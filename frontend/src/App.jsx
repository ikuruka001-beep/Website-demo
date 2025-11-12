import React from 'react'
import { Routes, Route, Link, Navigate } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Register from './pages/Register'
import { getToken, logout } from './utils/auth'

export default function App(){
  const token = getToken()
  return (
    <div className='min-h-screen'>
      <nav className='bg-white shadow'>
        <div className='max-w-6xl mx-auto px-4 py-3 flex justify-between items-center'>
          <div className='text-xl font-bold'><Link to='/'>Ikuruka</Link></div>
          <div className='space-x-3'>
            <Link to='/' className='text-sm'>Dashboard</Link>
            {!token && <Link to='/login' className='text-sm'>Login</Link>}
            {!token && <Link to='/register' className='text-sm'>Register</Link>}
            {token && <button onClick={()=>{logout(); window.location.href='/login'}} className='text-sm'>Logout</button>}
          </div>
        </div>
      </nav>
      <main className='max-w-6xl mx-auto p-6'>
        <Routes>
          <Route path='/' element={ token ? <Dashboard /> : <Navigate to='/login'/> } />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Register />} />
        </Routes>
      </main>
    </div>
  )
}
