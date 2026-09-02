import { motion } from 'framer-motion'
import { TIKI_COLORS } from '../data/tikaColors'

const ROW_CONFIGS = [
  { key: 'top',    pts: 9, thresh: 'POSITION #1',  badge: { bg: 'linear-gradient(135deg, #d4af37, #c8980a)', text: '#1a0c00', shadow: 'rgba(212,175,55,0.55)' } },
  { key: 'middle', pts: 5, thresh: 'TOP 2',         badge: { bg: 'linear-gradient(135deg, #b0bec5, #8fa8b2)', text: '#101820', shadow: 'rgba(150,180,200,0.4)' } },
  { key: 'bottom', pts: 2, thresh: 'TOP 3',         badge: { bg: 'linear-gradient(135deg, #a0785a, #8c6040)', text: '#120900', shadow: 'rgba(140,100,60,0.4)' } },
]

// Carved scroll ornament band — top and bottom of card
function ScrollBand({ flip = false }) {
  return (
    <svg
      viewBox="0 0 130 20"
      width="100%"
      height={20}
      style={{ display: 'block', transform: flip ? 'scaleY(-1)' : 'none' }}
      preserveAspectRatio="none"
    >
      <rect width="130" height="20" fill="#3a1a06" />
      {/* Top + bottom ruled lines */}
      <line x1="0" y1="2.5"  x2="130" y2="2.5"  stroke="rgba(212,175,55,0.35)" strokeWidth="0.7" />
      <line x1="0" y1="17.5" x2="130" y2="17.5" stroke="rgba(212,175,55,0.22)" strokeWidth="0.5" />
      {/* Central diamond */}
      <polygon points="65,4 71,10 65,16 59,10" fill="none" stroke="rgba(212,175,55,0.65)" strokeWidth="0.85" />
      <circle cx="65" cy="10" r="1.6" fill="rgba(212,175,55,0.55)" />
      {/* Left knotwork loop */}
      <path d="M9,10 Q15,4.5 21,10 Q15,15.5 9,10Z" fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="0.75" />
      <circle cx="15" cy="10" r="1.1" fill="rgba(212,175,55,0.4)" />
      {/* Right knotwork loop */}
      <path d="M121,10 Q115,4.5 109,10 Q115,15.5 121,10Z" fill="none" stroke="rgba(212,175,55,0.45)" strokeWidth="0.75" />
      <circle cx="115" cy="10" r="1.1" fill="rgba(212,175,55,0.4)" />
      {/* Flanking accent dots */}
      {[30, 38, 92, 100].map((x, i) => (
        <circle key={i} cx={x} cy="10" r="0.9" fill="rgba(212,175,55,0.3)" />
      ))}
      {/* Subtle wood grain lines */}
      <line x1="0" y1="6"  x2="130" y2="6"  stroke="rgba(0,0,0,0.12)" strokeWidth="0.4" />
      <line x1="0" y1="10" x2="130" y2="10" stroke="rgba(0,0,0,0.08)" strokeWidth="0.3" />
      <line x1="0" y1="14" x2="130" y2="14" stroke="rgba(0,0,0,0.1)"  strokeWidth="0.4" />
    </svg>
  )
}

// Tiki face watermark
function TikiWatermark() {
  return (
    <svg viewBox="0 0 60 70" width={58} height={68} style={{ display: 'block', opacity: 0.06 }}>
      <ellipse cx="30" cy="28" rx="20" ry="24" fill="none" stroke="#d4af37" strokeWidth="2" />
      <ellipse cx="22" cy="24" rx="5" ry="6" fill="#d4af37" />
      <ellipse cx="38" cy="24" rx="5" ry="6" fill="#d4af37" />
      <circle cx="22" cy="24" r="2.5" fill="#1a0800" />
      <circle cx="38" cy="24" r="2.5" fill="#1a0800" />
      <path d="M22 36 Q30 42 38 36" stroke="#d4af37" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      <rect x="26" y="48" width="8" height="16" rx="2" fill="#d4af37" />
    </svg>
  )
}

// Crown icon for top-target row
function CrownIcon({ color }) {
  return (
    <svg viewBox="0 0 16 12" width={13} height={10} style={{ flexShrink: 0 }}>
      <polygon
        points="1,11 4,4 8,7 12,4 15,11"
        fill="none"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <circle cx="1"  cy="11" r="1.2" fill={color} />
      <circle cx="15" cy="11" r="1.2" fill={color} />
      <circle cx="8"  cy="6"  r="1.2" fill={color} />
    </svg>
  )
}

