'use strict';

require('dotenv').config();

const path           = require('path');
const { v4: uuidv4 } = require('uuid');
const express        = require('express');
const http           = require('http');
const { Server }     = require('socket.io');
const cors           = require('cors');
const helmet         = require('helmet');
const morgan         = require('morgan');
const rateLimit      = require('express-rate-limit');

const {
  createGame,
  getPlayerView,
  playCard,
  endRound,
  isGameOver,
  startNextRound,
  CARD,
} = require('./gameEngine');

const { chooseBotMove } = require('./botEngine');

// ── Config ────────────────────────────────────────────────────────────────────

const PORT         = process.env.PORT        || 3001;
const NODE_ENV     = process.env.NODE_ENV    || 'development';

// Fail-fast in production if CORS origin is not explicitly configured — do
// not silently allow localhost from a public server.
const CORS_ORIGIN_ENV = process.env.CORS_ORIGIN || process.env.CLIENT_ORIGIN || null;
if (NODE_ENV === 'production' && !CORS_ORIGIN_ENV) {
  // Single-service deploy: frontend served from same origin, allow same-origin only.
  console.warn('[server] NODE_ENV=production but CORS_ORIGIN not set — allowing same-origin only.');
}
const CORS_ORIGIN = CORS_ORIGIN_ENV
                    || (NODE_ENV === 'production' ? false : 'http://localhost:5173');

const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];

/** Valid card types — used for server-side validation */
const VALID_CARD_TYPES = new Set([CARD.UP_1, CARD.UP_2, CARD.UP_3, CARD.TOPPLE, CARD.TOAST]);

/** Valid avatar IDs */
const VALID_AVATAR_IDS = new Set(['surfer', 'chieftain', 'volcano', 'mermaid', 'shaman']);

// ── Express + Socket.io setup ─────────────────────────────────────────────────

const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: {
    origin:  CORS_ORIGIN,
    methods: ['GET', 'POST'],
  },
  // Reconnection-friendly settings
  pingTimeout:  60000,
  pingInterval: 25000,
});

// ── HTTPS enforcement ──────────────────────────────────────────────────────
// Behind a reverse proxy / PaaS (Railway, Fly, Render, Heroku) that terminates
// TLS. `trust proxy` lets Express read the `x-forwarded-proto` header so we
// can redirect insecure requests.
if (NODE_ENV === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    // Skip for local health checks + already-secure requests
    if (req.secure || req.header('x-forwarded-proto') === 'https') return next();
    // Only redirect GETs; other verbs should never hit us on plain HTTP
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return res.status(403).json({ error: 'HTTPS required for this operation.' });
    }
    return res.redirect(301, `https://${req.header('host')}${req.url}`);
  });
}

// Security middleware — set BEFORE any routes
app.use(helmet({
  // Allow inline styles for our inline-style-based UI + framer-motion
  contentSecurityPolicy: NODE_ENV === 'production' ? {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'", 'https://apis.google.com', 'https://www.gstatic.com'],
      styleSrc:   ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc:    ["'self'", 'https://fonts.gstatic.com', 'data:'],
      imgSrc:     ["'self'", 'data:', 'blob:', 'https:'],
      connectSrc: ["'self'", 'wss:', 'https:', 'https://*.firebaseio.com',
                   'https://*.googleapis.com', 'https://securetoken.googleapis.com'],
      frameSrc:   ["'self'", 'https://*.firebaseapp.com'],
    },
  } : false,  // Disable CSP in dev to avoid HMR / Vite proxy pain
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));

// Request logging — combined in prod, dev-friendly in development
app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));

// Body parser w/ hard cap so a rogue client can't DoS us with megabyte JSON
app.use(express.json({ limit: '32kb' }));

// HTTP-layer rate limit — protects room creation / health / static from
// brute-force. Socket-layer play_card limit is separate (see isRateLimited).
const httpLimiter = rateLimit({
  windowMs: 60_000,      // 1 minute
  max:      120,         // 120 requests / min / IP
  standardHeaders: true,
  legacyHeaders:   false,
  message: { error: 'Too many requests — try again shortly.' },
});
app.use('/health', httpLimiter);

