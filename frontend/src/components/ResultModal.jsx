export default function ResultModal({ status, word, streak, bestStreak, onPlayAgain }) {
  if (!status || status === 'ongoing') return null

  const won = status === 'won'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(20,24,26,0.52)] px-4 backdrop-blur-sm">
      <div className="panel-dark arcade-card pop w-full max-w-md overflow-hidden p-0">
        <div className={`h-2 w-full ${won ? 'bg-[#2d8a5f]' : 'bg-[#bb4d3f]'}`} />

        <div className="p-7 sm:p-8">
          <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Round complete</p>
          <h2 className="neon-text mt-3 text-4xl font-black text-[#fff6ea]">
            {won ? 'Puzzle solved.' : 'Round lost.'}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#d7c8bb]">
            {won
              ? 'You closed the word before the board filled out.'
              : 'The final answer is revealed below so the next round starts clean.'}
          </p>

          <div className="arcade-card mt-6 rounded border border-[#00ff88]/30 bg-gray-950 p-5 text-center">
            <p className="section-label neon-text-orange text-[rgba(246,240,231,0.64)]">Answer</p>
            <div className="masked-word mt-3 break-words text-2xl font-black tracking-[0.22em] text-[#f7d7c0]">
              {(word || '').split('').map((letter, index) => (
                <div key={`${letter}-${index}`} className="letter-box">
                  {letter}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="stat-box rounded border border-[#00ff88]/30 bg-gray-950 p-4">
              <p className="section-label stat-label text-[rgba(246,240,231,0.64)]">
                {won ? 'Current streak' : 'Reset streak'}
              </p>
              <p className="stat-value mt-2 font-black text-[#fff6ea]">{won ? streak : 0}</p>
            </div>
            <div className="stat-box rounded border border-[#00ff88]/30 bg-gray-950 p-4">
              <p className="section-label stat-label text-[rgba(246,240,231,0.64)]">Best streak</p>
              <p className="stat-value mt-2 font-black text-[#fff6ea]">{bestStreak}</p>
            </div>
          </div>

          <button onClick={onPlayAgain} className="primary-btn arcade-btn mt-6 w-full text-base">
            Play again
          </button>
        </div>
      </div>
    </div>
  )
}
