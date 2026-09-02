import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion'

// Brighter, richer card art — each type now has a saturated jewel-tone
// gradient body so cards pop against the dark board.
const CARD_META = {
  up1:    { accent: '#7cffb0', bg: 'linear-gradient(160deg, #0a2410 0%, #144a24 30%, #2a8c48 65%, #4de088 100%)', label: 'TIKI UP',  num: '1', glow: '#5cff98', cost: 1, costColor: '#4dff88' },
  up2:    { accent: '#9cffbf', bg: 'linear-gradient(160deg, #0a2818 0%, #185a32 30%, #34a668 65%, #6cf0a0 100%)', label: 'TIKI UP',  num: '2', glow: '#6cf0a0', cost: 2, costColor: '#6cf0a0' },
  up3:    { accent: '#c0ffd8', bg: 'linear-gradient(160deg, #0a2a20 0%, #1c6844 30%, #40c078 65%, #88ffb8 100%)', label: 'TIKI UP',  num: '3', glow: '#88ffb8', cost: 3, costColor: '#88ffb8' },
  topple: { accent: '#ff98a8', bg: 'linear-gradient(160deg, #2a0810 0%, #6a1218 30%, #b8202c 65%, #ff4058 100%)', label: 'TOPPLE',   num: '',  glow: '#ff5878', cost: 4, costColor: '#ff98a8' },
  toast:  { accent: '#ffe066', bg: 'linear-gradient(160deg, #2a0e00 0%, #6a2400 30%, #d05010 65%, #ffa030 100%)', label: 'TOAST',    num: '',  glow: '#ffb040', cost: 3, costColor: '#ffe066' },
}

const CARD_W = 100
const CARD_H = 148

// ── Card icons ────────────────────────────────────────────────────────────────

function UpArrowIcon({ num, glow }) {
  return (
    <svg viewBox="0 0 80 80" width={58} height={58} style={{ display: 'block', filter: `drop-shadow(0 2px 10px ${glow}77)` }}>
      <defs>
        <linearGradient id={`ug${num}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
      <path d="M40 68 L40 18 M18 42 L40 18 L62 42"
        stroke={`url(#ug${num})`} strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {num && (
        <>
          <circle cx="60" cy="64" r="14" fill="rgba(0,0,0,0.55)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
          <text x="60" y="69.5" textAnchor="middle" fill="white"
            style={{ font: 'bold 17px "Cinzel Decorative", serif', letterSpacing: '-0.02em' }}>{num}</text>
        </>
      )}
    </svg>
  )
}

function ToppleIcon() {
  return (
    <svg viewBox="0 0 80 80" width={58} height={58} style={{ display: 'block', filter: 'drop-shadow(0 2px 12px rgba(251,113,133,0.7))' }}>
      <defs>
        <linearGradient id="tpg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.95)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
        </linearGradient>
      </defs>
      <path d="M40 14 L40 62 M18 38 L40 62 L62 38"
        stroke="url(#tpg)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="27" cy="18" r="5" fill="rgba(255,255,255,0.35)" />
      <circle cx="53" cy="18" r="5" fill="rgba(255,255,255,0.35)" />
    </svg>
  )
}

function ToastIcon() {
  return (
    <svg viewBox="0 0 80 80" width={58} height={58} style={{ display: 'block', filter: 'drop-shadow(0 2px 14px rgba(251,191,36,0.75))' }}>
      <defs>
        <linearGradient id="fg3" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#ffe066" />
          <stop offset="40%" stopColor="#ff7a00" />
          <stop offset="100%" stopColor="#ff1a00" />
        </linearGradient>
        <linearGradient id="fi3" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="#fff8c0" />
          <stop offset="100%" stopColor="#ffcc44" />
        </linearGradient>
      </defs>
      <path d="M40 74 Q20 58 26 40 Q33 52 37 46 Q32 32 40 16 Q48 32 43 46 Q47 38 52 48 Q56 32 46 12 Q70 26 64 50 Q70 42 74 48 Q76 64 56 74Z"
        fill="url(#fg3)" />
      <path d="M40 68 Q30 56 34 44 Q38 50 39 46 Q36 36 40 24 Q44 36 41 46 Q46 40 48 48 Q52 64 40 68Z"
        fill="url(#fi3)" opacity="0.75" />
      <ellipse cx="40" cy="73" rx="12" ry="4" fill="rgba(255,140,0,0.3)" />
    </svg>
  )
}

