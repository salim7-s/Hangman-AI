# The Chief: Shannon Entropy Engine (Hard Mode)

The "Chief" difficulty uses a mathematically perfect solver based on **Information Theory** and **Shannon Entropy**. This algorithm guarantees that every guess made will eliminate the maximum possible number of remaining dictionary candidates on average.

## The Objective
In Hangman, a guess is optimal if it splits the remaining possible words into many small, evenly distributed "buckets." If a guess splits the dictionary such that no matter what the outcome is (e.g., the letter is not in the word, the letter is at index 0, the letter is at index 2 and 4), very few words remain, that guess provides high **Information Gain**.

## How It Works

1. **Identify Possible Letters:** The AI scans the remaining candidate words and collects every unique unguessed letter.
2. **Simulate the Future:** For *each* possible letter, the AI simulates guessing it against every remaining candidate word.
3. **Create Buckets:** When a letter is simulated against a word, it produces a specific "pattern match." 
   - *Example:* If the word is "APPLE" and we guess "P", the pattern match is `01100`. 
   - The AI groups all candidate words into "buckets" based on their pattern match.
4. **Calculate Entropy:** The AI calculates the Shannon Entropy ($H$) for the letter using the formula:
   $$H = - \sum_{i} p_i \log_2(p_i)$$
   Where $p_i$ is the probability of bucket $i$ occurring (i.e., `words in bucket / total candidates`).
5. **Execute:** The AI selects the letter with the highest Entropy ($H$) score and submits it as its guess.

## Why This is Unbeatable
Unlike basic frequency models, Entropy doesn't just look for "common" letters. It looks for letters that divide the dataset. 

For example, if you have 10 words left, and the letter 'E' appears in 9 of them, a naive AI will guess 'E'. But if it guesses 'E', 90% of the time it only eliminates 1 word! 

The Entropy engine will instead find a letter that appears in exactly 5 of the words. It doesn't matter if it's right or wrong; the dictionary is guaranteed to be cut in half, maximizing efficiency. This makes the Hard Mode AI an incredibly ruthless interrogator.
