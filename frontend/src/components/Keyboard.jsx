import { useEffect } from 'react'

const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M'],
]

export default function Keyboard({ guesses, wrongGuesses, onGuess, disabled }) {
  const correctSet = new Set(guesses.filter((letter) => !wrongGuesses.includes(letter)))
  const wrongSet = new Set(wrongGuesses)
  const usedSet = new Set(guesses)

  useEffect(() => {
    const usedLetters = new Set(guesses)

    const handler = (event) => {
      const key = event.key.toUpperCase()
      if (/^[A-Z]$/.test(key) && !usedLetters.has(key) && !disabled) {
        onGuess(key)
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [guesses, disabled, onGuess])

  return (
    <div className="mt-4 flex flex-col items-center gap-2.5">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap justify-center gap-2">
          {row.map((letter) => {
            const isCorrect = correctSet.has(letter)
            const isWrong = wrongSet.has(letter)
            const isUsed = usedSet.has(letter)

            let tone = ''
            if (isCorrect) tone = 'correct'
            if (isWrong) tone = 'wrong'

            return (
              <button
                key={letter}
                id={`key-${letter}`}
                onClick={() => onGuess(letter)}
                disabled={isUsed || disabled}
                style={{ touchAction: 'manipulation' }}
                className={`key-btn ${tone} w-10 text-sm sm:w-11 sm:text-base ${
                  isUsed || disabled ? 'cursor-not-allowed' : ''
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
