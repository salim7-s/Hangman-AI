import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HangmanScene from '../components/HangmanScene'
import Keyboard from '../components/Keyboard'
import ResultModal from '../components/ResultModal'
import api from '../services/api'
import { useStreak } from '../hooks/useStreak'
import { useSounds } from '../hooks/useSounds'

const MODE_LABELS = {
  'ai-vs-player':     'SOLO INVESTIGATION',
  'player-vs-ai':     'AI INTERROGATION',
  'player-vs-player': 'LOCAL DUEL',
}

export default function Game() {
  const location = useLocation()
  const navigate  = useNavigate()
  const init      = location.state

  const [gameId]         = useState(init?.gameId || null)
  const [maskedWord, setMaskedWord]       = useState(init?.maskedWord || '')
  const [guesses, setGuesses]             = useState([])
  const [wrongGuesses, setWrongGuesses]   = useState([])
  const [attemptsLeft, setAttemptsLeft]   = useState(init?.attemptsLeft ?? 6)
  const [status, setStatus]               = useState('ongoing')
  const [word, setWord]                   = useState('')
  const [aiGuess, setAiGuess]             = useState(null)
  const [candidateCount, setCandidateCount] = useState(null)
  const [loading, setLoading]             = useState(false)
  const [aiThinking, setAiThinking]       = useState(false)
  const [error, setError]                 = useState('')
  const [mode]                            = useState(init?.mode || '')

  const { recordWin, recordLoss } = useStreak()
  const [streakSnapshot, setStreakSnapshot] = useState({ streak: 0, bestStreak: 0 })
  const [muted, setMuted] = useState(false)
  const sounds = useSounds()

  useEffect(() => {
    if (!gameId) navigate('/')
  }, [gameId, navigate])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && status === 'ongoing') navigate('/')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status, navigate])

  // Automatically trigger AI guesses in Reverse mode
  useEffect(() => {
    if (mode === 'player-vs-ai' && status === 'ongoing' && !loading && !aiThinking) {
      // Delay slightly so the UI doesn't feel instantly jarring
      const timer = setTimeout(() => {
        handleGuess('')
      }, 1500)
      return () => clearTimeout(timer)
    }
  }, [mode, status, loading, aiThinking])

  async function handleGuess(letter) {
    if (loading || aiThinking || status !== 'ongoing') return
    setLoading(true)
    setError('')

    try {
      const res  = await api.post('/api/game/guess', { gameId, letter })
      const data = res.data

      setMaskedWord(data.maskedWord)
      setGuesses(data.guesses)
      setWrongGuesses(data.wrongGuesses)
      setAttemptsLeft(data.attemptsLeft)
      setStatus(data.status)
      if (data.word) setWord(data.word)

      if (data.aiGuess) {
        setAiThinking(true)
        setTimeout(() => {
          setAiGuess(data.aiGuess)
          setCandidateCount(data.candidateCount)
          setAiThinking(false)
        }, 600)
      }
      if (data.candidateCount !== undefined && !data.aiGuess) {
        setCandidateCount(data.candidateCount)
      }

      if (!muted) {
        if (data.status === 'won')       sounds.playWin()
        else if (data.status === 'lost') sounds.playLose()
        else if (data.wrongGuesses?.length > wrongGuesses.length) sounds.playWrong()
        else sounds.playCorrect()
      }

      if (data.status === 'won')  setStreakSnapshot(recordWin())
      if (data.status === 'lost') setStreakSnapshot(recordLoss())
    } catch (err) {
      setError(err.response?.data?.error || 'COMMUNICATION ERROR.')
    } finally {
      setLoading(false)
    }
  }

  function handlePlayAgain() {
    navigate('/')
  }

  function renderMaskedLetters(value) {
    return (value || '_ _ _ _').split(' ').map((letter, index) => (
      <div key={`${letter}-${index}`} className="w-12 h-14 border-b-[4px] border-[#2c2825] flex items-center justify-center text-4xl font-bold uppercase">
        {letter}
      </div>
    ))
  }

  const wrongGuessCount = 6 - attemptsLeft
  const keyboardDisabled = loading || aiThinking || status !== 'ongoing'

  return (
    <div className="app-shell p-4 sm:p-8">
      <div className="page-wrap mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-4 border-dashed border-[#2c2825] pb-4">
          <button onClick={() => navigate('/')} className="text-[#2c2825] hover:opacity-70 font-bold uppercase tracking-widest text-sm transition-opacity">
            &larr; ARCHIVES
          </button>
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-bold border-2 border-[#2c2825] px-2 py-1 uppercase">{MODE_LABELS[mode] || 'CASE FILE'}</span>
            <span className="font-bold border-2 border-[#2c2825] px-2 py-1 uppercase bg-[#2c2825] text-[#e3d5c1]">STRIKES LEFT: {attemptsLeft}/6</span>
            <button
              onClick={() => setMuted((v) => !v)}
              className="text-[#2c2825] font-bold underline"
            >
              {muted ? 'RADIO MUTED' : 'RADIO ON'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 fade-in-up">
          
          {/* ── Left: Sketch Pad & Status (5 cols) ─────────────────────────── */}
          <section className="lg:col-span-5 flex flex-col gap-8">
            <div className="glass-panel p-6 rotate-[-1deg]">
              <div className="flex items-center justify-between mb-4 border-b-2 border-[#2c2825] pb-2">
                <p className="font-bold tracking-widest uppercase">Suspect Sketch</p>
                <p className="font-bold tracking-widest uppercase text-sm opacity-60">Status: {status === 'ongoing' ? 'AT LARGE' : status === 'won' ? 'CAPTURED' : 'ESCAPED'}</p>
              </div>

              <div className="border-4 border-[#2c2825] p-2 bg-[#d4c5b0]">
                <HangmanScene wrongGuessCount={wrongGuessCount} skinName="default" isDead={status === 'lost'} />
              </div>

              <div className="mt-6">
                <p className="font-bold uppercase tracking-widest text-sm mb-2">Errors in Judgement</p>
                <div className="flex flex-wrap gap-2 min-h-[40px]">
                  {wrongGuesses.length === 0 ? (
                    <span className="opacity-50 text-sm font-bold italic">No errors yet.</span>
                  ) : (
                    wrongGuesses.map((letter) => (
                      <span
                        key={letter}
                        className="text-[#8b0000] font-black text-2xl line-through decoration-4 uppercase"
                      >
                        {letter}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* AI stats (player-vs-ai mode) */}
            {mode === 'player-vs-ai' && (
              <div className="glass-panel p-6 rotate-[1deg]">
                <p className="font-bold uppercase tracking-widest border-b-2 border-[#2c2825] pb-2 mb-4">Interrogation Log</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-bold opacity-70">AI SUSPECTS:</p>
                    <p className="text-2xl font-black">{aiThinking ? '...' : aiGuess || '--'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold opacity-70">POSSIBILITIES:</p>
                    <p className="text-2xl font-black">{candidateCount ?? '--'}</p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ── Right: Evidence & Keyboard (7 cols) ───────────────────────────────── */}
          <section className="lg:col-span-7 flex flex-col gap-8">
            <div className="glass-panel p-8 sm:p-12 h-full flex flex-col">
              
              <div className="mb-12">
                <p className="section-label">Evidence Board</p>
                <div className="flex flex-wrap justify-center gap-3 mt-4">
                  {renderMaskedLetters(maskedWord)}
                </div>
              </div>

              <div className="mt-auto">
                <div className="flex justify-between items-end mb-4">
                  <p className="section-label mb-0">Typewriter</p>
                  {(loading || aiThinking) && (
                    <p className="text-sm font-bold animate-pulse text-[#8b0000]">PROCESSING...</p>
                  )}
                </div>
                
                {error && <p className="mb-4 shake font-bold text-[#8b0000] border-2 border-[#8b0000] p-2 text-center">{error}</p>}

                <Keyboard
                  guesses={guesses}
                  wrongGuesses={wrongGuesses}
                  onGuess={handleGuess}
                  disabled={keyboardDisabled}
                />
              </div>

            </div>
          </section>
        </div>

        <ResultModal
          status={status}
          word={word}
          streak={streakSnapshot.streak}
          bestStreak={streakSnapshot.bestStreak}
          onPlayAgain={handlePlayAgain}
        />
      </div>
    </div>
  )
}