// ── Production: serve frontend static files ───────────────────────────────────
if (NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'public');
  app.use(express.static(frontendPath));
  app.get('*', (req, res) => {
    // Only serve index.html for non-API routes
    if (!req.path.startsWith('/socket.io')) {
      res.sendFile(path.join(frontendPath, 'index.html'));
    }
  });
}

app.get('/health', (_req, res) => res.json({ status: 'ok', env: NODE_ENV }));

// ── Room storage ──────────────────────────────────────────────────────────────

/** @type {Map<string, RoomState>}  roomCode → RoomState */
const rooms          = new Map();
/** @type {Map<string, string>}     socketId → roomCode  — O(1) disconnect lookup */
const socketToRoom   = new Map();
/** @type {Map<string, string>}     socketId → playerId  — O(1) player lookup */
const socketToPlayer = new Map();

// ── Rate limiting ─────────────────────────────────────────────────────────────

/**
 * Token-bucket rate limiter for play_card events.
 * Allows up to 10 events per second per socket, then blocks.
 * @type {Map<string, { count: number, resetAt: number }>}
 */
const rateLimitMap = new Map();

function isRateLimited(socketId, max = 10) {
  const now = Date.now();
  let bucket = rateLimitMap.get(socketId);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + 1000 };
    rateLimitMap.set(socketId, bucket);
    return false;
  }
  bucket.count++;
  return bucket.count > max;
}

// Cheaper coarse limit for lobby ops so a burst of create_room/join_room
// can't spin up hundreds of rooms in a second.
const lobbyLimitMap = new Map();
function isLobbyRateLimited(socketId) {
  const now = Date.now();
  let bucket = lobbyLimitMap.get(socketId);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 1, resetAt: now + 5000 };
    lobbyLimitMap.set(socketId, bucket);
    return false;
  }
  bucket.count++;
  return bucket.count > 6;  // 6 lobby actions per 5s
}

// ── Input sanitization ────────────────────────────────────────────────────────

/**
 * Strip HTML tags and trim whitespace from a string input.
 * @param {string} input
 * @param {number} maxLen
 * @returns {string}
 */
