import { motion } from 'framer-motion'

const TIKI_LOOKUP = {
  hookipa: { name: 'Hookipa', color: '#9e9e9e' },
  lani:    { name: 'Lani',    color: '#ab47bc' },
  kai:     { name: 'Kai',     color: '#ef5350' },
  malu:    { name: 'Malu',    color: '#f06292' },
  nalu:    { name: 'Nalu',    color: '#ffa726' },
  pele:    { name: 'Pele',    color: '#ff7043' },
  honu:    { name: 'Honu',    color: '#66bb6a' },
  mana:    { name: 'Mana',    color: '#42a5f5' },
  koa:     { name: 'Koa',     color: '#a1887f' },
}

const ROW_CONFIGS = [
  { key: 'top',    pts: 9, thresh: 'POSITION #1',  badge: { bg: 'linear-gradient(135deg, #d4af37, #c8980a)', text: '#1a0c00', shadow: 'rgba(212,175,55,0.55)' } },
  { key: 'middle', pts: 5, thresh: 'TOP 2',         badge: { bg: 'linear-gradient(135deg, #b0bec5, #8fa8b2)', text: '#101820', shadow: 'rgba(150,180,200,0.4)' } },
  { key: 'bottom', pts: 2, thresh: 'TOP 3',         badge: { bg: 'linear-gradient(135deg, #a0785a, #8c6040)', text: '#120900', shadow: 'rgba(140,100,60,0.4)' } },
]

// Decorative SVG tiki face watermark
function TikiWatermark() {
  return (
    <svg viewBox="0 0 60 70" width={60} height={70} style={{ display: 'block', opacity: 0.05 }}>
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

export default function SecretTikiCard({ secretCard }) {
  if (!secretCard) return null

  return (
    <motion.div
      initial={{ x: -170, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.35 }}
      style={{
        width: 158, height: 224,
        flexShrink: 0,
        background: `
          linear-gradient(148deg, rgba(212,175,55,0.06) 0%, transparent 45%),
          linear-gradient(180deg, #2e1400 0%, #1e0c00 55%, #120700 100%)
        `,
        borderRadius: 14,
        border: '1.5px solid rgba(212,175,55,0.48)',
        boxShadow: '0 0 36px rgba(212,175,55,0.18), 0 12px 44px rgba(0,0,0,0.88), inset 0 0 28px rgba(0,0,0,0.22)',
        padding: '12px 14px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Shimmer sweep */}
      <motion.div
        animate={{ x: ['-100%', '240%'] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear', repeatDelay: 2.8 }}
        style={{
          position: 'absolute', top: 0, bottom: 0, width: '38%',
          background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.11), transparent)',
          pointerEvents: 'none',
        }}
      />

      {/* Tiki watermark */}
      <div style={{ position: 'absolute', bottom: 14, right: 12, pointerEvents: 'none' }}>
        <TikiWatermark />
      </div>

      {/* Corner filigree */}
      {[
        { top: 6, left: 6,   borderTop: '1.5px solid rgba(212,175,55,0.38)', borderLeft:  '1.5px solid rgba(212,175,55,0.38)', borderTopLeftRadius: 7 },
        { top: 6, right: 6,  borderTop: '1.5px solid rgba(212,175,55,0.38)', borderRight: '1.5px solid rgba(212,175,55,0.38)', borderTopRightRadius: 7 },
        { bottom: 6, left: 6,  borderBottom: '1.5px solid rgba(212,175,55,0.28)', borderLeft:  '1.5px solid rgba(212,175,55,0.28)', borderBottomLeftRadius: 7 },
        { bottom: 6, right: 6, borderBottom: '1.5px solid rgba(212,175,55,0.28)', borderRight: '1.5px solid rgba(212,175,55,0.28)', borderBottomRightRadius: 7 },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...s }} />
      ))}

      {/* Header */}
      <div style={{
        fontSize: 7.5,
        letterSpacing: '0.22em',
        color: 'rgba(212,175,55,0.7)',
        textAlign: 'center',
        fontFamily: '"Cinzel Decorative", cursive',
        fontWeight: 700,
        marginBottom: 8,
      }}>
        SECRET TIKIS
      </div>

      {/* Gold divider */}
      <div style={{
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)',
        marginBottom: 13,
      }} />

      {/* Tiki rows */}
      {ROW_CONFIGS.map(({ key, pts, thresh, badge }) => {
        const tikId = secretCard[key]
        const tiki  = TIKI_LOOKUP[tikId] || { name: tikId || '?', color: '#888' }

        return (
          <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
            {/* LED glow orb */}
            <div style={{
              width: 15, height: 15, borderRadius: '50%', flexShrink: 0,
              background: `radial-gradient(circle at 32% 30%, white 0%, ${tiki.color} 40%, ${tiki.color}99 100%)`,
              boxShadow: `0 0 10px ${tiki.color}99, 0 0 4px ${tiki.color}55, inset 0 1px 2px rgba(255,255,255,0.3)`,
              border: '1px solid rgba(255,255,255,0.12)',
            }} />

            {/* Name + threshold */}
            <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <div style={{
                fontSize: 14.5,
                color: '#f5ead0',
                fontFamily: '"Crimson Text", serif',
                fontWeight: 700,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                lineHeight: 1.1,
              }}>
                {tiki.name}
              </div>
              <div style={{
                fontSize: 7.5,
                color: 'rgba(245,234,208,0.38)',
                fontFamily: '"Cinzel Decorative", cursive',
                letterSpacing: '0.08em',
                marginTop: 2,
              }}>
                {thresh}
              </div>
            </div>

            {/* Points badge */}
            <div style={{
              background: badge.bg,
              color: badge.text,
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 900,
              padding: '3px 7px',
              fontFamily: '"Cinzel Decorative", cursive',
              flexShrink: 0,
              boxShadow: `0 2px 10px ${badge.shadow}`,
              minWidth: 30,
              textAlign: 'center',
              letterSpacing: '-0.01em',
            }}>
              +{pts}
            </div>
          </div>
        )
      })}

      {/* Bottom divider */}
      <div style={{
        position: 'absolute', bottom: 12, left: 14, right: 14, height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.25), transparent)',
      }} />
    </motion.div>
  )
}
