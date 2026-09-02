import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CHARACTERS, getCharacter, getCareerWins, isCharacterUnlocked } from "../utils/characters";
import NoirCartoonAvatar from "../components/NoirCartoonAvatar";

export default function InspectorModels() {
  const [careerWins] = useState(() => getCareerWins());
  const [selected, setSelected] = useState(() => {
    const saved = localStorage.getItem("selectedInspectorId");
    const active = saved ? getCharacter(saved) : CHARACTERS[0];
    return isCharacterUnlocked(active, careerWins) ? active : CHARACTERS[0];
  });
  const navigate = useNavigate();

  const isUnlocked = isCharacterUnlocked(selected, careerWins);

  const handleSelect = (character) => {
    if (!isCharacterUnlocked(character, careerWins)) return;
    localStorage.setItem("selectedInspectorId", String(character.id));
    navigate("/");
  };

  return (
    <main className="min-h-screen bg-[#d9c9b2] text-[#292522] px-5 py-8 sm:py-12">
      <div className="mx-auto max-w-5xl">

        {/* Top Navigation & Career Stats Bar */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="font-mono text-sm font-bold uppercase tracking-widest text-[#8b1717] hover:underline flex items-center gap-2 cursor-pointer transition-transform hover:-translate-x-1"
          >
            &larr; Return to HQ Game
          </button>

          {/* Career Wins Trophy Badge */}
          <div className="flex items-center gap-2.5 border-2 border-[#292522] bg-[#eee2cf] px-4 py-2 shadow-[4px_4px_0_#292522]">
            <span className="text-lg">🏆</span>
            <span className="font-mono text-xs font-black uppercase tracking-[0.18em] text-[#8b1717]">
              Career Wins: <strong className="text-[#292522] text-sm ml-1">{careerWins}</strong>
            </span>
          </div>
        </div>

        {/* HEADER */}
        <header className="mb-10 text-center">
          <p className="mb-2 text-xs font-black uppercase tracking-[0.35em] text-[#8b1717]">
            Detective Department // 4-Tier Roster
          </p>

          <h1 className="font-serif text-4xl sm:text-5xl font-black uppercase tracking-tight text-[#292522]">
            Choose Your Inspector
          </h1>

          <p className="mx-auto mt-3 max-w-xl text-base font-medium text-[#292522]/75">
            Win classified cases to unlock higher-level detective companions with unique powers!
          </p>
        </header>

        {/* ===================================================
            MAIN PREVIEW STAGE
        ==================================================== */}
        <section className="mb-14 grid overflow-hidden border-2 border-[#292522] bg-[#eee2cf] shadow-[8px_8px_0_#292522] md:grid-cols-[1.1fr_1fr]">

          {/* CHARACTER STAGE */}
          <div className="relative flex min-h-[440px] items-center justify-center overflow-hidden bg-[#e5d6c0] p-6">

            {/* Background decoration */}
            <div className="absolute inset-0 opacity-15 pointer-events-none">
              <div className="absolute left-10 top-10 h-36 w-36 rounded-full border-2 border-[#292522]" />
              <div className="absolute right-16 bottom-10 h-52 w-52 rounded-full border-2 border-[#292522]" />
              <div className="absolute left-0 right-0 top-1/2 border-t-2 border-dashed border-[#292522]" />
            </div>

            {/* Character Render (Transparent Noir Avatar) */}
            <div className="relative z-10 flex h-80 w-80 items-center justify-center">
              <div className={`w-full h-full drop-shadow-[10px_10px_0px_rgba(44,40,37,0.3)] ${!isUnlocked ? "grayscale opacity-50" : ""}`}>
                <NoirCartoonAvatar character={selected} />
              </div>
            </div>

            {/* Lock Status Watermark */}
            {!isUnlocked && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-[#292522]/35 backdrop-blur-[2px] p-4">
                <div className="border-2 border-[#292522] bg-[#eee2cf] px-6 py-4 text-center shadow-[6px_6px_0_#8b1717] max-w-xs">
                  <span className="text-3xl">🔒</span>
                  <p className="mt-2 font-mono text-xs font-black uppercase tracking-[0.18em] text-[#8b1717]">
                    LOCKED &bull; REQUIRES {selected.requiredWins} WINS
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#292522]/80">
                    Your Progress: {careerWins} / {selected.requiredWins} Wins
                  </p>
                </div>
              </div>
            )}

            <div className="absolute bottom-4 left-5 font-mono text-xs font-bold uppercase tracking-[0.25em] text-[#292522]/50">
              LEVEL {selected.level} // {selected.name}
            </div>
          </div>

          {/* INFORMATION PANEL */}
          <div className="border-t-2 border-[#292522] p-7 md:border-l-2 md:border-t-0 flex flex-col justify-between bg-[#f0e5d3]">
            <div>
              <div className="mb-4 flex items-center justify-between">
                <span className="border-2 border-[#8b1717] bg-[#8b1717]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#8b1717]">
                  {selected.badge}
                </span>

                <span className="font-mono text-xs font-bold tracking-widest text-[#292522]/60">
                  TIER {selected.level}
                </span>
              </div>

              <h2 className="font-serif text-4xl font-black uppercase tracking-tight text-[#292522]">
                {selected.name}
              </h2>

              <p className="mt-4 text-sm sm:text-base italic leading-relaxed text-[#292522] bg-[#e4d6c1] p-4 border-l-4 border-[#8b1717] shadow-inner font-serif">
                &ldquo;{selected.message}&rdquo;
              </p>

              <div className="my-6 border-t-2 border-dashed border-[#292522]/25" />

              <div className="space-y-4 font-sans">
                <Info label="Role" value={selected.role} />
                <Info label="Special Power" value={selected.ability.hasPower ? `${selected.ability.icon} ${selected.ability.name}` : "None (Default Mascot)"} />
                <div className="rounded border border-[#292522]/20 bg-[#292522]/5 p-3 text-xs sm:text-sm leading-relaxed text-[#292522]/90 font-medium">
                  {selected.ability.desc}
                </div>
                <Info label="Unlock Requirement" value={selected.requiredWins === 0 ? "Unlocked by Default" : `${selected.requiredWins} Career Wins`} />
              </div>
            </div>

            <button
              onClick={() => handleSelect(selected)}
              disabled={!isUnlocked}
              className={`
                mt-8 w-full
                border-2 border-[#292522]
                px-6 py-4
                text-xs sm:text-sm
                font-black
                uppercase
                tracking-[0.2em]
                transition-all
                ${
                  isUnlocked
                    ? "bg-[#292522] text-[#eee2cf] shadow-[5px_5px_0_#8b1717] hover:-translate-y-1 hover:shadow-[7px_7px_0_#8b1717] cursor-pointer"
                    : "bg-[#292522]/20 text-[#292522]/50 cursor-not-allowed border-dashed"
                }
              `}
            >
              {isUnlocked ? "Use This Inspector" : `🔒 Locked (${careerWins}/${selected.requiredWins} Wins)`}
            </button>
          </div>
        </section>

        {/* ===================================================
            4-TIER CARTOON DETECTIVE LINEUP
        ==================================================== */}
        <div className="mb-6 flex items-end justify-between border-b-2 border-[#292522] pb-4">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm font-bold text-[#8b1717]">01</span>
            <h2 className="font-serif text-2xl sm:text-3xl font-black uppercase text-[#292522]">
              Inspector Progression (Levels 1–4)
            </h2>
          </div>
          <span className="hidden text-xs font-bold uppercase tracking-[0.2em] text-[#292522]/50 sm:block">
            Win Games To Unlock Powers
          </span>
        </div>

        <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-16">
          {CHARACTERS.map((item) => {
            const unlocked = isCharacterUnlocked(item, careerWins);
            const isSel = selected.id === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setSelected(item)}
                className={`
                  group text-left border-2 transition-all cursor-pointer overflow-hidden relative
                  ${
                    isSel
                      ? "border-[#8b1717] bg-[#eee2cf] shadow-[6px_6px_0_#8b1717] -translate-y-1"
                      : "border-[#292522]/40 bg-[#eee2cf]/70 hover:-translate-y-1 hover:border-[#292522] hover:shadow-[4px_4px_0_#292522]"
                  }
                `}
              >
                {/* Character Thumbnail */}
                <div className="relative h-48 flex items-center justify-center p-4">
                  <div className={`h-full w-full flex items-center justify-center drop-shadow-[5px_5px_0px_rgba(44,40,37,0.25)] group-hover:scale-105 transition-transform ${!unlocked ? "grayscale opacity-50" : ""}`}>
                    <NoirCartoonAvatar character={item} />
                  </div>

                  {/* Top Badges */}
                  <span className="absolute left-2.5 top-2.5 bg-[#292522] px-2 py-1 text-[9px] font-black tracking-[0.15em] text-[#eee2cf]">
                    LVL {item.level}
                  </span>

                  {isSel && (
                    <span className="absolute right-2.5 top-2.5 bg-[#8b1717] px-2 py-1 text-[9px] font-black tracking-[0.15em] text-white">
                      SELECTED
                    </span>
                  )}

                  {!unlocked && !isSel && (
                    <span className="absolute right-2.5 top-2.5 bg-[#292522]/90 px-2 py-1 text-[9px] font-black tracking-[0.1em] text-[#ede2cf] flex items-center gap-1">
                      🔒 {careerWins}/{item.requiredWins}
                    </span>
                  )}
                </div>

                {/* Card Footer Info */}
                <div className="p-3.5 border-t border-[#292522]/20 bg-[#e5d6bf]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-black uppercase tracking-wide truncate">
                      {item.name}
                    </h3>
                    <span className="text-sm">{item.ability.hasPower ? item.ability.icon : "🧽"}</span>
                  </div>
                  <p className="mt-1 text-[10px] sm:text-xs font-mono font-bold uppercase text-[#8b1717] truncate">
                    {unlocked ? (item.ability.hasPower ? item.ability.name : "Default Mascot") : `Requires ${item.requiredWins} Wins`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </main>
  );
}

function Info({ label, value }) {
  return (
    <div className="flex items-center justify-between border-b border-[#292522]/15 pb-2.5">
      <span className="text-xs font-black uppercase tracking-[0.15em] text-[#292522]/60">
        {label}
      </span>
      <span className="text-xs sm:text-sm font-bold uppercase text-[#292522]">
        {value}
      </span>
    </div>
  );
}
