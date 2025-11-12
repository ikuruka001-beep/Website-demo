import React, { useState } from 'react'
import axios from 'axios'
import { saveToken } from '../utils/auth'

export default function Login(){
  const [email,setEmail]=useState(''); const [password,setPassword]=useState('')
  async function submit(e){ e.preventDefault(); try{ const r=await axios.post('/api/auth/login',{email,password}); saveToken(r.data.token); window.location.href='/' }catch(e){ alert(e.response?.data?.error || e.message) } }
  return (
    <div className='max-w-md mx-auto bg-white p-6 rounded shadow'>
      <h2 className='text-lg font-semibold mb-4'>Login</h2>
      <form onSubmit={submit} className='space-y-3'>
        <input className='w-full border p-2 rounded' placeholder='Email' value={email} onChange={e=>setEmail(e.target.value)} />
        <input type='password' className='w-full border p-2 rounded' placeholder='Password' value={password} onChange={e=>setPassword(e.target.value)} />
        <button className='px-4 py-2 bg-indigo-600 text-white rounded'>Login</button>
      </form>
    </div>
  )
}
