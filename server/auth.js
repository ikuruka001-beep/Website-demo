const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const { Pool } = require('pg')
const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgres://postgres:password@localhost:5432/ikuruka' })
const query = (text, params) => pool.query(text, params)

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

// Register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const hash = await bcrypt.hash(password, 10)
    await query('INSERT INTO users(email, password_hash, subscription_status) VALUES($1,$2,$3) ON CONFLICT (email) DO NOTHING', [email, hash, 'free'])
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token })
  } catch (err) {
    console.error('Register error', err)
    res.status(500).json({ error: err.message })
  }
})

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' })
    const r = await query('SELECT email, password_hash FROM users WHERE email = $1', [email])
    if (r.rowCount === 0) return res.status(401).json({ error: 'Invalid credentials' })
    const user = r.rows[0]
    const ok = await bcrypt.compare(password, user.password_hash || '')
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' })
    const token = jwt.sign({ email }, JWT_SECRET, { expiresIn: '30d' })
    res.json({ token })
  } catch (err) {
    console.error('Login error', err)
    res.status(500).json({ error: err.message })
  }
})

// Middleware to protect routes
function authMiddleware(req, res, next) {
  const h = req.headers.authorization
  if (!h) return res.status(401).json({ error: 'Missing Authorization header' })
  const parts = h.split(' ')
  if (parts.length !== 2) return res.status(401).json({ error: 'Invalid Authorization header' })
  const token = parts[1]
  try {
    const payload = jwt.verify(token, JWT_SECRET)
    req.user = payload
    next()
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

module.exports = { router, authMiddleware }