export default function SecretTikiCard({ secretCard }) {
  if (!secretCard) return null

  return (
    <motion.div
      initial={{ x: -170, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.35 }}
      style={{
        width: 162,
        flexShrink: 0,
        position: 'relative',
        // Carved wood base: subtle grain lines over warm brown
        background: `
          repeating-linear-gradient(
            89deg,
            transparent 0px,
            transparent 3px,
            rgba(0,0,0,0.028) 3px,
            rgba(0,0,0,0.028) 4px
          ),
          linear-gradient(158deg, #3e1f09 0%, #2b1306 42%, #1d0b03 100%)
        `,
        borderRadius: 13,
        // Outer wood border + inner gold ring via outline
        border: '2px solid #7d4014',
        outline: '1px solid rgba(212,175,55,0.28)',
        outlineOffset: '-5px',
        boxShadow: `
          0 0 36px rgba(212,175,55,0.16),
          0 16px 48px rgba(0,0,0,0.94),
          inset 0 0 0 1px rgba(212,175,55,0.12),
          inset 0 2px 14px rgba(0,0,0,0.45)
        `,
        overflow: 'hidden',
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        animate={{ x: ['-100%', '250%'] }}
        transition={{ duration: 4.0, repeat: Infinity, ease: 'linear', repeatDelay: 3.5 }}
        style={{
          position: 'absolute', top: 0, bottom: 0, width: '36%',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.1), transparent)',
          pointerEvents: 'none', zIndex: 3,
        }}
      />

      {/* Tiki watermark */}
      <div style={{ position: 'absolute', bottom: 30, right: 10, pointerEvents: 'none', zIndex: 0 }}>
        <TikiWatermark />
      </div>

      {/* TOP carved scroll band */}
      <ScrollBand />

      {/* Card body */}
      <div style={{ padding: '10px 13px 11px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{
          fontSize: 7.5,
          letterSpacing: '0.24em',
          color: 'rgba(212,175,55,0.78)',
          textAlign: 'center',
          fontFamily: '"Cinzel Decorative", cursive',
          fontWeight: 700,
          marginBottom: 9,
          textShadow: '0 0 10px rgba(212,175,55,0.45)',
        }}>
          SECRET TIKIS
        </div>

        {/* Gold ruled divider */}
        <div style={{
          height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.58), transparent)',
          marginBottom: 11,
        }} />

        {/* Tiki rows */}
        {ROW_CONFIGS.map(({ key, pts, thresh, badge }, rowIdx) => {
          const tikId = secretCard[key]
          const tiki  = TIKI_COLORS[tikId] || { name: tikId || '?', color: '#888' }
          const isTop = rowIdx === 0

          return (
            <motion.div
              key={key}
              animate={isTop
                ? {
                    boxShadow: [
                      `0 0  0px ${tiki.color}00`,
                      `0 0 16px ${tiki.color}66`,
                      `0 0  0px ${tiki.color}00`,
                    ],
                  }
                : {}
              }
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                marginBottom: rowIdx < 2 ? 9 : 0,
                padding: '6px 7px 6px 10px',
                borderRadius: 8,
                // Carved slot look — each row sits in its own inset panel
                background: isTop
                  ? `linear-gradient(90deg, ${tiki.color}1e 0%, ${tiki.color}0b 55%, transparent 100%)`
                  : 'rgba(255,255,255,0.025)',
                border: isTop
                  ? `1px solid ${tiki.color}4a`
                  : '1px solid rgba(255,255,255,0.045)',
                position: 'relative',
              }}
            >
              {/* Left color accent bar */}
              <div style={{
                position: 'absolute',
                left: 0, top: 5, bottom: 5,
                width: 3,
                borderRadius: 2,
                background: tiki.color,
                boxShadow: `0 0 8px ${tiki.color}aa, 0 0 4px ${tiki.color}66`,
              }} />

              {/* LED glow orb */}
              <div style={{
                width: 13, height: 13,
                borderRadius: '50%', flexShrink: 0,
                background: `radial-gradient(circle at 33% 30%, white 0%, ${tiki.color} 42%, ${tiki.color}88 100%)`,
                boxShadow: `0 0 10px ${tiki.color}aa, 0 0 4px ${tiki.color}66, inset 0 1px 2px rgba(255,255,255,0.35)`,
                border: '1px solid rgba(255,255,255,0.14)',
              }} />

              {/* Name + threshold */}
              <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {isTop && <CrownIcon color={tiki.color} />}
                  <div style={{
                    fontSize: 13,
                    color: isTop ? '#f5ead0' : 'rgba(245,234,208,0.8)',
                    fontFamily: '"Crimson Text", serif',
                    fontWeight: isTop ? 700 : 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    lineHeight: 1.15,
                    textShadow: isTop ? `0 0 12px ${tiki.color}55` : 'none',
                  }}>
                    {tiki.name}
                  </div>
                </div>
                <div style={{
                  fontSize: 6.8,
                  color: 'rgba(245,234,208,0.32)',
                  fontFamily: '"Cinzel Decorative", cursive',
                  letterSpacing: '0.08em',
                  marginTop: 1.5,
                }}>
                  {thresh}
                </div>
              </div>

              {/* Points badge */}
              <div style={{
                background: badge.bg,
                color: badge.text,
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 900,
                padding: '3px 6px',
                fontFamily: '"Cinzel Decorative", cursive',
                flexShrink: 0,
                boxShadow: `0 2px 10px ${badge.shadow}`,
                minWidth: 28,
                textAlign: 'center',
                letterSpacing: '-0.01em',
              }}>
                +{pts}
              </div>
            </motion.div>
          )
        })}

      </div>

      {/* BOTTOM carved scroll band — flipped */}
      <ScrollBand flip />
    </motion.div>
  )
}
