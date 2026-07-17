import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/auth-context'
import AuthModal from '../components/AuthModal'

const MODES = [
  {
    id: 'ai-vs-player',
    label: 'Solo',
    desc: 'Investigate AI.',
  },
  {
    id: 'player-vs-ai',
    label: 'Reverse',
    desc: 'AI investigates you.',
  },
  {
    id: 'player-vs-player',
    label: 'Local Duel',
    desc: 'Pass the file.',
  },
]

const DIFFICULTIES = [
  { id: 'easy',   label: 'Rookie' },
  { id: 'medium', label: 'Detective' },
  { id: 'hard',   label: 'Chief' },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [view, setView]             = useState('landing') // 'landing' | 'setup'
  const [mode, setMode]             = useState('ai-vs-player')
  const [difficulty, setDifficulty] = useState('medium')
  const [word, setWord]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showAuth, setShowAuth]     = useState(false)

  const needsWord = mode === 'player-vs-ai' || mode === 'player-vs-player'

  async function handleStart() {
    if (needsWord && !word.trim()) return setError('EVIDENCE REQUIRED: ENTER A WORD.')
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/api/game/start', {
        mode,
        difficulty,
        word: needsWord ? word.trim() : undefined,
      })
      navigate('/game', { state: { ...res.data } })
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (err.request
            ? 'CONNECTION TO HQ FAILED.'
            : 'COULD NOT OPEN CASE.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell relative flex min-h-screen flex-col overflow-hidden">
      {/* ── Auth Bar ── */}
      <div className="relative z-20 flex items-center justify-end gap-3 border-b-2 border-dashed border-[#2c2825] px-4 py-2 sm:px-8">
        {user ? (
          <>
            <span className="text-xs font-bold uppercase tracking-widest opacity-70">
              Agent: <span className="opacity-100">{user.username}</span>
            </span>
            <button
              onClick={logout}
              className="btn-secondary px-3 py-1 text-xs"
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <span className="text-xs font-bold uppercase tracking-widest opacity-60 hidden sm:inline">
              Sign in to track wins on the leaderboard
            </span>
            <button
              onClick={() => setShowAuth(true)}
              className="btn-primary px-4 py-2 text-xs"
            >
              Sign In / Register
            </button>
          </>
        )}
      </div>

      {/* ── Auth Modal ── */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* ── Landing ── */}
      <div className="flex flex-1 items-center justify-center p-3 sm:p-8">
        {view === 'landing' && (
          <div className="z-10 flex flex-col items-center justify-center text-center fade-in-up w-full">
            <div className="glass-panel flex w-full max-w-[92vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[1400px] flex-col items-center bg-[#e3d5c1] p-6 sm:p-16 lg:p-24 sm:rotate-[-1deg]">
              <div className="mb-6 flex w-full flex-col gap-4 border-b-4 border-dashed border-[#2c2825] pb-5 text-left sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] opacity-70 sm:text-sm lg:text-lg">Department of Investigation</p>
                  <h1 className="text-4xl font-black leading-none uppercase tracking-[0.12em] sm:text-7xl lg:text-9xl xl:text-[10rem] sm:tracking-widest">
                    AI HANGMAN
                  </h1>
                </div>
                <div className="stamp-confidential w-fit self-start hidden sm:block">
                  TOP SECRET
                </div>
              </div>

              <p className="mb-8 max-w-2xl lg:max-w-4xl text-sm font-bold uppercase tracking-[0.12em] opacity-80 sm:mb-12 sm:text-lg lg:text-2xl sm:tracking-widest">
                You have been assigned to Case File #404. Review the evidence carefully. One wrong guess and the suspect walks.
              </p>

              {/* Signed-in nudge */}
              {!user && (
                <p className="mb-6 text-xs font-bold uppercase tracking-widest opacity-60 border border-dashed border-[#2c2825] px-4 py-2">
                  <button onClick={() => setShowAuth(true)} className="underline hover:opacity-80">Sign in</button> to track your wins on the leaderboard
                </p>
              )}

              <div className="flex w-full flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center sm:gap-6">
                <button
                  onClick={() => setView('setup')}
                  className="btn-primary w-full px-6 py-4 text-base sm:min-w-[240px] lg:min-w-[360px] sm:px-12 lg:py-6 sm:text-xl lg:text-3xl"
                >
                  OPEN CASE FILE
                </button>
                <button
                  onClick={() => navigate('/multiplayer')}
                  className="btn-primary w-full px-6 py-4 text-base sm:min-w-[240px] lg:min-w-[360px] sm:px-12 lg:py-6 sm:text-xl lg:text-3xl"
                >
                  MULTIPLAYER LOBBY
                </button>
              </div>

              <div className="absolute right-3 top-3 hidden origin-top-right rotate-90 text-[10px] font-bold opacity-50 sm:block">
                ARCHIVE: DO NOT DESTROY
              </div>
            </div>
          </div>
        )}

        {view === 'setup' && (
          <div className="z-10 w-full max-w-[92vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[1400px] px-1 fade-in-up sm:px-2">
            <button
              onClick={() => setView('landing')}
              className="text-[#2c2825] hover:opacity-70 text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest transition-opacity"
            >
              &larr; Return to Archives
            </button>

            <div className="glass-panel p-5 sm:rotate-[1deg] sm:p-12 lg:p-16">
              <div className="mb-6 flex flex-col gap-3 border-b-4 border-[#2c2825] pb-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl font-black uppercase tracking-[0.12em] sm:text-3xl lg:text-4xl sm:tracking-widest">Case Parameters</h2>
                <span className="stamp-confidential w-fit self-start border-2 p-1 text-[11px] sm:rotate-2 sm:text-sm">AUTHORIZED EYES ONLY</span>
              </div>

              <div className="space-y-10 lg:space-y-14 w-full">
                {/* Mode Selection */}
                <div>
                  <p className="section-label lg:text-base">Investigation Type</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {MODES.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => { setMode(item.id); setError(''); setWord('') }}
                        className={`glass-card flex flex-col items-center justify-center p-4 lg:p-6 text-center ${
                          mode === item.id
                            ? 'glass-card-active shadow-none translate-y-0'
                            : 'opacity-70 border-dashed hover:opacity-100'
                        }`}
                      >
                        <span className="mb-1 text-base font-bold uppercase tracking-[0.12em] sm:text-lg lg:text-xl sm:tracking-widest lg:tracking-[0.18em]">{item.label}</span>
                        <span className="text-[11px] font-bold uppercase tracking-[0.12em] opacity-80 sm:text-xs lg:text-sm sm:tracking-wider">{item.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Secret Word */}
                <div className={`transition-all duration-300 overflow-hidden ${needsWord ? 'max-h-[150px] opacity-100' : 'max-h-0 opacity-0 m-0'}`}>
                  <p className="section-label lg:text-base">Classified Evidence (Secret Word)</p>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                    placeholder="TYPE EVIDENCE HERE..."
                    maxLength={20}
                    className="glass-input uppercase text-base sm:text-2xl lg:text-3xl"
                  />
                  {needsWord && (
                    <p className="text-[10px] sm:text-xs lg:text-sm opacity-60 font-bold uppercase mt-1">
                      Use common English words for best AI performance.
                    </p>
                  )}
                </div>

                {/* Difficulty Selection */}
                <div>
                  <p className="section-label lg:text-base">Threat Level (Difficulty)</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {DIFFICULTIES.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setDifficulty(item.id)}
                        className={`glass-card flex-1 py-4 lg:py-6 text-center font-bold uppercase tracking-[0.12em] sm:tracking-widest lg:tracking-[0.18em] lg:text-2xl ${
                          difficulty === item.id
                            ? 'glass-card-active border-[#8b0000] text-[#8b0000]'
                            : 'opacity-70 border-dashed hover:opacity-100'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <div className="shake bg-[#8b0000] text-[#e3d5c1] px-4 py-3 border-4 border-[#2c2825] text-sm font-bold text-center uppercase tracking-widest shadow-[4px_4px_0px_#2c2825] lg:text-base">
                    {error}
                  </div>
                )}

                {/* Start Button */}
                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="btn-primary mt-4 w-full py-4 text-base sm:py-5 lg:py-6 sm:text-xl lg:text-2xl"
                >
                  {loading ? 'PROCESSING...' : 'INITIATE INVESTIGATION'}
                </button>
              </div>

              {/* Fake staple */}
              <div className="absolute top-4 left-4 w-6 h-2 bg-gray-400 border border-gray-600 rounded-sm shadow-sm rotate-12"></div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
