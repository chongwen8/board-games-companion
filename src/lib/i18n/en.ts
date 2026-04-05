export interface Translations {
  language: string;
  languageName: string;
  home: {
    title: string; subtitle: string; players: string;
    games: Record<string, { description: string }>;
  };
  common: {
    activeSession: string; rejoin: string; dismiss: string;
    endSessionExit: string; leaveSession: string;
    newGameSamePlayers: string; exitToLobby: string;
  };
  nav: { dashboard: string; spend: string; industry: string; more: string; guide: string };
  game: {
    title: string; subtitle: string; canalEra: string; railEra: string;
    round: string; actionsLeft: (n: number) => string;
    reconnecting: string; connecting: string; connectionFailed: string; loadingSession: string; settingUp: string;
  };
  lobby: {
    sessionCode: string; shareCode: string; players: string; host: string;
    connected: string; disconnected: string; bot: string; addBot: string;
    startGame: (n: number) => string; waitingForPlayers: string; waitingForHost: string;
    yourName: string; enterName: string; enterNameFirst: string;
    newSession: string; createSession: string; joinSession: string;
    enterCode: string; invalidCode: string; join: string;
    viewHistory: string; signInGoogle: string; signOut: string; loading: string;
  };
  dashboard: { turnOrder: string; you: string; thisRoundSpending: string; spent: string };
  spend: { recordSpending: string; remaining: string; reset: string; nextRoundOrder: string };
  industry: {
    title: string; tapToCycle: string; available: string; built: string; developed: string;
    coal: string; iron: string; brewery: string; cotton: string; manufacturer: string; pottery: string;
    next: string; done: string; showOthers: string; hideOthers: string;
  };
  playerCard: {
    money: string; spent: string; income: string; vp: string; loan: string;
    nLoans: (n: number) => string;
  };
  vp: { title: string; vp: string; money: string };
  income: {
    title: string; income: string; loans: string; takeLoan: string;
    confirmLoan: string; cancel: string; perRound: string;
  };
  endOfRound: {
    spendingSummary: string; left: string; newTurnOrder: string;
    nextCollectIncome: string; collectIncome: string; collectIncomeDesc: string;
    level: string; back: string; nextConfirm: string; collectAllFirst: string;
    endCanalEra: string; endGame: string; endRound: (n: number) => string;
    canalToRail: string; canalToRailItems: string[];
    finalScoring: string; finalScoringItems: string[];
    endCanalEraBtn: string; endGameBtn: string; endRoundBtn: string;
    confirmEndCanalEra: string; confirmEndGame: string;
    endRoundCollect: string; confirmEndRoundCollect: string;
    waitingForHost: string; waitingForHostAdvance: string;
    finalRound: string; finalRoundWarning: string;
  };
  mistakeLevel: { newbie: string; intermediate: string; experienced: string };
  history: {
    title: string; noActions: string; undo: string;
    actions: {
      spent: (name: string, amount: number) => string;
      spendingSet: (name: string, amount: number) => string;
      turnEnded: string; roundEnded: string; eraTransition: string;
      tookLoan: (name: string) => string;
      incomeAdjusted: (name: string, delta: number) => string;
      vpAdjusted: (name: string, delta: number) => string;
      moneyAdjusted: (name: string, delta: number) => string;
      built: (name: string, industry: string, level: number) => string;
      developed: (name: string, industry: string, level: number) => string;
      toggled: (name: string, industry: string, level: number) => string;
      gameEnded: string; undoAction: string; unknown: string;
    };
  };
  summary: {
    gameOver: string; finalScores: string; industryLinks: string;
    moneyBonus: string; loanPenalty: string; gameStats: string;
    players: string; actionsTaken: string; tiebreaker: string;
  };
  rules: {
    title: string; searchPlaceholder: string;
    noResults: (q: string) => string;
    sections: {
      actions: string; resources: string; network: string; links: string; turnOrder: string;
      overbuild: string; eraTransition: string; scoring: string; industries: string;
    };
  };
  mistakes: {
    title: string;
    subtitle: string;
    items: { title: string; description: string; level: string }[];
  };
  // --- Dune: Imperium ---
  dune: {
    game: { title: string; titleUprising: string; subtitle: string; round: string };
    resources: { spice: string; solari: string; water: string; vp: string; intrigue: string; spy: string; dreadnought: string };
    factions: {
      emperor: string; spacingGuild: string; beneGesserit: string; fremen: string;
    };
    influence: {
      alliance: string; allianceGained: string; allianceLost: string;
      level: string; influence: string;
    };
    dashboard: {
      nextRound: string; confirmNextRound: string; endGame: string; confirmEndGame: string;
      waitingForHost: string; finalRound: string; finalRoundWarning: string;
      troops: string; garrison: string; combatTroops: string; supply: string;
      dreadnoughtCombat: string; combatBonus: string; combatStrength: string;
      combatResults: string; noCombat: string; confirmResolve: string;
      combatResolveDesc: string; skipCombat: string;
    };
    history: {
      actions: {
        adjustedSpice: (name: string, delta: number) => string;
        adjustedSolari: (name: string, delta: number) => string;
        adjustedWater: (name: string, delta: number) => string;
        adjustedVp: (name: string, delta: number) => string;
        adjustedIntrigue: (name: string, delta: number) => string;
        adjustedSpy: (name: string, delta: number) => string;
        adjustedDreadnought: (name: string, delta: number) => string;
        adjustedGarrison: (name: string, delta: number) => string;
        adjustedCombatTroops: (name: string, delta: number) => string;
        adjustedDreadnoughtCombat: (name: string, delta: number) => string;
        adjustedCombatBonus: (name: string, delta: number) => string;
        combatStarted: string;
        combatResolved: string;
        adjustedInfluence: (name: string, faction: string, delta: number) => string;
        allianceGained: (name: string, faction: string) => string;
        allianceLost: (name: string, faction: string) => string;
        nextRound: string;
        gameEnded: string;
        undoAction: string;
        unknown: string;
      };
    };
    summary: {
      gameOver: string; finalStandings: string;
      alliances: string; gameStats: string;
      tiebreaker: string;
    };
    tips: {
      title: string; subtitle: string;
      items: { title: string; description: string; level: string }[];
    };
    rules: {
      title: string; searchPlaceholder: string;
      noResults: (q: string) => string;
      sections: {
        resources: string; factions: string; influence: string;
        alliance: string; combat: string; endgame: string;
      };
      resourceDescriptions: {
        spice: string; solari: string; water: string; vp: string;
      };
      factionDesc: (maxInf: number, allianceLevel: number, thresholdLevel: number, thresholdAmount: number, thresholdResource: string) => string;
      allianceItems: { term: string; desc: string }[];
    };
  };
}

