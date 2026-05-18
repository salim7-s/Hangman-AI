const fs = require('fs')
const path = require('path')

const {
  buildGameplayWordList,
} = require('../services/aiService')

const RAW_WORDS_PATH = path.join(__dirname, '..', '..', 'words_250000_train.txt')
const BLOCKLIST_PATH = path.join(__dirname, '..', 'data', 'word_blocklist.txt')
const OUTPUT_PATH = path.join(__dirname, '..', 'data', 'words_game_curated.txt')

function normalizeWords(words) {
  return words
    .map((word) => word.trim().toUpperCase())
    .filter((word) => /^[A-Z]+$/.test(word))
}

async function readWordFile(filePath) {
  const raw = await fs.promises.readFile(filePath, 'utf-8')
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
}

async function main() {
  const sourceWords = normalizeWords(await readWordFile(RAW_WORDS_PATH))
  let blocklist = []

  try {
    blocklist = normalizeWords(await readWordFile(BLOCKLIST_PATH))
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }

  const curatedWords = buildGameplayWordList(sourceWords, new Set(blocklist))
  await fs.promises.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.promises.writeFile(OUTPUT_PATH, `${curatedWords.join('\n')}\n`, 'utf-8')

  console.log(
    `Wrote ${curatedWords.length} curated gameplay words to ${OUTPUT_PATH}`
  )
}

main().catch((error) => {
  console.error('Failed to build curated gameplay dictionary:', error)
  process.exitCode = 1
})
