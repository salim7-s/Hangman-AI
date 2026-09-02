import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/auth-context'
import AuthModal from '../components/AuthModal'
import InspectorGuide from '../components/InspectorGuide'

const MODES = [
  { id: 'ai-vs-player',    label: 'Solo',       desc: 'Investigate AI.'      },
  { id: 'player-vs-ai',    label: 'Reverse',    desc: 'AI investigates you.' },
  { id: 'player-vs-player',label: 'Local Duel', desc: 'Pass the file.'       },
]

const DIFFICULTIES = [
  { id: 'easy',   label: 'Rookie'    },
  { id: 'medium', label: 'Detective' },
  { id: 'hard',   label: 'Chief'     },
]

export default function Home() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [view, setView]             = useState('landing')
  const [mode, setMode]             = useState('ai-vs-player')
  const [difficulty, setDifficulty] = useState('medium')
  const [word, setWord]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [showAuth, setShowAuth]     = useState(false)

  // Pre-warm backend on page load so cold-starts finish while the user navigates menus
  useEffect(() => {
    api.get('/api/health').catch(() => {})
  }, [])

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
          (err.request ? 'CONNECTION TO HQ FAILED.' : 'COULD NOT OPEN CASE.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell relative flex min-h-screen flex-col">

      {/* ── Auth Bar ── */}
      <div className="relative z-20 flex items-center justify-between border-b-2 border-dashed border-[#2c2825] px-4 py-2 sm:px-8">
        <button
          onClick={() => navigate('/inspectors')}
          className="text-xs font-bold uppercase tracking-widest text-[#8b0000] hover:underline flex items-center gap-1.5 cursor-pointer"
        >
          <span>🕵️‍♂️</span>
          <span>Inspectors Gallery</span>
        </button>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-xs font-bold uppercase tracking-widest opacity-70">
                Agent: <span className="opacity-100">{user.username}</span>
              </span>
              <button onClick={logout} className="btn-secondary px-3 py-1 text-xs">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <span className="text-xs font-bold uppercase tracking-widest opacity-60 hidden sm:inline">
                Sign in to track wins on the leaderboard
              </span>
              <button onClick={() => setShowAuth(true)} className="btn-primary px-4 py-2 text-xs">
                Sign In / Register
              </button>
            </>
          )}
        </div>
      </div>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* ── Landing ── */}
      {view === 'landing' && (
        <div className="flex flex-1 items-center justify-center p-4 sm:p-8 fade-in-up">
          <div className="glass-panel w-[90%] max-w-[860px] bg-[#e3d5c1] p-6 sm:p-12 sm:rotate-[-1deg] relative">
            <div className="mb-6 flex w-full flex-col gap-4 border-b-4 border-dashed border-[#2c2825] pb-5 text-left sm:mb-8 sm:flex-row sm:items-start sm:justify-between sm:pb-6">
              <div>
                <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] opacity-70 sm:text-sm">Department of Investigation</p>
                <h1 className="text-4xl font-black leading-none uppercase tracking-[0.12em] sm:text-7xl sm:tracking-widest">
                  AI HANGMAN
                </h1>
              </div>
              <div className="stamp-confidential w-fit self-start hidden sm:block">TOP SECRET</div>
            </div>

            <p className="mb-8 max-w-lg text-sm font-bold uppercase tracking-[0.12em] opacity-80 sm:mb-10 sm:text-base sm:tracking-widest">
              You have been assigned to Case File #404. Review the evidence carefully. One wrong guess and the suspect walks.
            </p>

            {!user && (
              <p className="mb-6 text-xs font-bold uppercase tracking-widest opacity-60 border border-dashed border-[#2c2825] px-4 py-2">
                <button onClick={() => setShowAuth(true)} className="underline hover:opacity-80">Sign in</button> to track your wins on the leaderboard
              </p>
            )}

            <div className="flex w-full flex-col items-stretch gap-4 sm:flex-row sm:items-center sm:gap-6">
              <button onClick={() => setView('setup')} className="btn-primary w-full px-6 py-4 text-base sm:px-10 sm:text-lg">
                OPEN CASE FILE
              </button>
              <button onClick={() => navigate('/multiplayer')} className="btn-primary w-full px-6 py-4 text-base sm:px-10 sm:text-lg">
                MULTIPLAYER LOBBY
              </button>
            </div>

            <div className="absolute right-3 top-3 hidden origin-top-right rotate-90 text-[10px] font-bold opacity-50 sm:block">
              ARCHIVE: DO NOT DESTROY
            </div>
          </div>
        </div>
      )}

      {/* ── Setup ── */}
      {view === 'setup' && (
        <div className="flex flex-1 flex-col p-4 sm:p-6 fade-in-up">
          <div className="w-[90%] max-w-[860px] mx-auto">

            <button
              onClick={() => setView('landing')}
              className="text-[#2c2825] hover:opacity-70 text-sm font-bold flex items-center gap-2 mb-3 uppercase tracking-widest transition-opacity"
            >
              &larr; Return to Archives
            </button>

            <div className="glass-panel p-5 sm:p-8 sm:rotate-[1deg] relative">
              <div className="absolute top-4 left-4 w-6 h-2 bg-gray-400 border border-gray-600 rounded-sm shadow-sm rotate-12" />

              <div className="mb-4 flex flex-col gap-2 border-b-4 border-[#2c2825] pb-3 sm:mb-5 sm:flex-row sm:items-end sm:justify-between">
                <h2 className="text-2xl font-black uppercase tracking-[0.12em] sm:text-3xl sm:tracking-widest">Case Parameters</h2>
                <span className="stamp-confidential w-fit self-start border-2 p-1 text-[11px] sm:rotate-2 sm:text-sm">AUTHORIZED EYES ONLY</span>
              </div>

              <div className="space-y-5 w-full">

                {/* Mode */}
                <div>
                  <p className="section-label">Investigation Type</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {MODES.map((item) => {
                      const isSelected = mode === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => { setMode(item.id); setError(''); setWord('') }}
                          className={`flex flex-col items-center justify-center p-3 sm:p-4 text-center border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2c2825] text-[#e3d5c1] border-[#2c2825] shadow-[4px_4px_0px_#8b0000]'
                              : 'bg-transparent text-[#2c2825] border-dashed border-[#2c2825]/60 hover:bg-[#2c2825]/5 hover:border-solid'
                          }`}
                        >
                          <span className="mb-0.5 text-sm font-bold uppercase tracking-widest sm:text-base">{item.label}</span>
                          <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#e3d5c1]/80' : 'opacity-70'}`}>
                            {item.desc}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Secret Word */}
                <div className={`transition-all duration-300 overflow-hidden ${needsWord ? 'max-h-[130px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                  <p className="section-label">Classified Evidence (Secret Word)</p>
                  <input
                    type="text"
                    value={word}
                    onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                    placeholder="TYPE EVIDENCE HERE..."
                    maxLength={20}
                    className="glass-input uppercase text-base sm:text-xl"
                  />
                  {needsWord && (
                    <p className="text-[10px] opacity-60 font-bold uppercase mt-1">
                      Use common English words for best AI performance.
                    </p>
                  )}
                </div>

                {/* Difficulty */}
                <div>
                  <p className="section-label">Threat Level (Difficulty)</p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    {DIFFICULTIES.map((item) => {
                      const isSelected = difficulty === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setDifficulty(item.id)}
                          className={`flex-1 py-3 text-center font-bold uppercase tracking-widest border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#2c2825] text-[#e3d5c1] border-[#2c2825] shadow-[4px_4px_0px_#8b0000]'
                              : 'bg-transparent text-[#2c2825] border-dashed border-[#2c2825]/60 hover:bg-[#2c2825]/5 hover:border-solid'
                          }`}
                        >
                          {item.label}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {error && (
                  <div className="shake bg-[#8b0000] text-[#e3d5c1] px-4 py-2 border-4 border-[#2c2825] text-sm font-bold text-center uppercase tracking-widest shadow-[4px_4px_0px_#2c2825]">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleStart}
                  disabled={loading}
                  className="btn-primary w-full py-3 text-base sm:py-4 sm:text-lg"
                >
                  {loading ? 'PROCESSING...' : 'INITIATE INVESTIGATION'}
                </button>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Officer Dispatch Guide on Right ── */}
      <InspectorGuide view={view} mode={mode} difficulty={difficulty} />

    </div>
  )
}
