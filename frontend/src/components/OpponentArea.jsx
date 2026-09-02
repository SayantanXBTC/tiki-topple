import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AVATAR_MAP } from '../data/avatars'

// ═════════════════════════════════════════════════════════════════════════════
// Royal metallic opponent totem — ornate gold frame, engraved plaques,
// filigree corners, sweeping torch-light sheen on active turn.
// ═════════════════════════════════════════════════════════════════════════════

const GOLD       = '#d4af37'
const GOLD_LIGHT = '#fbe58a'
const GOLD_DARK  = '#7a5810'
const CREAM      = '#f5ead0'

// ── Gold metallic gradient border helper ────────────────────────────────────
const goldBorder = (opacity = 1) => `linear-gradient(135deg,
  ${GOLD_DARK} 0%, ${GOLD} 22%, ${GOLD_LIGHT} 46%, ${GOLD} 62%, ${GOLD_DARK} 88%, ${GOLD_LIGHT} 100%)`

// ── Ornate corner filigree (SVG) ────────────────────────────────────────────
function Corner({ pos = 'tl', size = 22 }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[pos]
  const style = { tl: { top: 4, left: 4 }, tr: { top: 4, right: 4 },
                  br: { bottom: 4, right: 4 }, bl: { bottom: 4, left: 4 } }[pos]
  return (
    <svg viewBox="0 0 22 22" width={size} height={size}
         style={{ position: 'absolute', ...style, transform: `rotate(${rot}deg)`, zIndex: 4, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={`crn-${pos}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <path d="M 1 10 Q 1 1 10 1 L 15 1 L 15 3 L 10 3 Q 3 3 3 10 L 3 15 L 1 15 Z"
            fill={`url(#crn-${pos})`} />
      <circle cx="4" cy="4" r="1.6" fill={GOLD_LIGHT} stroke={GOLD_DARK} strokeWidth="0.4" />
    </svg>
  )
}

// ── Hexagonal avatar w/ royal gold ring ─────────────────────────────────────
function RoyalHexAvatar({ player, size, isCurrentTurn, celebrateRef }) {
  const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
  const r  = size / 2
  const ri = r - 4
  const pts = (rad) => Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${r + rad * Math.cos(a)},${r + rad * Math.sin(a)}`
  }).join(' ')

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      {/* Pulsing outer gold ring when active */}
      <AnimatePresence>
        {isCurrentTurn && (
          <motion.svg
            key="pulse-ring"
            viewBox={`0 0 ${size} ${size}`}
            width={size + 16} height={size + 16}
            style={{ position: 'absolute', top: -8, left: -8, pointerEvents: 'none', overflow: 'visible' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.4, 0.95, 0.4], scale: [1, 1.08, 1] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          >
            <polygon points={pts(r - 1)} fill="none" stroke={GOLD} strokeWidth="2.5"
                     strokeDasharray="5 3" style={{ filter: `drop-shadow(0 0 8px ${GOLD}dd)` }} />
          </motion.svg>
        )}
      </AnimatePresence>

      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <clipPath id={`royal-clip-${player.id}`}>
            <polygon points={pts(ri)} />
          </clipPath>
          <linearGradient id={`royal-ring-${player.id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor={GOLD_LIGHT} />
            <stop offset="50%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DARK} />
          </linearGradient>
          <radialGradient id={`royal-bg-${player.id}`} cx="50%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#3d1a00" />
            <stop offset="100%" stopColor="#080300" />
          </radialGradient>
        </defs>

        {/* Outer gold hex frame */}
        <polygon points={pts(r - 1)} fill={`url(#royal-ring-${player.id})`}
                 style={{ filter: `drop-shadow(0 2px 6px rgba(0,0,0,0.7))` }} />
        {/* Inner dark hex */}
        <polygon points={pts(ri)} fill={`url(#royal-bg-${player.id})`}
                 stroke={player.color} strokeWidth="1" opacity="0.95" />

        {/* Avatar */}
        <foreignObject x={4} y={4} width={size - 8} height={size - 8}
                       clipPath={`url(#royal-clip-${player.id})`}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden' }} ref={celebrateRef}>
            {avatar
              ? <div dangerouslySetInnerHTML={{ __html: avatar.svg }} style={{ width: '100%', height: '100%' }} />
              : <div style={{ width: '100%', height: '100%',
                    background: `radial-gradient(ellipse at 50% 30%, ${player.color}cc, ${player.color})`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: size * 0.32, fontFamily: '"Cinzel Decorative", serif', fontWeight: 700 }}>
                    {player.name.slice(0, 1).toUpperCase()}
                  </span>
                </div>}
          </div>
        </foreignObject>

        {/* Top sheen */}
        <polygon points={pts(ri)} fill="url(#royal-sheen)" style={{ pointerEvents: 'none' }} />
        <defs>
          <linearGradient id="royal-sheen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="rgba(255,255,255,0.22)" />
            <stop offset="45%" stopColor="transparent" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

// ── Ornate score gem badge ──────────────────────────────────────────────────
function RoyalScoreBadge({ score, color }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      background: 'linear-gradient(135deg, rgba(30,14,0,0.94), rgba(10,5,0,0.96))',
      border: '1.5px solid transparent',
      borderRadius: 999,
      padding: '5px 14px 5px 8px',
      backgroundImage: `linear-gradient(135deg, rgba(30,14,0,0.94), rgba(10,5,0,0.96)),
                        ${goldBorder()}`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      boxShadow: '0 3px 14px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,225,140,0.15)',
    }}>
      <svg viewBox="0 0 16 16" width={15} height={15}>
        <defs>
          <linearGradient id={`gem-badge-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"  stopColor="white" stopOpacity="0.95" />
            <stop offset="40%" stopColor={color} />
            <stop offset="100%" stopColor={color} stopOpacity="0.55" />
          </linearGradient>
        </defs>
        <polygon points="8,1 15,6 8,15 1,6" fill={`url(#gem-badge-${color})`}
                 stroke={GOLD_DARK} strokeWidth="0.6"
                 style={{ filter: `drop-shadow(0 0 4px ${color}bb)` }} />
        <polygon points="8,1 15,6 8,7 1,6" fill="rgba(255,255,255,0.45)" />
      </svg>
      <span style={{
        fontFamily: '"Cinzel Decorative", serif',
        fontSize: 15, fontWeight: 900,
        background: `linear-gradient(180deg, ${GOLD_LIGHT} 0%, ${GOLD} 55%, ${GOLD_DARK} 100%)`,
        WebkitBackgroundClip: 'text', backgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        letterSpacing: '-0.01em',
      }}>
        {score}
      </span>
    </div>
  )
}

// ── Card fan — mini card backs ──────────────────────────────────────────────
function CardStack({ count, color }) {
  const visible = Math.min(Math.max(count, 0), 5)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 3, minHeight: 24 }}>
      {visible === 0
        ? <span style={{ fontSize: 10, fontFamily: '"Crimson Text", serif',
                         color: 'rgba(245,234,208,0.35)', fontStyle: 'italic' }}>no cards</span>
        : Array.from({ length: visible }, (_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: -6, rotate: -8 + i * 3 }}
              animate={{ opacity: 1, y: 0, rotate: -6 + i * 3 }}
              transition={{ delay: i * 0.06 }}
              style={{
                width: 15, height: 22, borderRadius: 3,
                background: `linear-gradient(160deg, #1a0a30 0%, #0a041a 100%)`,
                border: `1px solid ${color}66`,
                boxShadow: `0 1px 4px rgba(0,0,0,0.75), inset 0 0 6px rgba(212,175,55,0.08)`,
                position: 'relative',
              }}>
              <div style={{ position: 'absolute', inset: 2, borderRadius: 1.5,
                            border: '0.5px solid rgba(212,175,55,0.2)',
                            background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.12) 0%, transparent 70%)' }} />
            </motion.div>
          ))}
      {count > 5 && (
        <span style={{ fontSize: 10, color: GOLD, fontFamily: '"Cinzel Decorative", serif', marginLeft: 3, fontWeight: 700 }}>
          +{count - 5}
        </span>
      )}
    </div>
  )
}

