# Board Games Companion

A real-time multiplayer companion app for complex board games. Automates the tedious bookkeeping — resources, faction influence, combat, scoring — so players can focus on strategy instead of mental math.

**Live:** [board-games.one](https://board-games.one)

## Supported Games

| Game | Features |
|---|---|
| **Brass: Birmingham** | Spending tracker, turn order (spending-based), income track, loans, industry tile progression, canal/rail era transition, final scoring with tiebreakers |
| **Dune: Imperium** | Resources (Spice, Solari, Water, VP, Intrigue, Dreadnought), faction influence with automatic threshold rewards, alliance tokens with auto VP transfer, troop tracking (supply/garrison/combat), combat resolution with rankings |
| **Dune: Imperium Uprising** | All of the above plus Spy tracking (max 3, enforces recall rule), uprising-specific faction rewards |

## Key Features

- **Real-time multiplayer** — all players see updates instantly via WebSocket sync
- **Automatic rules enforcement** — influence thresholds, alliance transfers, combat strength calculation, end-of-game tiebreakers
- **Undo system** — host can revert any action, with server-side snapshots sharded across multiple storage keys to handle long games
- **Session management** — 4-character join codes, rejoin after disconnect, host controls (add/remove bots, start/end session)
- **Bilingual UI** — English and Chinese (i18n throughout, including official Chinese game names)
- **PWA-ready** — works on mobile with offline session recovery
- **Game-over cleanup** — undo stack and history are freed automatically when a game ends to save storage

## Architecture

### Stack

- **Next.js 16** (App Router, Turbopack)
- **PartyKit** — WebSocket server for real-time multiplayer, with durable storage
- **Zustand** — client state management
- **Immer** — immutable reducers with snapshot-based undo
- **Tailwind CSS v4** + shadcn/ui
- **Firebase** — optional auth and Firestore persistence
- **TypeScript** — strict mode throughout

### Project Structure

```
src/
├── app/
│   ├── page.tsx                           # Home (game selection)
│   └── games/
│       ├── brass-birmingham/              # Game-specific pages
│       ├── dune-imperium/                 # Dune base game
│       └── dune-imperium-uprising/        # Uprising expansion (shares components)
├── components/                            # Shared UI
│   ├── GameLobbyPage.tsx                  # Reusable lobby (create/join)
│   ├── GameJoinPage.tsx                   # Code lookup → redirect
│   ├── GameHistoryPage.tsx                # Past sessions
│   ├── SessionLobby.tsx                   # In-session lobby view
│   └── GameSessionShell.tsx               # Session wrapper (WebSocket, persistence, top bar)
├── lib/
│   ├── games/
│   │   ├── brass-birmingham/              # Types, constants, logic, reducer
│   │   └── dune-imperium/                 # Shared by base + uprising
│   ├── hooks/                             # usePartySocket, useAuth
│   ├── i18n/                              # en.ts, zh.ts
│   └── utils/                             # Session codes, player IDs, active session
├── stores/                                # Zustand stores per game
└── ...

party/
├── shared/
│   └── base-game-server.ts                # Abstract base: session mgmt, storage sharding
├── brass-birmingham.ts                    # Extends base
├── dune-imperium.ts                       # Extends base
├── dune-imperium-uprising.ts              # Extends base (different faction constants)
└── lobby.ts                               # Shared code → room ID lookup
```

### Design Highlights

- **Reducer pattern** — game logic runs as a pure Immer reducer on both server (authoritative) and client (optimistic). Pushing a snapshot before each action enables undo.
- **Extensible game registry** — adding a new game means extending `BaseGameServer`, writing a reducer, and plugging in components. Brass and Dune share zero game-specific code but reuse all infrastructure (lobby, join flow, session shell, undo, persistence).
- **Uprising reuses Dune** — the Uprising variant shares types, reducer, and components with the base game. The only difference is the faction constants passed to the reducer — a clean expansion pattern for future Dune DLCs.
- **Storage sharding** — PartyKit has a 128KB per-key limit. Undo snapshots are auto-sharded across `undo-0`, `undo-1`, etc. (25 snapshots per key) to handle full games without hitting the limit.
- **Disconnected-by-default** — the server doesn't wipe sessions when all clients disconnect; players can rejoin via 4-character code or localStorage-tracked active session.

## Running Locally

```bash
# Install
npm install

# Start Next.js dev server
npm run dev

# Start PartyKit dev server (separate terminal)
npx partykit dev
```

Visit [http://localhost:3000](http://localhost:3000).

## License

This project is **open source** under the [Apache License 2.0](./LICENSE). Feel free to fork, study, and build on it.

## Disclaimer

This is an **unofficial, non-commercial companion tool** for **in-person play only**. It is not a game. It simply helps players save setup and resource-counting time during physical play sessions — nothing more.

- Does **not** include any game rules, cards, artwork, board images, or other copyrighted content.
- Does **not** simulate, replace, or recreate the games in any form.
- Requires players to own a physical copy of the game to play.
- Not affiliated with, endorsed by, or sponsored by the game publishers.

All game names and trademarks are property of their respective owners (Roxley Games, Dire Wolf Digital).

**Note on forks:** Since this project is open source under MIT, you are free to fork and modify it. However, the author is not responsible for any modifications, adaptations, or derivative works created by others. Any infringement or misuse introduced by forks is the sole responsibility of those who create or distribute them.
