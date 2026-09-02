import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../store/gameStore'
import { useSocketContext } from '../context/SocketContext'
import { TIKI_COLORS as TIKI_LOOKUP } from '../data/tikaColors'

// ── Animated score counter ───────────────────────────────────────────────────

function CountUp({ target, delay = 0, suffix = '' }) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0
      const step = Math.ceil(target / 24)
      const id = setInterval(() => {
        start = Math.min(start + step, target)
        setValue(start)
        if (start >= target) clearInterval(id)
      }, 30)
      return () => clearInterval(id)
    }, delay * 1000)
    return () => clearTimeout(timer)
  }, [target, delay])
  return <>{value}{suffix}</>
}

// ── Revealed secret card ─────────────────────────────────────────────────────

function RevealCard({ player, secretCard, roundScore, delay }) {
  const rows = [
    { key: 'top',    pts: 9,  thresh: 'Position #1' },
    { key: 'middle', pts: 5,  thresh: '#1 or #2' },
    { key: 'bottom', pts: 2,  thresh: 'Top 3' },
  ]

  return (
    <motion.div
      initial={{ rotateY: 180 }}
      animate={{ rotateY: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 22, delay }}
      style={{
        width: 130,
        perspective: 600,
        flexShrink: 0,
      }}
    >
      <div style={{
        background: 'linear-gradient(160deg, #2a1000, #1a0800)',
        border: `2px solid ${player.color}`,
        borderRadius: 10,
        padding: '10px',
        boxShadow: `0 0 16px ${player.color}44, 0 4px 16px rgba(0,0,0,0.5)`,
      }}>
        {/* Player name */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
        }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: player.color,
            flexShrink: 0,
            boxShadow: `0 0 6px ${player.color}`,
          }} />
          <div style={{
            fontSize: 9.5,
            fontFamily: '"Cinzel Decorative", cursive',
            color: '#f5ead0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {player.name}
          </div>
        </div>

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${player.color}55, transparent)`, marginBottom: 8 }} />

        {/* Tiki rows */}
        {rows.map(({ key, pts }) => {
          const tikId = secretCard?.[key]
          const tiki  = TIKI_LOOKUP[tikId] || { name: tikId || '?', color: '#888' }
          const scored = roundScore > 0   // simplified — full scoring detail would need per-tiki data
          return (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: tiki.color,
                flexShrink: 0,
                boxShadow: `0 0 4px ${tiki.color}88`,
              }} />
              <div style={{
                flex: 1, fontSize: 9,
                color: 'rgba(245,234,208,0.75)',
                fontFamily: '"Crimson Text", serif',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {tiki.name}
              </div>
              <div style={{
                fontSize: 9,
                fontWeight: 900,
                color: '#d4af37',
                fontFamily: '"Cinzel Decorative", cursive',
              }}>
                +{pts}
              </div>
            </div>
          )
        })}

        <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${player.color}44, transparent)`, margin: '8px 0 6px' }} />

        {/* Round score */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: delay + 0.5, type: 'spring', stiffness: 300, damping: 18 }}
          style={{
            textAlign: 'center',
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 20,
            fontWeight: 900,
            color: roundScore > 0 ? '#d4af37' : 'rgba(245,234,208,0.3)',
            textShadow: roundScore > 0 ? '0 0 16px rgba(212,175,55,0.7)' : 'none',
          }}
        >
          +{roundScore}
        </motion.div>
        <div style={{
          textAlign: 'center',
          fontSize: 7.5,
          color: 'rgba(245,234,208,0.35)',
          fontFamily: '"Cinzel Decorative", cursive',
          letterSpacing: '0.1em',
        }}>
          THIS ROUND
        </div>
      </div>
    </motion.div>
  )
}

// ── Score track ──────────────────────────────────────────────────────────────

