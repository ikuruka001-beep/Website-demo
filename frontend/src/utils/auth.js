export function saveToken(t){ localStorage.setItem('ik_token', t) }
export function getToken(){ return localStorage.getItem('ik_token') }
export function logout(){ localStorage.removeItem('ik_token') }
