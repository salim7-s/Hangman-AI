import { useState } from 'react'
import { useAuth } from '../context/auth-context'

function getAuthErrorMessage(err) {
  const backendMessage = err.response?.data?.error || err.response?.data?.message
  if (backendMessage) return backendMessage

  if (err.request) {
    return 'SERVER UNREACHABLE. CHECK API URL, BACKEND STATUS, OR CORS SETTINGS.'
  }

  return 'REQUEST SETUP FAILED. TRY AGAIN.'
}

export default function AuthModal({ onClose }) {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (!username.trim()) {
          setError('BADGE NAME REQUIRED.')
          setLoading(false)
          return
        }

        await register(username.trim(), email, password)
      }

      onClose()
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,40,37,0.7)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="glass-panel w-full max-w-md p-8 fade-in-up">
        <div className="mb-6 flex items-center justify-between border-b-4 border-dashed border-[#2c2825] pb-4">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] opacity-60">
              {mode === 'login' ? 'Agent Verification' : 'New Agent Enrollment'}
            </p>
            <h2 className="text-2xl font-black uppercase tracking-widest">
              {mode === 'login' ? 'Sign In' : 'Register'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-xl font-black opacity-50 transition-opacity hover:opacity-100"
            aria-label="Close"
          >
            X
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'register' && (
            <div>
              <p className="section-label">Badge Name</p>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="YOUR OPERATIVE NAME"
                maxLength={20}
                className="glass-input text-base"
                autoFocus
              />
            </div>
          )}

          <div>
            <p className="section-label">Email</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="AGENT@HQ.GOV"
              className="glass-input text-base"
              autoFocus={mode === 'login'}
            />
          </div>

          <div>
            <p className="section-label">Password</p>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              className="glass-input text-base"
            />
          </div>

          {error && (
            <div className="shake border-4 border-[#2c2825] bg-[#8b0000] px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-[#e3d5c1]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-4 text-base"
          >
            {loading
              ? 'PROCESSING...'
              : mode === 'login'
                ? 'ACCESS FILES'
                : 'ENROLL AGENT'}
          </button>
        </form>

        <div className="mt-6 border-t-2 border-dashed border-[#2c2825] pt-4 text-center">
          <p className="text-xs font-bold uppercase tracking-wider opacity-70">
            {mode === 'login' ? 'No file on record?' : 'Already enrolled?'}
          </p>
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="mt-2 text-sm font-black uppercase tracking-widest underline transition-opacity hover:opacity-70"
          >
            {mode === 'login' ? 'Create Account' : 'Sign In Instead'}
          </button>
        </div>
      </div>
    </div>
  )
}
