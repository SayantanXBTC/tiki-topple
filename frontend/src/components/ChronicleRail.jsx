import { useMemo } from 'react'
import { motion } from 'framer-motion'

const GOLD       = '#d4af37'
const GOLD_LIGHT = '#fbe58a'
const GOLD_DARK  = '#7a5810'
const CREAM      = '#f5ead0'

// Ornate metallic gold border helper
const goldBorder = () => `linear-gradient(135deg,
  ${GOLD_DARK} 0%, ${GOLD} 22%, ${GOLD_LIGHT} 46%, ${GOLD} 62%, ${GOLD_DARK} 88%, ${GOLD_LIGHT} 100%)`

function Corner({ pos, size = 18 }) {
  const rot = { tl: 0, tr: 90, br: 180, bl: 270 }[pos]
  const s   = { tl: { top: 4, left: 4 }, tr: { top: 4, right: 4 },
                br: { bottom: 4, right: 4 }, bl: { bottom: 4, left: 4 } }[pos]
  return (
    <svg viewBox="0 0 22 22" width={size} height={size}
         style={{ position: 'absolute', ...s, transform: `rotate(${rot}deg)`, zIndex: 4, pointerEvents: 'none' }}>
      <defs>
        <linearGradient id={`rail-crn-${pos}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%"  stopColor={GOLD_LIGHT} />
          <stop offset="60%" stopColor={GOLD} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <path d="M 1 10 Q 1 1 10 1 L 15 1 L 15 3 L 10 3 Q 3 3 3 10 L 3 15 L 1 15 Z"
            fill={`url(#rail-crn-${pos})`} />
      <circle cx="4" cy="4" r="1.6" fill={GOLD_LIGHT} stroke={GOLD_DARK} strokeWidth="0.4" />
    </svg>
  )
}

// ── Round progress arc ──────────────────────────────────────────────────────
function RoundProgress({ round, total }) {
  const pct = Math.min(1, Math.max(0, round / total))
  const size = 78
  const stroke = 6
  const r = size / 2 - stroke
  const c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <defs>
          <linearGradient id="ring-arc" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%"  stopColor={GOLD_LIGHT} />
            <stop offset="60%" stopColor={GOLD} />
            <stop offset="100%" stopColor={GOLD_DARK} />
          </linearGradient>
        </defs>
        <circle cx={size/2} cy={size/2} r={r} stroke="rgba(212,175,55,0.15)"
                strokeWidth={stroke} fill="none" />
        <motion.circle
          cx={size/2} cy={size/2} r={r}
          stroke="url(#ring-arc)" strokeWidth={stroke} fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: c * (1 - pct) }}
          transition={{ type: 'spring', stiffness: 80, damping: 22 }}
          style={{ filter: `drop-shadow(0 0 6px ${GOLD}aa)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 7.5, letterSpacing: '0.22em',
          color: 'rgba(212,175,55,0.6)', lineHeight: 1,
        }}>ROUND</span>
        <span style={{
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 22, fontWeight: 900,
          background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DARK})`,
          WebkitBackgroundClip: 'text', backgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.05,
        }}>{round}</span>
        <span style={{
          fontFamily: '"Cinzel Decorative", serif',
          fontSize: 8.5, color: 'rgba(212,175,55,0.55)', lineHeight: 1,
        }}>of {total}</span>
      </div>
    </div>
  )
}

