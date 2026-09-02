import { useState } from 'react'

const STREAK_KEY = 'hangman_streak'
const BEST_STREAK_KEY = 'hangman_best_streak'
const CAREER_WINS_KEY = 'hangman_career_wins'

function readNumber(key) {
  const value = localStorage.getItem(key)
  return Number.parseInt(value || '0', 10)
}

export function useStreak() {
  const [streak, setStreak] = useState(() => readNumber(STREAK_KEY))
  const [bestStreak, setBestStreak] = useState(() => readNumber(BEST_STREAK_KEY))
  const [careerWins, setCareerWins] = useState(() => readNumber(CAREER_WINS_KEY))

  function recordWin() {
    const newStreak = streak + 1
    const newBest = Math.max(newStreak, bestStreak)
    const newWins = careerWins + 1

    setStreak(newStreak)
    setBestStreak(newBest)
    setCareerWins(newWins)

    localStorage.setItem(STREAK_KEY, String(newStreak))
    localStorage.setItem(BEST_STREAK_KEY, String(newBest))
    localStorage.setItem(CAREER_WINS_KEY, String(newWins))

    return { streak: newStreak, bestStreak: newBest, careerWins: newWins }
  }

  function recordLoss() {
    setStreak(0)
    localStorage.setItem(STREAK_KEY, '0')
    return { streak: 0, bestStreak, careerWins }
  }

  function resetStreak() {
    setStreak(0)
    setBestStreak(0)
    localStorage.removeItem(STREAK_KEY)
    localStorage.removeItem(BEST_STREAK_KEY)
  }

  return { streak, bestStreak, careerWins, recordWin, recordLoss, resetStreak }
}
