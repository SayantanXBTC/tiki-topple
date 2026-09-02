import { motion } from 'framer-motion'
import { useEffect } from 'react'
import useGameStore from '../store/gameStore'
import { useAuth } from '../context/AuthContext'
import { saveGameResult } from '../utils/profileStats'

const MEDALS = ['🥇', '🥈', '🥉']

// ── Crown SVG ────────────────────────────────────────────────────────────────

function Crown() {
  return (
    <svg viewBox="0 0 80 56" width={80} height={56} fill="none">
      <polygon points="4,48 4,12 22,28 40,4 58,28 76,12 76,48" fill="#d4af37" stroke="#ffd700" strokeWidth="1.5" strokeLinejoin="round"/>
      <polygon points="4,48 76,48 70,56 10,56" fill="#b8860b"/>
      <circle cx="40" cy="4" r="5" fill="#ffd700" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="4" cy="12" r="4" fill="#ffd700" stroke="#d4af37" strokeWidth="1"/>
      <circle cx="76" cy="12" r="4" fill="#ffd700" stroke="#d4af37" strokeWidth="1"/>
      <rect x="14" y="46" width="52" height="4" fill="rgba(0,0,0,0.2)" rx="1"/>
    </svg>
  )
}

// ── Confetti particle ────────────────────────────────────────────────────────

function Particle({ i }) {
  const colors = ['#d4af37', '#ff6b1a', '#27ae60', '#3498db', '#e91e8c', '#ffd700']
  const color  = colors[i % colors.length]
  const size   = 5 + Math.random() * 6
  const startX = (Math.random() - 0.5) * 300
  const startY = -60
  const endX   = startX + (Math.random() - 0.5) * 200
  const endY   = 400 + Math.random() * 200
  const delay  = Math.random() * 1.2

  return (
    <motion.div
      initial={{ x: startX, y: startY, opacity: 1, rotate: 0 }}
      animate={{ x: endX, y: endY, opacity: 0, rotate: 720 }}
      transition={{ duration: 2.4 + Math.random() * 1.2, delay, ease: 'easeIn' }}
      style={{
        position: 'absolute',
        top: '20%', left: '50%',
        width: size, height: size,
        background: color,
        borderRadius: i % 3 === 0 ? '50%' : 2,
        pointerEvents: 'none',
      }}
    />
  )
}

// ── Leaderboard row ──────────────────────────────────────────────────────────

