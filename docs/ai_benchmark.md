# AI Benchmark

This project now includes a reproducible AI evaluation script at `backend/scripts/evaluateAi.js`.

## How To Run

From `backend/`:

```bash
npm run benchmark:ai
```

Optional environment variable:

```bash
SAMPLE_SIZE=50 npm run benchmark:ai
```

`SAMPLE_SIZE` controls how many words are sampled from each difficulty bucket.

You can also run it from the repo root:

```bash
npm run benchmark:ai
```

## What The Script Measures

For each difficulty, the evaluator simulates full Hangman games and reports:

- total games evaluated
- win rate
- average turns per game
- average wrong guesses
- average latency per completed simulation

The script loads the production dictionary and uses the same `aiGuess()` logic as the application.
The active AI candidate pool depends on `AI_WORD_POOL`:

- `game`: curated gameplay dictionary
- `full`: raw corpus

By default, the AI now works from the curated gameplay pool rather than the raw 250k corpus. If you want to refresh that pool after editing the blocklist, run:

```bash
npm run words:build
```

## Latest Local Run

Date: 2026-05-18

Dictionary snapshot:

- raw words: 227300
- gameplay words: 149921
- AI pool mode: game
- gameplay source: curated-file
- easy words: 16226
- medium words: 75876
- hard words: 57819
- indexed word lengths: 7

Results from `SAMPLE_SIZE=25`:

| Difficulty | Games | Win Rate | Avg Turns | Avg Wrong Guesses | Avg Latency |
| --- | ---: | ---: | ---: | ---: | ---: |
| Easy | 25 | 68.0% | 8.20 | 4.32 | 6.12 ms |
| Medium | 25 | 84.0% | 8.04 | 2.76 | 27.92 ms |
| Hard | 25 | 100.0% | 9.24 | 1.80 | 138.97 ms |

## Notes

- Easy mode intentionally behaves less optimally because it includes score jitter.
- Hard mode is slower because it computes entropy across the remaining candidate set.
- The AI service now indexes the dictionary by word length to avoid scanning the full corpus on every guess.
- If no compatible candidates remain, the AI falls back to a fixed English letter frequency order.
