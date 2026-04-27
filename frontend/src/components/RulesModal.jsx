import { motion } from 'framer-motion'

const SECTIONS = [
  {
    num: '01',
    title: 'Winning',
    body: 'Most points after all rounds wins. Each round, score points based on where your secret tikis end up on the board.',
  },
  {
    num: '02',
    title: 'Secret Tikis',
    body: 'You receive a secret card each round with 3 target tikis. Only revealed at round end — keep your strategy hidden.',
  },
  {
    num: '03',
    title: 'Tiki Up',
    body: 'Move a tiki exactly 1, 2, or 3 positions toward the top. It cannot go past position 1.',
  },
  {
    num: '04',
    title: 'Tiki Topple',
    body: 'Send any tiki (not already at the bottom) to the very last position. Great for sabotaging opponents.',
  },
  {
    num: '05',
    title: 'Tiki Toast',
    body: 'Remove the bottom-most tiki entirely. Cannot be the very first card played. Cannot toast if 3 or fewer tikis remain.',
  },
  {
    num: '06',
    title: 'Round End',
    body: 'A round ends when all hands are empty or 3 or fewer tikis remain. Scores are revealed and the start seat shifts clockwise.',
  },
]

const SCORING = [
  { label: 'Top tiki at #1',      pts: '+9', tier: 'gold'   },
  { label: 'Middle tiki in top 2', pts: '+5', tier: 'silver' },
  { label: 'Bottom tiki in top 3', pts: '+2', tier: 'bronze' },
]

const TIER_COLORS = {
  gold:   '#d4af37',
  silver: '#b0c0cc',
  bronze: '#a0785a',
}

export default function RulesModal({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.74)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
      }}
    >
      <motion.div
        key="rules-panel"
        initial={{ scale: 0.82, opacity: 0, y: 28 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.88, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 270, damping: 26 }}
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%', maxWidth: 420,
          maxHeight: '88vh', overflowY: 'auto',
          background: 'linear-gradient(168deg, #2c1200 0%, #1c0a00 50%, #0e0500 100%)',
          border: '1.5px solid rgba(212,175,55,0.32)',
          borderRadius: 18,
          boxShadow: '0 0 50px rgba(212,175,55,0.1), 0 24px 70px rgba(0,0,0,0.8)',
          padding: '22px 22px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background shimmer */}
        <motion.div
          animate={{ x: ['-100%', '300%'] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          style={{
            position: 'absolute', top: 0, bottom: 0, width: '30%',
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.05), transparent)',
            pointerEvents: 'none', zIndex: 0,
          }}
        />

        {/* Corner filigree */}
        <div style={{ position: 'absolute', top: 8, left: 8, width: 16, height: 16, borderTop: '1.5px solid rgba(212,175,55,0.3)', borderLeft: '1.5px solid rgba(212,175,55,0.3)', borderTopLeftRadius: 8 }} />
        <div style={{ position: 'absolute', top: 8, right: 8, width: 16, height: 16, borderTop: '1.5px solid rgba(212,175,55,0.3)', borderRight: '1.5px solid rgba(212,175,55,0.3)', borderTopRightRadius: 8 }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <div style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 18, fontWeight: 900,
                color: '#d4af37',
                letterSpacing: '0.06em',
                textShadow: '0 0 18px rgba(212,175,55,0.45)',
              }}>
                How to Play
              </div>
              <div style={{
                fontSize: 11,
                color: 'rgba(245,234,208,0.38)',
                fontFamily: '"Crimson Text", serif',
                fontStyle: 'italic',
                marginTop: 3,
                letterSpacing: '0.04em',
              }}>
                Tiki Topple · 2–4 players
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.12, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: 'rgba(245,234,208,0.65)',
                width: 34, height: 34,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: 14,
                transition: 'background 0.2s',
              }}
            >
              ✕
            </motion.button>
          </div>

          {/* Gold rule */}
          <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)', marginBottom: 20 }} />

          {/* Rules sections */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {SECTIONS.map(({ num, title, body }, i) => (
              <motion.div
                key={num}
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, type: 'spring', stiffness: 280, damping: 28 }}
                style={{
                  display: 'flex', gap: 14, alignItems: 'flex-start',
                  paddingBottom: i < SECTIONS.length - 1 ? 16 : 0,
                  marginBottom: i < SECTIONS.length - 1 ? 16 : 0,
                  borderBottom: i < SECTIONS.length - 1 ? '1px solid rgba(212,175,55,0.1)' : 'none',
                }}
              >
                {/* Chapter number badge */}
                <div style={{
                  flexShrink: 0,
                  width: 38, height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(145deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.05) 100%)',
                  border: '1px solid rgba(212,175,55,0.28)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{
                    fontFamily: '"Cinzel Decorative", cursive',
                    fontSize: 10, fontWeight: 900,
                    color: 'rgba(212,175,55,0.7)',
                    letterSpacing: '0.02em',
                  }}>
                    {num}
                  </span>
                </div>

                {/* Text content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: '"Cinzel Decorative", cursive',
                    fontSize: 12, fontWeight: 700,
                    color: '#d4af37',
                    marginBottom: 5,
                    letterSpacing: '0.04em',
                  }}>
                    {title}
                  </div>
                  <div style={{
                    fontSize: 13,
                    color: 'rgba(245,234,208,0.68)',
                    fontFamily: '"Crimson Text", serif',
                    lineHeight: 1.6,
                  }}>
                    {body}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Scoring reference */}
          <div style={{ marginTop: 20 }}>
            <div style={{ height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.3), transparent)', marginBottom: 16 }} />

            <div style={{
              fontFamily: '"Cinzel Decorative", cursive',
              fontSize: 8.5, color: 'rgba(212,175,55,0.55)',
              letterSpacing: '0.18em', marginBottom: 12,
              textAlign: 'center',
            }}>
              SCORING REFERENCE
            </div>

            <div style={{
              background: 'rgba(212,175,55,0.04)',
              border: '1px solid rgba(212,175,55,0.14)',
              borderRadius: 12,
              overflow: 'hidden',
            }}>
              {SCORING.map(({ label, pts, tier }, i) => (
                <div
                  key={tier}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '11px 16px',
                    borderBottom: i < SCORING.length - 1 ? '1px solid rgba(212,175,55,0.08)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: TIER_COLORS[tier],
                      boxShadow: `0 0 7px ${TIER_COLORS[tier]}88`,
                    }} />
                    <span style={{
                      fontSize: 13, color: 'rgba(245,234,208,0.68)',
                      fontFamily: '"Crimson Text", serif',
                    }}>
                      {label}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 14, fontWeight: 900,
                    color: TIER_COLORS[tier],
                    fontFamily: '"Cinzel Decorative", cursive',
                    textShadow: `0 0 10px ${TIER_COLORS[tier]}55`,
                  }}>
                    {pts}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
