import { motion, AnimatePresence } from 'framer-motion'

const CARD_META = {
  up1:    { accent: '#4ade80', bg: 'linear-gradient(155deg, #0a1f0a 0%, #152e18 40%, #1e5228 75%, #2a7a38 100%)', label: 'Tiki Up',  num: '1', glow: '#4ade80' },
  up2:    { accent: '#6ee89a', bg: 'linear-gradient(155deg, #0a1f10 0%, #153520 40%, #1e6040 75%, #3cb371 100%)', label: 'Tiki Up',  num: '2', glow: '#3cb371' },
  up3:    { accent: '#86efac', bg: 'linear-gradient(155deg, #0a2018 0%, #153828 40%, #1e6855 75%, #52d68a 100%)', label: 'Tiki Up',  num: '3', glow: '#52d68a' },
  topple: { accent: '#fb7185', bg: 'linear-gradient(155deg, #220808 0%, #400c0c 40%, #6e1010 75%, #c01230 100%)', label: 'Topple',  num: '',  glow: '#fb7185' },
  toast:  { accent: '#fbbf24', bg: 'linear-gradient(155deg, #1f0d00 0%, #3d1c00 40%, #6e3500 75%, #c46800 100%)', label: 'Toast',   num: '',  glow: '#fbbf24' },
}

function UpArrowIcon({ num, accent, glow }) {
  return (
    <svg viewBox="0 0 80 80" width={54} height={54} style={{ display: 'block', filter: `drop-shadow(0 2px 8px ${glow}66)` }}>
      <defs>
        <linearGradient id={`ug${num}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.65)" />
          <stop offset="100%" stopColor="white" />
        </linearGradient>
      </defs>
      <path d="M40 66 L40 20 M20 42 L40 20 L60 42"
        stroke={`url(#ug${num})`} strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {num && (
        <>
          <circle cx="59" cy="64" r="13.5" fill="rgba(0,0,0,0.5)" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" />
          <text x="59" y="69.5" textAnchor="middle" fill="white"
            style={{ font: 'bold 16px "Cinzel Decorative", serif', letterSpacing: '-0.02em' }}>{num}</text>
        </>
      )}
    </svg>
  )
}

function ToppleIcon() {
  return (
    <svg viewBox="0 0 80 80" width={54} height={54} style={{ display: 'block', filter: 'drop-shadow(0 2px 10px rgba(251,113,133,0.6))' }}>
      <defs>
        <linearGradient id="tpg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,255,255,0.9)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.55)" />
        </linearGradient>
      </defs>
      <path d="M40 16 L40 60 M20 38 L40 60 L60 38"
        stroke="url(#tpg)" strokeWidth="9.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="28" cy="20" r="4.5" fill="rgba(255,255,255,0.3)" />
      <circle cx="52" cy="20" r="4.5" fill="rgba(255,255,255,0.3)" />
    </svg>
  )
}

function ToastIcon() {
  return (
    <svg viewBox="0 0 80 80" width={54} height={54} style={{ display: 'block', filter: 'drop-shadow(0 2px 12px rgba(251,191,36,0.65))' }}>
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
      <ellipse cx="40" cy="73" rx="11" ry="3.5" fill="rgba(255,140,0,0.3)" />
    </svg>
  )
}

const CARD_W = 90
const CARD_H = 130

