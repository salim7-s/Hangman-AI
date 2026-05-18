export default function ResultModal({ status, word, streak, bestStreak, onPlayAgain }) {
  if (!status || status === 'ongoing') return null

  const won = status === 'won'

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#2c2825]/80 px-3 py-3 backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:px-4">
      <div className="glass-panel pop mx-auto w-full max-w-[min(24rem,calc(100vw-1.5rem))] overflow-x-hidden p-4 max-sm:min-h-fit max-sm:shadow-[4px_4px_0px_rgba(44,40,37,0.22)] sm:max-h-[calc(100dvh-2rem)] sm:p-12 sm:rotate-[2deg]">
        {/* Fake staple */}
        <div className="absolute top-4 left-4 w-6 h-2 bg-gray-400 border border-gray-600 rounded-sm shadow-sm -rotate-12"></div>
        
        <div className="mb-6 flex flex-col gap-3 border-b-4 border-dashed border-[#2c2825] pb-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="font-bold uppercase tracking-widest">Case Status</p>
          <div className={`stamp-confidential w-fit self-start sm:rotate-[10deg] ${won ? 'text-[#10B981] border-[#10B981]' : 'text-[#8b0000] border-[#8b0000]'}`}>
            {won ? 'SOLVED' : 'FAILED'}
          </div>
        </div>

        <h2 className="mb-4 text-2xl font-black uppercase tracking-[0.08em] sm:text-4xl sm:tracking-widest">
          {won ? 'Suspect Captured' : 'Suspect Escaped'}
        </h2>
        
        <p className="mb-6 text-sm font-bold uppercase tracking-[0.08em] opacity-80 sm:mb-8 sm:tracking-wider">
          {won
            ? 'Excellent work, detective. The evidence was decisive.'
            : 'You failed to deduce the evidence in time. The trail went cold.'}
        </p>

        <div className="mb-6 bg-[#d4c5b0] p-4 text-center shadow-[4px_4px_0px_#2c2825] border-4 border-[#2c2825] sm:mb-8 sm:p-6">
          <p className="mb-4 inline-block border-b-2 border-[#2c2825] pb-2 text-xs font-bold uppercase tracking-[0.14em] sm:text-sm sm:tracking-widest">Official Answer</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(word || '').split('').map((letter, index) => (
              <div key={`${letter}-${index}`} className="w-7 border-b-4 border-[#2c2825] pb-1 text-xl font-black uppercase sm:w-10 sm:text-3xl">
                {letter}
              </div>
            ))}
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-3 sm:mb-8 sm:grid-cols-2 sm:gap-4">
          <div className="border-2 border-[#2c2825] bg-[#e3d5c1] p-4 text-center border-dashed">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] opacity-80 sm:text-xs sm:tracking-widest">
              {won ? 'Current Streak' : 'Reset Streak'}
            </p>
            <p className="text-3xl font-black sm:text-4xl">{won ? streak : 0}</p>
          </div>
          <div className="border-2 border-[#2c2825] bg-[#e3d5c1] p-4 text-center border-dashed">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] opacity-80 sm:text-xs sm:tracking-widest">Best Record</p>
            <p className="text-3xl font-black sm:text-4xl">{bestStreak}</p>
          </div>
        </div>

        <button onClick={onPlayAgain} className="btn-primary w-full py-3 text-sm shadow-[6px_6px_0px_#2c2825] sm:py-4 sm:text-xl">
          RETURN TO ARCHIVES
        </button>
      </div>
    </div>
  )
}
