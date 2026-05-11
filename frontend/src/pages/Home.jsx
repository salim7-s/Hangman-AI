import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const MODES = [
  {
    id: 'ai-vs-player',
    label: 'Solo',
    desc: 'Guess against AI.',
  },
  {
    id: 'player-vs-ai',
    label: 'Reverse',
    desc: 'Watch AI guess.',
  },
  {
    id: 'player-vs-player',
    label: 'Local Duel',
    desc: 'Pass and play.',
  },
]

const DIFFICULTIES = [
  { id: 'easy',   label: 'Easy' },
  { id: 'medium', label: 'Medium' },
  { id: 'hard',   label: 'Hard' },
]

export default function Home() {
  const navigate = useNavigate()
  const [view, setView]             = useState('landing') // 'landing' | 'setup'
  const [mode, setMode]             = useState('ai-vs-player')
  const [difficulty, setDifficulty] = useState('medium')
  const [word, setWord]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

  const needsWord = mode === 'player-vs-ai' || mode === 'player-vs-player'

  async function handleStart() {
    if (needsWord && !word.trim()) return setError('Enter a word to start.')
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
            ? 'Backend unreachable.'
            : 'Failed to start.')
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app-shell flex items-center justify-center min-h-screen relative overflow-hidden">
      
      {view === 'landing' && (
        <div className="flex flex-col items-center justify-center text-center z-10 fade-in-up">
          <div className="mb-4">
             <p className="section-label tracking-[0.3em] opacity-80 mb-6">Experience Next-Gen Word Strategy</p>
          </div>
          <h1 className="text-gradient text-[clamp(4rem,10vw,8rem)] font-black leading-[0.9] tracking-tighter mb-10">
            AI HANGMAN
          </h1>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <button
              onClick={() => setView('setup')}
              className="btn-primary text-lg px-10 py-4 min-w-[200px]"
            >
              Play Game
            </button>
            <button
              onClick={() => navigate('/multiplayer')}
              className="btn-secondary text-lg px-10 py-4 min-w-[200px]"
            >
              Multiplayer
            </button>
          </div>
        </div>
      )}

      {view === 'setup' && (
        <div className="z-10 w-full max-w-lg px-6 fade-in-up">
          <button 
            onClick={() => setView('landing')}
            className="text-muted hover:text-white text-sm font-semibold flex items-center gap-2 mb-8 transition-colors"
          >
            &larr; Back
          </button>
          
          <div className="glass-panel p-8 sm:p-10">
            <h2 className="text-[2rem] font-bold text-white mb-8 tracking-tight">Configure Match</h2>
            
            <div className="space-y-8">
              {/* Mode Selection */}
              <div>
                <p className="section-label mb-4 opacity-70">Game Mode</p>
                <div className="grid grid-cols-3 gap-3">
                  {MODES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setMode(item.id); setError(''); setWord(''); }}
                      className={`glass-card p-4 text-center flex flex-col items-center justify-center transition-all ${
                        mode === item.id 
                          ? 'border-[var(--accent-1)] bg-[rgba(0,240,255,0.08)] shadow-[0_0_15px_rgba(0,240,255,0.2)]' 
                          : 'border-[rgba(255,255,255,0.05)] opacity-60 hover:opacity-100'
                      }`}
                    >
                      <span className="font-bold text-sm text-white mb-1">{item.label}</span>
                      <span className="text-[0.65rem] text-muted">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secret Word */}
              <div className={`transition-all duration-300 overflow-hidden ${needsWord ? 'max-h-[120px] opacity-100' : 'max-h-0 opacity-0 m-0'}`}>
                <p className="section-label mb-4 opacity-70">Secret Word</p>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  placeholder="Enter a secret word..."
                  maxLength={20}
                  className="glass-input uppercase tracking-[0.2em] font-bold text-center text-lg"
                />
              </div>

              {/* Difficulty Selection */}
              <div>
                <p className="section-label mb-4 opacity-70">Difficulty</p>
                <div className="flex gap-3">
                  {DIFFICULTIES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDifficulty(item.id)}
                      className={`glass-card flex-1 py-3 text-center transition-all ${
                        difficulty === item.id 
                          ? 'border-[var(--accent-2)] bg-[rgba(255,46,147,0.08)] text-[var(--accent-2)] font-bold' 
                          : 'border-[rgba(255,255,255,0.05)] text-muted opacity-70 hover:opacity-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <div className="shake bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] text-[var(--danger)] px-4 py-3 rounded-lg text-sm font-medium text-center">
                  {error}
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleStart}
                disabled={loading}
                className="btn-primary w-full py-4 text-lg mt-4 shadow-[0_0_20px_rgba(255,46,147,0.3)] hover:shadow-[0_0_30px_rgba(255,46,147,0.5)] transition-shadow"
              >
                {loading ? 'Initializing...' : 'Start Match'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
