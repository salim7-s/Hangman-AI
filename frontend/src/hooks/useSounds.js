// Procedural sound effects using Web Audio API — no sound files needed

let audioCtx = null

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}

function playTone({ frequency = 440, type = 'sine', duration = 0.2, volume = 0.3, delay = 0, ramp = 'down' }) {
  try {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.type = type
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay)

    gain.gain.setValueAtTime(volume, ctx.currentTime + delay)
    if (ramp === 'down') {
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    } else {
      gain.gain.setValueAtTime(0.001, ctx.currentTime + delay)
      gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + delay + duration * 0.3)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration)
    }

    osc.start(ctx.currentTime + delay)
    osc.stop(ctx.currentTime + delay + duration + 0.05)
  } catch {
    // Silently fail if audio not available
  }
}

export function useSounds() {
  function playCorrect() {
    // Soft ascending ding
    playTone({ frequency: 523, type: 'sine', duration: 0.15, volume: 0.25 })
    playTone({ frequency: 659, type: 'sine', duration: 0.15, volume: 0.2, delay: 0.1 })
  }

  function playWrong() {
    // Low dull thud
    playTone({ frequency: 180, type: 'triangle', duration: 0.3, volume: 0.3 })
    playTone({ frequency: 140, type: 'triangle', duration: 0.2, volume: 0.2, delay: 0.1 })
  }

  function playWin() {
    // Ascending fanfare — 4 notes
    const notes = [523, 659, 784, 1047]
    notes.forEach((f, i) => {
      playTone({ frequency: f, type: 'sine', duration: 0.25, volume: 0.25, delay: i * 0.12 })
    })
  }

  function playLose() {
    // Descending sad trombone — 3 notes
    const notes = [392, 330, 261]
    notes.forEach((f, i) => {
      playTone({ frequency: f, type: 'sawtooth', duration: 0.3, volume: 0.18, delay: i * 0.18 })
    })
  }

  function playKeyClick() {
    // Subtle click on key press
    playTone({ frequency: 800, type: 'square', duration: 0.04, volume: 0.08 })
  }

  return { playCorrect, playWrong, playWin, playLose, playKeyClick }
}