// ── Divider — engraved gold hairline ────────────────────────────────────────
function GoldDivider({ horizontal = true }) {
  return horizontal ? (
    <div style={{
      width: '85%', height: 1, margin: '2px auto',
      background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
      boxShadow: `0 0 6px ${GOLD}55`,
    }} />
  ) : (
    <div style={{ width: 1, height: '85%', margin: 'auto 2px',
      background: `linear-gradient(180deg, transparent, ${GOLD}, transparent)` }} />
  )
}

// ═════════════════════════════════════════════════════════════════════════════
export default function OpponentArea({ player, position, cardCount }) {
  const isCurrentTurn = player.isCurrentTurn
  // All rail positions (right/left/*-top/*-bottom) render as vertical cards
  const isVertical    = !position?.startsWith('top-')
  const celebrateRef  = useRef(null)
  const prevCount     = useRef(cardCount)

  useEffect(() => {
    if (cardCount < prevCount.current && celebrateRef.current) {
      celebrateRef.current.animate(
        [{ transform: 'scale(1)' }, { transform: 'scale(1.2)' }, { transform: 'scale(0.95)' }, { transform: 'scale(1)' }],
        { duration: 360, easing: 'ease-out' }
      )
    }
    prevCount.current = cardCount
  }, [cardCount])

  // Compact vertical card so up to 3 opponents fit on the rails without
  // overlapping each other on standard 900px-tall viewports.
  const avatarSize = isVertical ? 60 : 68

  // ── Vertical (side-rail) card ────────────────────────────────────────────
  if (isVertical) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        whileHover={{ scale: 1.02, x: -3 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{
          width: 176,
          background: 'linear-gradient(160deg, rgba(28,12,2,0.96) 0%, rgba(12,5,0,0.98) 55%, rgba(6,2,0,0.98) 100%)',
          border: '2px solid transparent',
          borderRadius: 18,
          backgroundImage: `linear-gradient(160deg, rgba(28,12,2,0.96), rgba(6,2,0,0.98)),
                            ${goldBorder()}`,
          backgroundOrigin: 'border-box',
          backgroundClip: 'padding-box, border-box',
          padding: '14px 12px 12px',
          boxShadow: isCurrentTurn
            ? `0 0 44px rgba(212,175,55,0.32), 0 0 90px rgba(212,175,55,0.1),
               0 16px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,225,140,0.22)`
            : '0 12px 36px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,225,140,0.1)',
          transition: 'box-shadow 0.4s',
          position: 'relative', overflow: 'hidden',
          // backdrop-filter removed — was creating pale saturated ghost boxes
          // when r3f canvas bg sat behind the card.
        }}
      >
        {/* Filigree corners */}
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />

        {/* Turn sweep */}
        <AnimatePresence>
          {isCurrentTurn && (
            <motion.div
              key="sweep"
              initial={{ y: '-120%' }} animate={{ y: '160%' }} exit={{ opacity: 0 }}
              transition={{ duration: 2.0, repeat: Infinity, repeatDelay: 1.4, ease: 'linear' }}
              style={{
                position: 'absolute', left: 0, right: 0, height: '55%',
                background: `linear-gradient(180deg, transparent, ${GOLD}22, transparent)`,
                pointerEvents: 'none', zIndex: 1,
              }} />
          )}
        </AnimatePresence>

        {/* Header — OPPONENT label */}
        <div style={{
          textAlign: 'center', marginBottom: 6,
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 8, letterSpacing: '0.22em', fontWeight: 700,
          color: isCurrentTurn ? GOLD_LIGHT : 'rgba(212,175,55,0.5)',
          textShadow: isCurrentTurn ? `0 0 10px ${GOLD}aa` : 'none',
          transition: 'color 0.3s',
        }}>
          {isCurrentTurn ? '◆ THEIR TURN ◆' : '◇ OPPONENT ◇'}
        </div>

        {/* Avatar */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6, position: 'relative', zIndex: 2 }}>
          <RoyalHexAvatar player={player} size={avatarSize}
                          isCurrentTurn={isCurrentTurn} celebrateRef={celebrateRef} />
        </div>

        {/* Name plaque */}
        <div style={{
          textAlign: 'center',
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 12, fontWeight: 700,
          color: CREAM, letterSpacing: '0.04em',
          textShadow: isCurrentTurn ? `0 0 14px ${GOLD}88` : '0 1px 2px rgba(0,0,0,0.8)',
          maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 6, position: 'relative', zIndex: 2,
        }}>
          {player.name}
        </div>

        {/* Score gem + hand row combined */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, position: 'relative', zIndex: 2 }}>
          <RoyalScoreBadge score={player.score} color={player.color} />
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <CardStack count={cardCount} color={player.color} />
          </div>
        </div>
      </motion.div>
    )
  }

  // ── Horizontal (top) card — 3/4 player layouts ───────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.03, y: -2 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      style={{
        display: 'flex', alignItems: 'center', flexDirection: 'row', gap: 14,
        background: 'linear-gradient(155deg, rgba(28,12,2,0.94) 0%, rgba(10,5,0,0.96) 100%)',
        border: '2px solid transparent',
        borderRadius: 18,
        backgroundImage: `linear-gradient(155deg, rgba(28,12,2,0.94), rgba(10,5,0,0.96)),
                          ${goldBorder()}`,
        backgroundOrigin: 'border-box',
        backgroundClip: 'padding-box, border-box',
        padding: '12px 18px',
        boxShadow: isCurrentTurn
          ? `0 0 32px rgba(212,175,55,0.28), 0 12px 30px rgba(0,0,0,0.75)`
          : '0 8px 24px rgba(0,0,0,0.7)',
        position: 'relative', overflow: 'hidden',
      }}>
      <Corner pos="tl" size={16} /><Corner pos="tr" size={16} />
      <Corner pos="bl" size={16} /><Corner pos="br" size={16} />

      <RoyalHexAvatar player={player} size={avatarSize}
                      isCurrentTurn={isCurrentTurn} celebrateRef={celebrateRef} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
        <div style={{
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 8.5, letterSpacing: '0.22em',
          color: isCurrentTurn ? GOLD_LIGHT : 'rgba(212,175,55,0.5)',
        }}>
          {isCurrentTurn ? '◆ PLAYING ◆' : 'OPPONENT'}
        </div>
        <div style={{
          fontSize: 13, fontFamily: '"Cinzel Decorative", serif',
          color: CREAM, fontWeight: 700,
          maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {player.name}
        </div>
        <RoyalScoreBadge score={player.score} color={player.color} />
        <CardStack count={cardCount} color={player.color} />
      </div>
    </motion.div>
  )
}
