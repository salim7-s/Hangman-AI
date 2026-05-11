const { loadDictionary, aiGuess } = require('./services/aiService')

loadDictionary()

function simulate(targetWord) {
  console.log(`\n${'='.repeat(50)}`)
  console.log(`TEST: AI guessing "${targetWord}"`)
  console.log('='.repeat(50))

  const word = targetWord.toUpperCase()
  let guessedLetters = []
  let wrongLetters   = []
  let pattern = word.split('').map(() => '_').join(' ')
  let totalGuesses = 0

  while (true) {
    if (totalGuesses >= 20) { console.log('RESULT: Too many guesses, stopping'); break }

    const { letter, candidateCount } = aiGuess(pattern, wrongLetters, guessedLetters)
    totalGuesses++
    guessedLetters.push(letter)

    console.log(`\nGuess #${totalGuesses}: ${letter}  |  Candidates: ${candidateCount}`)

    if (word.includes(letter)) {
      // Reveal all positions
      const chars = word.split('')
      pattern = chars.map(ch => guessedLetters.includes(ch) ? ch : '_').join(' ')
      console.log(`  ✓ Correct!  Pattern: ${pattern}`)

      if (!pattern.includes('_')) {
        console.log(`\n🎉 RESULT: Solved "${word}" in ${totalGuesses} guesses with ${wrongLetters.length} wrong`)
        break
      }
    } else {
      wrongLetters.push(letter)
      console.log(`  ✗ Wrong!  Wrong count: ${wrongLetters.length}/6`)

      if (wrongLetters.length >= 6) {
        console.log(`\n💀 RESULT: Failed to solve "${word}" — wrong letters: ${wrongLetters.join(', ')}`)
        console.log(`   Revealed: ${pattern}`)
        break
      }
    }
  }
}

simulate('APPLE')
simulate('RHYTHM')
simulate('JAZZ')
simulate('HANGMAN')
simulate('QUIZZIFY')