// ── Cost gem (CR elixir-style) ────────────────────────────────────────────────
function CostGem({ cost, color }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: -10, left: '50%', transform: 'translateX(-50%)',
      width: 26, height: 26,
      background: `radial-gradient(circle at 38% 30%, white 0%, ${color} 35%, ${color}99 100%)`,
      borderRadius: '50%',
      border: `2px solid rgba(255,255,255,0.4)`,
      boxShadow: `0 0 12px ${color}cc, 0 2px 8px rgba(0,0,0,0.7), inset 0 1px 3px rgba(255,255,255,0.5)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 5,
    }}>
      <span style={{
        color: 'white',
        fontSize: 11,
        fontWeight: 900,
        fontFamily: '"Cinzel Decorative", cursive',
        textShadow: '0 1px 4px rgba(0,0,0,0.8)',
        lineHeight: 1,
      }}>{cost}</span>
    </div>
  )
}

// ── Single card ───────────────────────────────────────────────────────────────
function ActionCard({ card, isSelected, isMyTurn, onSelect, xOffset, arcDip, rotation }) {
  const meta     = CARD_META[card.type] || CARD_META.up1
  const playable = isMyTurn

  const mouseX  = useMotionValue(0.5)
  const mouseY  = useMotionValue(0.5)
  const rotateX = useTransform(mouseY, [0, 1], [16, -16])
  const rotateY = useTransform(mouseX, [0, 1], [-16, 16])
  // Holographic foil — background position tracks mouse
  const foilPos = useTransform([mouseX, mouseY], ([mx, my]) =>
    `${mx * 200 - 50}% ${my * 200 - 50}%`)
  const foilOpacity = useTransform(mouseX, [0, 0.5, 1], [0.25, 0.7, 0.25])

  const handleMouseMove = (e) => {
    if (isSelected) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseX.set((e.clientX - rect.left) / rect.width)
    mouseY.set((e.clientY - rect.top) / rect.height)
  }
  const handleMouseLeave = () => { mouseX.set(0.5); mouseY.set(0.5) }

  // Arc base Y. Selected card rockets upward from arc position.
  const baseY     = arcDip + 10
  const selectedY = baseY - 60

  return (
    <motion.div
      layout
      initial={{ y: 160, opacity: 0, scale: 0.7 }}
      animate={{
        x: isSelected ? xOffset : xOffset,
        y: isSelected ? selectedY : baseY,
        opacity: playable ? 1 : 0.72,
        scale: isSelected ? 1.13 : 1,
        rotateZ: isSelected ? 0 : rotation,
        zIndex: isSelected ? 50 : 1,
        filter: playable ? 'none' : 'grayscale(30%) brightness(0.75)',
      }}
      exit={{ y: 160, opacity: 0, scale: 0.6 }}
      whileHover={playable && !isSelected
        ? { y: baseY - 28, scale: 1.08, rotateZ: 0, zIndex: 40, filter: 'none' }
        : {}
      }
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      onClick={() => playable && onSelect(card)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      role="button"
      tabIndex={playable ? 0 : -1}
      aria-label={`${meta.label}${meta.num ? ' ' + meta.num : ''} card${isSelected ? ' — selected' : ''}`}
      aria-pressed={isSelected}
      onKeyDown={e => {
        if (playable && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onSelect(card) }
      }}
      style={{
        position: 'absolute',
        left: '50%',
        marginLeft: -CARD_W / 2,
        top: 0,
        width: CARD_W,
        height: CARD_H,
        cursor: playable ? 'pointer' : 'default',
        transformOrigin: 'bottom center',
      }}
    >
      {/* Ready-to-play underglow — pulses when isMyTurn */}
      {playable && !isSelected && (
        <motion.div
          animate={{ opacity: [0.0, 0.55, 0.0], scale: [0.85, 1.05, 0.85] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -8, bottom: -14,
            borderRadius: 18,
            background: `radial-gradient(ellipse at 50% 110%, ${meta.glow}50 0%, transparent 65%)`,
            pointerEvents: 'none', zIndex: -1,
          }}
        />
      )}

      {/* Selected corona halo */}
      {isSelected && (
        <motion.div
          animate={{ opacity: [0.5, 1.0, 0.5], scale: [0.9, 1.06, 0.9] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -16,
            borderRadius: 22,
            background: `radial-gradient(ellipse at 50% 60%, ${meta.glow}55 0%, transparent 65%)`,
            boxShadow: `0 0 36px ${meta.glow}55, 0 0 60px ${meta.glow}22`,
            pointerEvents: 'none', zIndex: -1,
          }}
        />
      )}

      <motion.div style={{
        width: '100%', height: '100%',
        rotateX: isSelected ? 0 : rotateX,
        rotateY: isSelected ? 0 : rotateY,
        position: 'relative',
        perspective: 900,
        transformStyle: 'preserve-3d',
      }}>
        {/* Card body — premium wooden-framed tarot with gold metallic edge */}
        <div style={{
          width: CARD_W, height: CARD_H,
          borderRadius: 13,
          overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
          padding: 2,
          background: `linear-gradient(140deg, #7a5810 0%, #d4af37 22%, #fbe58a 46%, #d4af37 62%, #7a5810 88%, #fbe58a 100%)`,
          boxShadow: isSelected
            ? `0 0 32px ${meta.glow}88, 0 0 60px ${meta.glow}33, 0 20px 50px rgba(0,0,0,0.9)`
            : playable
              ? `0 8px 28px rgba(0,0,0,0.75), 0 2px 6px rgba(0,0,0,0.5)`
              : '0 4px 16px rgba(0,0,0,0.6)',
          position: 'relative',
        }}>
          {/* Inner card content clipped inside metallic frame */}
          <div style={{
            width: '100%', height: '100%',
            borderRadius: 11,
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            position: 'relative',
          }}>
          {/* Holographic foil overlay — iridescent stripes shift w/ mouse
              for Pokémon-TCG-style tactile sheen. */}
          {playable && (
            <motion.div
              aria-hidden
              style={{
                position: 'absolute', inset: 0, zIndex: 12,
                pointerEvents: 'none', mixBlendMode: 'color-dodge',
                opacity: foilOpacity,
                backgroundImage: `linear-gradient(115deg,
                  transparent 0%,
                  rgba(255,0,140,0.5) 18%,
                  rgba(255,220,60,0.55) 32%,
                  rgba(80,255,180,0.5) 46%,
                  rgba(60,140,255,0.5) 60%,
                  rgba(180,60,255,0.5) 74%,
                  transparent 88%)`,
                backgroundSize: '250% 250%',
                backgroundPosition: foilPos,
                maskImage: 'radial-gradient(ellipse at center, black 25%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(ellipse at center, black 25%, transparent 85%)',
              }}
            />
          )}
          {/* Shimmer sweep */}
          {isSelected && (
            <motion.div
              animate={{ x: ['-100%', '240%'] }}
              transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 0.6, ease: 'linear' }}
              style={{
                position: 'absolute', top: 0, bottom: 0, width: '45%', zIndex: 10,
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent)',
                pointerEvents: 'none',
              }}
            />
          )}

          {/* ── Art area ── */}
          <div style={{
            flex: '0 0 65%',
            background: meta.bg,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', overflow: 'hidden',
          }}>
            {/* Radial light from top-center */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'radial-gradient(ellipse at 50% 15%, rgba(255,255,255,0.13) 0%, transparent 60%)',
            }} />
            {/* Bottom vignette for label transition */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 24,
              background: 'linear-gradient(0deg, rgba(0,0,0,0.45) 0%, transparent 100%)',
            }} />
            {/* Top-left corner filigree */}
            <div style={{ position: 'absolute', top: 5, left: 5, width: 11, height: 11,
              borderTop: '1.5px solid rgba(255,255,255,0.22)', borderLeft: '1.5px solid rgba(255,255,255,0.22)' }} />
            {/* Top-right corner filigree */}
            <div style={{ position: 'absolute', top: 5, right: 5, width: 11, height: 11,
              borderTop: '1.5px solid rgba(255,255,255,0.22)', borderRight: '1.5px solid rgba(255,255,255,0.22)' }} />

            {card.type === 'topple' ? <ToppleIcon />
              : card.type === 'toast'  ? <ToastIcon />
              : <UpArrowIcon num={meta.num} glow={meta.glow} />}
          </div>

          {/* ── Label area ── */}
          <div style={{
            flex: '0 0 35%',
            background: 'linear-gradient(180deg, #120800 0%, #080300 100%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            borderTop: `1.5px solid ${meta.accent}60`,
            padding: '4px 8px 14px',
            position: 'relative', gap: 2,
          }}>
            {/* Top divider glow line */}
            <div style={{
              position: 'absolute', top: 0, left: 10, right: 10, height: 1,
              background: `linear-gradient(90deg, transparent, ${meta.accent}50, transparent)`,
            }} />
            {/* Bottom corner filigree */}
            <div style={{ position: 'absolute', bottom: 14, left: 6, width: 9, height: 9,
              borderBottom: '1.5px solid rgba(255,255,255,0.14)', borderLeft: '1.5px solid rgba(255,255,255,0.14)' }} />
            <div style={{ position: 'absolute', bottom: 14, right: 6, width: 9, height: 9,
              borderBottom: '1.5px solid rgba(255,255,255,0.14)', borderRight: '1.5px solid rgba(255,255,255,0.14)' }} />

            <span style={{
              fontSize: 8,
              fontFamily: '"Cinzel Decorative", cursive',
              color: meta.accent,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textAlign: 'center',
              lineHeight: 1.2,
              textShadow: `0 0 10px ${meta.glow}66`,
            }}>
              {meta.label}
            </span>
            {meta.num && (
              <span style={{
                fontSize: 18,
                fontFamily: '"Cinzel Decorative", cursive',
                color: meta.accent,
                fontWeight: 900,
                lineHeight: 1,
                textShadow: `0 0 14px ${meta.glow}88`,
              }}>
                {meta.num}
              </span>
            )}
          </div>

          {/* Cost gem — overlaps label/art boundary */}
          <CostGem cost={meta.cost} color={meta.costColor} />
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Player hand ───────────────────────────────────────────────────────────────