function sanitizeString(input, maxLen = 20) {
  if (typeof input !== 'string') return '';
  // Hard pre-cut before running regex — prevents DoS on multi-MB inputs
  const bounded = input.length > 256 ? input.slice(0, 256) : input;
  return bounded
    .replace(/<[^>]*>/g, '')  // strip HTML tags
    .replace(/[<>&"']/g, '')  // strip remaining special chars
    .trim()
    .slice(0, maxLen);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  } while (rooms.has(code));
  return code;
}

function assignColor(room) {
  for (const color of PLAYER_COLORS) {
    if (!room.usedColors.has(color)) return color;
  }
  return PLAYER_COLORS[0];
}

function lobbyRoster(room) {
  return room.playerOrder.map(pid => {
    const p = room.players.get(pid);
    return {
      id:       pid,
      name:     p.name,
      color:    p.color,
      avatarId: p.avatarId,
      isHost:   pid === room.hostPlayerId,
    };
  });
}

/**
 * Send each CONNECTED player their private personalised view.
 * avatarId is included for all players in the roster.
 */
function broadcastPlayerViews(room) {
  for (const [playerId, player] of room.players) {
    if (player.connected && player.socketId) {
      const view = getPlayerView(room.gameState, playerId);
      if (view) {
        // Augment view with avatar IDs for all players
        view.players = view.players.map(p => ({
          ...p,
          avatarId: room.players.get(p.id)?.avatarId ?? null,
        }));
        io.to(player.socketId).emit('state_update', view);
      }
    }
  }
}

function buildRoundEndedPayload(gameState, roundScores, room) {
  // Security: allSecretCards ONLY sent here, never in state_update
  const allSecretCards = {};
  gameState.secretCards.forEach((sc, pid) => { allSecretCards[pid] = sc; });

  const totalScores = {};
  gameState.scores.forEach((score, pid) => { totalScores[pid] = score; });

  return {
    roundScores:    Object.fromEntries(roundScores),
    allSecretCards,
    board: gameState.board.map(node => ({
      id:       node.id,
      name:     node.name,
      color:    node.color,
      position: node.position,
    })),
    totalScores,
    players: gameState.players.map(p => ({
      id:         p.id,
      name:       p.name,
      color:      p.color,
      avatarId:   room.players.get(p.id)?.avatarId ?? null,
      score:      gameState.scores.get(p.id),
      roundScore: roundScores.get(p.id),
      roundScores: gameState.roundScoreHistory.map(rm => rm.get(p.id) ?? 0),
    })),
  };
}

function buildGameOverPayload(gameState, room) {
  const sorted = [...gameState.players].sort((a, b) =>
    gameState.scores.get(b.id) - gameState.scores.get(a.id)
  );
  const winner = sorted[0];

  return {
    finalScores: gameState.players.map(p => ({
      id:          p.id,
      name:        p.name,
      color:       p.color,
      avatarId:    room.players.get(p.id)?.avatarId ?? null,
      score:       gameState.scores.get(p.id),
      roundScores: gameState.roundScoreHistory.map(rm => rm.get(p.id) ?? 0),
    })),
    winner: {
      id:       winner.id,
      name:     winner.name,
      color:    winner.color,
      avatarId: room.players.get(winner.id)?.avatarId ?? null,
      score:    gameState.scores.get(winner.id),
    },
  };
}

// ── Bot helpers ───────────────────────────────────────────────────────────────

const BOT_NAMES   = ['Koa Bot', 'Pele Bot', 'Lani Bot'];
const BOT_AVATARS = ['volcano', 'mermaid', 'shaman'];

// Bot takes ~2.5-3.2 seconds per turn so the human can read the narration
// toast + watch the board animation before the next move fires.
// Bot spacing: 4.5–5.5 s per turn so the narration toast (4.5s) fully clears
// before the next bot fires. Prevents overlapping toasts in 3p/4p cascades.
const BOT_THINK_MS_MIN = 4500;
const BOT_THINK_MS_MAX = 5500;

function maybeScheduleBotTurn(room, code) {
  if (!room.vsComputer) return;
  if (!room.gameState || room.gameState.phase !== 'playing') return;
  if (room.paused) return;
  const currentId = room.gameState.turnQueue[room.gameState.currentTurnIndex];
  if (room.players.get(currentId)?.isBot) {
    const delay = BOT_THINK_MS_MIN + Math.random() * (BOT_THINK_MS_MAX - BOT_THINK_MS_MIN);
    setTimeout(() => runBotTurn(code), delay);
  }
}

function runBotTurn(code) {
  const room = rooms.get(code);
  if (!room || !room.vsComputer) return;
  if (!room.gameState || room.gameState.phase !== 'playing') return;
  if (room.paused) return;

  const gs        = room.gameState;
  const currentId = gs.turnQueue[gs.currentTurnIndex];
  if (!room.players.get(currentId)?.isBot) return;

  const move = chooseBotMove(gs, currentId);
  if (!move) {
    console.warn(`[bot] no valid move for ${currentId} — skipping`);
    return;
  }

  const { error, action } = playCard(gs, currentId, move.cardType, move.targetTikiId);
  if (error) { console.error('[bot] playCard error:', error); return; }

  // Emit card_played BEFORE the state update so the toast + animation align
  // with the resulting board change. Bots must narrate too.
  if (action) {
    const actor = room.players.get(action.playerId);
    io.to(code).emit('card_played', {
      ...action,
      actorId:    action.playerId,
      actorName:  actor?.name  || 'Bot',
      actorColor: actor?.color || '#888',
    });
  }

  if (gs.phase === 'round_end') {
    const roundScores = endRound(gs);
    broadcastPlayerViews(room);
    io.to(code).emit('round_ended', buildRoundEndedPayload(gs, roundScores, room));

    if (isGameOver(gs)) {
      io.to(code).emit('game_over', buildGameOverPayload(gs, room));
      setTimeout(() => {
        if (rooms.has(code)) { rooms.delete(code); }
      }, 10 * 60 * 1000);
    }
    // Human must click "Next Round" — no auto-advance
  } else {
    broadcastPlayerViews(room);
    maybeScheduleBotTurn(room, code);
  }
}

// ── Socket event handlers ─────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Clean up rate limit bucket on disconnect
  socket.on('disconnect', cleanupOnDisconnect);

  // ── create_room ─────────────────────────────────────────────────────────────
  socket.on('create_room', ({ playerName, avatarId } = {}) => {
    try {
      if (isLobbyRateLimited(socket.id)) {
        socket.emit('error', { message: 'Too many lobby actions — slow down.' });
        return;
      }
      const name = sanitizeString(playerName);
      if (!name) {
        socket.emit('error', { message: 'Player name is required.' });
        return;
      }

      const safeAvatarId = VALID_AVATAR_IDS.has(avatarId) ? avatarId : null;
      const code         = generateRoomCode();
      const playerId     = uuidv4();
      const color        = PLAYER_COLORS[0];

      const room = {
        code,
        hostPlayerId: playerId,
        players:      new Map([[playerId, {
          socketId:  socket.id,
          name,
          color,
          avatarId:  safeAvatarId,
          connected: true,
        }]]),
        playerOrder: [playerId],
        usedColors:  new Set([color]),
        gameState:   null,
        started:     false,
        paused:      false,
        createdAt:   new Date(),
      };

      rooms.set(code, room);
      socketToRoom.set(socket.id, code);
      socketToPlayer.set(socket.id, playerId);
      socket.join(code);

      socket.emit('room_created', { roomCode: code, playerId, playerName: name, color, avatarId: safeAvatarId, isHost: true });
      io.to(code).emit('lobby_update', { players: lobbyRoster(room) });
      console.log(`[room] created ${code} by "${name}"`);
    } catch (err) {
      console.error('[create_room] error:', err);
      socket.emit('error', { message: 'Server error creating room.' });
    }
  });

  // ── join_room ────────────────────────────────────────────────────────────────
  socket.on('join_room', ({ roomCode, playerName, avatarId } = {}) => {
    try {
      if (isLobbyRateLimited(socket.id)) {
        socket.emit('join_error', { message: 'Too many join attempts — slow down.' });
        return;
      }
      const name = sanitizeString(playerName);
      if (!name) {
        socket.emit('join_error', { message: 'Player name is required.' });
        return;
      }
      if (!roomCode || typeof roomCode !== 'string') {
        socket.emit('join_error', { message: 'Room code is required.' });
        return;
      }

      const code         = sanitizeString(roomCode, 4).toUpperCase();
      const safeAvatarId = VALID_AVATAR_IDS.has(avatarId) ? avatarId : null;
      const room         = rooms.get(code);

      if (!room)                  { socket.emit('join_error', { message: `Room "${code}" does not exist.` });      return; }
      if (room.started)           { socket.emit('join_error', { message: 'Game has already started.' });            return; }
      if (room.players.size >= 4) { socket.emit('join_error', { message: 'Room is full (max 4 players).' });       return; }

      const playerId = uuidv4();
      const color    = assignColor(room);

      room.players.set(playerId, { socketId: socket.id, name, color, avatarId: safeAvatarId, connected: true });
      room.playerOrder.push(playerId);
      room.usedColors.add(color);

      socketToRoom.set(socket.id, code);
      socketToPlayer.set(socket.id, playerId);
      socket.join(code);

      socket.emit('room_joined', { playerId, playerName: name, color, avatarId: safeAvatarId, isHost: false });
      io.to(code).emit('lobby_update', { players: lobbyRoster(room) });
      console.log(`[room] "${name}" joined ${code}`);
    } catch (err) {
      console.error('[join_room] error:', err);
      socket.emit('join_error', { message: 'Server error joining room.' });
    }
  });

  // ── start_game ───────────────────────────────────────────────────────────────
  socket.on('start_game', ({ roomCode } = {}) => {
    try {
      const room     = rooms.get(sanitizeString(roomCode, 4).toUpperCase());
      const playerId = socketToPlayer.get(socket.id);

      if (!room)                          { socket.emit('error', { message: 'Room not found.' });                        return; }
      if (playerId !== room.hostPlayerId) { socket.emit('error', { message: 'Only the host can start the game.' });      return; }
      if (room.started)                   { socket.emit('error', { message: 'Game has already started.' });               return; }
      if (room.players.size < 2)          { socket.emit('error', { message: 'Need at least 2 players to start.' });      return; }

      const playerList = room.playerOrder.map(pid => {
        const p = room.players.get(pid);
        return { id: pid, name: p.name, color: p.color, isBot: !!p.isBot };
      });

      room.gameState = createGame(playerList);
      room.started   = true;

      // Ensure a human always opens the game so the player sees the board
      // before any bot move. No-op in pure-human multiplayer.
      const humanIdx0 = playerList.findIndex(p => !p.isBot);
      if (humanIdx0 !== -1) {
        room.gameState.currentTurnIndex = humanIdx0;
        room.gameState.firstPlayerIndex = humanIdx0;
      }

      for (const [pid, player] of room.players) {
        if (player.connected) {
          const view = getPlayerView(room.gameState, pid);
          if (view) {
            view.players = view.players.map(p => ({
              ...p,
              avatarId: room.players.get(p.id)?.avatarId ?? null,
            }));
            io.to(player.socketId).emit('game_started', view);
          }
        }
      }

      console.log(`[game] started in ${roomCode} (${room.players.size} players)`);
    } catch (err) {
      console.error('[start_game] error:', err);
      socket.emit('error', { message: 'Server error starting game.' });
    }
  });

  // ── start_vs_computer ────────────────────────────────────────────────────────
  socket.on('start_vs_computer', ({ playerName, avatarId, playerCount } = {}) => {
    try {
      const name = sanitizeString(playerName);
      if (!name) { socket.emit('error', { message: 'Player name is required.' }); return; }

      const count        = Math.max(2, Math.min(4, parseInt(playerCount) || 2));
      const safeAvatarId = VALID_AVATAR_IDS.has(avatarId) ? avatarId : null;
      const code         = generateRoomCode();
      const humanId      = uuidv4();
      const humanColor   = PLAYER_COLORS[0];

      const room = {
        code,
        hostPlayerId: humanId,
        players:      new Map(),
        playerOrder:  [],
        usedColors:   new Set(),
        gameState:    null,
        started:      false,
        paused:       false,
        vsComputer:   true,
        createdAt:    new Date(),
      };

      room.players.set(humanId, { socketId: socket.id, name, color: humanColor, avatarId: safeAvatarId, connected: true, isBot: false });
      room.playerOrder.push(humanId);
      room.usedColors.add(humanColor);

      for (let i = 0; i < count - 1; i++) {
        const botId    = uuidv4();
        const botColor = assignColor(room);
        room.players.set(botId, { socketId: null, name: BOT_NAMES[i], color: botColor, avatarId: BOT_AVATARS[i], connected: true, isBot: true });
        room.playerOrder.push(botId);
        room.usedColors.add(botColor);
      }

      const playerList = room.playerOrder.map(pid => {
        const p = room.players.get(pid);
        return { id: pid, name: p.name, color: p.color, isBot: !!p.isBot };
      });

      room.gameState = createGame(playerList);
      room.started   = true;

      // Ensure the human plays first (bots never open the game so the player
      // always sees the initial board and can react before AI moves).
      const humanIdx = playerList.findIndex(p => !p.isBot);
      if (humanIdx !== -1) {
        room.gameState.currentTurnIndex = humanIdx;
        room.gameState.firstPlayerIndex = humanIdx;
      }

      rooms.set(code, room);
      socketToRoom.set(socket.id, code);
      socketToPlayer.set(socket.id, humanId);
      socket.join(code);

      const view = getPlayerView(room.gameState, humanId);
      view.players = view.players.map(p => ({
        ...p,
        avatarId: room.players.get(p.id)?.avatarId ?? null,
        isBot:    room.players.get(p.id)?.isBot    ?? false,
      }));

      socket.emit('vs_computer_ready', {
        roomCode:   code,
        playerId:   humanId,
        playerName: name,
        color:      humanColor,
        avatarId:   safeAvatarId,
        ...view,
      });

      console.log(`[vs_computer] "${name}" vs ${count - 1} bot(s) in ${code}`);
      maybeScheduleBotTurn(room, code);
    } catch (err) {
      console.error('[start_vs_computer] error:', err);
      socket.emit('error', { message: 'Server error starting game.' });
    }
  });

  // ── play_card ─────────────────────────────────────────────────────────────────
  socket.on('play_card', ({ roomCode, cardType, targetTikiId } = {}) => {
    try {
      // Rate limiting
      if (isRateLimited(socket.id)) {
        socket.emit('game_error', { message: 'Too many actions — slow down.' });
        return;
      }

      const code = typeof roomCode === 'string' ? roomCode.toUpperCase().trim() : '';
      const room = rooms.get(code);
      const playerId = socketToPlayer.get(socket.id);

      if (!room)         { socket.emit('game_error', { message: 'Room not found.' });             return; }
      if (!room.started) { socket.emit('game_error', { message: 'Game has not started yet.' });   return; }
      if (room.paused)   { socket.emit('game_error', { message: 'Game is paused — a player disconnected.' }); return; }

      // Validate cardType — only accept known card types
      if (!VALID_CARD_TYPES.has(cardType)) {
        socket.emit('game_error', { message: `Invalid card type: "${cardType}".` });
        return;
      }

      // Validate targetTikiId — must be a non-empty string when provided
      const safeTargetId = (typeof targetTikiId === 'string' && targetTikiId.length > 0)
        ? targetTikiId : null;

      // Validate targetTikiId is actually on the board when required
      if (cardType !== CARD.TOAST && safeTargetId) {
        const tikiOnBoard = room.gameState.board.find(t => t.id === safeTargetId && t.active);
        if (!tikiOnBoard) {
          socket.emit('game_error', { message: 'Target tiki is not active on the board.' });
          return;
        }
      }

      const { error, action } = playCard(
        room.gameState,
        playerId,
        cardType,
        safeTargetId
      );

      if (error) { socket.emit('game_error', { message: error }); return; }

      // Broadcast a narration event so all clients can announce the move
      // (e.g. "Alice raised Pele by 2 slots"). Includes actor name for UI.
      if (action) {
        const actor = room.players.get(action.playerId);
        io.to(code).emit('card_played', {
          ...action,
          actorId:   action.playerId,
          actorName: actor?.name || 'Unknown',
          actorColor: actor?.color || '#888',
        });
      }

      if (room.gameState.phase === 'round_end') {
        const roundScores = endRound(room.gameState);

        broadcastPlayerViews(room);

        io.to(code).emit('round_ended', buildRoundEndedPayload(room.gameState, roundScores, room));

        if (isGameOver(room.gameState)) {
          io.to(code).emit('game_over', buildGameOverPayload(room.gameState, room));

          // Room cleanup 10 minutes after game_over
          setTimeout(() => {
            if (rooms.has(code)) {
              rooms.delete(code);
              console.log(`[room] ${code} cleaned up after game over`);
            }
          }, 10 * 60 * 1000);
        }
      } else {
        broadcastPlayerViews(room);
        maybeScheduleBotTurn(room, code);
      }
    } catch (err) {
      console.error('[play_card] error:', err);
      socket.emit('game_error', { message: 'Server error processing card play.' });
    }
  });

  // ── request_state ──────────────────────────────────────────────────────────
  socket.on('request_state', ({ roomCode, playerId } = {}) => {
    try {
      const code = typeof roomCode === 'string' ? roomCode.toUpperCase().trim() : '';
      const room = rooms.get(code);
      if (!room) { socket.emit('error', { message: 'Room not found.' }); return; }

      const pid = typeof playerId === 'string' ? playerId : '';
      const player = room.players.get(pid);
      if (!player) { socket.emit('error', { message: 'Player not found in this room.' }); return; }

      if (player.socketId !== socket.id) {
        socketToRoom.delete(player.socketId);
        socketToPlayer.delete(player.socketId);
        player.socketId = socket.id;
        socket.join(code);
      }
      socketToRoom.set(socket.id, code);
      socketToPlayer.set(socket.id, pid);
      player.connected = true;

      if (!room.started) {
        socket.emit('lobby_update', { players: lobbyRoster(room) });
      } else {
        if (room.gameState) room.gameState.connectedPlayers.add(pid);

        const view = getPlayerView(room.gameState, pid);
        if (view) {
          view.players = view.players.map(p => ({
            ...p,
            avatarId: room.players.get(p.id)?.avatarId ?? null,
          }));
          socket.emit('state_update', view);
        }

        if (room.paused) {
          room.paused = false;
          io.to(code).emit('game_resumed', { playerName: player.name });
          maybeScheduleBotTurn(room, code);
        }
      }
    } catch (err) {
      console.error('[request_state] error:', err);
      socket.emit('error', { message: 'Server error fetching state.' });
    }
  });

  // ── next_round ────────────────────────────────────────────────────────────────
  socket.on('next_round', ({ roomCode } = {}) => {
    try {
      const code     = typeof roomCode === 'string' ? roomCode.toUpperCase().trim() : '';
      const room     = rooms.get(code);
      const playerId = socketToPlayer.get(socket.id);

      if (!room)                                { socket.emit('error', { message: 'Room not found.' });                    return; }
      if (playerId !== room.hostPlayerId)       { socket.emit('error', { message: 'Only the host can start the next round.' }); return; }
      if (!room.started)                        { socket.emit('error', { message: 'Game has not started.' });              return; }
      if (isGameOver(room.gameState))           { socket.emit('error', { message: 'The game is already over.' });          return; }
      if (room.gameState.phase !== 'round_end') { socket.emit('error', { message: 'Current round is not over yet.' });     return; }

      startNextRound(room.gameState);

      // Human always opens each round in vs-computer mode so the player sees
      // the reset board before bots take over.
      if (room.vsComputer) {
        const humanIdxR = room.gameState.playerIds.findIndex(
          pid => !room.players.get(pid)?.isBot
        );
        if (humanIdxR !== -1) {
          room.gameState.currentTurnIndex = humanIdxR;
          room.gameState.firstPlayerIndex = humanIdxR;
        }
      }

      for (const [pid, player] of room.players) {
        if (player.connected) {
          const view = getPlayerView(room.gameState, pid);
          if (view) {
            view.players = view.players.map(p => ({
              ...p,
              avatarId: room.players.get(p.id)?.avatarId ?? null,
            }));
            io.to(player.socketId).emit('round_started', view);
          }
        }
      }

      console.log(`[game] round ${room.gameState.roundNumber} started in ${code}`);
      maybeScheduleBotTurn(room, code);
    } catch (err) {
      console.error('[next_round] error:', err);
      socket.emit('error', { message: 'Server error starting next round.' });
    }
  });

  // ── disconnect ────────────────────────────────────────────────────────────────
  function cleanupOnDisconnect() {
    try {
      console.log(`[disconnect] ${socket.id}`);

      rateLimitMap.delete(socket.id);

      const roomCode = socketToRoom.get(socket.id);
      const playerId = socketToPlayer.get(socket.id);

      socketToRoom.delete(socket.id);
      socketToPlayer.delete(socket.id);

      if (!roomCode) return;
      const room = rooms.get(roomCode);
      if (!room) return;

      const player = room.players.get(playerId);
      if (!player) return;

      if (!room.started) {
        room.players.delete(playerId);
        room.playerOrder = room.playerOrder.filter(id => id !== playerId);
        room.usedColors.delete(player.color);

        if (room.players.size === 0) {
          rooms.delete(roomCode);
          console.log(`[room] ${roomCode} deleted (empty)`);
          return;
        }

        if (room.hostPlayerId === playerId) {
          room.hostPlayerId = room.playerOrder[0];
          io.to(roomCode).emit('host_changed', {
            newHostId:   room.hostPlayerId,
            newHostName: room.players.get(room.hostPlayerId).name,
          });
        }

        io.to(roomCode).emit('lobby_update', { players: lobbyRoster(room) });
        console.log(`[room] "${player.name}" left ${roomCode} (lobby)`);

      } else if (room.gameState && room.gameState.phase === 'game_over') {
        player.connected = false;
        console.log(`[room] "${player.name}" left ${roomCode} (game over)`);

      } else {
        player.connected = false;
        if (room.gameState) room.gameState.connectedPlayers.delete(playerId);

        room.paused = true;
        io.to(roomCode).emit('player_disconnected', { playerId, playerName: player.name });
        console.log(`[game] "${player.name}" disconnected from ${roomCode} — game paused`);

        const allGone = [...room.players.values()].every(p => p.isBot || !p.connected);
        if (allGone) {
          setTimeout(() => {
            const r = rooms.get(roomCode);
            if (r && [...r.players.values()].every(p => !p.connected)) {
              rooms.delete(roomCode);
              console.log(`[room] ${roomCode} cleaned up (all players disconnected)`);
            }
          }, 5 * 60 * 1000);
        }
      }
    } catch (err) {
      console.error('[disconnect] error:', err);
    }
  }

  socket.on('disconnect', cleanupOnDisconnect);
});

server.listen(PORT, () => {
  console.log(`Tiki Topple backend running on http://localhost:${PORT} [${NODE_ENV}]`);
});


