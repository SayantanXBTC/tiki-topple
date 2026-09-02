// Profile stats — Firestore-backed w/ localStorage fallback.
//
// Storage strategy:
//   - Primary:   Firestore `profiles/{uid}` document — synced across devices,
//     persisted, survives cache clears.
//   - Fallback:  localStorage `tiki-profile-{uid}` — used when offline or if
//     Firestore write fails. Keeps the UI responsive even without a network.
//
// Firestore doc shape (matches DEFAULT below):
//   {
//     gamesPlayed: number,
//     wins:        number,
//     totalScore:  number,
//     highScore:   number,
//     recentGames: Array<{ date, myScore, place, isWin, totalPlayers, players }>,
//     updatedAt:   Firestore serverTimestamp (added on write)
//   }

import { db } from '../firebase'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

const DEFAULT = { gamesPlayed: 0, wins: 0, totalScore: 0, highScore: 0, recentGames: [] }

const lsKey     = uid => `tiki-profile-${uid}`
const profileRef = uid => doc(db, 'profiles', uid)

// ── Local-storage helpers ────────────────────────────────────────────────
function readLocal(uid) {
  if (!uid) return { ...DEFAULT }
  try {
    const raw = localStorage.getItem(lsKey(uid))
    if (raw) return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {}
  return { ...DEFAULT }
}

function writeLocal(uid, stats) {
  try { localStorage.setItem(lsKey(uid), JSON.stringify(stats)) } catch {}
}

// ── Public API — async, Firestore-first ─────────────────────────────────

/**
 * Load stats for the given uid. Firestore-first, falls back to local cache.
 * Returns a promise resolving to a stats object (never rejects — returns
 * DEFAULT on hard failure).
 */
export async function loadProfileStats(uid) {
  if (!uid) return { ...DEFAULT }

  // Kick a Firestore read; if it succeeds we hydrate + also write to local
  // so subsequent sync reads (loadProfileStatsSync) return the fresh data.
  try {
    const snap = await getDoc(profileRef(uid))
    if (snap.exists()) {
      const remote = { ...DEFAULT, ...snap.data() }
      // Firestore serverTimestamp comes back as a Timestamp object — strip it
      delete remote.updatedAt
      writeLocal(uid, remote)
      return remote
    }
    // No remote doc yet — fall through to local (may be a new user)
  } catch (err) {
    console.warn('[profileStats] Firestore read failed, using local cache:', err.code || err.message)
  }
  return readLocal(uid)
}

/**
 * Synchronous local-cache read. Use only for immediate render before the
 * async Firestore read resolves. Always safe to call.
 */
export function loadProfileStatsSync(uid) {
  return readLocal(uid)
}

/**
 * Record the result of a completed game. Updates both Firestore and local
 * cache. Returns the updated stats (from local write) so the UI can update
 * immediately even before the Firestore write completes.
 */
export async function saveGameResult(uid, { myPlayerId, finalScores }) {
  if (!uid || !finalScores?.length) return null
  const sorted = [...finalScores].sort((a, b) => b.score - a.score)
  const me = sorted.find(p => p.id === myPlayerId)
  if (!me) return null

  const place = sorted.findIndex(p => p.id === myPlayerId) + 1

  // Read latest from Firestore so we don't overwrite writes from another device
  let stats
  try {
    const snap = await getDoc(profileRef(uid))
    stats = snap.exists() ? { ...DEFAULT, ...snap.data() } : readLocal(uid)
    delete stats.updatedAt
  } catch {
    stats = readLocal(uid)
  }

  stats.gamesPlayed++
  if (place === 1) stats.wins++
  stats.totalScore += me.score
  if (me.score > stats.highScore) stats.highScore = me.score
  stats.recentGames = [
    {
      date: new Date().toISOString().slice(0, 10),
      myScore: me.score,
      place,
      isWin: place === 1,
      totalPlayers: sorted.length,
      players: sorted.map(p => ({ name: p.name, score: p.score, color: p.color })),
    },
    ...stats.recentGames,
  ].slice(0, 10)

  writeLocal(uid, stats)

  // Fire-and-forget Firestore write; if offline the SDK queues it
  try {
    await setDoc(profileRef(uid), { ...stats, updatedAt: serverTimestamp() }, { merge: true })
  } catch (err) {
    console.warn('[profileStats] Firestore write failed (cached locally):', err.code || err.message)
  }

  return stats
}
