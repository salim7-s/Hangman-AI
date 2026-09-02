/**
 * validateWords.js
 *
 * Checks every word in backend/data/words_alpha.txt against the Datamuse API.
 * Datamuse returns a `score` (word frequency/popularity) for each word it knows.
 * Words not known to Datamuse are dropped (fake/garbage words).
 * Valid words are saved sorted by popularity score.
 *
 * OUTPUTS:
 *   backend/data/words_validated.txt        — all valid words (sorted by popularity)
 *   backend/data/words_popular.txt          — only popular words (score >= threshold)
 *
 * HOW TO RUN:
 *   node scripts/validateWords.js
 *
 * TO RESUME after interruption:
 *   node scripts/validateWords.js --resume
 *
 * ESTIMATED TIME: ~30-50 minutes for 219k words (50 parallel requests to Datamuse)
 *
 * AFTER IT FINISHES:
 *   Replace the AI dictionary:
 *     copy backend\data\words_popular.txt backend\data\words_alpha.txt
 *   Then commit + push.
 */

const fs   = require('fs')
const path = require('path')
const http = require('https')

const INPUT_FILE        = path.join(__dirname, '..', 'backend', 'data', 'words_alpha.txt')
const OUTPUT_ALL        = path.join(__dirname, '..', 'backend', 'data', 'words_validated.txt')
const OUTPUT_POPULAR    = path.join(__dirname, '..', 'backend', 'data', 'words_popular.txt')
const CHECKPOINT_FILE   = path.join(__dirname, '..', 'backend', 'data', 'validate_checkpoint.json')

const CONCURRENCY       = 50    // Datamuse handles high concurrency fine
const CHECKPOINT_EVERY  = 5000
const POPULAR_THRESHOLD = 1000  // Datamuse score >= this = popular word
                                 // (increase to 5000 for only very common words)

// ── helpers ──────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Returns the Datamuse score for the word, or 0 if not found.
 * Uses ?sp=word to get exact spelling match.
 * The score field reflects corpus frequency — higher = more popular.
 */
function getWordScore(word) {
  return new Promise((resolve) => {
    const url = `https://api.datamuse.com/words?sp=${encodeURIComponent(word.toLowerCase())}&max=1&md=f`
    const req = http.get(url, { timeout: 8000 }, (res) => {
      let body = ''
      res.on('data', chunk => body += chunk)
      res.on('end', () => {
        try {
          const data = JSON.parse(body)
          if (data.length > 0 && data[0].word.toLowerCase() === word.toLowerCase()) {
            // Use the score field (word frequency proxy)
            resolve(data[0].score || 1)
          } else {
            resolve(0) // Not a real word
          }
        } catch {
          resolve(0)
        }
      })
    })
    req.on('error', () => resolve(0))
    req.on('timeout', () => { req.destroy(); resolve(0) })
  })
}

async function processBatch(words) {
  return Promise.all(words.map(w => getWordScore(w).then(score => ({ word: w, score }))))
}

// ── main ─────────────────────────────────────────────────────────────────────

async function main() {
  const resume = process.argv.includes('--resume')

  const allWords = fs.readFileSync(INPUT_FILE, 'utf8')
    .split('\n').map(w => w.trim()).filter(Boolean)

  console.log(`Loaded ${allWords.length} words from ${path.basename(INPUT_FILE)}`)
  console.log(`Popular threshold: Datamuse score >= ${POPULAR_THRESHOLD}\n`)

  let startIndex = 0
  let results    = [] // { word, score }

  if (resume && fs.existsSync(CHECKPOINT_FILE)) {
    const checkpoint = JSON.parse(fs.readFileSync(CHECKPOINT_FILE, 'utf8'))
    startIndex = checkpoint.nextIndex
    results    = checkpoint.results
    console.log(`Resuming from word #${startIndex} (${results.length} processed so far)\n`)
  }

  const remaining = allWords.slice(startIndex)
  const startTime = Date.now()
  let checked     = startIndex

  console.log(`Checking ${remaining.length} words with ${CONCURRENCY} parallel requests...`)
  console.log(`Estimated time: ~${Math.round(remaining.length / CONCURRENCY * 0.4 / 60)} minutes\n`)

  for (let i = 0; i < remaining.length; i += CONCURRENCY) {
    const batch       = remaining.slice(i, i + CONCURRENCY)
    const batchResult = await processBatch(batch)
    results.push(...batchResult)
    checked += batch.length

    // Progress
    if (checked % 1000 < CONCURRENCY || i + CONCURRENCY >= remaining.length) {
      const elapsed  = (Date.now() - startTime) / 1000
      const rate     = (checked - startIndex) / Math.max(elapsed, 1)
      const eta      = Math.round((allWords.length - checked) / Math.max(rate, 1) / 60)
      const pct      = ((checked / allWords.length) * 100).toFixed(1)
      const valid    = results.filter(r => r.score > 0).length
      const popular  = results.filter(r => r.score >= POPULAR_THRESHOLD).length
      process.stdout.write(
        `\r[${pct}%] ${checked}/${allWords.length} | valid: ${valid} | popular: ${popular} | ETA ~${eta}min   `
      )
    }

    // Checkpoint
    if (checked % CHECKPOINT_EVERY < CONCURRENCY) {
      fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify({ nextIndex: checked, results }))
    }
  }

  // Sort by score descending (most popular first)
  const valid   = results.filter(r => r.score > 0).sort((a, b) => b.score - a.score)
  const popular = valid.filter(r => r.score >= POPULAR_THRESHOLD)

  // Write outputs (words only, most popular first)
  fs.writeFileSync(OUTPUT_ALL,     valid.map(r => r.word).join('\n'))
  fs.writeFileSync(OUTPUT_POPULAR, popular.map(r => r.word).join('\n'))
  if (fs.existsSync(CHECKPOINT_FILE)) fs.unlinkSync(CHECKPOINT_FILE)

  const minutes = ((Date.now() - startTime) / 60000).toFixed(1)

  console.log(`\n\n✅ Done in ${minutes} minutes`)
  console.log(`   All valid words : ${valid.length}   → ${path.basename(OUTPUT_ALL)}`)
  console.log(`   Popular words   : ${popular.length}  → ${path.basename(OUTPUT_POPULAR)}`)
  console.log(`\nTop 20 most popular words found:`)
  console.log(valid.slice(0, 20).map(r => `  ${r.word} (${r.score})`).join('\n'))
  console.log(`\n📋 Next steps:`)
  console.log(`   Option A (popular only):  copy backend\\data\\words_popular.txt backend\\data\\words_alpha.txt`)
  console.log(`   Option B (all valid):     copy backend\\data\\words_validated.txt backend\\data\\words_alpha.txt`)
  console.log(`   Then: git add backend/data/words_alpha.txt && git commit -m "feat: popularity-filtered dictionary" && git push`)
}

main().catch(err => {
  console.error('\nFATAL:', err.message)
  process.exit(1)
})
