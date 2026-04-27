import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AVATAR_MAP } from '../data/avatars'

const ORBIT_STYLE_ID = 'tiki-orbit-anim'

function ensureOrbitKeyframes() {
  if (typeof document === 'undefined') return
  if (document.getElementById(ORBIT_STYLE_ID)) return
  const style = document.createElement('style')
  style.id    = ORBIT_STYLE_ID
  style.textContent = `
    @keyframes tikiorbit {
      from { transform: translate(-50%,-50%) rotate(0deg) translateX(40px) rotate(0deg); }
      to   { transform: translate(-50%,-50%) rotate(360deg) translateX(40px) rotate(-360deg); }
    }
  `
  document.head.appendChild(style)
}

// Premium card back with tiki pattern
function CardBack({ angle, pivotX, pivotY, style }) {
  const W = 50, H = 70
  return (
    <div style={{
      position: 'absolute',
      width: W, height: H,
      borderRadius: 7,
      background: 'linear-gradient(148deg, #0f1a40 0%, #1a0838 55%, #0a0030 100%)',
      border: '1.5px solid rgba(212,175,55,0.28)',
      boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6), 0 3px 10px rgba(0,0,0,0.55)',
      transform: `rotate(${angle}deg)`,
      transformOrigin: `${pivotX} ${pivotY}`,
      overflow: 'hidden',
      ...style,
    }}>
      {/* Card back decoration */}
      <div style={{
        position: 'absolute', inset: 4,
        borderRadius: 4,
        border: '1px solid rgba(212,175,55,0.18)',
        background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.07) 0%, transparent 65%)',
      }} />
      {/* Diagonal cross lines */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }} viewBox={`0 0 ${W} ${H}`}>
        <line x1="0" y1="0" x2={W} y2={H} stroke="#d4af37" strokeWidth="0.8" />
        <line x1={W} y1="0" x2="0" y2={H} stroke="#d4af37" strokeWidth="0.8" />
      </svg>
      {/* Mini tiki eye dots */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        display: 'flex', gap: 6, opacity: 0.2,
      }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d4af37' }} />
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#d4af37' }} />
      </div>
    </div>
  )
}

function CardFan({ count, position }) {
  const visible = Math.min(Math.max(count, 0), 7)
  const W = 50, H = 70
  const halfSpread = Math.min(visible * 4, 22)

  if (visible === 0) return null

  if (position !== 'right') {
    const containerW = W + halfSpread * 6 + 20
    return (
      <div style={{ position: 'relative', width: containerW, height: H + 16, flexShrink: 0 }}>
        {Array.from({ length: visible }, (_, i) => {
          const t = visible > 1 ? i / (visible - 1) : 0.5
          return (
            <CardBack
              key={i}
              style={{ top: 0, left: '50%', marginLeft: -W / 2 }}
              angle={-halfSpread + t * halfSpread * 2}
              pivotX="50%" pivotY="100%"
            />
          )
        })}
      </div>
    )
  }

  const containerH = H + halfSpread * 5 + 16
  return (
    <div style={{ position: 'relative', width: W + 18, height: containerH, flexShrink: 0 }}>
      {Array.from({ length: visible }, (_, i) => {
        const t     = visible > 1 ? i / (visible - 1) : 0.5
        const angle = (-halfSpread + t * halfSpread * 2) * -1
        return (
          <CardBack
            key={i}
            style={{ top: '50%', marginTop: -H / 2, right: 0 }}
            angle={angle}
            pivotX="100%" pivotY="50%"
          />
        )
      })}
    </div>
  )
}