// ── Chronicle rail — right-side royal panel ─────────────────────────────────
export default function ChronicleRail({ round = 1, totalRounds = 4, players = [], myPlayerId }) {
  const sortedByScore = useMemo(
    () => [...(players || [])].sort((a, b) => (b.score || 0) - (a.score || 0)),
    [players]
  )
  const leader = sortedByScore[0]

  return (
    <motion.aside
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 240, damping: 22, delay: 0.15 }}
      style={{
        position: 'absolute',
        right: 12, top: 80, bottom: 260,
        width: 210,
        display: 'flex', flexDirection: 'column',
        gap: 14, pointerEvents: 'auto',
        zIndex: 9,
      }}
    >
      {/* Panel: Round Progress */}
      <Panel title="Chronicle">
        <RoundProgress round={round} totalRounds={totalRounds} total={totalRounds} />
        <div style={{
          textAlign: 'center', marginTop: 8,
          fontFamily: '"Crimson Text", serif',
          fontStyle: 'italic', fontSize: 11,
          color: 'rgba(245,234,208,0.55)',
        }}>
          The tikis await your fate…
        </div>
      </Panel>

      {/* Panel: Standings */}
      <Panel title="Standings">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
          {sortedByScore.map((p, i) => (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 8px',
              borderRadius: 8,
              background: p.id === myPlayerId
                ? 'linear-gradient(90deg, rgba(212,175,55,0.14), rgba(212,175,55,0.03))'
                : 'rgba(0,0,0,0.28)',
              border: p.id === myPlayerId
                ? `1px solid ${GOLD}66`
                : '1px solid rgba(212,175,55,0.14)',
            }}>
              {/* Rank */}
              <span style={{
                fontFamily: '"Cinzel Decorative", serif',
                fontSize: 11, fontWeight: 900,
                color: i === 0 ? GOLD_LIGHT : 'rgba(245,234,208,0.5)',
                minWidth: 12, textAlign: 'center',
                textShadow: i === 0 ? `0 0 6px ${GOLD}` : 'none',
              }}>
                {i + 1}
              </span>
              {/* Color chip */}
              <span style={{
                width: 8, height: 8, borderRadius: 2,
                background: p.color,
                boxShadow: `0 0 6px ${p.color}, inset 0 0 2px rgba(255,255,255,0.4)`,
                flexShrink: 0,
              }} />
              {/* Name */}
              <span style={{
                flex: 1, minWidth: 0,
                fontFamily: '"Cinzel Decorative", serif',
                fontSize: 11,
                color: p.id === myPlayerId ? CREAM : 'rgba(245,234,208,0.72)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {p.name}
              </span>
              {/* Score */}
              <span style={{
                fontFamily: '"Cinzel Decorative", serif',
                fontSize: 12, fontWeight: 900,
                background: `linear-gradient(180deg, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DARK})`,
                WebkitBackgroundClip: 'text', backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                minWidth: 20, textAlign: 'right',
              }}>
                {p.score ?? 0}
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Panel: Sacred Omen (flavor / hint) */}
      <Panel title="Omen">
        <div style={{
          fontFamily: '"Crimson Text", serif',
          fontStyle: 'italic', fontSize: 12,
          color: 'rgba(245,234,208,0.68)',
          lineHeight: 1.5,
          textAlign: 'center',
          padding: '4px 6px',
        }}>
          {leader
            ? <>The <strong style={{ color: GOLD_LIGHT }}>{leader.name}</strong> tribe rises in the torchlight.</>
            : <>The oracle waits in silence…</>}
        </div>
      </Panel>
    </motion.aside>
  )
}

// ── Panel container ─────────────────────────────────────────────────────────
function Panel({ title, children }) {
  return (
    <div style={{
      position: 'relative',
      background: 'linear-gradient(160deg, rgba(28,12,2,0.94) 0%, rgba(10,4,0,0.96) 100%)',
      border: '1.5px solid transparent',
      borderRadius: 14,
      backgroundImage: `linear-gradient(160deg, rgba(28,12,2,0.94), rgba(10,4,0,0.96)),
                        ${goldBorder()}`,
      backgroundOrigin: 'border-box',
      backgroundClip: 'padding-box, border-box',
      padding: '18px 14px 14px',
      boxShadow: '0 10px 28px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,225,140,0.14)',
      backdropFilter: 'blur(22px) saturate(140%)',
      WebkitBackdropFilter: 'blur(22px) saturate(140%)',
    }}>
      <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
      {/* Title plaque */}
      <div style={{
        position: 'absolute', top: -9, left: '50%',
        transform: 'translateX(-50%)',
        background: `linear-gradient(180deg, ${GOLD_DARK}, ${GOLD} 50%, ${GOLD_DARK})`,
        padding: '2px 14px', borderRadius: 4,
        fontFamily: '"Cinzel Decorative", serif',
        fontSize: 9, fontWeight: 900,
        letterSpacing: '0.28em',
        color: '#1a0a00',
        boxShadow: '0 3px 10px rgba(0,0,0,0.75), inset 0 1px 0 rgba(255,255,255,0.35)',
        border: `1px solid ${GOLD_DARK}`,
        whiteSpace: 'nowrap',
      }}>
        {title.toUpperCase()}
      </div>
      {children}
    </div>
  )
}
