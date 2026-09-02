'use strict';

const { v4: uuidv4 } = require('uuid');

// ═══════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * The 9 tiki pieces, grouped into 3 symbol sets of 3.
 * Symbol is used to ensure groups stay contiguous at round start.
 * @type {Array<{id:string, name:string, color:string, symbol:string}>}
 */
const TIKIS = [
  { id: 'hookipa', name: 'Hookipa', color: '#8a8a8a', symbol: 'starfish'  },
  { id: 'lani',    name: 'Lani',    color: '#7b2fbe', symbol: 'starfish'  },
  { id: 'kai',     name: 'Kai',     color: '#c0392b', symbol: 'starfish'  },
  { id: 'malu',    name: 'Malu',    color: '#e91e8c', symbol: 'shells'    },
  { id: 'nalu',    name: 'Nalu',    color: '#f39c12', symbol: 'shells'    },
  { id: 'pele',    name: 'Pele',    color: '#e67e22', symbol: 'shells'    },
  { id: 'honu',    name: 'Honu',    color: '#27ae60', symbol: 'fishbones' },
  { id: 'mana',    name: 'Mana',    color: '#2980b9', symbol: 'fishbones' },
  { id: 'koa',     name: 'Koa',     color: '#795548', symbol: 'fishbones' },
];

/** Static id→tiki lookup for server use (e.g. building network payloads). */
const TIKI_MAP = Object.fromEntries(TIKIS.map(t => [t.id, t]));

/** Card type string constants. */
const CARD = {
  UP_1:   'up1',
  UP_2:   'up2',
  UP_3:   'up3',
  TOPPLE: 'topple',
  TOAST:  'toast',
};

/**
 * Metadata for each card type.
 * `value` is the N in "Tiki Up N"; 0 for non-movement cards.
 */
const CARD_META = {
  up1:    { label: 'Tiki Up 1',   value: 1 },
  up2:    { label: 'Tiki Up 2',   value: 2 },
  up3:    { label: 'Tiki Up 3',   value: 3 },
  topple: { label: 'Tiki Topple', value: 0 },
  toast:  { label: 'Tiki Toast',  value: 0 },
};

/**
 * Starting hand template per player count.
 * 2 players get Up 1 (harder to score); 3–4 players skip it.
 */
const HAND_TEMPLATES = {
  2: ['up1', 'up2', 'up3', 'topple', 'topple', 'toast', 'toast'],
  3: ['up2', 'up3', 'topple', 'topple', 'toast', 'toast'],
  4: ['up2', 'up3', 'topple', 'topple', 'toast', 'toast'],
};

/** Total rounds by player count. */
const TOTAL_ROUNDS = { 2: 4, 3: 3, 4: 4 };

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Fisher-Yates in-place shuffle on a copy of the input array.
 * Returns a new array. O(n).
 * @template T
 * @param {T[]} arr
 * @returns {T[]}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRIVATE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Rebuild 1-indexed `.position` fields on every node in the board array.
 * Must be called after any splice that changes element indices. O(n), n ≤ 9.
 * @param {TikiNode[]} board
 */
function _rebuildPositions(board) {
  for (let i = 0; i < board.length; i++) {
    board[i].position = i + 1;
  }
}

/**
 * Linear scan to find the first card of a given type in a hand Set.
 * O(k), k ≤ 7 (max hand size).
 * @param {Set<Card>} hand
 * @param {string}    cardType
 * @returns {Card|null}
 */
function _findCardByType(hand, cardType) {
  for (const card of hand) {
    if (card.type === cardType) return card;
  }
  return null;
}

/**
 * Advance the circular turn queue to the next player who has cards.
 * Skips players with empty hands. Sets phase to 'round_end' if no eligible
 * player exists (all hands empty or board condition met).
 * O(p), p ≤ 4.
 * @param {GameState} gameState  Mutated in place.
 */
function _advanceTurn(gameState) {
  // Check end condition AFTER the just-played card has been removed.
  if (isRoundOver(gameState)) {
    gameState.phase = 'round_end';
    return;
  }

  const { turnQueue, playerHands } = gameState;
  const n = turnQueue.length;

  for (let i = 0; i < n; i++) {
    gameState.currentTurnIndex = (gameState.currentTurnIndex + 1) % n;
    const nextId = turnQueue[gameState.currentTurnIndex];
    if (playerHands.get(nextId).size > 0) return;
  }

  // All hands empty — safety net (isRoundOver above should have caught this).
  gameState.phase = 'round_end';
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOARD DATA STRUCTURES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} TikiNode
 * @property {string}       id        — Tiki identifier
 * @property {string}       name      — Display name
 * @property {string}       color     — Hex color
 * @property {string}       symbol    — 'starfish' | 'shells' | 'fishbones'
 * @property {boolean}      active    — false when toasted
 * @property {number|null}  position  — 1-indexed board position; null when toasted
 */

