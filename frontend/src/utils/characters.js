export const CHARACTERS = [
  {
    id: 1,
    name: "SPONGEBOB",
    level: 1,
    category: "DEFAULT",
    role: "ROOKIE SLEUTH",
    requiredWins: 0,
    unlocked: true,
    accent: "#d6a638",
    color: "#5c3f28",
    badge: "LVL 1 // UNLOCKED",
    message: "I'm ready! I'm ready! Let's uncover the classified clues, partner!",
    gibberish: false,
    ability: {
      name: "None (Standard Guidance)",
      desc: "Basic rookie investigation. Provides gameplay rules, tips, and strike countdowns with zero special powers.",
      icon: "🧽",
      cooldown: "None",
      hasPower: false,
    },
    sampleQuotes: [
      "I'm ready! I'm ready! Let's crack this case!",
      "Order up! One fresh clue coming right to the evidence board!",
      "Barnacles! That was a close call, keep your eyes on the board!",
      "Deduction is like flipping Krabby Patties — precision is everything!",
    ],
  },
  {
    id: 2,
    name: "MINION",
    level: 2,
    category: "CHAOS HELPER",
    role: "MINIONESE SPECIALIST",
    requiredWins: 2,
    unlocked: false,
    accent: "#d6a638",
    color: "#2c4d6f",
    badge: "LVL 2 // 2 WINS",
    message: "Bello! Baboi tulaliloo papoy banana! Poka la bodoka bapple?!",
    gibberish: true,
    ability: {
      name: "Banana Strike Shield",
      desc: "Banana distraction absorbs 1 wrong strike penalty per match.",
      icon: "🍌",
      cooldown: "1x Per Game",
      hasPower: true,
    },
    sampleQuotes: [
      "Bello! Baboi tulaliloo papoy banana!",
      "Hana, dul, sae! Poka la bodoka banana gelato!",
      "Bee-do! Bee-do! Bee-do! Tatata bala tu!",
      "Kampai! Para tu banana baboi tulaliloo!",
    ],
  },
  {
    id: 3,
    name: "DORAEMON",
    level: 3,
    category: "22ND CENTURY",
    role: "TECH SPECIALIST",
    requiredWins: 5,
    unlocked: false,
    accent: "#2c5173",
    color: "#8b1717",
    badge: "LVL 3 // 5 WINS",
    message: "I've pulled a 22nd-century Future Letter Probe from my 4D pocket!",
    gibberish: false,
    ability: {
      name: "Pocket Letter Probe",
      desc: "Deploys a future gadget to reveal 1 guaranteed blank letter position.",
      icon: "🐱",
      cooldown: "1x Per Game",
      hasPower: true,
    },
    sampleQuotes: [
      "Deploying Future-Vision Letter Probe from my 4D pocket!",
      "Don't worry, Nobita... I mean Detective! I have the perfect gadget for this!",
      "Statistical trajectory computed: high probability on central consonants!",
      "Gadget scan complete! One hidden letter position is now exposed.",
    ],
  },
  {
    id: 4,
    name: "SPIDER-MAN",
    level: 4,
    category: "MASTERMIND",
    role: "WEB DETECTIVE",
    requiredWins: 10,
    unlocked: false,
    accent: "#8b1717",
    color: "#1e3450",
    badge: "LVL 4 // 10 WINS",
    message: "My spider-sense is tingling. Three dead-end letters have been eliminated!",
    gibberish: false,
    ability: {
      name: "Spider-Sense Purge",
      desc: "Webs up and permanently eliminates 3 guaranteed wrong letters from the board.",
      icon: "🕷️",
      cooldown: "1x Per Game",
      hasPower: true,
    },
    sampleQuotes: [
      "My spider-sense is tingling. That letter is a trap!",
      "Friendly neighborhood detective on duty! Three wrong letters webbed up.",
      "With great deduction comes great responsibility. Let's finish this!",
      "Target acquired! Watch the evidence board light up.",
    ],
  },
];

export function getCareerWins() {
  try {
    const saved = localStorage.getItem("hangman_career_wins");
    return saved ? parseInt(saved, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

export function incrementCareerWins() {
  try {
    const current = getCareerWins();
    const updated = current + 1;
    localStorage.setItem("hangman_career_wins", String(updated));
    return updated;
  } catch {
    return 1;
  }
}

export function isCharacterUnlocked(char, wins = getCareerWins()) {
  return wins >= char.requiredWins;
}

export function getCharacter(id) {
  const parsed = Number(id);
  return CHARACTERS.find((c) => c.id === parsed) || CHARACTERS[0];
}