function ScoreTrack({ players }) {
  const maxScore = Math.max(...players.map(p => p.score), 1)
  return (
    <div style={{ width: '100%' }}>
      <div style={{
        fontSize: 9.5,
        letterSpacing: '0.14em',
        color: 'rgba(212,175,55,0.55)',
        fontFamily: '"Cinzel Decorative", cursive',
        marginBottom: 10,
        textAlign: 'center',
      }}>
        TOTAL SCORES
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...players].sort((a, b) => b.score - a.score).map((p, i) => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: p.color, flexShrink: 0,
              boxShadow: `0 0 5px ${p.color}88`,
            }} />
            <div style={{
              width: 72, fontSize: 10,
              fontFamily: '"Cinzel Decorative", cursive',
              color: '#f5ead0',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {p.name}
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(p.score / maxScore) * 100}%` }}
                transition={{ duration: 0.8, delay: 0.4 + i * 0.1, ease: 'easeOut' }}
                style={{ height: '100%', background: p.color, borderRadius: 4 }}
              />
            </div>
            <div style={{
              width: 28, textAlign: 'right',
              fontFamily: '"Cinzel Decorative", cursive',
              fontSize: 11, color: '#d4af37',
              fontWeight: 700, flexShrink: 0,
            }}>
              {p.score}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── RoundEndScreen ────────────────────────────────────────────────────────────

export default function RoundEndScreen() {
  const { roundEndData, roundNumber, totalRounds, isHost, myPlayerId } = useGameStore()
  const { nextRound } = useSocketContext()

  if (!roundEndData) return null

  const { players, allSecretCards, roundScores } = roundEndData
  const isLastRound = roundNumber >= totalRounds

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #08020a 0%, #0d0400 50%, #1a0800 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: '"Crimson Text", serif',
      overflow: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>

        {/* ── Heading ──────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -32, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
          style={{ textAlign: 'center' }}
        >
          <div style={{
            fontSize: 10,
            letterSpacing: '0.22em',
            color: 'rgba(212,175,55,0.55)',
            fontFamily: '"Cinzel Decorative", cursive',
            marginBottom: 4,
          }}>
            ROUND {roundNumber} OF {totalRounds}
          </div>
          <h2 style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 28,
            fontWeight: 900,
            color: '#d4af37',
            margin: 0,
            textShadow: '2px 2px 0 #0d0400, 0 0 28px rgba(212,175,55,0.5)',
          }}>
            {isLastRound ? 'FINAL ROUND' : 'ROUND COMPLETE'}
          </h2>
        </motion.div>

        {/* ── Secret card reveals (staggered flip) ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            width: '100%',
            display: 'flex',
            flexWrap: 'wrap',
            gap: 12,
            justifyContent: 'center',
          }}
        >
          {players.map((p, i) => (
            <RevealCard
              key={p.id}
              player={p}
              secretCard={allSecretCards?.[p.id]}
              roundScore={p.roundScore ?? 0}
              delay={0.2 + i * 0.4}
            />
          ))}
        </motion.div>

        {/* ── Score track ───────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + players.length * 0.4 }}
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(212,175,55,0.15)',
            borderRadius: 12,
            padding: '16px 18px',
          }}
        >
          <ScoreTrack players={players} />
        </motion.div>

        {/* ── CTA ──────────────────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 + players.length * 0.4 }}
          style={{ width: '100%', textAlign: 'center' }}
        >
          {isLastRound ? (
            <div style={{
              padding: '12px',
              color: 'rgba(245,234,208,0.5)',
              fontStyle: 'italic',
              fontSize: 13,
              letterSpacing: '0.04em',
            }}>
              Calculating final scores…
            </div>
          ) : isHost ? (
            <motion.button
              whileHover={{ scale: 1.03, boxShadow: '0 0 24px rgba(212,175,55,0.45)' }}
              whileTap={{ scale: 0.97 }}
              animate={{
                boxShadow: ['0 0 0px rgba(212,175,55,0)', '0 0 18px rgba(212,175,55,0.4)', '0 0 0px rgba(212,175,55,0)'],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              onClick={nextRound}
              style={{
                background: 'linear-gradient(145deg, #4d2a0a, #3d1f0a)',
                border: '2px solid #d4af37',
                borderRadius: 10,
                color: '#d4af37',
                padding: '15px 40px',
                fontSize: 14,
                fontFamily: '"Cinzel Decorative", cursive',
                fontWeight: 700,
                letterSpacing: '0.12em',
                cursor: 'pointer',
              }}
            >
              ▶ Next Round
            </motion.button>
          ) : (
            <motion.div
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{
                fontSize: 12,
                color: 'rgba(245,234,208,0.45)',
                fontStyle: 'italic',
              }}
            >
              Waiting for host to start next round…
            </motion.div>
          )}
        </motion.div>

      </div>
    </div>
  )
}
