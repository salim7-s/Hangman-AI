export default function ResultModal({ status, word, streak, bestStreak, onPlayAgain }) {
  if (!status || status === 'ongoing') return null

  const won = status === 'won'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#2c2825]/80 px-4 backdrop-blur-sm">
      <div className="glass-panel pop w-full max-w-md p-8 sm:p-12 rotate-[2deg]">
        {/* Fake staple */}
        <div className="absolute top-4 left-4 w-6 h-2 bg-gray-400 border border-gray-600 rounded-sm shadow-sm -rotate-12"></div>
        
        <div className="flex justify-between items-start border-b-4 border-dashed border-[#2c2825] pb-4 mb-6">
          <p className="font-bold uppercase tracking-widest">Case Status</p>
          <div className={`stamp-confidential rotate-[10deg] ${won ? 'text-[#10B981] border-[#10B981]' : 'text-[#8b0000] border-[#8b0000]'}`}>
            {won ? 'SOLVED' : 'FAILED'}
          </div>
        </div>

        <h2 className="text-4xl font-black uppercase tracking-widest mb-4">
          {won ? 'Suspect Captured' : 'Suspect Escaped'}
        </h2>
        
        <p className="text-sm font-bold opacity-80 uppercase tracking-wider mb-8">
          {won
            ? 'Excellent work, detective. The evidence was decisive.'
            : 'You failed to deduce the evidence in time. The trail went cold.'}
        </p>

        <div className="border-4 border-[#2c2825] p-6 text-center bg-[#d4c5b0] mb-8 shadow-[4px_4px_0px_#2c2825]">
          <p className="font-bold uppercase tracking-widest text-sm mb-4 border-b-2 border-[#2c2825] pb-2 inline-block">Official Answer</p>
          <div className="flex flex-wrap justify-center gap-2">
            {(word || '').split('').map((letter, index) => (
              <div key={`${letter}-${index}`} className="text-3xl font-black uppercase border-b-4 border-[#2c2825] w-10 pb-1">
                {letter}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border-2 border-[#2c2825] p-4 text-center bg-[#e3d5c1] border-dashed">
            <p className="text-xs font-bold uppercase opacity-80 tracking-widest mb-2">
              {won ? 'Current Streak' : 'Reset Streak'}
            </p>
            <p className="text-4xl font-black">{won ? streak : 0}</p>
          </div>
          <div className="border-2 border-[#2c2825] p-4 text-center bg-[#e3d5c1] border-dashed">
            <p className="text-xs font-bold uppercase opacity-80 tracking-widest mb-2">Best Record</p>
            <p className="text-4xl font-black">{bestStreak}</p>
          </div>
        </div>

        <button onClick={onPlayAgain} className="btn-primary w-full text-xl py-4 shadow-[6px_6px_0px_#2c2825]">
          RETURN TO ARCHIVES
        </button>
      </div>
    </div>
  )
}