export default function OpponentArea({ player, position, cardCount }) {
  const isCurrentTurn = player.isCurrentTurn
  const isVertical    = position === 'right'
  const celebrateRef  = useRef(null)
  const prevCount     = useRef(cardCount)

  useEffect(() => { ensureOrbitKeyframes() }, [])

  useEffect(() => {
    if (cardCount < prevCount.current && celebrateRef.current) {
      celebrateRef.current.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }],
        { duration: 360, easing: 'ease-out' }
      )
    }
    prevCount.current = cardCount
  }, [cardCount])

  const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
  const sz     = 66

  const NameTag = (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <div style={{
        fontSize: 14.5,
        fontFamily: '"Cinzel Decorative", cursive',
        color: isCurrentTurn ? '#d4af37' : 'rgba(245,234,208,0.92)',
        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        maxWidth: 108,
        fontWeight: 700,
        letterSpacing: '0.03em',
        textShadow: isCurrentTurn ? '0 0 14px rgba(212,175,55,0.65)' : 'none',
        transition: 'color 0.3s, text-shadow 0.3s',
      }}>
        {player.name}
      </div>
      <div style={{
        fontSize: 17,
        fontFamily: '"Cinzel Decorative", cursive',
        color: '#d4af37',
        fontWeight: 900,
        marginTop: 3,
        letterSpacing: '-0.01em',
      }}>
        {player.score}
        <span style={{ fontSize: 9, opacity: 0.55, fontWeight: 400, marginLeft: 3, letterSpacing: '0.05em' }}>PTS</span>
      </div>
      {cardCount > 0 && (
        <div style={{
          fontSize: 11,
          fontFamily: '"Crimson Text", serif',
          color: 'rgba(245,234,208,0.45)',
          marginTop: 2,
          fontStyle: 'italic',
        }}>
          {cardCount} card{cardCount !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.82 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: isCurrentTurn
          ? 'linear-gradient(145deg, rgba(20,8,0,0.94) 0%, rgba(14,5,0,0.96) 100%)'
          : 'linear-gradient(145deg, rgba(14,5,0,0.88) 0%, rgba(9,3,0,0.90) 100%)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderRadius: 16,
        padding: isVertical ? '14px 10px' : '10px 16px',
        border: isCurrentTurn
          ? '1.5px solid rgba(212,175,55,0.52)'
          : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isCurrentTurn
          ? '0 0 24px rgba(212,175,55,0.14), 0 6px 20px rgba(0,0,0,0.6)'
          : '0 4px 18px rgba(0,0,0,0.5)',
        gap: isVertical ? 0 : 14,
        flexDirection: isVertical ? 'column' : 'row',
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Avatar cluster */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {/* Outer pulsing ring */}
        <AnimatePresence>
          {isCurrentTurn && (
            <motion.div
              key="outer-ring"
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: [0.4, 0.85, 0.4], scale: [1, 1.16, 1] }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                position: 'absolute', inset: -8,
                borderRadius: '50%',
                border: '2px solid #d4af37',
                boxShadow: '0 0 20px rgba(212,175,55,0.5)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* Orbit dot */}
        {isCurrentTurn && (
          <div style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#d4af37',
            boxShadow: '0 0 12px #d4af37, 0 0 4px #fff8',
            animation: 'tikiorbit 2.4s linear infinite',
            pointerEvents: 'none',
            zIndex: 5,
          }} />
        )}

        {/* Avatar circle */}
        <motion.div
          ref={celebrateRef}
          animate={isCurrentTurn ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={isCurrentTurn ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
          style={{
            width: sz, height: sz,
            borderRadius: '50%',
            overflow: 'hidden',
            border: isCurrentTurn ? '2.5px solid #d4af37' : `2.5px solid ${player.color}`,
            boxShadow: isCurrentTurn
              ? '0 0 22px rgba(212,175,55,0.55), 0 3px 12px rgba(0,0,0,0.6)'
              : `0 0 12px ${player.color}44, 0 3px 12px rgba(0,0,0,0.55)`,
            background: 'radial-gradient(ellipse at 50% 30%, rgba(55,25,0,0.9), rgba(10,3,0,0.96))',
            flexShrink: 0,
            transition: 'border-color 0.4s, box-shadow 0.4s',
          }}
        >
          {avatar ? (
            <div
              dangerouslySetInnerHTML={{ __html: avatar.svg }}
              style={{ width: '100%', height: '100%', overflow: 'hidden' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: `radial-gradient(ellipse at 50% 30%, ${player.color}cc, ${player.color})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{
                color: 'white', fontFamily: '"Cinzel Decorative", cursive',
                fontSize: sz * 0.32, fontWeight: 700,
                textShadow: '0 2px 5px rgba(0,0,0,0.7)',
              }}>
                {player.name.slice(0, 1).toUpperCase()}
              </span>
            </div>
          )}
        </motion.div>

        {/* Card count badge */}
        {cardCount > 0 && (
          <div style={{
            position: 'absolute', bottom: -4, right: -4,
            background: 'linear-gradient(135deg, #d4af37, #c8980a)',
            color: '#1a0800',
            borderRadius: '50%', width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 900,
            border: '2px solid rgba(0,0,0,0.4)', zIndex: 3,
            fontFamily: '"Cinzel Decorative", cursive',
            boxShadow: '0 2px 6px rgba(0,0,0,0.5)',
          }}>
            {cardCount}
          </div>
        )}
      </div>

      {NameTag}
      <CardFan count={cardCount} position={position} />
    </motion.div>
  )
}
