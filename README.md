# Tiki Topple

A real-time multiplayer board game I built to teach myself sockets, WebGL, and how to actually ship something instead of just prototyping forever.

2–4 players stack tikis on a totem, screw with each other's plans, and try to be the last one standing. Each player has secret target cards, so nobody really knows what anyone else is playing for — which is where the mind games kick in.

Playable in the browser, no download.

## Why this project

Honestly? Two reasons:

1. I wanted an excuse to learn real-time multiplayer (Socket.io) without doing another boring chat app.
2. I've always liked board games and figured "how hard could it be to build one" — turns out surprisingly hard once you start caring about animation, latency, and how the game *feels*.

Also, I liked the idea of making something that looks premium instead of the usual grey-box dev-art look. So I went a bit overboard on the visuals (r3f jungle scene, custom torch shaders, procedural ambient music, metallic gold everywhere). Zero regrets.

## What's in the box

- **Real-time multiplayer** — 2 to 4 players, join by room code, works across devices
- **Play vs bots** — solo mode with 1–3 AI opponents (they think for a few seconds so you can actually see what they did)
- **3D jungle scene** — react-three-fiber, custom GLSL flame shaders, ocean, palm trees, torch lights
- **2D game board** — canvas-rendered tikis with idle animations, carved wooden shaft, engraved score stones
- **Google sign-in + profile stats** — Firebase Auth + Firestore, stats sync across devices
- **Procedural ambient music** — Web Audio API, no audio files, dark tribal-ish vibe with a toggle
- **Reconnect handling** — if you drop mid-game, you get your state back
- **Rate limiting, input sanitization, HTTPS redirect** — because putting real Socket.io in prod without any of that is asking for pain

## Tech stack

**Backend:** Node.js, Express, Socket.io, Helmet, express-rate-limit
**Frontend:** React 18, Vite, Zustand, Framer Motion, Socket.io-client, react-three-fiber, drei, three.js, Sonner
**Auth/DB:** Firebase Auth (Google), Firestore
**Deploy:** Railway (single service — Express serves the built frontend)

## Screenshots

_(add screenshots here once you've deployed and grabbed some)_

## Run it locally

You'll need Node 18+ and npm.

```bash
git clone https://github.com/SayantanXBTC/tiki-topple.git
cd tiki-topple
npm install
npm run install:all    # installs backend + frontend deps
npm run dev            # starts backend (:3001) + frontend (:5173) with hot reload
```

Then open http://localhost:5173.

If you want to test multiplayer locally, open a second browser window (or an incognito tab) and join with the same room code.

## Environment variables

Copy the example files and fill in whatever's needed. Local dev mostly works out of the box.

**`backend/.env`**
```
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

**`frontend/.env`** — only needed if you split-deploy backend and frontend to different hosts.
```
VITE_SOCKET_URL=https://your-backend.example.com
```

Firebase config is checked in as public web config (it's meant to be public — access is locked down by Firestore rules and the Auth domain allowlist).

## Deploy to Railway (single service, easiest option)

I chose Railway because it's dead simple and Express can serve the built frontend from `backend/public/` so I only pay for one service.

1. Push to GitHub (see the section below if you haven't yet).
2. Go to [railway.app](https://railway.app), click **New Project → Deploy from GitHub repo**, pick this repo.
3. Under **Settings → Build**:
   - Root directory: `/` (leave blank if the repo root IS the project)
   - Build command: `npm run install:all && npm run build`
   - Start command: `npm start`
4. Under **Settings → Variables**, add:
   - `NODE_ENV` = `production`
   - `CORS_ORIGIN` = `https://your-railway-app.up.railway.app` (fill in after you get the URL)
5. Under **Settings → Networking**, click **Generate Domain**. That gives you the public URL — put it back into `CORS_ORIGIN` and redeploy.
6. In the Firebase console → Authentication → Settings → Authorized domains, add your Railway domain, otherwise Google sign-in will fail.

### Firestore setup

1. Enable Firestore in the [Firebase console](https://console.firebase.google.com) (native mode).
2. Deploy the security rules:
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules
   ```
   The rules in `firestore.rules` restrict reads/writes to the signed-in owner and validate schema.

### Alternative: split deploy (Vercel + Railway)

If you'd rather host the frontend separately (Vercel/Netlify) and only the backend on Railway:

- **Frontend (Vercel):** import repo, set root to `frontend/`, build command `npm run build`, output dir `dist`, add env var `VITE_SOCKET_URL=https://your-backend.up.railway.app`.
- **Backend (Railway):** same as above but skip the frontend build. Set `CORS_ORIGIN` to your Vercel URL.

## Pushing to GitHub

If you cloned this and want to fork it / push your own version:

```bash
git remote set-url origin https://github.com/YOUR_USERNAME/tiki-topple.git
git add .
git commit -m "your message"
git push -u origin main
```

## Project structure

```
tiki-topple/
├── backend/
│   ├── server.js          # Express + Socket.io, room/state management
│   ├── gameEngine.js      # Pure game logic — createGame, playCard, endRound
│   ├── botEngine.js       # Bot decision logic
│   └── public/            # Vite build output (generated, gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Screen routing
│   │   ├── components/    # UI screens + game components
│   │   ├── hooks/         # useSocket, useSoundEngine
│   │   ├── store/         # Zustand game state
│   │   ├── context/       # Socket + Auth providers
│   │   └── firebase.js    # Firebase config (public)
│   └── vite.config.js
├── firestore.rules        # Firestore security rules
└── package.json           # Monorepo scripts (dev, build, start)
```

## Things I'd do differently next time

- Split the frontend into more chunks — main bundle is 2MB, not great for first load.
- Move bot AI into a separate worker so it doesn't share the game loop thread.
- Write actual tests. There are none. I know. I know.
- Firebase Admin token verification on the socket layer — right now sockets trust the client-sent user ID, which is fine for a small game but not ideal for anything with rankings/leaderboards.

## Credits

Game design inspired by the physical Tiki Topple board game. Everything else — code, art direction, sound design — was me learning as I went.

Built with a lot of coffee and probably too many hours in the browser dev tools.

## License

MIT — do whatever you want, just don't sue me.
