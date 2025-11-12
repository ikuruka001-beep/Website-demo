import React, { useEffect, useState } from 'react'
import axios from 'axios'
import { getToken } from '../utils/auth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function Dashboard(){
  const [monitor, setMonitor] = useState([])
  const [coverageCount, setCoverageCount] = useState(0)
  const token = getToken()

  useEffect(()=>{ fetchMonitor() }, [])

  async function fetchMonitor(){
    try{
      const r = await axios.get('/api/monitor?q=travel')
      setMonitor(r.data.items || [])
      setCoverageCount(r.data.items.length || 0)
    }catch(e){ console.error(e) }
  }

  async function sendPitch(to){
    const subject = prompt('Subject', 'Ikuruka pitch')
    const body = prompt('Body', 'Story pitch...')
    try{
      await axios.post('/api/send-pitch',{ toEmail: to, subject, body }, { headers: { Authorization: 'Bearer '+token } })
      alert('Sent')
    }catch(e){ alert('Send failed: '+(e.response?.data?.error||e.message)) }
  }

  async function subscribe(){
    const priceId = prompt('Enter Stripe Price ID:')
    try{
      const r = await axios.post('/api/create-checkout-session', { priceId }, { headers: { Authorization: 'Bearer '+token } })
      if(r.data.url) window.location.href = r.data.url
    }catch(e){ alert(e.response?.data?.error || e.message) }
  }

  return (
    <div className='grid grid-cols-12 gap-6'>
      <div className='col-span-8'>
        <div className='bg-white p-4 rounded shadow mb-4'>
          <h3 className='font-semibold'>Monitoring ({coverageCount})</h3>
          {monitor.slice(0,10).map(m=>(
            <div key={m.id} className='border-b py-2'>
              <div className='font-medium'>{m.title}</div>
              <div className='text-xs text-gray-500'>{m.outlet} • {new Date(m.date).toLocaleString()}</div>
              <div className='mt-1 text-sm'>{m.snippet}</div>
              <div className='mt-2'><button className='text-sm text-indigo-600' onClick={()=>sendPitch(prompt('journalist email?')||'test@example.com')}>Send pitch</button></div>
            </div>
          ))}
        </div>
        <div className='bg-white p-4 rounded shadow'>
          <h3 className='font-semibold'>GDELT / BigQuery (sample)</h3>
          <p className='text-sm text-gray-600'>Run advanced queries using BigQuery and GDELT dataset. See server logs for results.</p>
          <button className='mt-2 px-3 py-2 bg-indigo-600 text-white rounded' onClick={async ()=>{ try{ const r=await axios.get('/api/gdelt'); alert(JSON.stringify(r.data).slice(0,300)) }catch(e){ alert('Error: '+e.message) } }}>Run sample</button>
        </div>
      </div>
      <div className='col-span-4'>
        <div className='bg-white p-4 rounded shadow mb-4'>
          <h3 className='font-semibold'>Actions</h3>
          <button className='w-full mt-2 px-3 py-2 bg-green-600 text-white rounded' onClick={()=>subscribe()}>Subscribe (Stripe)</button>
        </div>
        <div className='bg-white p-4 rounded shadow'>
          <h3 className='font-semibold'>Quick analytics</h3>
          <div style={{height:200}}><ResponsiveContainer width='100%' height='100%'><BarChart data={[{name:'Coverage', val:coverageCount}]}><XAxis dataKey='name' /><YAxis /><Tooltip /><Bar dataKey='val' /></BarChart></ResponsiveContainer></div>
        </div>
      </div>
    </div>
  )
}
