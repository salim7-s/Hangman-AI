import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

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
  const [view, setView]             = useState('landing') // 'landing' | 'setup'
  const [mode, setMode]             = useState('ai-vs-player')
  const [difficulty, setDifficulty] = useState('medium')
  const [word, setWord]             = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')

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
    <div className="app-shell flex items-center justify-center min-h-screen relative overflow-hidden p-4 sm:p-8">
      
      {view === 'landing' && (
        <div className="flex flex-col items-center justify-center text-center z-10 fade-in-up">
          <div className="glass-panel p-10 sm:p-16 max-w-3xl rotate-[-1deg] bg-[#e3d5c1] flex flex-col items-center">
            <div className="w-full flex justify-between items-start mb-8 border-b-4 border-dashed border-[#2c2825] pb-6">
              <div className="text-left">
                <p className="font-bold opacity-70 mb-1 tracking-[0.2em] uppercase text-sm">Department of Investigation</p>
                <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-widest leading-none">
                  AI HANGMAN
                </h1>
              </div>
              <div className="stamp-confidential hidden sm:block">
                TOP SECRET
              </div>
            </div>
            
            <p className="text-lg font-bold mb-12 opacity-80 uppercase tracking-widest max-w-xl">
              You have been assigned to Case File #404. Review the evidence carefully. One wrong guess and the suspect walks.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 items-center w-full justify-center">
              <button
                onClick={() => setView('setup')}
                className="btn-primary text-xl px-12 py-4 min-w-[240px]"
              >
                OPEN CASE FILE
              </button>
              <button
                onClick={() => navigate('/multiplayer')}
                className="btn-primary text-xl px-12 py-4 min-w-[240px]"
              >
                MULTIPLAYER LOBBY
              </button>
            </div>
            
            <div className="absolute top-4 right-4 text-xs opacity-50 font-bold rotate-90 origin-top-right">
              ARCHIVE: DO NOT DESTROY
            </div>
          </div>
        </div>
      )}

      {view === 'setup' && (
        <div className="z-10 w-full max-w-2xl px-2 fade-in-up">
          <button 
            onClick={() => setView('landing')}
            className="text-[#2c2825] hover:opacity-70 text-sm font-bold flex items-center gap-2 mb-4 uppercase tracking-widest transition-opacity"
          >
            &larr; Return to Archives
          </button>
          
          <div className="glass-panel p-8 sm:p-12 rotate-[1deg]">
            <div className="border-b-4 border-[#2c2825] pb-4 mb-8 flex justify-between items-end">
              <h2 className="text-3xl font-black uppercase tracking-widest">Case Parameters</h2>
              <span className="stamp-confidential text-sm p-1 border-2 rotate-2">AUTHORIZED EYES ONLY</span>
            </div>
            
            <div className="space-y-10">
              {/* Mode Selection */}
              <div>
                <p className="section-label">Investigation Type</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {MODES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => { setMode(item.id); setError(''); setWord(''); }}
                      className={`glass-card p-4 text-center flex flex-col items-center justify-center ${
                        mode === item.id 
                          ? 'glass-card-active shadow-none translate-y-0' 
                          : 'opacity-70 border-dashed hover:opacity-100'
                      }`}
                    >
                      <span className="font-bold text-lg mb-1 uppercase tracking-widest">{item.label}</span>
                      <span className="text-xs font-bold opacity-80 uppercase tracking-wider">{item.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Secret Word */}
              <div className={`transition-all duration-300 overflow-hidden ${needsWord ? 'max-h-[150px] opacity-100' : 'max-h-0 opacity-0 m-0'}`}>
                <p className="section-label">Classified Evidence (Secret Word)</p>
                <input
                  type="text"
                  value={word}
                  onChange={(e) => setWord(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  placeholder="TYPE EVIDENCE HERE..."
                  maxLength={20}
                  className="glass-input uppercase"
                />
              </div>

              {/* Difficulty Selection */}
              <div>
                <p className="section-label">Threat Level (Difficulty)</p>
                <div className="flex flex-col sm:flex-row gap-4">
                  {DIFFICULTIES.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setDifficulty(item.id)}
                      className={`glass-card flex-1 py-4 text-center uppercase tracking-widest font-bold ${
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
                <div className="shake bg-[#8b0000] text-[#e3d5c1] px-4 py-3 border-4 border-[#2c2825] text-sm font-bold text-center uppercase tracking-widest shadow-[4px_4px_0px_#2c2825]">
                  {error}
                </div>
              )}

              {/* Start Button */}
              <button
                onClick={handleStart}
                disabled={loading}
                className="btn-primary w-full py-5 text-xl mt-4"
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
  )
}
