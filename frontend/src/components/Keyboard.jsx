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
    <div className="mt-4 flex flex-col items-center gap-3">
      {ROWS.map((row, rowIndex) => (
        <div key={rowIndex} className="flex flex-wrap justify-center gap-2 sm:gap-3">
          {row.map((letter) => {
            const isCorrect = correctSet.has(letter)
            const isWrong = wrongSet.has(letter)
            const isUsed = usedSet.has(letter)

            // Typewriter key baseline styles
            let btnClass = "w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-[#2c2825] text-lg sm:text-xl font-bold uppercase transition-all shadow-[2px_2px_0px_#2c2825]"
            
            if (!isUsed && !disabled) {
              btnClass += " bg-[#d4c5b0] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-none"
            } else if (isCorrect) {
              // Stamped with black ink
              btnClass += " bg-[#2c2825] text-[#d4c5b0] shadow-none translate-y-[2px] translate-x-[2px]"
            } else if (isWrong) {
              // Strikethrough / crossed out
              btnClass += " bg-[#e3d5c1] text-[#2c2825] opacity-50 shadow-none translate-y-[2px] translate-x-[2px] relative overflow-hidden"
            } else {
              // Just disabled
              btnClass += " bg-[#e3d5c1] opacity-50 shadow-none translate-y-[2px] translate-x-[2px]"
            }

            return (
              <button
                key={letter}
                id={`key-${letter}`}
                onClick={() => onGuess(letter)}
                disabled={isUsed || disabled}
                style={{ touchAction: 'manipulation' }}
                className={btnClass}
              >
                {letter}
                {/* Visual crossed out line for wrong guesses */}
                {isWrong && (
                  <div className="absolute inset-0 bg-[#8b0000] opacity-80 w-full h-[2px] top-1/2 -mt-[1px] -rotate-45 pointer-events-none"></div>
                )}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}
