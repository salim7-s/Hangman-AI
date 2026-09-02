import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCharacter, getCareerWins, isCharacterUnlocked } from "../utils/characters";
import NoirCartoonAvatar from "./NoirCartoonAvatar";

export default function InspectorGuide({
  view = "landing",
  mode = "ai-vs-player",
  difficulty = "medium",
  attemptsLeft = 6,
  status = "ongoing",
  aiGuess = null,
  candidateCount = null,
  allowAbilities = true,
  onUseAbility = null,
}) {
  const navigate = useNavigate();

  const [character, setCharacter] = useState(() => {
    const savedId = localStorage.getItem("selectedInspectorId");
    const wins = getCareerWins();
    const active = savedId ? getCharacter(savedId) : getCharacter(1);
    return isCharacterUnlocked(active, wins) ? active : getCharacter(1); // SpongeBob by default
  });

  const [isOpen, setIsOpen] = useState(true);
  const [customMessage, setCustomMessage] = useState(null);
  const [isTalking, setIsTalking] = useState(false);
  const [abilityUsed, setAbilityUsed] = useState(false);

  // Sync selected character across tabs and page navigations
  useEffect(() => {
    const syncInspector = () => {
      const savedId = localStorage.getItem("selectedInspectorId");
      const wins = getCareerWins();
      const updated = savedId ? getCharacter(savedId) : getCharacter(1);
      const safeChar = isCharacterUnlocked(updated, wins) ? updated : getCharacter(1);
      if (safeChar.id !== character.id) {
        setCharacter(safeChar);
      }
    };
    syncInspector();
    window.addEventListener("storage", syncInspector);
    return () => window.removeEventListener("storage", syncInspector);
  }, [character.id]);

  // Drag position state
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Reset custom message on state change & trigger talking animation
  const prevProps = useRef({ view, mode, difficulty, attemptsLeft, status, aiGuess, charId: character.id });
  useEffect(() => {
    if (
      prevProps.current.view !== view ||
      prevProps.current.mode !== mode ||
      prevProps.current.difficulty !== difficulty ||
      prevProps.current.attemptsLeft !== attemptsLeft ||
      prevProps.current.status !== status ||
      prevProps.current.aiGuess !== aiGuess ||
      prevProps.current.charId !== character.id
    ) {
      prevProps.current = { view, mode, difficulty, attemptsLeft, status, aiGuess, charId: character.id };
      setCustomMessage(null);
      setIsTalking(true);
      const timer = setTimeout(() => setIsTalking(false), 500);
      return () => clearTimeout(timer);
    }
  }, [view, mode, difficulty, attemptsLeft, status, aiGuess, character.id]);

  const message =
    customMessage ||
    getLeveledGameMessage({
      character,
      view,
      mode,
      difficulty,
      attemptsLeft,
      status,
      aiGuess,
      candidateCount,
    });

  const speak = (text) => {
    setCustomMessage(text);
    setIsTalking(true);
    setTimeout(() => setIsTalking(false), 500);
  };

  const isMinion = character.id === 2;

  const handleUseAbility = () => {
    if (abilityUsed) {
      speak(isMinion ? "Nono para! Poka no more baboi banana!" : "Ability already deployed for this case file!");
      return;
    }
    setAbilityUsed(true);
    if (onUseAbility) {
      onUseAbility(character.id, { speak });
    } else {
      if (character.id === 2) {
        speak("🍌 BANANAAAA! Baboi tulaliloo papoy! Bee-do bee-do muak muak shield active!!");
      } else if (character.id === 3) {
        speak("🐱 4D Pocket Gadget Deployed! Probability sensors scanning candidate dictionary for letter frequency!");
      } else if (character.id === 4) {
        speak("🕷️ Spider-Sense Purge Active! Three low-probability trap letters have been permanently webbed up!");
      }
    }
  };

  // Drag handlers
  const handleMouseDown = (e) => {
    if (e.target.closest("button")) return;

    setIsDragging(true);
    const currentX = position ? position.x : window.innerWidth - 420;
    const currentY = position ? position.y : window.innerHeight - 250;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: currentX,
      initialY: currentY,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const deltaX = e.clientX - dragRef.current.startX;
      const deltaY = e.clientY - dragRef.current.startY;

      const newX = Math.max(10, Math.min(window.innerWidth - 400, dragRef.current.initialX + deltaX));
      const newY = Math.max(10, Math.min(window.innerHeight - 230, dragRef.current.initialY + deltaY));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const containerStyle = position
    ? { left: `${position.x}px`, top: `${position.y}px`, bottom: "auto", right: "auto" }
    : {};

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        aria-label="Open inspector"
        className="
          fixed bottom-5 right-5 z-40
          group
          flex items-center gap-2
          border-2 border-[#292522]
          bg-[#eee2cf]
          px-3.5 py-2.5
          text-[9px] font-black uppercase tracking-[.15em]
          text-[#292522]
          shadow-[4px_4px_0_#292522]
          transition-transform duration-200
          hover:-translate-y-1
          cursor-pointer
        "
      >
        <span className="text-xs">{character.ability.icon}</span>
        {character.name} &bull; BRIEFING
      </button>
    );
  }

  return (
    <aside
      aria-label="Inspector Briefing"
      style={containerStyle}
      className={`
        fixed z-40
        ${!position ? "bottom-4 right-4" : ""}
        w-[min(430px,calc(100vw-24px))]
        select-none
      `}
    >
      <div className="relative flex items-end justify-end gap-2.5">

        {/* ==============================================
            SPEECH BUBBLE
        =============================================== */}
        <div
          className="
            relative
            w-[275px] sm:w-[310px]
            origin-bottom-right
          "
        >
          <div
            className="
              relative
              rounded-[20px]
              border-2 border-[#2c2825]
              bg-[#f0e5d3]
              px-4 py-3.5
              text-[#2c2825]
              shadow-[4px_4px_0px_#2c2825]
            "
          >
            {/* Top Bar / Drag Handle */}
            <div
              onMouseDown={handleMouseDown}
              className="cursor-grab active:cursor-grabbing mb-2 flex items-center justify-between border-b border-dashed border-[#2c2825]/30 pb-1.5 pr-6"
            >
              <div className="flex items-center gap-1.5">
                <span className="text-xs">{character.ability.icon}</span>
                <span className="font-mono text-[9px] font-bold uppercase tracking-[0.15em] text-[#8b1717]">
                  LVL {character.level} &bull; {character.name}
                </span>
              </div>
            </div>

            {/* Actions: Change / Close */}
            <div className="absolute right-2.5 top-2 flex items-center gap-1.5">
              <button
                onClick={() => navigate("/inspectors")}
                className="font-mono text-[8px] font-bold uppercase text-[#8b1717] hover:underline cursor-pointer"
                title="Change Character"
              >
                [Roster]
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="
                  flex h-5 w-5
                  items-center justify-center
                  rounded-full
                  text-[12px] font-black
                  text-[#2c2825]/60
                  transition-colors
                  hover:bg-[#2c2825]
                  hover:text-[#f0e5d3]
                  cursor-pointer
                "
                aria-label="Close inspector"
              >
                &times;
              </button>
            </div>

            {/* Speech message */}
            <p
              className={`
                pr-1
                font-sans
                text-[12px] sm:text-[12.5px]
                font-semibold
                leading-[1.5]
                normal-case
                tracking-normal
                transition-transform duration-200
                ${isTalking ? "-translate-y-0.5 text-[#8b1717]" : "text-[#2c2825]"}
              `}
            >
              &ldquo;{message}&rdquo;
            </p>

            {/* In-Game Ability / Quick Question Chips */}
            <div className="mt-3 flex flex-wrap gap-1.5 font-sans">
              {view === "game" && status === "ongoing" && allowAbilities && character.ability?.hasPower && (
                <button
                  onClick={handleUseAbility}
                  className="
                    rounded-full
                    border border-[#8b1717]
                    bg-[#8b1717]
                    px-2.5 py-1
                    text-[10px] font-bold
                    text-[#ede2cf]
                    shadow-[2px_2px_0_#292522]
                    transition-all
                    hover:-translate-y-0.5
                    cursor-pointer flex items-center gap-1
                  "
                >
                  <span>{character.ability.icon}</span>
                  <span>{isMinion ? "BANANA SHIELD!" : character.ability.name}</span>
                </button>
              )}

              {view === "landing" ? (
                <>
                  <QuickChip
                    label={isMinion ? "Bello?" : "What is this?"}
                    onClick={() =>
                      speak(
                        isMinion
                          ? "Bello! Tulaliloo papoy baboi banana! Po ka la bodoka gelato kampai!"
                          : "Hangman AI is a noir detective puzzle powered by statistical N-gram AI, 3D gallows, and unlockable detective companions!"
                      )
                    }
                  />
                  <QuickChip
                    label={isMinion ? "Papoy?" : "Unlock rule"}
                    onClick={() =>
                      speak(
                        isMinion
                          ? "Hana, dul, sae! Baboi banana muak muak! Para tu gelato kampai!"
                          : "Win matches to unlock Minion (2 Wins), Doraemon (5 Wins), and Spider-Man (10 Wins)!"
                      )
                    }
                  />
                </>
              ) : mode === "player-vs-ai" ? (
                <>
                  <QuickChip
                    label={isMinion ? "Luk at tu?" : "How AI guesses"}
                    onClick={() =>
                      speak(
                        isMinion
                          ? "Como la pala?! Baboi bapple gelato! Poka la bodoka choko banana!"
                          : "The AI filters 220k candidates, scores letter entropy, and queries Datamuse API in parallel for modern slang."
                      )
                    }
                  />
                  <QuickChip
                    label={isMinion ? "Baboi spala" : "AI Explainer"}
                    onClick={() =>
                      speak(
                        isMinion
                          ? "Muak muak! Tulaliloo ti amo papoy banana! Sa la ma!"
                          : "Open the 'AI Explainer' drawer to inspect live candidate counts and exact letter probability percentages."
                      )
                    }
                  />
                </>
              ) : (
                <>
                  <QuickChip
                    label={isMinion ? "Bee-do?" : "Strikes rule"}
                    onClick={() =>
                      speak(
                        isMinion
                          ? "Bee-do! Bee-do! Bee-do! Hana dul sae... Poopaye banana! Nono para!"
                          : "You have 6 strikes (wrong guesses). Correct letters reveal blank slots and are free. Keep strikes under 6!"
                      )
                    }
                  />
                  <QuickChip
                    label={isMinion ? "Banana!" : "Deduction tip"}
                    onClick={() =>
                      speak(
                        isMinion
                          ? "Poka boka! Baboi bapple gelato! Tulaliloo para tu kampai!"
                          : "Start with common vowels (E, A, O, I) and high-frequency consonants (T, N, S, R) to narrow down candidates."
                      )
                    }
                  />
                </>
              )}
            </div>

            {/* Speech bubble tail */}
            <div
              className="
                absolute
                -bottom-3
                right-6
                h-5 w-5
                rotate-45
                border-b-2 border-r-2
                border-[#2c2825]
                bg-[#f0e5d3]
              "
            />
          </div>
        </div>

        {/* ==============================================
            STANDALONE CHARACTER CUTOUT (NO BACKGROUND BOX)
        =============================================== */}
        <div
          onMouseDown={handleMouseDown}
          className={`
            relative shrink-0
            cursor-grab active:cursor-grabbing
            transition-transform duration-300
            ${isTalking ? "-translate-y-1 scale-105" : ""}
          `}
          style={{ animation: isTalking ? "none" : "inspectorIdle 3s ease-in-out infinite" }}
          title={`${character.name} - Drag anywhere`}
        >
          {/* Status beacon light */}
          <div
            className="
              absolute
              right-0 top-0
              z-20
              h-3 w-3
              rounded-full
              border-2 border-[#f0e5d3]
              bg-[#8b1717]
              shadow-[0_0_8px_rgba(139,0,0,0.5)]
            "
          />

          {/* Render Standalone Vector Avatar */}
          <div className="relative h-[115px] w-[95px] flex items-end justify-center pointer-events-none">
            <div className="w-full h-full drop-shadow-[4px_4px_0px_#2c2825]">
              <NoirCartoonAvatar character={character} isTalking={isTalking} />
            </div>
          </div>
        </div>
      </div>

      {/* Embedded idle keyframe */}
      <style>{`
        @keyframes inspectorIdle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }
      `}</style>
    </aside>
  );
}

function QuickChip({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        rounded-full
        border border-[#2c2825]
        bg-[#2c2825]/10
        px-2.5 py-1
        text-[10px] font-bold
        text-[#2c2825]
        transition-all
        hover:bg-[#2c2825]
        hover:text-[#f0e5d3]
        cursor-pointer
      "
    >
      {label}
    </button>
  );
}

function getLeveledGameMessage({
  character,
  view,
  mode,
  difficulty,
  attemptsLeft = 6,
  status = "ongoing",
  aiGuess = null,
  candidateCount = null,
}) {
  const isMinion = character.id === 2; // 100% Pure Minionese

  if (view === "game") {
    if (status === "won") {
      return isMinion
        ? "Whaaat?! Waaaahooo! Gelato baboi kampai!! Tulaliloo ti amo banana!!"
        : "Case Closed! Suspect captured. Outstanding investigative work, Detective!";
    }
    if (status === "lost") {
      return isMinion
        ? "Poopaye... Bi-do... Tatata bala tu... baboi gelato nooo..."
        : "The suspect escaped! Review the evidence and let's run it back.";
    }
    if (mode === "player-vs-ai") {
      if (aiGuess) {
        return isMinion
          ? `Bello! Poka '${aiGuess}' baboi?! Tulaliloo luk at tu!`
          : `The AI deduced '${aiGuess}' based on ${candidateCount || "entropy"}. Watch its next move or open the AI Explainer!`;
      }
      return isMinion
        ? "Como la pala?! Baboi bapple gelato... Hana dul sae!"
        : "Reverse Interrogation active. Watch the machine calculate probabilities for your secret word.";
    }
    if (mode === "player-vs-player") {
      return isMinion
        ? `Baboi duel! Hana dul sae... Tulaliloo ${attemptsLeft} banana!`
        : `Local Duel: Guesser's turn. ${attemptsLeft} strikes left before the file is closed.`;
    }
    if (attemptsLeft <= 2) {
      return isMinion
        ? `Bee-do! Bee-do! Bee-do! Nono para! ${attemptsLeft} banana left baboi!`
        : `Danger! Only ${attemptsLeft} strikes left before the gallows completes. Choose carefully!`;
    }
    return isMinion
      ? `Bello! Baboi tulaliloo papoy! Hana dul sae... ${attemptsLeft} banana!`
      : `Solo Investigation: ${attemptsLeft} strikes left. Click typewriter keys to uncover the hidden letters.`;
  }

  if (view === "landing") {
    return isMinion
      ? "Bello! Baboi tulaliloo papoy banana! Poka la bodoka bapple?!"
      : "Welcome to Hangman AI HQ! This is a full-stack noir detective word puzzle. Choose an operation below to begin.";
  }

  if (mode === "ai-vs-player") {
    if (difficulty === "easy") {
      return isMinion
        ? "Bello! Poka boka baboi bapple! Tulaliloo gelato banana!"
        : "Solo Mode (Rookie): 4–5 letter words with standard frequency guessing. You have 6 strikes before the case goes cold.";
    }
    if (difficulty === "hard") {
      return isMinion
        ? "Bee-do! Bee-do! Tatata bala tu baboi! Muak muak big banana!"
        : "Solo Mode (Chief): 8–10 letter words with high-entropy candidate elimination. Maximum challenge.";
    }
    return isMinion
      ? "Bello! Baboi tulaliloo papoy banana! Poka la bodoka gelato!"
      : "Solo Mode (Detective): 6–7 letter words. The AI blends candidate searching with character N-gram context.";
  }

  return character.message;
}
