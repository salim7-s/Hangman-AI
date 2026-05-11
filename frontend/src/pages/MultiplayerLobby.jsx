import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export default function MultiplayerLobby() {
  const navigate = useNavigate()
  const { emit, on } = useSocket()

  const [screen, setScreen] = useState('home')
  const [nickname, setNickname] = useState('')
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [role, setRole] = useState(null)
  const [wordInput, setWordInput] = useState('')
  const [gameState, setGameState] = useState(null)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const cleanups = [
      on('room-created', ({ code, role: nextRole }) => {
        setRoomCode(code)
        setRole(nextRole)
        setScreen('create')
        setLoading(false)
      }),
      on('room-joined', ({ code, role: nextRole, wordGiverNickname }) => {
        setRoomCode(code)
        setRole(nextRole)
        setInfo(`Joined room. Waiting for ${wordGiverNickname} to submit a word.`)
        setScreen('game')
        setLoading(false)
      }),
      on('guesser-joined', ({ guesserNickname }) => {
        setInfo(`${guesserNickname} joined. Enter a secret word to begin.`)
        setScreen('word-entry')
      }),
      on('game-started', () => {
        setInfo('Game started. Begin guessing.')
        setScreen('game')
      }),
      on('game-state', (state) => {
        setGameState(state)
        setError('')
      }),
      on('rematch-started', ({ wordGiverNickname, guesserNickname }) => {
        setInfo(`New round. ${wordGiverNickname} sets the word, ${guesserNickname} guesses.`)
        setWordInput('')
        setScreen('word-entry')
      }),
      on('player-left', ({ nickname: playerNickname }) => {
        setError(`${playerNickname} left the game.`)
        setScreen('home')
      }),
      on('error', ({ message }) => {
        setError(message)
        setLoading(false)
      }),
    ]

    return () => cleanups.forEach((cleanup) => cleanup && cleanup())
  }, [on])

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCreate = () => {
    if (!nickname.trim()) return setError('Enter your badge name.')
    setError('')
    setLoading(true)
    emit('create-room', { nickname: nickname.trim() })
  }

  const handleJoin = () => {
    if (!nickname.trim()) return setError('Enter your badge name.')
    if (!inputCode.trim()) return setError('Enter an access code.')
    setError('')
    setLoading(true)
    emit('join-room', { code: inputCode.trim().toUpperCase(), nickname: nickname.trim() })
  }

  const handleSubmitWord = () => {
    if (!wordInput.trim()) return setError('Enter a word.')
    if (!/^[a-zA-Z]+$/.test(wordInput)) return setError('Use letters only.')
    emit('submit-word', { code: roomCode, word: wordInput.trim() })
    setInfo('Evidence logged. Waiting for partner.')
    setWordInput('')
  }

  const handleGuess = useCallback(
    (letter) => {
      emit('guess-letter', { code: roomCode, letter })
    },
    [emit, roomCode],
  )

  const handleRematch = () => emit('rematch', { code: roomCode })

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const isGuesser = role === 'guesser'
  const usedLetters = new Set(gameState?.guesses || [])
  const stepText =
    screen === 'home'
      ? 'Sign the ledger to open a new line of inquiry or join an existing case.'
      : screen === 'create'
        ? 'Distribute this access code to your partner.'
        : screen === 'word-entry'
          ? 'Log the classified word to begin the interrogation.'
          : 'Monitor the live investigation. Request a new file when concluded.'

  return (
    <div className="app-shell p-4 sm:p-8">
      <div className="page-wrap mx-auto max-w-5xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-4 border-dashed border-[#2c2825] pb-4">
          <button onClick={() => navigate('/')} className="text-[#2c2825] hover:opacity-70 font-bold uppercase tracking-widest text-sm transition-opacity">
            &larr; ARCHIVES
          </button>
          <span className="font-bold border-2 border-[#2c2825] px-2 py-1 uppercase bg-[#2c2825] text-[#e3d5c1]">
            MULTI-AGENT SECURE LINE
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 fade-in-up">
          {/* ── Left: Information Ledger ─────────────────────────── */}
          <section className="glass-panel p-8 rotate-[1deg]">
            <p className="font-bold uppercase tracking-widest text-sm opacity-60 mb-2">Protocol 9</p>
            <h1 className="text-4xl font-black uppercase tracking-widest mb-6">Partner <br/>Inquiry Line</h1>
            <p className="font-bold uppercase tracking-wider text-sm mb-8 opacity-80 border-l-4 border-[#2c2825] pl-4">
              Secure socket connection established. Coordinate with a remote agent. One agent logs the evidence; the other extracts the truth.
            </p>

            <div className="space-y-6">
              <div className="border-2 border-[#2c2825] p-4 bg-[#e3d5c1] shadow-[4px_4px_0px_#2c2825]">
                <p className="section-label mb-2">1. Badge In</p>
                <p className="font-bold uppercase text-sm">Provide your operative nickname.</p>
              </div>
              <div className="border-2 border-[#2c2825] p-4 bg-[#e3d5c1] shadow-[4px_4px_0px_#2c2825]">
                <p className="section-label mb-2">2. Establish Link</p>
                <p className="font-bold uppercase text-sm">Create a secure line or use a known access code.</p>
              </div>
            </div>
            
            <div className="mt-8 border-t-2 border-dashed border-[#2c2825] pt-6">
              <p className="section-label">Current Status</p>
              <p className="font-bold uppercase text-lg mt-2">{stepText}</p>
              {info && <p className="font-bold text-[#2d8a5f] uppercase text-sm mt-2">{info}</p>}
              {error && <p className="font-bold text-[#8b0000] uppercase text-sm mt-2 border-2 border-[#8b0000] p-2 shake inline-block">{error}</p>}
            </div>
          </section>

          {/* ── Right: Action Terminal ───────────────────────────────── */}
          <section className="glass-panel p-8 rotate-[-1deg] bg-[#e3d5c1] border-[#2c2825] flex flex-col justify-center">
            
            {screen === 'home' && (
              <div className="space-y-6">
                <div>
                  <p className="section-label">Operative Profile</p>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.toUpperCase())}
                    placeholder="ENTER BADGE NAME"
                    className="glass-input uppercase"
                  />
                </div>
                <div className="flex flex-col gap-4 pt-4">
                  <button onClick={handleCreate} disabled={loading} className="btn-primary py-4">
                    {loading ? 'ESTABLISHING...' : 'OPEN NEW SECURE LINE'}
                  </button>
                  <button
                    onClick={() => {
                      setError('')
                      setScreen('join')
                    }}
                    className="btn-secondary py-4"
                  >
                    ENTER ACCESS CODE
                  </button>
                </div>
              </div>
            )}

            {screen === 'join' && (
              <div className="space-y-6">
                <div>
                  <p className="section-label">Operative Profile</p>
                  <input
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value.toUpperCase())}
                    placeholder="ENTER BADGE NAME"
                    className="glass-input uppercase"
                  />
                </div>
                <div>
                  <p className="section-label">Access Code</p>
                  <input
                    value={inputCode}
                    onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                    placeholder="6-LETTER CODE"
                    maxLength={6}
                    className="glass-input uppercase text-center font-black tracking-widest text-2xl"
                  />
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button onClick={handleJoin} disabled={loading} className="btn-primary flex-1 py-4">
                    {loading ? 'JOINING...' : 'CONNECT'}
                  </button>
                  <button onClick={() => setScreen('home')} className="btn-secondary flex-1 py-4">
                    CANCEL
                  </button>
                </div>
              </div>
            )}

            {screen === 'create' && (
              <div className="text-center space-y-8">
                <p className="section-label">Access Code Generated</p>
                <p className="text-6xl font-black tracking-[0.2em] border-y-4 border-[#2c2825] py-6 my-8">
                  {roomCode}
                </p>
                <p className="font-bold uppercase text-sm opacity-80">Awaiting partner connection...</p>
                <button onClick={handleCopyRoomCode} className="btn-secondary py-3 px-8 text-sm">
                  {copied ? 'COPIED TO CLIPBOARD' : 'COPY CODE'}
                </button>
              </div>
            )}

            {screen === 'word-entry' && role === 'word-giver' && (
              <div className="space-y-6">
                <p className="section-label">You are the Informant</p>
                <p className="font-bold uppercase text-sm mb-6">Type the secret evidence word. Your partner will attempt to extract it.</p>
                
                <div>
                  <input
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                    placeholder="ENTER SECRET WORD"
                    maxLength={20}
                    className="glass-input uppercase text-center font-black tracking-widest text-2xl"
                  />
                </div>
                <button onClick={handleSubmitWord} className="btn-primary w-full py-4 mt-4">
                  LOG EVIDENCE
                </button>
              </div>
            )}

            {screen === 'game' && gameState && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-4 border-b-2 border-[#2c2825] pb-6">
                  <div>
                    <p className="text-xs font-bold uppercase opacity-60">Informant</p>
                    <p className="font-black text-xl">{gameState.wordGiver}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase opacity-60">Extractor</p>
                    <p className="font-black text-xl">{gameState.guesser || 'WAITING...'}</p>
                  </div>
                </div>

                {gameState.maskedWord && (
                  <div className="text-center">
                    <p className="section-label">Classified Word</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4 mb-4">
                      {gameState.maskedWord.split(' ').map((letter, index) => (
                        <div key={`${letter}-${index}`} className="w-10 h-12 border-b-4 border-[#2c2825] flex items-center justify-center text-3xl font-bold uppercase">
                          {letter}
                        </div>
                      ))}
                    </div>
                    <p className="font-bold uppercase text-sm opacity-80">
                      Strikes Remaining: <span className="text-xl font-black">{gameState.attemptsLeft}</span> / 6
                    </p>
                  </div>
                )}

                {isGuesser && gameState.status === 'ongoing' && (
                  <div className="border-t-2 border-[#2c2825] pt-6">
                    <p className="section-label mb-4">Typewriter</p>
                    <div className="flex flex-wrap justify-center gap-2">
                      {ALPHABET.map((letter) => {
                        const correct = gameState.guesses?.includes(letter) && !gameState.wrongGuesses?.includes(letter)
                        const wrong = gameState.wrongGuesses?.includes(letter)
                        const isUsed = usedLetters.has(letter)

                        let btnClass = "w-10 h-10 rounded-full border-2 border-[#2c2825] text-lg font-bold uppercase transition-all shadow-[2px_2px_0px_#2c2825]"
            
                        if (!isUsed) {
                          btnClass += " bg-[#d4c5b0] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
                        } else if (correct) {
                          btnClass += " bg-[#2c2825] text-[#d4c5b0] shadow-none translate-y-[2px] translate-x-[2px]"
                        } else if (wrong) {
                          btnClass += " bg-[#e3d5c1] text-[#2c2825] opacity-50 shadow-none translate-y-[2px] translate-x-[2px] relative overflow-hidden"
                        }

                        return (
                          <button
                            key={letter}
                            onClick={() => handleGuess(letter)}
                            disabled={isUsed}
                            className={btnClass}
                          >
                            {letter}
                            {wrong && <div className="absolute inset-0 bg-[#8b0000] opacity-80 w-full h-[2px] top-1/2 -mt-[1px] -rotate-45 pointer-events-none"></div>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {gameState.status === 'won' && (
                  <div className="text-center border-t-4 border-dashed border-[#2c2825] pt-8">
                    <p className="text-3xl font-black uppercase tracking-widest text-[#10B981] mb-2">CASE SOLVED</p>
                    {gameState.word && <p className="text-xl font-bold uppercase mb-6">{gameState.word}</p>}
                    <button onClick={handleRematch} className="btn-primary py-4 px-8">
                      OPEN NEW CASE
                    </button>
                  </div>
                )}

                {gameState.status === 'lost' && (
                  <div className="text-center border-t-4 border-dashed border-[#2c2825] pt-8">
                    <p className="text-3xl font-black uppercase tracking-widest text-[#8b0000] mb-2">CASE FAILED</p>
                    {gameState.word && <p className="text-lg font-bold uppercase mb-6 opacity-80">True Word: <span className="text-xl">{gameState.word}</span></p>}
                    <button onClick={handleRematch} className="btn-primary py-4 px-8">
                      RETRY CASE
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
