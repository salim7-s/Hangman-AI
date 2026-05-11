import { useState } from 'react'
import api from '../services/api'
import { AuthContext } from './auth-context'

function readStoredAuth() {
  const savedToken = localStorage.getItem('hangman_token')
  const savedUser = localStorage.getItem('hangman_user')

  if (!savedToken || !savedUser) {
    return { token: null, user: null }
  }

  try {
    return { token: savedToken, user: JSON.parse(savedUser) }
  } catch {
    localStorage.removeItem('hangman_token')
    localStorage.removeItem('hangman_user')
    return { token: null, user: null }
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => readStoredAuth())

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password })
    saveAuth(res.data)
    return res.data
  }

  async function register(username, email, password) {
    const res = await api.post('/api/auth/register', { username, email, password })
    saveAuth(res.data)
    return res.data
  }

  function logout() {
    localStorage.removeItem('hangman_token')
    localStorage.removeItem('hangman_user')
    setAuth({ token: null, user: null })
  }

  function saveAuth({ token, user }) {
    localStorage.setItem('hangman_token', token)
    localStorage.setItem('hangman_user', JSON.stringify(user))
    setAuth({ token, user })
  }

  return (
    <AuthContext.Provider
      value={{ user: auth.user, token: auth.token, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}