const en: Translations = {
  // Common
  language: "EN",
  languageName: "English",

  // Home page
  home: {
    title: "Board Games Companion",
    subtitle: "Pick a game to get started",
    players: "players",
    games: {
      "brass-birmingham": { description: "Track spending, turn order, and industry during your Brass: Birmingham session." },
      "dune-imperium": { description: "Track resources, faction influence, and alliances during your Dune: Imperium session." },
      "dune-imperium-uprising": { description: "Track resources, spies, faction influence, and alliances during your Dune: Imperium Uprising session." },
    },
  },

  // Shared strings
  common: {
    activeSession: "You have an active session",
    rejoin: "Rejoin",
    dismiss: "Dismiss",
    endSessionExit: "End Session & Exit",
    leaveSession: "Leave Session",
    newGameSamePlayers: "New Game (Same Players)",
    exitToLobby: "Exit to Lobby",
  },

  // Navigation
  nav: {
    dashboard: "Dashboard",
    spend: "Spend",
    industry: "Industry",
    more: "More",
    guide: "Guide",
  },

  // Game header
  game: {
    title: "Brass: Birmingham",
    subtitle: "Companion app for in-person play",
    canalEra: "Canal Era",
    railEra: "Rail Era",
    round: "Round",
    actionsLeft: (n: number) => `${n} action${n !== 1 ? "s" : ""} left`,
    reconnecting: "Reconnecting...",
    connecting: "Connecting...",
    connectionFailed: "Unable to connect to game server. Check your connection and try again.",
    loadingSession: "Loading session...",
    settingUp: "Setting up session...",
  },

  // Lobby
  lobby: {
    sessionCode: "Session Code",
    shareCode: "Share this code with other players",
    players: "Players",
    host: "host",
    connected: "connected",
    disconnected: "disconnected",
    bot: "bot",
    addBot: "+ Add Bot",
    startGame: (n: number) => `Start Game (${n} players)`,
    waitingForPlayers: "Add bots or wait for players to join...",
    waitingForHost: "Waiting for host to start the game...",
    yourName: "Your name",
    enterName: "Enter your name",
    enterNameFirst: "Enter your name first",
    newSession: "New Session",
    createSession: "Create Session",
    joinSession: "Join Session",
    enterCode: "Enter 4-letter code",
    invalidCode: "Enter a 4-letter session code",
    join: "Join",
    viewHistory: "View game history",
    signInGoogle: "Sign in with Google",
    signOut: "Sign out",
    loading: "Loading...",
  },

  // Dashboard
  dashboard: {
    turnOrder: "Turn Order",
    you: "you",
    thisRoundSpending: "This Round's Spending",
    spent: "spent",
  },

  // Spend Tracker
  spend: {
    recordSpending: "Record Spending",
    remaining: "remaining",
    reset: "Reset",
    nextRoundOrder: "Next round order preview",
  },

  // Industry
  industry: {
    title: "Industry Tiles",
    tapToCycle: "Tap a tile to cycle:",
    available: "available",
    built: "built",
    developed: "developed",
    coal: "Coal Mine",
    iron: "Iron Works",
    brewery: "Brewery",
    cotton: "Cotton Mill",
    manufacturer: "Manufacturer",
    pottery: "Pottery",
    next: "Next",
    done: "Done",
    showOthers: "Show others",
    hideOthers: "Hide others",
  },

  // Player Card
  playerCard: {
    money: "Money \u00A3",
    spent: "Spent \u00A3",
    income: "Income",
    vp: "VP",
    loan: "Loan",
    nLoans: (n: number) => `${n} loan${n > 1 ? "s" : ""}`,
  },

  // VP & Money
  vp: {
    title: "Victory Points & Money",
    vp: "VP",
    money: "Money",
  },

  // Income & Loans
  income: {
    title: "Income & Loans",
    income: "Income",
    loans: "Loans",
    takeLoan: "Take Loan",
    confirmLoan: "Confirm: +\u00A330, -3 income",
    cancel: "Cancel",
    perRound: "/round",
  },

  // End of Round
  endOfRound: {
    spendingSummary: "Spending Summary",
    left: "left",
    newTurnOrder: "New turn order",
    nextCollectIncome: "Next: Collect Income",
    collectIncome: "Collect Income",
    collectIncomeDesc: "Each player collects (or pays) their income. Tap to mark as done.",
    level: "level",
    back: "Back",
    nextConfirm: "Next: Confirm",
    collectAllFirst: "Collect all income first",
    endCanalEra: "End Canal Era?",
    endGame: "End Game?",
    endRound: (n: number) => `End Round ${n}?`,
    canalToRail: "Canal \u2192 Rail Era Transition",
    canalToRailItems: [
      "Remove all Level I industry tiles from the board",
      "Remove all canal links from the board",
      "Reshuffle the merchant tiles",
      "Players keep their money, income, and remaining tiles",
    ],
    finalScoring: "Final Scoring",
    finalScoringItems: [
      "Score VP for your link tiles and flipped industry tiles",
      "Tiebreaker: highest income level, then most money remaining",
    ],
    endCanalEraBtn: "End Canal Era",
    endGameBtn: "End Game",
    endRoundBtn: "End Round",
    confirmEndCanalEra: "Confirm \u2014 End Canal Era & Collect Income",
    confirmEndGame: "Confirm \u2014 End Game",
    endRoundCollect: "End Round & Collect Income",
    confirmEndRoundCollect: "Confirm \u2014 Collect Income & Reorder",
    waitingForHost: "Waiting for host...",
    waitingForHostAdvance: "Waiting for host to advance the round...",
    finalRound: "Final Round",
    finalRoundWarning: "This will end the game. Make sure all VP, income, and money are correct. This cannot be undone.",
  },

  // Mistake levels
  mistakeLevel: {
    newbie: "Beginner",
    intermediate: "Intermediate",
    experienced: "Advanced",
  },

  // Action History
  history: {
    title: "Action History",
    noActions: "No actions yet",
    undo: "Undo",
    actions: {
      spent: (name: string, amount: number) => `${name} spent \u00A3${amount}`,
      spendingSet: (name: string, amount: number) => `${name} spending set to \u00A3${amount}`,
      turnEnded: "Turn ended",
      roundEnded: "Round ended \u2014 turn order recalculated",
      eraTransition: "Era transitioned to Rail",
      tookLoan: (name: string) => `${name} took a loan (+\u00A330, -3 income)`,
      incomeAdjusted: (name: string, delta: number) => `${name} income ${delta >= 0 ? "+" : ""}${delta}`,
      vpAdjusted: (name: string, delta: number) => `${name} VP ${delta >= 0 ? "+" : ""}${delta}`,
      moneyAdjusted: (name: string, delta: number) => `${name} money ${delta >= 0 ? "+" : ""}\u00A3${Math.abs(delta)}`,
      built: (name: string, industry: string, level: number) => `${name} built ${industry} Lv${level}`,
      developed: (name: string, industry: string, level: number) => `${name} developed ${industry} Lv${level}`,
      toggled: (name: string, industry: string, level: number) => `${name} toggled ${industry} Lv${level}`,
      gameEnded: "Game ended",
      undoAction: "Undo",
      unknown: "Unknown action",
    },
  },

  // Game Summary
  summary: {
    gameOver: "Game Over",
    finalScores: "Final Scores",
    industryLinks: "Industry/Links",
    moneyBonus: "Money",
    loanPenalty: "Loans",
    gameStats: "Game Stats",
    players: "Players",
    actionsTaken: "Actions taken",
    tiebreaker: "Tiebreaker: income level, then money",
  },

  // Rules
  rules: {
    title: "Rules Reference",
    searchPlaceholder: "Search rules...",
    noResults: (q: string) => `No results for "${q}"`,
    sections: {
      actions: "Actions",
      resources: "Resources",
      network: "Network & Connection",
      links: "Links",
      turnOrder: "Turn Order",
      overbuild: "Overbuild",
      eraTransition: "Era Transition",
      scoring: "Scoring",
      industries: "Industries",
    },
  },

  // Common Mistakes
  mistakes: {
    title: "Common Mistakes",
    subtitle: "Pitfalls that catch new and experienced players alike",
    items: [
      { title: "Forgetting beer to sell", description: "Selling cotton, manufacturer, or pottery requires beer. Your own brewery: no connection needed. Opponent's brewery: must be connected (and flips it). Or use beer on the merchant tile.", level: "newbie" },
      { title: "Resource connection rules differ", description: "Coal: must be connected to a mine (closest first, free) or buy from market. Iron: ANY iron works, no connection needed. Beer: your own = free, no connection; opponent's = must be connected.", level: "newbie" },
      { title: "First round = 1 action only", description: "The first round of each era gives only 1 action per player, not 2. A very common oversight that throws off the whole game tempo.", level: "newbie" },
      { title: "Develop removes from player mat, not board", description: "Develop removes your lowest unbuilt tiles from the game. It does NOT remove tiles already built on the board.", level: "newbie" },
      { title: "Using opponent's brewery flips it", description: "When you use beer from an opponent's brewery, it flips \u2014 giving THEM VP and income. Your own brewery: free, no connection, no flip. Think carefully before gifting opponents free flips.", level: "intermediate" },
      { title: "Turn order is spending-based, not VP", description: "Next round's turn order is determined by who spent the LEAST this round. Spending \u00A30 (passing) means going first next round. Manage this strategically.", level: "newbie" },
      { title: "Canal links are removed at era transition", description: "All canal links are removed when transitioning to Rail Era. Don't over-invest in canal links late in the Canal Era \u2014 the VP is scored but the network disappears.", level: "intermediate" },
      { title: "Level I tiles removed at era transition", description: "All Level I industry tiles on the board are removed when transitioning to Rail Era. Don't build Level I tiles late in Canal Era unless you can flip them first.", level: "intermediate" },
      { title: "Can't build Level I in Rail Era", description: "Level I tiles cannot be built during the Rail Era. If you haven't developed past Level I, you'll be stuck. Plan your develops in Canal Era.", level: "newbie" },
      { title: "Overbuilding opponent's tiles is restricted", description: "You can overbuild any of your own tiles freely. But you can only overbuild an opponent's coal mine or iron works \u2014 and only when zero cubes of that resource remain on board + market. You can never overbuild opponent's brewery/cotton/manufacturer/pottery.", level: "intermediate" },
      { title: "Loan timing matters", description: "Taking a loan gives \u00A330 but costs 3 income levels. Late-game loans are less painful because there are fewer rounds of reduced income. Early loans compound the income loss.", level: "experienced" },
      { title: "End-game money VP is floored", description: "Each \u00A310 remaining = 1 VP. This means \u00A319 and \u00A310 both give only 1 VP. Don't leave money unspent in odd amounts \u2014 convert to actions or resources.", level: "experienced" },
      { title: "Scout is underused", description: "Discarding 3 cards to draw 2 wilds (1 location + 1 industry) is powerful when your hand doesn't match your strategy. New players often pass instead of scouting.", level: "intermediate" },
      { title: "Coal market price escalates fast", description: "Buying coal from the market gets expensive quickly. Build coal mines early or plan around connected opponents' mines. Don't rely on the market.", level: "experienced" },
      { title: "\"Connected\" vs \"Your Network\" are different", description: "Connected = any path of links (anyone's) \u2014 used for resources and selling. Your Network = locations with your tiles + adjacent to your links \u2014 used for where you can build and expand. You CAN use opponent's links to transport resources.", level: "newbie" },
      { title: "Links are permanent for the era", description: "You can never overbuild, replace, or remove another player's link. If they build a canal between two cities, that route is theirs. In Rail Era some routes have 2 slots, but you still can't replace an existing track.", level: "newbie" },
      { title: "New links must connect to Your Network", description: "When building a link (Network action), it must connect to a location where you have a tile or an adjacent link. You can't build links in isolation. Plan your expansion path early.", level: "intermediate" },
    ],
  },
  // --- Dune: Imperium ---
  dune: {
    game: {
      title: "Dune: Imperium",
      titleUprising: "Dune: Imperium Uprising",
      subtitle: "Companion app for in-person play",
      round: "Round",
    },
    resources: {
      spice: "Spice",
      solari: "Solari",
      water: "Water",
      vp: "VP",
      intrigue: "Intrigue",
      spy: "Spy",
      dreadnought: "Dreadnought",
    },
    factions: {
      emperor: "Emperor",
      spacingGuild: "Spacing Guild",
      beneGesserit: "Bene Gesserit",
      fremen: "Fremen",
    },
    influence: {
      alliance: "Alliance",
      allianceGained: "Alliance gained!",
      allianceLost: "Alliance lost!",
      level: "Level",
      influence: "Influence",
    },
    dashboard: {
      nextRound: "Next Round",
      confirmNextRound: "Confirm — Next Round",
      endGame: "End Game",
      confirmEndGame: "Confirm — End Game",
      waitingForHost: "Waiting for host to advance the round...",
      finalRound: "Final Round",
      finalRoundWarning: "This will end the game. Make sure all VP and resources are correct. This cannot be undone.",
      troops: "Troops",
      garrison: "Garrison",
      combatTroops: "Combat",
      supply: "Supply",
      dreadnoughtCombat: "Dreadnought",
      combatBonus: "Bonus",
      combatStrength: "Strength",
      combatResults: "Combat Results",
      noCombat: "No combat participants",
      confirmResolve: "Confirm — Resolve Combat & Next Round",
      combatResolveDesc: "Troops in combat return to supply. Dreadnought combat and bonus reset.",
      skipCombat: "Skip Combat & Next Round",
    },
    history: {
      actions: {
        adjustedSpice: (name: string, delta: number) => `${name} spice ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedSolari: (name: string, delta: number) => `${name} solari ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedWater: (name: string, delta: number) => `${name} water ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedVp: (name: string, delta: number) => `${name} VP ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedIntrigue: (name: string, delta: number) => `${name} intrigue ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedSpy: (name: string, delta: number) => `${name} spy ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedDreadnought: (name: string, delta: number) => `${name} dreadnought ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedGarrison: (name: string, delta: number) => `${name} garrison ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedCombatTroops: (name: string, delta: number) => `${name} combat troops ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedDreadnoughtCombat: (name: string, delta: number) => `${name} dreadnought combat ${delta >= 0 ? "+" : ""}${delta}`,
        adjustedCombatBonus: (name: string, delta: number) => `${name} combat bonus ${delta >= 0 ? "+" : ""}${delta}`,
        combatStarted: "Combat resolution started",
        combatResolved: "Combat resolved — round advanced",
        adjustedInfluence: (name: string, faction: string, delta: number) =>
          `${name} ${faction} influence ${delta >= 0 ? "+" : ""}${delta}`,
        allianceGained: (name: string, faction: string) => `${name} gained ${faction} alliance`,
        allianceLost: (name: string, faction: string) => `${name} lost ${faction} alliance`,
        nextRound: "Round advanced",
        gameEnded: "Game ended",
        undoAction: "Undo",
        unknown: "Unknown action",
      },
    },
    summary: {
      gameOver: "Game Over",
      finalStandings: "Final Standings",
      alliances: "Alliances",
      gameStats: "Game Stats",
      tiebreaker: "Tiebreaker: spice, then solari, then water, then garrison",
    },
    tips: {
      title: "Common Tips",
      subtitle: "Helpful reminders for Dune: Imperium",
      items: [
        { title: "Influence thresholds give bonuses", description: "Reaching influence level 2 in any faction gives an automatic bonus. Emperor & Spacing Guild give Solari, Bene Gesserit gives an Intrigue card, and Fremen gives Water.", level: "newbie" },
        { title: "Alliance tokens are competitive", description: "The player with the highest influence (≥4) in a faction holds the alliance token. If another player surpasses you, they take the token and you lose 1 VP.", level: "newbie" },
        { title: "Alliances give VP + bonus", description: "Gaining an alliance token immediately gives 1 VP plus a faction-specific resource bonus. Losing it removes that 1 VP.", level: "newbie" },
        { title: "Water is the scarcest resource", description: "Water is hard to get and needed for many actions. Don't spend it carelessly early in the game.", level: "intermediate" },
        { title: "Spice converts to Solari", description: "You can often trade Spice for Solari when selling to the Spacing Guild. Plan your resource conversion carefully.", level: "intermediate" },
        { title: "Combat matters for VP", description: "Winning conflicts awards VP and other rewards. Don't neglect military strength entirely.", level: "intermediate" },
      ],
    },
    rules: {
      title: "Rules Reference",
      searchPlaceholder: "Search rules...",
      noResults: (q: string) => `No results for "${q}"`,
      sections: {
        resources: "Resources",
        factions: "Factions",
        influence: "Influence",
        alliance: "Alliance",
        combat: "Combat",
        endgame: "Endgame",
      },
      resourceDescriptions: {
        spice: "Primary currency for many actions. Can be traded for Solari.",
        solari: "Money used for purchasing cards and paying costs.",
        water: "Scarce resource required for desert actions and Fremen alliance.",
        vp: "Victory Points. The player with the most VP at game end wins.",
      },
      factionDesc: (maxInf, allianceLevel, thresholdLevel, thresholdAmount, thresholdResource) =>
        `Max influence: ${maxInf}. Alliance at level ${allianceLevel}. Threshold reward at level ${thresholdLevel}: +${thresholdAmount} ${thresholdResource}.`,
      allianceItems: [
        { term: "Alliance Token", desc: "Held by the player with highest influence (≥4) in a faction. Gives 1 VP + faction bonus. Lost if another player surpasses your influence." },
        { term: "Alliance Transfer", desc: "When a player reaches higher influence than the current holder, they take the alliance token. The old holder loses 1 VP." },
        { term: "Tie-breaking", desc: "On ties, the incumbent keeps the alliance. If no incumbent, first in turn order wins." },
      ],
    },
  },
};

export default en;