const ARC_R       = 560   // virtual radius — larger = flatter arc
const MAX_SPREAD  = 30    // total arc degrees for 5-card hand

export default function PlayerHand({ hand, selectedCard, onCardSelect, isMyTurn }) {
  if (!hand || hand.length === 0) return null

  const total      = hand.length
  const spreadDeg  = Math.min(MAX_SPREAD, total * 5.8)
  const halfSpread = spreadDeg / 2

  // Container width: enough to fit all spread cards
  const containerW = Math.max(CARD_W + 40, total * 80 + CARD_W + 40)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: -18,
        left: '50%',
        transform: 'translateX(-50%)',
        width: Math.min(780, containerW),
        height: CARD_H + 80,
        zIndex: 20,
      }}
      role="group"
      aria-label="Your hand"
    >
      {/* Card count badge */}
      <div style={{
        position: 'absolute',
        top: 4,
        right: 4,
        background: 'rgba(0,0,0,0.55)',
        border: '1px solid rgba(212,175,55,0.3)',
        borderRadius: 99,
        padding: '2px 9px',
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: 9,
        color: 'rgba(212,175,55,0.6)',
        letterSpacing: '0.08em',
        backdropFilter: 'blur(6px)',
        zIndex: 60,
        pointerEvents: 'none',
      }}>
        {total} CARDS
      </div>

      <AnimatePresence>
        {hand.map((card, i) => {
          const t        = total > 1 ? (i - (total - 1) / 2) / ((total - 1) / 2) : 0
          const angleDeg = t * halfSpread
          const angleRad = angleDeg * Math.PI / 180
          // Arc fan positions
          const xOffset  = ARC_R * Math.sin(angleRad)
          // Edges dip down slightly — authentic hand arc
          const arcDip   = ARC_R * (1 - Math.cos(angleRad)) * 0.7

          return (
            <ActionCard
              key={card.id}
              card={card}
              xOffset={xOffset}
              arcDip={arcDip}
              rotation={angleDeg}
              isSelected={selectedCard?.id === card.id}
              isMyTurn={isMyTurn}
              onSelect={onCardSelect}
            />
          )
        })}
      </AnimatePresence>
    </div>
  )
}
