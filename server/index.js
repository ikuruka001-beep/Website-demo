require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const cors = require('cors')
const axios = require('axios')
const Stripe = require('stripe')
const sgMail = require('@sendgrid/mail')
const { Pool } = require('pg')
const { router: authRouter, authMiddleware } = require('./auth')
const app = express()
app.use(cors())
app.use(bodyParser.json())
app.use('/api/auth', authRouter)

const stripe = Stripe(process.env.STRIPE_SECRET_KEY || '')
sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/ikuruka'
})

// Simple helper
const query = (text, params) => pool.query(text, params)

// Create a Checkout session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const { priceId, customerEmail } = req.body
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: process.env.SUCCESS_URL || 'https://your-app.com/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: process.env.CANCEL_URL || 'https://your-app.com/cancel',
    })
    res.json({ url: session.url, id: session.id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

// Webhook (raw body required)
const rawBody = bodyParser.raw({ type: 'application/json' })
app.post('/webhook', rawBody, (req, res) => {
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  (async () => {
    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object
          const email = session.customer_email
          // create or update user record
          await query(
            `INSERT INTO users(email, stripe_customer_id, subscription_status) VALUES($1,$2,$3)
             ON CONFLICT (email) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id, subscription_status = EXCLUDED.subscription_status`,
            [email, session.customer, 'active']
          )
          console.log('Checkout completed for', email)
          break
        }
        case 'invoice.payment_failed':
          console.log('Payment failed for invoice', event.data.object.id)
          break
        case 'customer.subscription.updated':
          console.log('Subscription updated', event.data.object.id)
          break
        default:
          console.log('Unhandled event type', event.type)
      }
    } catch(e){
      console.error('Error handling webhook event', e)
    }
  })()

  res.json({ received: true })
})

// Monitor endpoint using NewsAPI
app.get('/api/monitor', async (req, res) => {
  try {
    const q = req.query.q || 'travel OR tourism OR destination'
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=en&pageSize=20&apiKey=${process.env.NEWSAPI_KEY}`
    const r = await axios.get(url)
    const items = r.data.articles.map(a => ({
      id: a.url, title: a.title, outlet: a.source.name, date: a.publishedAt, snippet: a.description || '', url: a.url
    }))
    // store coverage items to DB (dedupe by url)
    for (const it of items) {
      try {
        await query('INSERT INTO coverage(id, title, outlet, published_at, snippet, url) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT (id) DO NOTHING',
          [it.id, it.title, it.outlet, it.date, it.snippet, it.url])
      } catch(e){}
    }
    res.json({ items })
  } catch (err) {
    console.error('Monitor error', err.message)
    res.status(500).json({ error: err.message })
  }
})

// GDELT placeholder route
const { queryGdeltSample } = require('./gdelt_bigquery')

app.get('/api/gdelt', async (req, res) => {
  res.json({ message: 'GDELT integration placeholder - adapt for BigQuery or GDELT API' })
})

// Send pitch via SendGrid and record campaign
app.post('/api/send-pitch', authMiddleware, async (req, res) => {
  try {
    const { toEmail, subject, body, fromEmail } = req.body
    const msg = {
      to: toEmail,
      from: fromEmail || process.env.DEFAULT_FROM_EMAIL,
      subject,
      text: body,
      html: `<pre>${body}</pre>`,
    }
    await sgMail.send(msg)
    const id = Math.random().toString(36).slice(2,9)
    await query('INSERT INTO campaigns(id, to_email, subject, body, sent_at, status) VALUES($1,$2,$3,$4,NOW(),$5)',
      [id, toEmail, subject, body, 'sent'])
    res.json({ ok: true, id })
  } catch (err) {
    console.error('SendGrid error', err)
    res.status(500).json({ error: err.message })
  }
})

app.get('/_health', (req, res) => res.json({ status: 'ok' }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => console.log(`Ikuruka server listening on ${PORT}`))