function ActionCard({ card, isSelected, isMyTurn, onSelect, xOffset, baseY, rotation }) {
  const meta     = CARD_META[card.type] || CARD_META.up1
  const playable = isMyTurn

  return (
    <motion.div
      layout
      initial={{ y: 150, opacity: 0, rotate: rotation }}
      animate={{
        x: xOffset,
        y: isSelected ? baseY - 38 : baseY,
        opacity: 1,
        scale: isSelected ? 1.11 : 1,
        rotate: isSelected ? 0 : rotation,
        zIndex: isSelected ? 50 : 1,
      }}
      exit={{ y: 150, opacity: 0, scale: 0.65 }}
      whileHover={playable && !isSelected ? { y: baseY - 22, scale: 1.08, rotate: 0, zIndex: 40 } : {}}
      transition={{ type: 'spring', stiffness: 310, damping: 26 }}
      onClick={() => playable && onSelect(card)}
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
      {/* Selection glow aura */}
      {isSelected && (
        <motion.div
          animate={{ opacity: [0.45, 0.9, 0.45] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', inset: -10,
            borderRadius: 18,
            background: `radial-gradient(ellipse at 50% 85%, ${meta.glow}55 0%, transparent 68%)`,
            pointerEvents: 'none', zIndex: -1,
          }}
        />
      )}

      {/* Card body */}
      <div style={{
        width: CARD_W, height: CARD_H,
        borderRadius: 12,
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        boxShadow: isSelected
          ? `0 0 30px ${meta.glow}70, 0 0 10px ${meta.glow}35, 0 16px 40px rgba(0,0,0,0.85)`
          : '0 6px 22px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.45)',
        border: isSelected
          ? `2px solid ${meta.accent}`
          : `1.5px solid ${meta.accent}45`,
        position: 'relative',
      }}>
        {/* Shimmer sweep on selection */}
        {isSelected && (
          <motion.div
            animate={{ x: ['-100%', '220%'] }}
            transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 0.5, ease: 'linear' }}
            style={{
              position: 'absolute', top: 0, bottom: 0, width: '48%', zIndex: 10,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.11), transparent)',
              pointerEvents: 'none',
            }}
          />
        )}

        {/* Icon area */}
        <div style={{
          flex: '0 0 68%',
          background: meta.bg,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Top-left corner accent */}
          <div style={{
            position: 'absolute', top: 6, left: 6, width: 10, height: 10,
            borderTop: '1.5px solid rgba(255,255,255,0.18)',
            borderLeft: '1.5px solid rgba(255,255,255,0.18)',
          }} />
          {/* Top-right corner accent */}
          <div style={{
            position: 'absolute', top: 6, right: 6, width: 10, height: 10,
            borderTop: '1.5px solid rgba(255,255,255,0.18)',
            borderRight: '1.5px solid rgba(255,255,255,0.18)',
          }} />
          {/* Radial light from top */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.11) 0%, transparent 60%)',
          }} />
          {card.type === 'topple' ? <ToppleIcon />
            : card.type === 'toast' ? <ToastIcon />
            : <UpArrowIcon num={meta.num} accent={meta.accent} glow={meta.glow} />}
        </div>

        {/* Label area — dark parchment */}
        <div style={{
          flex: '0 0 32%',
          background: 'linear-gradient(180deg, #180c02 0%, #0e0701 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          borderTop: `1.5px solid ${meta.accent}50`,
          padding: '2px 6px',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: 0, left: 10, right: 10, height: 1,
            background: `linear-gradient(90deg, transparent, ${meta.accent}35, transparent)`,
          }} />
          <span style={{
            fontSize: 9,
            fontFamily: '"Cinzel Decorative", cursive',
            color: meta.accent,
            fontWeight: 700,
            letterSpacing: '0.05em',
            textAlign: 'center',
            lineHeight: 1.25,
            textShadow: `0 0 10px ${meta.glow}55`,
          }}>
            {meta.label}
            {meta.num && <span style={{ display: 'block', fontSize: 14, marginTop: 1 }}>{meta.num}</span>}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function PlayerHand({ hand, selectedCard, onCardSelect, isMyTurn }) {
  if (!hand || hand.length === 0) return null

  const total   = hand.length
  const spacing = Math.min(108, Math.max(74, 520 / total))
  const baseY   = 8
  const maxRot  = Math.min(5.5, total * 1.1)

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 14,
        left: '50%',
        transform: 'translateX(-50%)',
        width: Math.min(720, total * spacing + CARD_W + 40),
        height: CARD_H + 54,
        zIndex: 20,
      }}
      role="group"
      aria-label="Your hand"
    >
      <AnimatePresence>
        {hand.map((card, i) => {
          const t        = total > 1 ? (i - (total - 1) / 2) / ((total - 1) / 2) : 0
          const xOffset  = (i - (total - 1) / 2) * spacing
          const rotation = t * maxRot
          return (
            <ActionCard
              key={card.id}
              card={card}
              xOffset={xOffset}
              baseY={baseY}
              rotation={rotation}
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
