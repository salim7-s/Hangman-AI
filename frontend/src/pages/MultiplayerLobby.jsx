import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../context/auth-context'
import api from '../services/api'
import HangmanScene from '../components/HangmanScene'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function getScreenForState(role, status, fallback = 'game') {
  if (status === 'waiting' && role === 'word-giver') return 'create'
  if (status === 'word-entry' && role === 'word-giver') return 'word-entry'
  return fallback
}

export default function MultiplayerLobby() {
  const navigate = useNavigate()
  const { emit, on } = useSocket()
  const { user } = useAuth()

  const [screen, setScreen] = useState('home')
  const [nickname, setNickname] = useState(() => user?.username?.toUpperCase() || '')
  const [roomCode, setRoomCode] = useState('')
  const [inputCode, setInputCode] = useState('')
  const [role, setRole] = useState(null)
  const [wordInput, setWordInput] = useState('')
  const [gameState, setGameState] = useState(null)
  const [chatInput, setChatInput] = useState('')
  const [chatMessages, setChatMessages] = useState([])
  const [leaderboard, setLeaderboard] = useState([])
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)
  const [leaderboardLoading, setLeaderboardLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const cleanups = [
      on('room-created', ({ code, role: nextRole, screen: nextScreen, room }) => {
        setRoomCode(code)
        setRole(nextRole)
        setGameState(room)
        setChatMessages(room?.chatMessages || [])
        setScreen(nextScreen || 'create')
        setInfo('Secure line established. Share the room code with your partner.')
        setLoading(false)
      }),
      on('room-joined', ({ code, role: nextRole, screen: nextScreen, room, wordGiverNickname, reconnected }) => {
        setRoomCode(code)
        setRole(nextRole)
        setGameState(room)
        setChatMessages(room?.chatMessages || [])
        setScreen(nextScreen || getScreenForState(nextRole, room?.status, 'game'))
        setInfo(
          reconnected
            ? 'Connection restored. Room state synced from storage.'
            : `Joined room. Waiting for ${wordGiverNickname} to submit a word.`
        )
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
        setChatMessages(state.chatMessages || [])
        setScreen((current) => getScreenForState(role, state.status, current === 'home' || current === 'join' ? 'game' : current))
        setError('')
      }),
      on('chat-message', (message) => {
        setChatMessages((current) => [...current, message].slice(-50))
      }),
      on('role-updated', ({ role: nextRole, screen: nextScreen }) => {
        setRole(nextRole)
        setScreen(nextScreen || 'game')
      }),
      on('rematch-started', ({ wordGiverNickname, guesserNickname }) => {
        setInfo(`New round. ${wordGiverNickname} sets the word, ${guesserNickname} guesses.`)
        setWordInput('')
      }),
      on('player-left', ({ nickname: playerNickname }) => {
        if (playerNickname) {
          setInfo(`${playerNickname} disconnected. Room state has been saved.`)
        }
      }),
      on('error', ({ message }) => {
        setError(message)
        setLoading(false)
      }),
    ]

    return () => cleanups.forEach((cleanup) => cleanup && cleanup())
  }, [on, role])

  useEffect(() => {
    if (!copied) return undefined
    const timer = window.setTimeout(() => setCopied(false), 1400)
    return () => window.clearTimeout(timer)
  }, [copied])

  const handleCreate = () => {
    if (!nickname.trim()) return setError('Enter your badge name.')
    setError('')
    setLoading(true)
    emit('create-room', { nickname: nickname.trim().toUpperCase() })
  }

  const handleJoin = () => {
    if (!nickname.trim()) return setError('Enter your badge name.')
    if (!inputCode.trim()) return setError('Enter an access code.')
    setError('')
    setLoading(true)
    emit('join-room', {
      code: inputCode.trim().toUpperCase(),
      nickname: nickname.trim().toUpperCase(),
    })
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

  const handleSendChat = () => {
    if (!chatInput.trim()) return
    emit('send-chat-message', { code: roomCode, message: chatInput.trim() })
    setChatInput('')
  }

  const handleCopyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const handleToggleLeaderboard = async () => {
    const nextOpen = !leaderboardOpen
    setLeaderboardOpen(nextOpen)

    if (!nextOpen || leaderboard.length > 0) return

    try {
      setLeaderboardLoading(true)
      const response = await api.get('/api/game/leaderboard')
      setLeaderboard(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not load leaderboard.')
    } finally {
      setLeaderboardLoading(false)
    }
  }

  const isGuesser = role === 'guesser'
  const usedLetters = new Set(gameState?.guesses || [])
  const hasActiveRoom = Boolean(roomCode) || screen === 'create' || screen === 'word-entry' || screen === 'game'
  const wrongGuessCount = gameState?.wrongGuesses?.length || 0
  const stepText =
    screen === 'home'
      ? 'Sign the ledger to open a new line of inquiry or join an existing case.'
      : screen === 'create'
        ? 'Distribute this access code to your partner.'
        : screen === 'word-entry'
          ? 'Log the classified word to begin the interrogation.'
          : 'Monitor the live investigation. Use chat to coordinate with your partner.'

  return (
    <div className="app-shell p-3 sm:p-8">
      <div className="page-wrap mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 border-b-4 border-dashed border-[#2c2825] pb-4">
          <button onClick={() => navigate('/')} className="text-[#2c2825] hover:opacity-70 font-bold uppercase tracking-widest text-sm transition-opacity">
            &larr; ARCHIVES
          </button>
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleToggleLeaderboard} className="btn-secondary px-4 py-2 text-sm">
              {leaderboardOpen ? 'HIDE LEADERBOARD' : 'VIEW LEADERBOARD'}
            </button>
            <span className="font-bold border-2 border-[#2c2825] px-2 py-1 uppercase bg-[#2c2825] text-[#e3d5c1]">
              MULTI-AGENT SECURE LINE
            </span>
          </div>
        </div>

        {leaderboardOpen && (
          <section className="glass-panel mb-8 p-6 rotate-[0.4deg]">
            <div className="mb-4 flex items-center justify-between border-b-2 border-[#2c2825] pb-3">
              <div>
                <p className="section-label mb-1">Leaderboard</p>
                <p className="font-bold uppercase text-sm opacity-70">Top agents by recorded wins</p>
              </div>
              <button onClick={() => setLeaderboardOpen(false)} className="text-sm font-bold uppercase underline">
                Close
              </button>
            </div>

            {leaderboardLoading ? (
              <p className="font-bold uppercase text-sm">Loading standings...</p>
            ) : leaderboard.length === 0 ? (
              <p className="font-bold uppercase text-sm opacity-70">No ranked data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm uppercase">
                  <thead>
                    <tr className="border-b-2 border-[#2c2825]">
                      <th className="py-2">Rank</th>
                      <th className="py-2">Agent</th>
                      <th className="py-2">Wins</th>
                      <th className="py-2">Games</th>
                      <th className="py-2">Win %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={`${entry.username}-${entry.rank}`} className="border-b border-[#2c2825]/20">
                        <td className="py-2 font-black">{entry.rank}</td>
                        <td className="py-2 font-bold">{entry.username}</td>
                        <td className="py-2">{entry.wins}</td>
                        <td className="py-2">{entry.gamesPlayed}</td>
                        <td className="py-2">{entry.winPercent}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <div className={`fade-in-up ${hasActiveRoom ? 'mx-auto max-w-4xl' : ''}`}>
          <div className={`grid grid-cols-1 gap-8 ${hasActiveRoom ? '' : 'lg:grid-cols-2'}`}>
            {!hasActiveRoom && (
              <section className="glass-panel p-5 sm:rotate-[1deg] sm:p-8">
                <p className="mb-2 text-sm font-bold uppercase tracking-widest opacity-60">Protocol 9</p>
                <h1 className="mb-6 text-3xl font-black uppercase tracking-[0.12em] sm:text-4xl sm:tracking-widest">Partner <br />Inquiry Line</h1>
                <p className="mb-8 border-l-4 border-[#2c2825] pl-4 text-sm font-bold uppercase tracking-wider opacity-80">
                  Secure socket connection established. Coordinate with a remote agent. One agent logs the evidence; the other extracts the truth.
                </p>

                <div className="space-y-6">
                  <div className="border-2 border-[#2c2825] bg-[#e3d5c1] p-4 shadow-[4px_4px_0px_#2c2825]">
                    <p className="section-label mb-2">1. Badge In</p>
                    <p className="text-sm font-bold uppercase">Provide your operative nickname.</p>
                  </div>
                  <div className="border-2 border-[#2c2825] bg-[#e3d5c1] p-4 shadow-[4px_4px_0px_#2c2825]">
                    <p className="section-label mb-2">2. Establish Link</p>
                    <p className="text-sm font-bold uppercase">Create a secure line or use a known access code.</p>
                  </div>
                  <div className="border-2 border-[#2c2825] bg-[#e3d5c1] p-4 shadow-[4px_4px_0px_#2c2825]">
                    <p className="section-label mb-2">3. Field Chat</p>
                    <p className="text-sm font-bold uppercase">Use the room chat to coordinate in real time while the case is active.</p>
                  </div>
                </div>

                <div className="mt-8 border-t-2 border-dashed border-[#2c2825] pt-6">
                  <p className="section-label">Current Status</p>
                  <p className="mt-2 text-lg font-bold uppercase">{stepText}</p>
                  {info && <p className="mt-2 text-sm font-bold uppercase text-[#2d8a5f]">{info}</p>}
                  {error && <p className="mt-2 inline-block border-2 border-[#8b0000] p-2 text-sm font-bold uppercase text-[#8b0000] shake">{error}</p>}
                </div>
              </section>
            )}

            <section className={`glass-panel flex flex-col gap-8 border-[#2c2825] bg-[#e3d5c1] p-4 sm:p-8 ${hasActiveRoom ? '' : 'sm:rotate-[-1deg]'}`}>
              {hasActiveRoom && (
                <div className="border-b-2 border-dashed border-[#2c2825] pb-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.18em] opacity-60">Live Session</p>
                      <h1 className="text-3xl font-black uppercase tracking-[0.12em] sm:text-4xl">Partner Inquiry</h1>
                    </div>
                    <div className="flex flex-wrap gap-3 uppercase text-xs font-bold">
                      {gameState && (
                        <>
                          <span className={`border-2 px-3 py-2 ${gameState.connections?.wordGiver ? 'border-[#2d8a5f] text-[#2d8a5f]' : 'border-[#8b0000] text-[#8b0000]'}`}>
                            Informant: {gameState.connections?.wordGiver ? 'Online' : 'Offline'}
                          </span>
                          <span className={`border-2 px-3 py-2 ${gameState.connections?.guesser ? 'border-[#2d8a5f] text-[#2d8a5f]' : 'border-[#8b0000] text-[#8b0000]'}`}>
                            Extractor: {gameState.connections?.guesser ? 'Online' : 'Offline'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="mt-4 text-sm font-bold uppercase opacity-80">{stepText}</p>
                  {info && <p className="mt-2 text-sm font-bold uppercase text-[#2d8a5f]">{info}</p>}
                  {error && <p className="mt-2 inline-block border-2 border-[#8b0000] p-2 text-sm font-bold uppercase text-[#8b0000] shake">{error}</p>}
                </div>
              )}

              {(screen === 'home' || screen === 'join' || screen === 'create' || screen === 'word-entry' || screen === 'game') && (
                <div>
                {screen === 'home' && (
                  <div className="space-y-6">
                    <div>
                      <p className="section-label">Operative Profile</p>
                      <input
                        value={nickname}
                        onChange={(event) => setNickname(event.target.value.toUpperCase())}
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
                        onChange={(event) => setNickname(event.target.value.toUpperCase())}
                        placeholder="ENTER BADGE NAME"
                        className="glass-input uppercase"
                      />
                    </div>
                    <div>
                      <p className="section-label">Access Code</p>
                      <input
                        value={inputCode}
                        onChange={(event) => setInputCode(event.target.value.toUpperCase())}
                        placeholder="6-LETTER CODE"
                        maxLength={6}
                        className="glass-input text-center text-xl font-black uppercase tracking-[0.2em] sm:text-2xl sm:tracking-widest"
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
                    <p className="my-8 break-all border-y-4 border-[#2c2825] py-6 text-4xl font-black tracking-[0.18em] sm:text-6xl sm:tracking-[0.2em]">
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
                        onChange={(event) => setWordInput(event.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase())}
                        placeholder="ENTER SECRET WORD"
                        maxLength={20}
                        className="glass-input text-center text-xl font-black uppercase tracking-[0.2em] sm:text-2xl sm:tracking-widest"
                      />
                    </div>
                    <button onClick={handleSubmitWord} className="btn-primary w-full py-4 mt-4">
                      LOG EVIDENCE
                    </button>
                  </div>
                )}

                {screen === 'game' && gameState && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-3 border-b-2 border-[#2c2825] pb-5 sm:grid-cols-2">
                      <div className="border-2 border-[#2c2825] bg-[#f1e7d8] px-4 py-3">
                        <p className="text-xs font-bold uppercase opacity-60">Informant</p>
                        <p className="break-words text-lg font-black sm:text-xl">{gameState.wordGiver}</p>
                      </div>
                      <div className="border-2 border-[#2c2825] bg-[#f1e7d8] px-4 py-3">
                        <p className="text-xs font-bold uppercase opacity-60">Extractor</p>
                        <p className="break-words text-lg font-black sm:text-xl">{gameState.guesser || 'WAITING...'}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
                      <div className="lg:col-span-5">
                        <div className="border-2 border-[#2c2825] bg-[radial-gradient(circle_at_top,_#f3eadf_0%,_#d9c7b0_72%)] p-2 sm:p-3">
                          <HangmanScene
                            wrongGuessCount={wrongGuessCount}
                            skinName="default"
                            isDead={gameState.status === 'lost'}
                          />
                        </div>
                      </div>

                      <div className="space-y-6 lg:col-span-7">
                        {gameState.maskedWord && (
                          <div className="text-center lg:text-left">
                            <p className="section-label">Classified Word</p>
                            <div className="mb-4 mt-4 flex flex-wrap justify-center gap-2 lg:justify-start">
                              {gameState.maskedWord.split(' ').map((letter, index) => (
                                <div key={`${letter}-${index}`} className="flex h-10 w-8 items-center justify-center border-b-4 border-[#2c2825] text-2xl font-bold uppercase sm:h-12 sm:w-10 sm:text-3xl">
                                  {letter}
                                </div>
                              ))}
                            </div>
                            <p className="text-sm font-bold uppercase opacity-80">
                              Strikes Remaining: <span className="text-xl font-black">{gameState.attemptsLeft}</span> / 6
                            </p>
                          </div>
                        )}

                        {isGuesser && gameState.status === 'ongoing' && (
                          <div className="border-t-2 border-[#2c2825] pt-6">
                            <p className="section-label mb-4">Typewriter</p>
                            <div className="grid grid-cols-7 justify-items-center gap-2 sm:grid-cols-9 lg:grid-cols-7 xl:grid-cols-9">
                              {ALPHABET.map((letter) => {
                                const correct = gameState.guesses?.includes(letter) && !gameState.wrongGuesses?.includes(letter)
                                const wrong = gameState.wrongGuesses?.includes(letter)
                                const isUsed = usedLetters.has(letter)

                                let btnClass = 'relative h-10 w-10 overflow-hidden rounded-full border-2 border-[#2c2825] text-sm font-bold uppercase transition-all shadow-[2px_2px_0px_#2c2825] sm:h-11 sm:w-11 sm:text-base'

                                if (!isUsed) {
                                  btnClass += ' bg-[#d4c5b0] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none'
                                } else if (correct) {
                                  btnClass += ' translate-x-[2px] translate-y-[2px] bg-[#2c2825] text-[#d4c5b0] shadow-none'
                                } else if (wrong) {
                                  btnClass += ' translate-x-[2px] translate-y-[2px] bg-[#e3d5c1] text-[#2c2825] opacity-50 shadow-none'
                                }

                                return (
                                  <button
                                    key={letter}
                                    onClick={() => handleGuess(letter)}
                                    disabled={isUsed}
                                    className={btnClass}
                                  >
                                    {letter}
                                    {wrong && <div className="pointer-events-none absolute inset-0 top-1/2 -mt-[1px] h-[2px] w-full -rotate-45 bg-[#8b0000] opacity-80"></div>}
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )}

                        {gameState.status === 'won' && (
                          <div className="border-t-4 border-dashed border-[#2c2825] pt-8 text-center">
                            <p className="mb-2 text-3xl font-black uppercase tracking-widest text-[#10B981]">CASE SOLVED</p>
                            {gameState.word && <p className="mb-6 text-xl font-bold uppercase">{gameState.word}</p>}
                            <button onClick={handleRematch} className="btn-primary px-8 py-4">
                              OPEN NEW CASE
                            </button>
                          </div>
                        )}

                        {gameState.status === 'lost' && (
                          <div className="border-t-4 border-dashed border-[#2c2825] pt-8 text-center">
                            <p className="mb-2 text-3xl font-black uppercase tracking-widest text-[#8b0000]">CASE FAILED</p>
                            {gameState.word && <p className="mb-6 text-lg font-bold uppercase opacity-80">True Word: <span className="text-xl">{gameState.word}</span></p>}
                            <button onClick={handleRematch} className="btn-primary px-8 py-4">
                              RETRY CASE
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {roomCode && (
              <div className="border-t-2 border-dashed border-[#2c2825] pt-6">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="section-label mb-1">Field Chat</p>
                    <p className="truncate text-xs font-bold uppercase opacity-70">Room {roomCode}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold uppercase opacity-60">
                    {chatMessages.length} message{chatMessages.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mb-4 max-h-64 space-y-3 overflow-y-auto border-2 border-[#2c2825] bg-[#f1e7d8] p-3 sm:max-h-72">
                  {chatMessages.length === 0 ? (
                    <p className="text-xs font-bold uppercase opacity-60">No messages yet.</p>
                  ) : (
                    chatMessages.map((message, index) => (
                      <div key={`${message.senderNickname}-${message.createdAt || index}-${index}`} className="border-l-4 border-[#2c2825] pl-3">
                        <div className="flex items-center justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-black uppercase">{message.senderNickname}</p>
                          <span className="shrink-0 text-[10px] font-bold uppercase opacity-50">{message.senderRole}</span>
                        </div>
                        <p className="break-words text-sm font-bold">{message.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <input
                    value={chatInput}
                    onChange={(event) => setChatInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') handleSendChat()
                    }}
                    placeholder="SEND A MESSAGE"
                    maxLength={240}
                    className="glass-input flex-1 text-base uppercase sm:text-lg"
                  />
                  <button onClick={handleSendChat} className="btn-primary px-5 py-3 sm:self-end">
                    SEND
                  </button>
                </div>
              </div>
            )}
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
