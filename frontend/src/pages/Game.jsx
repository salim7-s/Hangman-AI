import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HangmanScene from '../components/HangmanScene'
import Keyboard from '../components/Keyboard'
import ResultModal from '../components/ResultModal'
import api from '../services/api'
import { useStreak } from '../hooks/useStreak'
import { useSounds } from '../hooks/useSounds'

const MODE_LABELS = {
  'ai-vs-player':     'Guess against AI',
  'player-vs-ai':     'Watch AI guess',
  'player-vs-player': 'Local duel',
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

  // Redirect home if no game was started
  useEffect(() => {
    if (!gameId) navigate('/')
  }, [gameId, navigate])

  // Escape key → back to home
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape' && status === 'ongoing') navigate('/')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status, navigate])

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

      // Show AI thinking state briefly in player-vs-ai mode
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
      setError(err.response?.data?.error || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  function handlePlayAgain() {
    navigate('/')
  }

  function renderMaskedLetters(value) {
    return (value || '_ _ _ _').split(' ').map((letter, index) => (
      <div key={`${letter}-${index}`} className="letter-box">
        {letter}
      </div>
    ))
  }

  const wrongGuessCount = 6 - attemptsLeft
  const progressWidth   = `${(attemptsLeft / 6) * 100}%`
  const attemptsTone    =
    attemptsLeft <= 2 ? 'status-danger' : attemptsLeft <= 4 ? 'status-warning' : 'status-success'

  // In player-vs-ai mode, the keyboard is disabled during both loading AND ai thinking
  const keyboardDisabled = loading || aiThinking || status !== 'ongoing'

  return (
    <div className="app-shell">
      <div className="page-wrap mx-auto max-w-7xl px-4 py-5 sm:px-6 sm:py-8 lg:px-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <button onClick={() => navigate('/')} className="ghost-btn arcade-btn px-0 py-2 text-sm font-bold">
            ← Back to menu
          </button>
          <div className="flex flex-wrap items-center gap-2">
            <span className="pill-badge">{MODE_LABELS[mode] || 'Game'}</span>
            <span className="pill-badge">Attempts {attemptsLeft}/6</span>
            <button
              onClick={() => setMuted((v) => !v)}
              className="secondary-btn arcade-btn arcade-btn-orange px-4 text-sm"
              title={muted ? 'Unmute' : 'Mute'}
            >
              {muted ? '🔇 Muted' : '🔊 Sound on'}
            </button>
          </div>
        </div>

        <div className="game-layout fade-in-up">
          {/* ── Left: hangman scene + status ─────────────────────────── */}
          <section className="glass-panel grain-panel arcade-card p-4 sm:p-5 lg:p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <p className="section-label neon-text-orange">Figure board</p>
                <h1 className="neon-text mt-2 text-2xl font-black sm:text-3xl">Read the pressure fast.</h1>
              </div>
              <div className="arcade-card rounded bg-gray-900 px-4 py-3 text-right">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-muted">Round state</p>
                <p className={`mt-1 text-lg font-black ${status === 'ongoing' ? attemptsTone : ''}`}>
                  {status === 'ongoing' ? 'In play' : status === 'won' ? 'Solved' : 'Failed'}
                </p>
              </div>
            </div>

            <HangmanScene wrongGuessCount={wrongGuessCount} skinName="default" isDead={status === 'lost'} />

            <div className="mt-4">
              <div className="stat-card stat-box">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="section-label stat-label">Attempts left</p>
                    <p className={`stat-value mt-2 font-black ${attemptsTone}`}>{attemptsLeft}</p>
                  </div>
                  <div className="h-3 w-28 overflow-hidden rounded-full bg-[rgba(24,33,38,0.08)]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        attemptsLeft <= 2 ? 'bg-[#bb4d3f]' : attemptsLeft <= 4 ? 'bg-[#c48b2d]' : 'bg-[#2d8a5f]'
                      }`}
                      style={{ width: progressWidth }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="arcade-card mt-4 stat-card">
              <p className="section-label neon-text-orange">Wrong guesses</p>
              <div className="mt-3 flex min-h-10 flex-wrap gap-2">
                {wrongGuesses.length === 0 ? (
                  <span className="text-sm text-muted">No misses yet.</span>
                ) : (
                  wrongGuesses.map((letter) => (
                    <span
                      key={letter}
                      className="pop inline-flex h-10 w-10 items-center justify-center rounded border border-red-500/60 bg-gray-950 font-black text-red-500"
                    >
                      {letter}
                    </span>
                  ))
                )}
              </div>
            </div>
          </section>

          {/* ── Right: word + keyboard ───────────────────────────────── */}
          <section className="panel-dark arcade-card p-5 sm:p-6 lg:p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Word panel</p>
                <h2 className="neon-text mt-2 text-3xl font-black text-[#fff6ea]">Keep every clue in view.</h2>
              </div>
              <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 px-4 py-3">
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#d7c8bb]">Guess count</p>
                <p className="neon-text mt-1 text-2xl font-black text-[#fff6ea]">{guesses.length}</p>
              </div>
            </div>

            <div className="arcade-card mt-5 rounded border border-[#00ff88]/30 bg-gray-950 p-5 text-center sm:p-6">
              <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Target word</p>
              <div className="masked-word mt-4 break-words text-3xl font-black tracking-[0.22em] text-[#fff6ea] sm:text-5xl">
                {renderMaskedLetters(maskedWord)}
              </div>
            </div>

            {/* AI stats (player-vs-ai mode) */}
            {mode === 'player-vs-ai' && (
              <div className="mt-4 grid gap-4 sm:grid-cols-2 fade-in-up">
                <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                  <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Last AI guess</p>
                  <p className="neon-text-orange mt-3 text-3xl font-black text-[#f7d7c0]">
                    {aiThinking ? (
                      <span className="animate-pulse">…</span>
                    ) : (
                      aiGuess || '--'
                    )}
                  </p>
                </div>
                <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                  <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Candidate words</p>
                  <p className="neon-text mt-3 text-3xl font-black text-[#fff6ea]">
                    {candidateCount ?? '--'}
                  </p>
                </div>
              </div>
            )}

            {error && <p className="mt-4 shake text-sm font-semibold text-[#ffcfbe]">{error}</p>}

            <div className="arcade-card mt-5 rounded border border-[#00ff88]/30 bg-gray-950 p-4 sm:p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Keyboard</p>
                  <p className="mt-1 text-sm text-[#d7c8bb]">Tap or type letters. Press Esc to exit.</p>
                </div>
                {(loading || aiThinking) && (
                  <p className="text-sm font-bold text-[#f7d7c0] animate-pulse">
                    {aiThinking ? 'AI thinking…' : 'Processing…'}
                  </p>
                )}
              </div>

              <Keyboard
                guesses={guesses}
                wrongGuesses={wrongGuesses}
                onGuess={handleGuess}
                disabled={keyboardDisabled}
              />
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