function LeaderboardRow({ player, rank, delay }) {
  const isFirst = rank === 0
  return (
    <motion.div
      initial={{ x: -40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22, delay }}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: isFirst ? 'rgba(212,175,55,0.1)' : 'rgba(255,255,255,0.04)',
        borderRadius: 10,
        border: isFirst ? '1px solid rgba(212,175,55,0.35)' : '1px solid rgba(255,255,255,0.07)',
        marginBottom: 8,
      }}
    >
      {/* Rank medal / number */}
      <div style={{ width: 28, textAlign: 'center', fontSize: 18, flexShrink: 0 }}>
        {rank < 3 ? MEDALS[rank] : <span style={{ fontSize: 12, color: 'rgba(245,234,208,0.4)', fontFamily: '"Cinzel Decorative", cursive' }}>#{rank + 1}</span>}
      </div>

      {/* Color dot + name */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%',
        background: player.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: 12, fontWeight: 700, color: 'white',
        textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        flexShrink: 0,
        border: isFirst ? '2px solid #d4af37' : '2px solid rgba(255,255,255,0.15)',
        boxShadow: isFirst ? `0 0 12px ${player.color}88` : 'none',
      }}>
        {player.name.slice(0, 1).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: '"Cinzel Decorative", cursive',
          fontSize: 13,
          color: isFirst ? '#d4af37' : '#f5ead0',
          fontWeight: isFirst ? 700 : 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {player.name}
        </div>
        {/* Round-by-round scores */}
        {player.roundScores?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
            {player.roundScores.map((s, i) => (
              <div key={i} style={{
                fontSize: 8.5,
                padding: '1px 5px',
                background: 'rgba(255,255,255,0.06)',
                borderRadius: 3,
                color: 'rgba(245,234,208,0.5)',
                fontFamily: '"Crimson Text", serif',
              }}>
                +{s}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: isFirst ? 24 : 18,
        fontWeight: 900,
        color: isFirst ? '#d4af37' : 'rgba(245,234,208,0.75)',
        textShadow: isFirst ? '0 0 16px rgba(212,175,55,0.6)' : 'none',
        flexShrink: 0,
      }}>
        {player.score}
      </div>
    </motion.div>
  )
}

// ── GameOverScreen ────────────────────────────────────────────────────────────

export default function GameOverScreen() {
  const { gameOverData, resetGame, myPlayerId, setScreen } = useGameStore()
  const { user } = useAuth()

  // Save game result to profile stats once on mount
  useEffect(() => {
    if (user?.uid && gameOverData?.finalScores && myPlayerId) {
      saveGameResult(user.uid, { myPlayerId, finalScores: gameOverData.finalScores })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!gameOverData) return null

  const { finalScores, winner } = gameOverData
  const sorted = [...finalScores].sort((a, b) => b.score - a.score)

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 50% 30%, #1a0e00 0%, #0d0400 60%, #08020a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '"Crimson Text", serif',
      overflow: 'auto',
      position: 'relative',
    }}>

      {/* Confetti burst */}
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 28 }, (_, i) => <Particle key={i} i={i} />)}
      </div>

      <div style={{
        width: '100%', maxWidth: 400,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 28,
        position: 'relative', zIndex: 1,
      }}>

        {/* ── Game over heading ──────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 16 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: 9,
            letterSpacing: '0.28em',
            color: 'rgba(212,175,55,0.5)',
            fontFamily: '"Cinzel Decorative", cursive',
            marginBottom: 6,
          }}>
            GAME OVER
          </div>
          <h1 style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 34,
            fontWeight: 900,
            color: '#d4af37',
            margin: 0,
            textShadow: '2px 2px 0 #0d0400, 0 0 32px rgba(212,175,55,0.6)',
            letterSpacing: '0.04em',
          }}>
            TIKI TOPPLE
          </h1>
        </motion.div>

        {/* ── Winner podium ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, rgba(212,175,55,0.12), rgba(212,175,55,0.05))',
            border: '2px solid rgba(212,175,55,0.4)',
            borderRadius: 16,
            padding: '24px 20px',
            textAlign: 'center',
            boxShadow: '0 0 32px rgba(212,175,55,0.15), inset 0 0 32px rgba(0,0,0,0.2)',
          }}
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ display: 'inline-block', marginBottom: 10 }}
          >
            <Crown />
          </motion.div>

          <div style={{
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'rgba(212,175,55,0.6)',
            fontFamily: '"Cinzel Decorative", cursive',
            marginBottom: 6,
          }}>
            WINNER
          </div>

          <div style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 28,
            fontWeight: 900,
            color: '#d4af37',
            textShadow: '0 0 24px rgba(212,175,55,0.7)',
            marginBottom: 4,
          }}>
            {winner.name}
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'rgba(212,175,55,0.15)',
            border: '1px solid rgba(212,175,55,0.3)',
            borderRadius: 20,
            padding: '4px 14px',
          }}>
            <span style={{ fontSize: 20, color: '#d4af37', fontFamily: '"Cinzel Decorative", cursive', fontWeight: 900 }}>
              {winner.score}
            </span>
            <span style={{ fontSize: 9.5, color: 'rgba(212,175,55,0.7)', fontFamily: '"Cinzel Decorative", cursive', letterSpacing: '0.1em' }}>
              POINTS
            </span>
          </div>
        </motion.div>

        {/* ── Leaderboard ────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{ width: '100%' }}
        >
          <div style={{
            fontSize: 9.5,
            letterSpacing: '0.16em',
            color: 'rgba(212,175,55,0.5)',
            fontFamily: '"Cinzel Decorative", cursive',
            marginBottom: 12,
            textAlign: 'center',
          }}>
            FINAL STANDINGS
          </div>
          {sorted.map((p, i) => (
            <LeaderboardRow
              key={p.id}
              player={p}
              rank={i}
              delay={0.6 + i * 0.12}
            />
          ))}
        </motion.div>

        {/* ── Play again ─────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          style={{ width: '100%' }}
        >
          <div style={{ display: 'flex', gap: 10 }}>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 28px rgba(212,175,55,0.5)' }}
              whileTap={{ scale: 0.97 }}
              onClick={resetGame}
              style={{
                flex: 1,
                background: 'linear-gradient(145deg, #4d2a0a, #3d1f0a)',
                border: '2px solid #d4af37',
                borderRadius: 10,
                color: '#d4af37',
                padding: '16px',
                fontSize: 14,
                fontFamily: '"Cinzel Decorative", cursive',
                fontWeight: 700,
                letterSpacing: '0.12em',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(212,175,55,0.2)',
              }}
            >
              ↺ Play Again
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 20px rgba(212,175,55,0.25)' }}
              whileTap={{ scale: 0.97 }}
              onClick={() => { resetGame(); setTimeout(() => setScreen('profile'), 50) }}
              style={{
                background: 'rgba(212,175,55,0.08)',
                border: '1.5px solid rgba(212,175,55,0.4)',
                borderRadius: 10,
                color: 'rgba(212,175,55,0.75)',
                padding: '16px 18px',
                fontSize: 12,
                fontFamily: '"Cinzel Decorative", cursive',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                whiteSpace: 'nowrap',
              }}
            >
              ✦ Profile
            </motion.button>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
