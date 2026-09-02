'use strict';

const { CARD, CARD_META } = require('./gameEngine');

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Choose a valid card play for a bot player.
 * Strategy: random valid move, with slight bias toward UP cards.
 * Returns { cardType, targetTikiId } or null if no valid move.
 */
function chooseBotMove(gameState, botId) {
  const hand    = gameState.playerHands.get(botId);
  const board   = gameState.board;
  const isFirst = gameState.isFirstCardOfRound;

  // Unique card types in hand, shuffled for randomness
  const types = shuffle([...new Set([...hand].map(c => c.type))]);

  for (const type of types) {
    if (type === CARD.TOAST) {
      if (!isFirst && board.length > 3) {
        return { cardType: CARD.TOAST, targetTikiId: null };
      }
    } else if (type === CARD.TOPPLE) {
      const valid = board.filter(t => t.position < board.length);
      if (valid.length > 0) {
        const target = valid[Math.floor(Math.random() * valid.length)];
        return { cardType: CARD.TOPPLE, targetTikiId: target.id };
      }
    } else {
      // UP_1, UP_2, UP_3
      const n     = CARD_META[type].value;
      const valid = board.filter(t => t.position - n >= 1);
      if (valid.length > 0) {
        const target = valid[Math.floor(Math.random() * valid.length)];
        return { cardType: type, targetTikiId: target.id };
      }
    }
  }

  return null;
}

module.exports = { chooseBotMove };