/**
 * Build a fresh board for the start of a round.
 *
 * Algorithm:
 *   1. Split 9 tikis into 3 symbol groups of 3.
 *   2. Fisher-Yates shuffle within each group  — O(3) each.
 *   3. Fisher-Yates shuffle the 3 groups        — O(3).
 *   4. Flatten to a single array of 9           — O(9).
 *   5. Assign 1-indexed positions.
 *   6. Build Map<tikId, TikiNode> for O(1) lookup.
 *
 * Total: O(n), n = 9.
 *
 * @returns {{ board: TikiNode[], tikMap: Map<string, TikiNode> }}
 */
function setupBoard() {
  const symbols = ['starfish', 'shells', 'fishbones'];

  const groups = symbols.map(sym =>
    shuffle(TIKIS.filter(t => t.symbol === sym))
  );

  const ordered = shuffle(groups).flat();

  /** @type {TikiNode[]} */
  const board = ordered.map((tiki, i) => ({
    id:       tiki.id,
    name:     tiki.name,
    color:    tiki.color,
    symbol:   tiki.symbol,
    active:   true,
    position: i + 1,
  }));

  // Both board[] and tikMap share the same TikiNode object references.
  // Mutating node.position in _rebuildPositions updates both views.
  const tikMap = new Map(board.map(node => [node.id, node]));

  return { board, tikMap };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOARD ALGORITHMS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Move a tiki exactly `n` positions toward position 1 (the top).
 *
 * Validation — O(1):
 *   position - n ≥ 1  (tiki must have room to move exactly n steps up)
 *
 * Execution — O(n), n ≤ 9:
 *   splice(oldIdx, 1)        — remove tiki from current slot
 *   splice(newIdx, 0, node)  — insert at target slot
 *   _rebuildPositions        — update all .position fields
 *
 * Correctness trace (position 5, n=3):
 *   oldIdx = 4, newIdx = 1
 *   Before: [A, B, C, D, ★, E, F, G, H]  (★ = tiki being moved)
 *   After splice out: [A, B, C, D, E, F, G, H]
 *   After splice in:  [A, ★, B, C, D, E, F, G, H]
 *   Positions: A=1, ★=2, B=3, C=4, D=5, E=6, F=7, G=8, H=9  ✓
 *
 * @param {TikiNode[]}            board
 * @param {Map<string,TikiNode>}  tikMap
 * @param {string}                tikId
 * @param {number}                n     — 1 | 2 | 3
 * @returns {{ error: string|null }}
 */
function tikiUp(board, tikMap, tikId, n) {
  const node = tikMap.get(tikId);
  if (!node || !node.active) {
    return { error: `Tiki "${tikId}" is not active on the board.` };
  }

  if (node.position - n < 1) {
    return {
      error: `Cannot move up — tiki "${tikId}" is at position ${node.position} ` +
             `and cannot move exactly ${n} step(s) toward the top without ` +
             `going past position 1.`,
    };
  }

  const oldIdx = node.position - 1;   // convert 1-indexed → 0-indexed
  const newIdx = oldIdx - n;

  board.splice(oldIdx, 1);            // O(n) — shift elements left
  board.splice(newIdx, 0, node);      // O(n) — shift elements right
  _rebuildPositions(board);           // O(n) — sync .position on every node

  return { error: null };
}

/**
 * Move a tiki to the last position among active tikis (the bottom).
 *
 * Validation — O(1):
 *   tiki must not already occupy the last position.
 *
 * Execution — O(n), n ≤ 9:
 *   splice(oldIdx, 1)  — remove tiki from current slot
 *   push(node)         — append to end (O(1))
 *   _rebuildPositions  — update all .position fields
 *
 * Correctness trace (position 2, board size 9):
 *   Before: [A, ★, B, C, D, E, F, G, H]
 *   After splice out: [A, B, C, D, E, F, G, H]
 *   After push: [A, B, C, D, E, F, G, H, ★]
 *   Positions: A=1, B=2, …, H=8, ★=9  ✓
 *
 * @param {TikiNode[]}            board
 * @param {Map<string,TikiNode>}  tikMap
 * @param {string}                tikId
 * @returns {{ error: string|null }}
 */
function tikiTopple(board, tikMap, tikId) {
  const node = tikMap.get(tikId);
  if (!node || !node.active) {
    return { error: `Tiki "${tikId}" is not active on the board.` };
  }

  if (node.position === board.length) {
    return { error: `Tiki "${tikId}" is already at the bottom and cannot be toppled.` };
  }

  const oldIdx = node.position - 1;

  board.splice(oldIdx, 1);            // O(n)
  board.push(node);                   // O(1) — amortised
  _rebuildPositions(board);           // O(n)

  return { error: null };
}

/**
 * Remove the bottom-most tiki from active play (toast it).
 *
 * Validation — O(1):
 *   Cannot be the very first card played this round.
 *   Cannot toast when ≤ 3 tikis remain (round would be over anyway, but
 *   the explicit check provides a clear error message).
 *
 * Execution — O(1):
 *   pop() removes the last element.
 *   _rebuildPositions NOT needed: only the last slot was removed,
 *   so positions 1…(n-1) are already correct.
 *
 * Correctness trace (board size 9, bottom = ★):
 *   Before: [A, B, C, D, E, F, G, H, ★]
 *   After pop: [A, B, C, D, E, F, G, H]  — positions 1-8 unchanged  ✓
 *   ★.active = false, ★.position = null  ✓
 *
 * @param {TikiNode[]} board
 * @param {boolean}    isFirstCardOfRound
 * @returns {{ error: string|null, toastedId: string|null }}
 */
function tikiToast(board, isFirstCardOfRound) {
  if (isFirstCardOfRound) {
    return {
      error:     'Tiki Toast cannot be played as the very first card of the round.',
      toastedId: null,
    };
  }
  if (board.length <= 3) {
    return {
      error:     'Cannot toast — only 3 or fewer tikis remain.',
      toastedId: null,
    };
  }

  const node = board[board.length - 1];
  board.pop();                        // O(1)

  node.active   = false;
  node.position = null;
  // No _rebuildPositions needed — positions 1…(n-1) are unchanged.

  return { error: null, toastedId: node.id };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HAND MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} Card
 * @property {string} id     — UUID, unique per card instance
 * @property {string} type   — 'up1' | 'up2' | 'up3' | 'topple' | 'toast'
 * @property {string} label  — Human-readable name
 * @property {number} value  — N for Tiki Up N; 0 otherwise
 */

/**
 * Deal a fresh action-card hand (as a Set) to every player.
 * Cards are removed from the Set on play, giving O(1) deletion.
 *
 * O(p × k) — p = player count (≤4), k = hand size (≤7).
 *
 * @param {string[]} playerIds
 * @returns {Map<string, Set<Card>>}
 */
function dealHands(playerIds) {
  const template = HAND_TEMPLATES[playerIds.length];
  const hands    = new Map();

  playerIds.forEach(pid => {
    const hand = new Set(
      template.map(type => ({
        id:    uuidv4(),
        type,
        label: CARD_META[type].label,
        value: CARD_META[type].value,
      }))
    );
    hands.set(pid, hand);
  });

  return hands;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECRET CARDS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} SecretCard
 * @property {string} top    — tikId of the tiki scoring +9 if at position 1
 * @property {string} middle — tikId of the tiki scoring +5 if at position ≤ 2
 * @property {string} bottom — tikId of the tiki scoring +2 if at position ≤ 3
 */

/**
 * Deal secret tiki cards to all players using Fisher-Yates.
 * Each player's card is dealt independently — the same tikId CAN appear on
 * multiple players' cards (intentional game design).
 * Secret cards are stored server-side ONLY; never sent in getPlayerView
 * except for the requesting player's own card.
 *
 * O(p × n) — p = player count, n = 9 tikis.
 *
 * @param {string[]} playerIds
 * @returns {Map<string, SecretCard>}
 */
function dealSecretCards(playerIds) {
  const allTikiIds  = TIKIS.map(t => t.id);
  const secretCards = new Map();

  playerIds.forEach(pid => {
    const [top, middle, bottom] = shuffle(allTikiIds);
    secretCards.set(pid, { top, middle, bottom });
  });

  return secretCards;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCORING
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Calculate each player's score for the completed round.
 *
 * Scoring rules:
 *   top    tiki at position 1           → +9 pts
 *   middle tiki at position 1 or 2      → +5 pts
 *   bottom tiki at position 1, 2, or 3  → +2 pts
 *   Toasted tikis are absent from board → positionMap has no entry → 0 pts.
 *
 * Algorithm:
 *   1. Build positionMap: Map<tikId, position> from active board. O(n).
 *   2. For each player look up their three secret tikis. O(1) each.
 *   3. Apply scoring thresholds. O(1) each.
 *
 * O(n + p) — n = board size (≤9), p = player count (≤4).
 *
 * @param {TikiNode[]}                       board
 * @param {Map<string, SecretCard>}          secretCards
 * @param {string[]}                         playerIds
 * @returns {Map<string, number>}            roundScores — Map<playerId, pts>
 */
function calculateRoundScores(board, secretCards, playerIds) {
  // Step 1: position lookup — O(n)
  const positionMap = new Map(board.map(node => [node.id, node.position]));

  const roundScores = new Map();

  // Step 2-3: score each player — O(p)
  playerIds.forEach(pid => {
    const { top, middle, bottom } = secretCards.get(pid);
    let pts = 0;

    const topPos    = positionMap.get(top);
    const middlePos = positionMap.get(middle);
    const bottomPos = positionMap.get(bottom);

    if (topPos === 1)                              pts += 9;
    if (middlePos !== undefined && middlePos <= 2) pts += 5;
    if (bottomPos !== undefined && bottomPos <= 3) pts += 2;

    roundScores.set(pid, pts);
  });

  return roundScores;
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROUND STATE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Returns true if the current round should end.
 *
 * Condition A: ≤ 3 active tikis remain on the board.
 * Condition B: Every player's hand Set is empty.
 *
 * Both conditions are checked — whichever fires first ends the round.
 * O(p) — p = player count.
 *
 * @param {GameState} gameState
 * @returns {boolean}
 */
function isRoundOver(gameState) {
  // Condition A — O(1): board only holds active tikis
  if (gameState.board.length <= 3) return true;

  // Condition B — O(p): scan all hand Sets
  for (const hand of gameState.playerHands.values()) {
    if (hand.size > 0) return false;
  }
  return true;
}

/**
 * Returns true when the game is over (final round has been scored).
 * O(1).
 *
 * @param {GameState} gameState
 * @returns {boolean}
 */
function isGameOver(gameState) {
  return gameState.phase === 'game_over';
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYER VIEW  — privacy boundary
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a privacy-safe snapshot of game state for one specific player.
 *
 * CRITICAL INVARIANTS:
 *   ✓  mySecretCard  — only this player's own card is included.
 *   ✓  myHand        — only this player's unplayed cards.
 *   ✗  Other players' secret cards are NEVER included.
 *   ✗  Other players' hand contents are NEVER included (cardsRemaining count only).
 *
 * O(n + p) — n = board size, p = player count.
 *
 * @param {GameState} gameState
 * @param {string}    playerId
 * @returns {PlayerView|null}  null if playerId not in game
 */
function getPlayerView(gameState, playerId) {
  const {
    board, tikMap, toastedTikis,
    playerHands, secretCards, scores,
    players, turnQueue, currentTurnIndex,
    roundNumber, totalRounds,
    isFirstCardOfRound, phase,
    connectedPlayers,
  } = gameState;

  const hand = playerHands.get(playerId);
  if (!hand) return null;

  const currentTurnPlayerId = turnQueue[currentTurnIndex];

  return {
    // Active board — position-ordered, no tikMap internals exposed
    board: board.map(node => ({
      id:       node.id,
      name:     node.name,
      color:    node.color,
      position: node.position,
    })),

    // Toasted tikis (for UI display of removed pieces)
    toastedTikis: toastedTikis.map(id => {
      const t = tikMap.get(id);
      return { id: t.id, name: t.name, color: t.color };
    }),

    // ← ONLY this player's secret card
    mySecretCard: secretCards.get(playerId),

    // ← ONLY this player's unplayed cards
    myHand: [...hand].map(card => ({
      id:    card.id,
      type:  card.type,
      label: card.label,
      value: card.value,
    })),

    // Public player roster — no secret cards or hand contents
    players: players.map(p => ({
      id:             p.id,
      name:           p.name,
      color:          p.color,
      score:          scores.get(p.id),
      cardsRemaining: playerHands.get(p.id).size,   // count only, not contents
      isCurrentTurn:  p.id === currentTurnPlayerId,
      isConnected:    connectedPlayers.has(p.id),
    })),

    currentTurnPlayerId,
    roundNumber,
    totalRounds,
    isMyTurn:           currentTurnPlayerId === playerId,
    isFirstCardOfRound,
    phase,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GAME LIFECYCLE
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * @typedef {Object} GameState
 * @property {Array<{id,name,color}>}    players
 * @property {string[]}                  playerIds
 * @property {TikiNode[]}                board            — active tikis only, ordered
 * @property {Map<string,TikiNode>}      tikMap           — ALL tikis (active + toasted)
 * @property {string[]}                  toastedTikis     — tikIds removed this round
 * @property {Map<string,Set<Card>>}     playerHands
 * @property {Map<string,SecretCard>}    secretCards      — server-only
 * @property {Map<string,number>}        scores           — cumulative totals
 * @property {Array<Map<string,number>>} roundScoreHistory — one Map per completed round
 * @property {Set<string>}               connectedPlayers
 * @property {string[]}                  turnQueue        — circular queue of playerIds
 * @property {number}                    currentTurnIndex — pointer into turnQueue
 * @property {number}                    firstPlayerIndex — for round-start rotation
 * @property {number}                    roundNumber
 * @property {number}                    totalRounds
 * @property {boolean}                   isFirstCardOfRound
 * @property {string}                    phase  — 'playing'|'round_end'|'game_over'
 */

/**
 * Initialise a complete game. Returns a fresh GameState — no mutation.
 * O(n + p).
 *
 * @param {Array<{id:string, name:string, color:string}>} players  2–4 players
 * @returns {GameState}
 */
function createGame(players) {
  if (players.length < 2 || players.length > 4) {
    throw new Error('Tiki Topple requires 2–4 players.');
  }

  const playerIds        = players.map(p => p.id);
  const firstPlayerIndex = Math.floor(Math.random() * players.length);
  const { board, tikMap } = setupBoard();

  return {
    players,
    playerIds,
    board,
    tikMap,
    toastedTikis:       [],
    playerHands:        dealHands(playerIds),
    secretCards:        dealSecretCards(playerIds),
    scores:             new Map(playerIds.map(id => [id, 0])),
    roundScoreHistory:  [],
    connectedPlayers:   new Set(playerIds),
    turnQueue:          [...playerIds],
    currentTurnIndex:   firstPlayerIndex,
    firstPlayerIndex,
    roundNumber:        1,
    totalRounds:        TOTAL_ROUNDS[players.length],
    isFirstCardOfRound: true,
    phase:              'playing',
  };
}

/**
 * Validate and apply one card play. Mutates gameState in place.
 *
 * Flow:
 *   1. Guard: phase must be 'playing' and round must not already be over.
 *   2. Guard: must be this player's turn.
 *   3. Find card by type in hand Set — O(k), k ≤ 7.
 *   4. Apply board algorithm (tikiUp / tikiTopple / tikiToast).
 *   5. Remove card from hand Set — O(1).
 *   6. Set isFirstCardOfRound = false.
 *   7. _advanceTurn — sets phase to 'round_end' if round is over.
 *
 * O(n) dominated by board splice operations.
 *
 * @param {GameState}   gameState
 * @param {string}      playerId
 * @param {string}      cardType
 * @param {string|null} targetTikiId   Required for up* and topple; ignored for toast.
 * @returns {{ error: string|null, action?: object }}
 *   action shape (on success):
 *     { playerId, cardType, targetTikiId, targetName?, fromPosition?, toPosition?, toastedId?, toastedName? }
 */
function playCard(gameState, playerId, cardType, targetTikiId) {
  if (gameState.phase !== 'playing') {
    return { error: 'Game is not in playing phase.' };
  }
  if (isRoundOver(gameState)) {
    return { error: 'The round is already over.' };
  }

  const currentPlayerId = gameState.turnQueue[gameState.currentTurnIndex];
  if (playerId !== currentPlayerId) {
    return { error: 'It is not your turn.' };
  }

  const hand = gameState.playerHands.get(playerId);
  if (!hand) return { error: 'Player not found.' };

  // Find the first card of requested type — O(k)
  const card = _findCardByType(hand, cardType);
  if (!card) {
    return { error: `You have no "${cardType}" card in your hand.` };
  }

  // Snapshot the target tiki's position before the effect so we can describe
  // the move to clients (e.g. "moved from slot 3 to slot 5").
  const targetBefore = targetTikiId
    ? gameState.board.findIndex(t => t.id === targetTikiId)
    : -1;
  const targetName = targetTikiId
    ? (gameState.tikMap.get(targetTikiId)?.name || targetTikiId)
    : null;

  // Apply board effect
  let result;
  if (cardType === CARD.TOAST) {
    result = tikiToast(gameState.board, gameState.isFirstCardOfRound);
    if (result.error) return { error: result.error };
    gameState.toastedTikis.push(result.toastedId);

  } else if (cardType === CARD.TOPPLE) {
    if (!targetTikiId) return { error: 'targetTikiId is required for Tiki Topple.' };
    result = tikiTopple(gameState.board, gameState.tikMap, targetTikiId);
    if (result.error) return { error: result.error };

  } else if (cardType === CARD.UP_1 || cardType === CARD.UP_2 || cardType === CARD.UP_3) {
    if (!targetTikiId) return { error: `targetTikiId is required for ${cardType}.` };
    const n = CARD_META[cardType].value;
    result = tikiUp(gameState.board, gameState.tikMap, targetTikiId, n);
    if (result.error) return { error: result.error };

  } else {
    return { error: `Unknown card type: "${cardType}".` };
  }

  // Remove card from hand — O(1) Set deletion
  hand.delete(card);
  gameState.isFirstCardOfRound = false;

  // Build action descriptor so the socket layer can narrate the move
  const action = { playerId, cardType, targetTikiId, targetName };
  if (targetTikiId && targetBefore !== -1) {
    action.fromPosition = targetBefore + 1;
    action.toPosition   = gameState.board.findIndex(t => t.id === targetTikiId) + 1;
  }
  if (cardType === CARD.TOAST && result?.toastedId) {
    action.toastedId   = result.toastedId;
    action.toastedName = gameState.tikMap.get(result.toastedId)?.name || result.toastedId;
  }

  // Advance turn (or transition to round_end) — O(p)
  _advanceTurn(gameState);

  return { error: null, action };
}

/**
 * Score the completed round, update cumulative scores, and transition phase.
 * Mutates gameState in place. Returns the round scores for broadcasting.
 * O(n + p).
 *
 * @param {GameState} gameState  Expected phase: 'round_end'
 * @returns {Map<string, number>}  roundScores — Map<playerId, pts>
 */
function endRound(gameState) {
  const roundScores = calculateRoundScores(
    gameState.board,
    gameState.secretCards,
    gameState.playerIds
  );

  // Accumulate into cumulative score Map — O(p)
  roundScores.forEach((pts, pid) => {
    gameState.scores.set(pid, gameState.scores.get(pid) + pts);
  });

  gameState.roundScoreHistory.push(roundScores);

  const isLast = gameState.roundNumber >= gameState.totalRounds;
  gameState.phase = isLast ? 'game_over' : 'round_end';

  return roundScores;
}

/**
 * Advance to the next round. No-op if the game is already over.
 * Mutates gameState in place.
 * O(n + p).
 *
 * Changes per round:
 *   — Starting player shifts one seat clockwise (firstPlayerIndex + 1).
 *   — Fresh board (new grouped random arrangement).
 *   — Fresh hand Sets dealt to every player.
 *   — Fresh secret cards dealt to every player.
 *
 * @param {GameState} gameState
 */
function startNextRound(gameState) {
  if (isGameOver(gameState)) return;

  const { playerIds } = gameState;
  const nextFirst     = (gameState.firstPlayerIndex + 1) % playerIds.length;

  const { board, tikMap } = setupBoard();

  gameState.board               = board;
  gameState.tikMap              = tikMap;
  gameState.toastedTikis        = [];
  gameState.playerHands         = dealHands(playerIds);
  gameState.secretCards         = dealSecretCards(playerIds);
  gameState.firstPlayerIndex    = nextFirst;
  gameState.currentTurnIndex    = nextFirst;
  gameState.roundNumber        += 1;
  gameState.isFirstCardOfRound  = true;
  gameState.phase               = 'playing';
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Game lifecycle
  createGame,
  playCard,
  endRound,
  isRoundOver,
  isGameOver,
  startNextRound,

  // Privacy-safe view
  getPlayerView,

  // Board algorithms (exported for unit testing)
  setupBoard,
  tikiUp,
  tikiTopple,
  tikiToast,

  // Hand / card / secret management (exported for unit testing)
  dealHands,
  dealSecretCards,
  calculateRoundScores,

  // Constants
  TIKIS,
  TIKI_MAP,          // static Object for server.js network payloads
  CARD,
  CARD_META,
};
