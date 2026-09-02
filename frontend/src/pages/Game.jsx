import { useState, useEffect, useEffectEvent, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import HangmanScene from '../components/HangmanScene'
import Keyboard from '../components/Keyboard'
import ResultModal from '../components/ResultModal'
import InspectorGuide from '../components/InspectorGuide'
import api from '../services/api'
import { useStreak } from '../hooks/useStreak'
import { useSounds } from '../hooks/useSounds'

const MODE_LABELS = {
  'ai-vs-player': 'SOLO INVESTIGATION',
  'player-vs-ai': 'AI INTERROGATION',
  'player-vs-player': 'LOCAL DUEL',
}

export default function Game() {
  const location = useLocation()
  const navigate = useNavigate()
  const init = location.state

  const gameId = init?.gameId || null
  const [maskedWord, setMaskedWord] = useState(init?.maskedWord || '')
  const [guesses, setGuesses] = useState([])
  const [wrongGuesses, setWrongGuesses] = useState([])
  const [attemptsLeft, setAttemptsLeft] = useState(init?.attemptsLeft ?? 6)
  const [status, setStatus] = useState('ongoing')
  const [word, setWord] = useState('')
  const [aiGuess, setAiGuess] = useState(null)
  const [candidateCount, setCandidateCount] = useState(null)
  const [wordNotInDict, setWordNotInDict] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiThinking, setAiThinking] = useState(false)
  const [error, setError] = useState('')
  const mode = init?.mode || ''

  const { recordWin, recordLoss, streak: initialStreak, bestStreak: initialBest } = useStreak()
  const [streakSnapshot, setStreakSnapshot] = useState({ streak: initialStreak, bestStreak: initialBest })
  const [muted, setMuted] = useState(false)
  const sounds = useSounds()

  // FIX 1 — prevents AI double-guess race condition
  const aiHasGuessedRef = useRef(false)

  const difficulty = init?.difficulty || 'medium'
  const [explanation, setExplanation] = useState(null)
  const [showExplanation, setShowExplanation] = useState(false)
  const [aiUsedWeb, setAiUsedWeb] = useState(false)

  // ── IN-GAME INSPECTOR ABILITY STATES ──
  const [shieldActive, setShieldActive] = useState(false)
  const [eliminatedLetters, setEliminatedLetters] = useState([])
  const shieldActiveRef = useRef(false)
  shieldActiveRef.current = shieldActive


  useEffect(() => {
    if (mode !== 'player-vs-ai' || status !== 'ongoing' || !maskedWord) return

    let active = true
    async function fetchExplanation() {
      try {
        const res = await api.post('/api/game/explain', {
          pattern: maskedWord,
          wrongLetters: wrongGuesses,
          guesses: guesses,
          difficulty,
          mode
        })
        if (active) {
          setExplanation(res.data)
          if (res.data.usedExternalApi !== undefined) {
            setAiUsedWeb(res.data.usedExternalApi)
          }
        }
      } catch (err) {
        console.error('Failed to fetch explanation:', err)
      }
    }
    fetchExplanation()
    return () => {
      active = false
    }
  }, [mode, status, maskedWord, wrongGuesses, guesses, difficulty])

  useEffect(() => {
    if (!gameId) navigate('/')
  }, [gameId, navigate])

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape' && status === 'ongoing') navigate('/')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [status, navigate])

  async function handleGuess(letter) {
    if (loading || aiThinking || status !== 'ongoing') return
    setLoading(true)
    setError('')

    try {
      const res = await api.post('/api/game/guess', { gameId, letter })
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
          aiHasGuessedRef.current = false
        }, 600)
      } else {
        aiHasGuessedRef.current = false
      }
      if (data.candidateCount !== undefined && !data.aiGuess) {
        setCandidateCount(data.candidateCount)
      }
      if (data.wordInDictionary === false) setWordNotInDict(true)
      if (data.aiUsedWeb !== undefined) setAiUsedWeb(data.aiUsedWeb)

      if (!muted) {
        if (data.status === 'won' || data.status === 'lost') {
          const won = mode === 'player-vs-ai' ? data.status === 'lost' : data.status === 'won'
          if (won) sounds.playWin()
          else sounds.playLose()
        }
        else if (data.wrongGuesses?.length > wrongGuesses.length) {
          if (shieldActiveRef.current) {
            // Shield absorbs the wrong guess sound and effect
            sounds.playCorrect()
          } else {
            sounds.playWrong()
          }
        }
        else sounds.playCorrect()
      }

      // Check if Banana Strike Shield absorbed a wrong guess
      if (shieldActiveRef.current && data.wrongGuesses?.length > wrongGuesses.length) {
        setShieldActive(false)
        shieldActiveRef.current = false
        // Restore 1 attempt because shield absorbed the penalty
        setAttemptsLeft((prev) => Math.min(6, prev + 1))
        setError("🍌 Banana Strike Shield absorbed the wrong strike penalty!")
      }

      if (data.status === 'won' || data.status === 'lost') {
        const won = mode === 'player-vs-ai' ? data.status === 'lost' : data.status === 'won'
        setStreakSnapshot(won ? recordWin() : recordLoss())
      }
    } catch (err) {
      setError(err.response?.data?.error || 'COMMUNICATION ERROR.')
      aiHasGuessedRef.current = false
    } finally {
      setLoading(false)
    }
  }

  // ── IN-GAME INSPECTOR ABILITY ACTIVATION ──
  const handleInspectorAbility = async (charId, { speak }) => {
    if (status !== 'ongoing') return

    if (charId === 2) {
      // MINION: Banana Strike Shield
      setShieldActive(true)
      shieldActiveRef.current = true
      speak("🍌 BANANAAAA! Baboi tulaliloo papoy! Bee-do bee-do shield active! Next wrong guess absorbed!")
    } else if (charId === 3) {
      // DORAEMON: Pocket Letter Probe (Reveal 1 correct letter for free)
      try {
        // Query top candidate letters from explain API or pick high frequency vowel
        const res = await api.post('/api/game/explain', {
          pattern: maskedWord,
          wrongLetters: wrongGuesses,
          guesses: guesses,
          difficulty,
          mode,
        })
        const candidates = res.data?.letterScores || {}
        const sorted = Object.entries(candidates)
          .filter(([l]) => !guesses.includes(l) && !wrongGuesses.includes(l))
          .sort((a, b) => b[1] - a[1])

        const probeLetter = sorted.length > 0 ? sorted[0][0] : ['E', 'A', 'O', 'I', 'T', 'N', 'S'].find((l) => !guesses.includes(l)) || 'E'

        speak(`🐱 4D Pocket Gadget Deployed! Probe scanning evidence board for letter '${probeLetter}'!`)
        setTimeout(() => {
          handleGuess(probeLetter)
        }, 500)
      } catch {
        const fallback = ['E', 'A', 'O', 'I', 'T'].find((l) => !guesses.includes(l)) || 'E'
        speak(`🐱 4D Pocket Gadget Deployed! Uncovered letter '${fallback}'!`)
        setTimeout(() => {
          handleGuess(fallback)
        }, 500)
      }
    } else if (charId === 4) {
      // SPIDER-MAN: Spider-Sense Purge (Webs up 3 wrong trap letters on keyboard)
      const alphabet = 'QWERTYUIOPASDFGHJKLZXCVBNM'.split('')
      const unused = alphabet.filter((l) => !guesses.includes(l) && !wrongGuesses.includes(l) && !eliminatedLetters.includes(l))
      
      // Pick low frequency trap letters that are not currently guessed
      const trapPool = unused.filter((l) => ['Z', 'X', 'Q', 'J', 'K', 'V', 'B', 'P', 'W', 'Y'].includes(l))
      const purged = (trapPool.length >= 3 ? trapPool : unused).slice(0, 3)

      setEliminatedLetters((prev) => [...prev, ...purged])
      speak(`🕷️ Spider-Sense Purge! Traps [${purged.join(', ')}] permanently webbed up on keyboard!`)
    }
  }

  const queueAiTurn = useEffectEvent(() => {
    handleGuess('')
  })

  // FIX 1 — reset guard when a new game begins (status flips to 'ongoing')
  useEffect(() => {
    if (status === 'ongoing') aiHasGuessedRef.current = false
  }, [status])

  // FIX 1 — guarded AI trigger: aiHasGuessedRef prevents double-firing
  useEffect(() => {
    if (
      mode === 'player-vs-ai' &&
      status === 'ongoing' &&
      !loading &&
      !aiThinking &&
      !aiHasGuessedRef.current
    ) {
      aiHasGuessedRef.current = true
      const timer = setTimeout(() => queueAiTurn(), 1500)
      return () => clearTimeout(timer)
    }
  }, [mode, status, loading, aiThinking])

  function handlePlayAgain() {
    navigate('/')
  }

  function renderMaskedLetters(value) {
    return (value || '_ _ _ _').split(' ').map((letter, index) => (
      <div
        key={`${letter}-${index}`}
        className="flex h-11 w-8 items-center justify-center border-b-[4px] border-[#2c2825] text-2xl font-bold uppercase sm:h-14 sm:w-12 sm:text-4xl"
      >
        {letter}
      </div>
    ))
  }

  const wrongGuessCount = 6 - attemptsLeft
  const keyboardDisabled = loading || aiThinking || status !== 'ongoing'

  return (
    <div className="app-shell p-3 sm:p-8">
      <div className="page-wrap mx-auto max-w-6xl lg:max-w-7xl xl:max-w-8xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-4 border-dashed border-[#2c2825] pb-4">
          <button
            onClick={() => navigate('/')}
            className="text-[#2c2825] hover:opacity-70 text-sm font-bold uppercase tracking-widest transition-opacity"
          >
            &larr; ARCHIVES
          </button>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <span className="border-2 border-[#2c2825] px-2 py-1 text-xs font-bold uppercase sm:text-sm">
              {MODE_LABELS[mode] || 'CASE FILE'}
            </span>
            <span className="border-2 border-[#2c2825] bg-[#2c2825] px-2 py-1 text-xs font-bold uppercase text-[#e3d5c1] sm:text-sm">
              STRIKES LEFT: {attemptsLeft}/6
            </span>
            <button onClick={() => setMuted((value) => !value)} className="font-bold text-[#2c2825] underline">
              {muted ? 'RADIO MUTED' : 'RADIO ON'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 fade-in-up lg:grid-cols-12 lg:gap-8">
          <section className="flex flex-col gap-6 lg:col-span-5 lg:gap-8">
            <div className="glass-panel p-4 sm:p-6 sm:rotate-[-1deg]">
              <div className="mb-4 flex flex-col gap-2 border-b-2 border-[#2c2825] pb-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="font-bold uppercase tracking-[0.12em] sm:tracking-widest">Suspect Sketch</p>
                <p className="text-xs font-bold uppercase tracking-[0.12em] opacity-60 sm:text-sm sm:tracking-widest">
                  Status: {status === 'ongoing' ? 'AT LARGE' : status === 'won' ? 'CAPTURED' : 'ESCAPED'}
                </p>
              </div>

              <div className="border-4 border-[#2c2825] bg-[#d4c5b0] p-2">
                <HangmanScene wrongGuessCount={wrongGuessCount} skinName="default" isDead={status === 'lost'} />
              </div>

              <div className="mt-6">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest">Errors in Judgement</p>
                <div className="flex min-h-[40px] flex-wrap gap-2">
                  {wrongGuesses.length === 0 ? (
                    <span className="text-sm font-bold italic opacity-50">No errors yet.</span>
                  ) : (
                    wrongGuesses.map((letter) => (
                      <span
                        key={letter}
                        className="text-2xl font-black uppercase text-[#8b0000] line-through decoration-4"
                      >
                        {letter}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

            {mode === 'player-vs-ai' && (
              <div className="glass-panel p-4 sm:p-6 sm:rotate-[1deg]">
                <p className="mb-4 border-b-2 border-[#2c2825] pb-2 font-bold uppercase tracking-widest">
                  Interrogation Log
                </p>
                {wordNotInDict && (
                  <p className="mb-3 border-2 border-[#8b0000] p-2 text-xs font-bold uppercase text-[#8b0000]">
                    ⚠ Word not in AI dictionary — operating on frequency fallback
                  </p>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-bold opacity-70">AI SUSPECTS:</p>
                    <p className="text-2xl font-black">{aiThinking ? '...' : aiGuess || '--'}</p>
                    {aiUsedWeb && !aiThinking && (
                      <p className="text-[10px] text-[#2d8a5f] font-black uppercase mt-1 animate-pulse">🌐 Web-Assisted</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-bold opacity-70">POSSIBILITIES:</p>
                    <p className="text-2xl font-black">{candidateCount ?? '--'}</p>
                  </div>
                </div>

                {explanation && (
                  <div className="mt-4 border-t-2 border-dashed border-[#2c2825] pt-4">
                    <button
                      onClick={() => setShowExplanation(!showExplanation)}
                      className="w-full text-left text-xs font-black uppercase tracking-wider text-[#2c2825] underline hover:opacity-80"
                    >
                      {showExplanation ? '▼ HIDE AI EXPLAINER' : '▶ VIEW AI EXPLAINER'}
                    </button>
                    {showExplanation && (
                      <div className="mt-3 space-y-2 text-[10px] sm:text-xs font-bold uppercase">
                        <p><span className="opacity-60">Strategy:</span> {explanation.strategy}</p>
                        {explanation.topCandidates && explanation.topCandidates.length > 0 && (
                          <p>
                            <span className="opacity-60">Top Candidates:</span>{' '}
                            {explanation.topCandidates.join(', ')}
                          </p>
                        )}
                        {explanation.letterScores && Object.keys(explanation.letterScores).length > 0 && (
                          <div>
                            <p className="opacity-60 mb-1">Operative Scores:</p>
                            <div className="flex flex-wrap gap-2">
                              {Object.entries(explanation.letterScores)
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 5)
                                .map(([letter, score]) => (
                                  <span key={letter} className="border border-[#2c2825] px-1.5 py-0.5 bg-[#f1e7d8]">
                                    {letter}: {score}
                                  </span>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="flex flex-col gap-6 lg:col-span-7 lg:gap-8">
            <div className="glass-panel flex h-full flex-col p-4 sm:p-8 lg:p-12">
              <div className="mb-8 sm:mb-12">
                <p className="section-label">Evidence Board</p>
                <div className="mt-4 flex flex-wrap justify-center gap-2 sm:gap-3">
                  {renderMaskedLetters(maskedWord)}
                </div>
              </div>

              <div className="mt-auto">
                <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <p className="section-label mb-0">Typewriter</p>
                  {(loading || aiThinking) && (
                    <p className="animate-pulse text-sm font-bold text-[#8b0000]">PROCESSING...</p>
                  )}
                </div>

                {error && (
                  <p className="shake mb-4 border-2 border-[#8b0000] p-2 text-center font-bold text-[#8b0000]">
                    {error}
                  </p>
                )}

                <Keyboard
                  guesses={guesses}
                  wrongGuesses={wrongGuesses}
                  onGuess={handleGuess}
                  disabled={keyboardDisabled}
                  eliminatedLetters={eliminatedLetters}
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
          mode={mode}
        />

        {/* ── Active Gameplay Inspector Guide ── */}
        <InspectorGuide
          view="game"
          mode={mode}
          difficulty={difficulty}
          attemptsLeft={attemptsLeft}
          status={status}
          aiGuess={aiGuess}
          candidateCount={candidateCount}
          onUseAbility={handleInspectorAbility}
        />
      </div>
    </div>
  )
}
