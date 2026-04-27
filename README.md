# Tiki Topple

A real-time multiplayer tactical board game for 2–4 players. Manipulate a carved tiki totem tower to score points based on your secret target cards. Built with a maximalist tropical luxury aesthetic — physical, tactile, unforgettable.

**Tech Stack:** Node.js / Socket.io (backend) · React 18 / Three.js / Framer Motion / Vite (frontend)

---

## Quick Start (Local Development)

### 1. Install dependencies

```bash
cd tiki-topple
npm install          # installs concurrently at workspace root
npm run install:all  # installs backend + frontend packages
```

### 2. Configure environment

```bash
# Backend
cp tiki-topple/backend/.env.example tiki-topple/backend/.env

# Frontend (optional — Vite proxy handles local dev automatically)
cp tiki-topple/frontend/.env.example tiki-topple/frontend/.env
```

### 3. Run in development mode (two servers)

```bash
# From tiki-topple/ root:
npm run dev
```

Or manually in two terminals:

```bash
# Terminal 1 — backend (nodemon auto-restart)
cd tiki-topple/backend
npm run dev

# Terminal 2 — frontend (Vite HMR)
cd tiki-topple/frontend
npm run dev
```

Open **http://localhost:5173** in two or more browser tabs.

---

## Production Build & Deploy

### Option A — Single Railway service (recommended)

The frontend builds directly into `backend/public/`. Express serves it in production.

```bash
# From tiki-topple/ root:
npm run build   # builds frontend → backend/public/
npm start       # NODE_ENV=production node backend/server.js
```

**Railway setup:**
1. Point root directory to `tiki-topple/`
2. Build command: `npm run install:all && npm run build`
3. Start command: `npm start`
4. Environment variables:
   - `NODE_ENV=production`
   - `PORT` — Railway injects automatically
   - `CORS_ORIGIN` — your public domain (can omit if frontend is served from same origin)

### Option B — Separate services (Railway backend + Vercel frontend)

**Backend (Railway):**
- Root: `tiki-topple/backend`
- Start: `npm start`
- Env vars: `PORT` (auto), `CORS_ORIGIN=https://your-app.vercel.app`

**Frontend (Vercel):**
- Root: `tiki-topple/frontend`
- Build: `npm run build`
- Env vars: `VITE_SOCKET_URL=https://your-backend.up.railway.app`

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | `production` enables static file serving |
| `CORS_ORIGIN` | `http://localhost:5173` | Allowed frontend origin |

### Frontend (`frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_SOCKET_URL` | *(uses Vite proxy)* | Backend WebSocket URL (production only) |

---

## How to Play

### Setup

1. One player opens the game, **selects an avatar**, enters a name, and clicks **Create Room**.
2. Share the 4-letter room code.
3. Others select an avatar, enter a name, click **Join Room**, enter the code.
4. Host clicks **Start Game** (requires 2–4 players).

### Goal

Score the most total points across all rounds by getting your **secret target tikis** to the top of the board.

### Secret Tiki Card

Each player receives a hidden card with three tikis. Scores are only revealed at round end.

| Role | Condition | Points |
|------|-----------|--------|
| **Top tiki** | At position #1 | **+9 pts** |
| **Middle tiki** | In top 2 | **+5 pts** |
| **Bottom tiki** | In top 3 | **+2 pts** |

### On Your Turn

| Card | Effect |
|------|--------|
| **Tiki Up 1 / 2 / 3** | Move any tiki exactly 1, 2, or 3 positions up. Must have room. |
| **Tiki Topple** | Send any tiki (not at bottom) to the very last position. |
| **Tiki Toast** | Permanently remove the bottom tiki. Not the first card of round; requires 4+ tikis remaining. |

Select a card from your fan, then tap/click the highlighted tiki on the 3D board.

### Round End & Scoring

A round ends when all hands are empty **or** 3 or fewer tikis remain. Secret cards are revealed.

| Players | Total rounds |
|---------|-------------|
| 2 | 4 |
| 3 | 3 |
| 4 | 4 |

---

## Architecture Overview

```
tiki-topple/
├── backend/
│   ├── server.js          — Express + Socket.io, rooms, rate limiting, security
│   ├── gameEngine.js      — Pure game logic: board algorithms, scoring, lifecycle
│   ├── public/            — (generated) Production frontend build
│   └── .env
└── frontend/
    └── src/
        ├── App.jsx                — Screen router with ErrorBoundary + LoadingScreen
        ├── data/
        │   └── avatars.js         — 5 SVG avatar definitions
        ├── components/
        │   ├── HomeScreen.jsx     — Create / join with AvatarPicker
        │   ├── AvatarPicker.jsx   — Animated avatar selection cards
        │   ├── LobbyScreen.jsx    — Waiting room with SVG avatar circles
        │   ├── GameScreen.jsx     — Main game: board + hand + settings panel
        │   ├── RoundEndScreen.jsx — Score reveals with card flip animation
        │   ├── GameOverScreen.jsx — Final leaderboard with confetti
        │   ├── OpponentArea.jsx   — Opponent avatar with orbit ring
        │   ├── PlayerHand.jsx     — Fan hand with hover spread + accessibility
        │   ├── SecretTikiCard.jsx — Secret card widget
        │   ├── TurnIndicator.jsx  — Your Turn / Waiting banner
        │   ├── Notifications.jsx  — Toast notification system
        │   ├── RulesModal.jsx     — In-game help
        │   ├── LoadingScreen.jsx  — Animated tiki loading screen
        │   └── ErrorBoundary.jsx  — React error catch with restart
        ├── three/
        │   └── TikiBoard.jsx      — Three.js WebGL board with AnimationQueue
        ├── hooks/
        │   ├── useSocket.js       — Socket.io with reconnection logic
        │   └── useSoundEngine.js  — Web Audio API procedural sounds
        ├── store/
        │   └── gameStore.js       — Zustand state (game + settings + connection)
        └── context/
            └── SocketContext.jsx  — Socket actions via context
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend runtime | Node.js 18+ |
| Backend framework | Express 4 |
| Real-time | Socket.io 4 |
| Frontend build | Vite 5 + React 18 |
| 3D graphics | Three.js r164 |
| Animation | Framer Motion 11 |
| State | Zustand 4 |
| Styling | CSS-in-JS inline styles |
| Fonts | Cinzel Decorative + Crimson Text (Google Fonts) |
| Audio | Web Audio API (procedural — no audio files) |

---

## Security Features

- **Rate limiting**: max 10 `play_card` events/second per socket (token bucket)
- **Input sanitization**: all string inputs strip HTML tags, max length enforced
- **Board validation**: `targetTikiId` verified to be active on the board before processing
- **Card type validation**: only 5 known types accepted server-side
- **Privacy boundary**: `allSecretCards` only sent in `round_ended` — never in `state_update`
- **Per-player views**: `getPlayerView` ensures each player only sees their own secret card
- **Room cleanup**: rooms deleted 10 min after game over or 5 min after all disconnect

---

## Reconnecting Mid-Game

If a player disconnects mid-game, the game pauses. When they return:
- Client emits `request_state` automatically on reconnect
- Server re-associates the new socket with the player's existing ID
- Game state is restored and game resumes

The reconnection attempts 5 times with exponential backoff (1s → 5s). After 5 failed attempts a "Connection Lost" overlay appears with a Rejoin button.
