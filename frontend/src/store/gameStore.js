import { create } from 'zustand'

// ── Settings persistence helpers ──────────────────────────────────────────────

function loadSettings() {
  try {
    const raw = localStorage.getItem('tiki-settings')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

function saveSettings(settings) {
  try {
    localStorage.setItem('tiki-settings', JSON.stringify(settings))
  } catch {}
}

const DEFAULT_SETTINGS = {
  masterVolume:     0.7,
  musicEnabled:     true,
  effectsEnabled:   true,
  particlesEnabled: true,
}

const stored = loadSettings()
const INITIAL_SETTINGS = stored ? { ...DEFAULT_SETTINGS, ...stored } : DEFAULT_SETTINGS

// ─────────────────────────────────────────────────────────────────────────────

const useGameStore = create((set, get) => ({
  // ── Connection state ───────────────────────────────────────────────────────
  myPlayerId:       null,
  myRoomCode:       null,
  isHost:           false,
  myColor:          null,
  myName:           null,
  myAvatarId:       null,
  connectionStatus: 'disconnected',  // 'connected' | 'disconnected' | 'reconnecting' | 'failed'

  // ── Screen routing ─────────────────────────────────────────────────────────
  screen:    'home',
  setScreen: (screen) => set({ screen }),

  // ── Lobby state ────────────────────────────────────────────────────────────
  lobbyPlayers:    [],
  setLobbyPlayers: (players) => set({ lobbyPlayers: players }),

  // ── Game state (from server playerView) ───────────────────────────────────
  board:               [],
  mySecretCard:        null,
  myHand:              [],
  players:             [],
  currentTurnPlayerId: null,
  isMyTurn:            false,
  roundNumber:         1,
  totalRounds:         4,
  isFirstCardOfRound:  true,
  phase:               'playing',

  updateFromPlayerView: (view) => set({
    board:               view.board,
    mySecretCard:        view.mySecretCard,
    myHand:              view.myHand,
    players:             view.players,
    currentTurnPlayerId: view.currentTurnPlayerId,
    isMyTurn:            view.isMyTurn,
    roundNumber:         view.roundNumber,
    totalRounds:         view.totalRounds,
    isFirstCardOfRound:  view.isFirstCardOfRound,
    phase:               view.phase,
  }),

  // ── Card selection UI state ────────────────────────────────────────────────
  selectedCard:   null,
  selectCard:     (card) => set({ selectedCard: card }),
  clearSelection: () => set({ selectedCard: null }),

  // ── Round end data ─────────────────────────────────────────────────────────
  roundEndData:    null,
  setRoundEndData: (data) => set({ roundEndData: data }),

  // ── Game over data ─────────────────────────────────────────────────────────
  gameOverData:    null,
  setGameOverData: (data) => set({ gameOverData: data }),

  // ── Error messages ─────────────────────────────────────────────────────────
  errorMessage: null,
  setError:     (msg) => set({ errorMessage: msg }),
  clearError:   () => set({ errorMessage: null }),

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications:      [],
  addNotification:    (msg) => set(s => ({
    notifications: [...s.notifications, { id: Date.now(), msg }],
  })),
  removeNotification: (id) => set(s => ({
    notifications: s.notifications.filter(n => n.id !== id),
  })),

  // ── Settings ───────────────────────────────────────────────────────────────
  settings: INITIAL_SETTINGS,
  updateSettings: (patch) => set(s => {
    const next = { ...s.settings, ...patch }
    saveSettings(next)
    return { settings: next }
  }),

  // ── Reset for new game ─────────────────────────────────────────────────────
  resetGame: () => set({
    screen:              'home',
    myPlayerId:          null,
    myRoomCode:          null,
    isHost:              false,
    myColor:             null,
    myName:              null,
    myAvatarId:          null,
    board:               [],
    mySecretCard:        null,
    myHand:              [],
    players:             [],
    selectedCard:        null,
    roundEndData:        null,
    gameOverData:        null,
    errorMessage:        null,
    notifications:       [],
    lobbyPlayers:        [],
    phase:               'playing',
    roundNumber:         1,
    currentTurnPlayerId: null,
    isMyTurn:            false,
  }),
}))

export default useGameStore
