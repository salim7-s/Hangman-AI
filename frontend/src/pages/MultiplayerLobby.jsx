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
    if (!nickname.trim()) return setError('Enter your nickname.')
    setError('')
    setLoading(true)
    emit('create-room', { nickname: nickname.trim() })
  }

  const handleJoin = () => {
    if (!nickname.trim()) return setError('Enter your nickname.')
    if (!inputCode.trim()) return setError('Enter a room code.')
    setError('')
    setLoading(true)
    emit('join-room', { code: inputCode.trim().toUpperCase(), nickname: nickname.trim() })
  }

  const handleSubmitWord = () => {
    if (!wordInput.trim()) return setError('Enter a word.')
    if (!/^[a-zA-Z]+$/.test(wordInput)) return setError('Use letters only.')
    emit('submit-word', { code: roomCode, word: wordInput.trim() })
    setInfo('Word submitted. Waiting for the guesser.')
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
      ? 'Choose whether to create or join a room.'
      : screen === 'create'
        ? 'Share the room code and wait for the second player.'
        : screen === 'word-entry'
          ? 'Set the secret word to start the round.'
          : 'Track the live round and request a rematch when it ends.'

  return (
    <div className="app-shell">
      <div className="page-wrap mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8">
        <div className="hero-grid fade-in-up">
          <section className="glass-panel grain-panel panel-strong arcade-card p-6 sm:p-8 lg:p-10">
            <button onClick={() => navigate('/')} className="ghost-btn arcade-btn px-0 py-2 text-sm font-bold">
              Back to home
            </button>

            <div className="mt-5">
              <p className="section-label neon-text-orange">Multiplayer lobby</p>
              <h1 className="page-title neon-text mt-3 text-balance">Room codes, clearer roles, less waiting friction.</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">
                The same socket flow, but with a more guided layout for creating rooms, joining fast,
                and understanding who does what next.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="stat-card stat-box">
                <p className="section-label stat-label">1. Connect</p>
                <p className="stat-value mt-2 text-lg font-black">Name yourself</p>
                <p className="stat-label mt-1 text-sm text-muted">Your nickname is shared in the room.</p>
              </div>
              <div className="stat-card stat-box">
                <p className="section-label stat-label">2. Match</p>
                <p className="stat-value mt-2 text-lg font-black">Create or join</p>
                <p className="stat-label mt-1 text-sm text-muted">Use a short code to sync both players.</p>
              </div>
              <div className="stat-card stat-box">
                <p className="section-label stat-label">3. Play</p>
                <p className="stat-value mt-2 text-lg font-black">Swap roles each round</p>
                <p className="stat-label mt-1 text-sm text-muted">Word giver and guesser stay obvious.</p>
              </div>
            </div>

            <div className="arcade-card mt-8 rounded border border-[var(--line)] bg-gray-900 p-5">
              <p className="section-label neon-text-orange">Current step</p>
              <p className="mt-2 text-lg font-bold text-gray-100">{stepText}</p>
              {info && <p className="mt-3 text-sm font-semibold text-[#146c68]">{info}</p>}
              {error && <p className="mt-3 shake text-sm font-semibold text-[#bb4d3f]">{error}</p>}
            </div>
          </section>

          <section className="panel-dark arcade-card p-5 sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Room flow</p>
                <h2 className="display-title neon-text mt-2 text-[#fff6ea]">Guide both players through the round.</h2>
              </div>
              <span className="rounded border border-[#00ff88]/30 px-3 py-1 text-sm font-bold neon-text-orange">
                Live
              </span>
            </div>

            {screen === 'home' && (
              <div className="mt-6 space-y-4">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  className="app-input"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={handleCreate} disabled={loading} className="primary-btn arcade-btn px-5">
                    {loading ? 'Creating...' : 'Create room'}
                  </button>
                  <button
                    onClick={() => {
                      setError('')
                      setScreen('join')
                    }}
                    className="secondary-btn arcade-btn arcade-btn-orange px-5"
                  >
                    Join room
                  </button>
                </div>
              </div>
            )}

            {screen === 'join' && (
              <div className="mt-6 space-y-4">
                <input
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="Your nickname"
                  className="app-input"
                />
                <input
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                  placeholder="Room code"
                  maxLength={6}
                  className="app-input app-input-mono text-center text-xl"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <button onClick={handleJoin} disabled={loading} className="primary-btn arcade-btn px-5">
                    {loading ? 'Joining...' : 'Join game'}
                  </button>
                  <button onClick={() => setScreen('home')} className="secondary-btn arcade-btn arcade-btn-orange px-5">
                    Back
                  </button>
                </div>
              </div>
            )}

            {screen === 'create' && (
              <div className="arcade-card mt-6 rounded border border-[#00ff88]/30 bg-gray-950 p-6 text-center">
                <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Share this room code</p>
                <p className="app-input-mono mt-4 text-5xl font-black tracking-[0.26em] text-[#fff6ea]">
                  {roomCode}
                </p>
                <p className="mt-3 text-sm text-[#d7c8bb]">Waiting for the second player to join.</p>
                <button onClick={handleCopyRoomCode} className="secondary-btn arcade-btn arcade-btn-orange mt-5 px-5 text-sm">
                  {copied ? 'Copied' : 'Copy code'}
                </button>
              </div>
            )}

            {screen === 'word-entry' && role === 'word-giver' && (
              <div className="mt-6 space-y-4">
                <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                  <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">You are the word giver</p>
                  <p className="mt-2 text-sm text-[#d7c8bb]">
                    Enter a word once, then hand the device over or wait for the remote guesser.
                  </p>
                </div>
                <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                  <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Room code</p>
                  <p className="app-input-mono mt-2 text-2xl font-black text-[#fff6ea]">{roomCode}</p>
                </div>
                <input
                  value={wordInput}
                  onChange={(e) => setWordInput(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                  placeholder="Type a secret word"
                  maxLength={20}
                  className="app-input app-input-mono text-center text-xl"
                />
                <button onClick={handleSubmitWord} className="primary-btn arcade-btn w-full px-5">
                  Submit word
                </button>
              </div>
            )}

            {screen === 'game' && gameState && (
              <div className="mt-6 space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                    <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Room</p>
                    <p className="app-input-mono mt-2 text-2xl font-black text-[#fff6ea]">{roomCode}</p>
                  </div>
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                    <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Role</p>
                    <p className="mt-2 text-lg font-black text-[#fff6ea]">
                      {isGuesser ? 'Guesser' : 'Word giver'}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                    <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Word giver</p>
                    <p className="mt-2 text-lg font-black text-[#f7d7c0]">{gameState.wordGiver}</p>
                  </div>
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                    <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Guesser</p>
                    <p className="mt-2 text-lg font-black text-[#fff6ea]">
                      {gameState.guesser || 'Waiting'}
                    </p>
                  </div>
                </div>

                {gameState.maskedWord && (
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-5 text-center sm:p-6">
                    <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Word</p>
                    <div className="masked-word mt-4 break-words text-3xl font-black tracking-[0.22em] text-[#fff6ea]">
                      {gameState.maskedWord.split(' ').map((letter, index) => (
                        <div key={`${letter}-${index}`} className="letter-box">
                          {letter}
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-[#d7c8bb]">
                      Attempts left:{' '}
                      <span className="font-black text-[#fff6ea]">{gameState.attemptsLeft}</span> / 6
                    </p>
                  </div>
                )}

                <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                  <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Wrong guesses</p>
                  <div className="mt-3 flex min-h-10 flex-wrap gap-2">
                    {gameState.wrongGuesses?.length ? (
                      gameState.wrongGuesses.map((letter) => (
                        <span
                          key={letter}
                          className="pop inline-flex h-10 w-10 items-center justify-center rounded border border-red-500/60 bg-gray-950 font-black text-red-500"
                        >
                          {letter}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-[#d7c8bb]">No misses yet.</span>
                    )}
                  </div>
                </div>

                {isGuesser && gameState.status === 'ongoing' && (
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-4">
                    <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Guess letters</p>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      {ALPHABET.map((letter) => {
                        const correct =
                          gameState.guesses?.includes(letter) &&
                          !gameState.wrongGuesses?.includes(letter)
                        const wrong = gameState.wrongGuesses?.includes(letter)
                        let tone = ''
                        if (correct) tone = 'correct'
                        if (wrong) tone = 'wrong'

                        return (
                          <button
                            key={letter}
                            onClick={() => handleGuess(letter)}
                            disabled={usedLetters.has(letter)}
                            style={{ touchAction: 'manipulation' }}
                            className={`key-btn ${tone} w-10 text-sm ${
                              usedLetters.has(letter) ? 'cursor-not-allowed' : ''
                            }`}
                          >
                            {letter}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {gameState.status === 'won' && (
                  <div className="arcade-card rounded border border-[#00ff88]/30 bg-gray-950 p-6 text-center">
                    <p className="section-label neon-text-orange text-[#caecd8]">Round result</p>
                    <p className="neon-text mt-2 text-3xl font-black text-white">Word solved.</p>
                    {gameState.word && (
                      <p className="app-input-mono mt-3 text-xl font-black text-[#fff6ea]">
                        {gameState.word}
                      </p>
                    )}
                    <button onClick={handleRematch} className="primary-btn arcade-btn mt-5 px-6">
                      Start rematch
                    </button>
                  </div>
                )}

                {gameState.status === 'lost' && (
                  <div className="arcade-card rounded border border-red-500/60 bg-gray-950 p-6 text-center">
                    <p className="section-label neon-text-orange text-[#ffd4ca]">Round result</p>
                    <p className="neon-text-orange mt-2 text-3xl font-black text-white">Game over.</p>
                    {gameState.word && (
                      <p className="mt-3 text-sm text-[#fff0e9]">
                        Final word:{' '}
                        <span className="app-input-mono font-black text-white">{gameState.word}</span>
                      </p>
                    )}
                    <button onClick={handleRematch} className="primary-btn arcade-btn mt-5 px-6">
                      Start rematch
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
