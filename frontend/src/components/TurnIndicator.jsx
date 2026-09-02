import { motion, AnimatePresence } from 'framer-motion'

// Step indicator pill
function StepDot({ active, done, label, num }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <motion.div
        animate={active
          ? { scale: [1, 1.22, 1], boxShadow: ['0 0 0px #d4af37', '0 0 12px #d4af37cc', '0 0 0px #d4af37'] }
          : {}
        }
        transition={{ duration: 1.2, repeat: Infinity }}
        style={{
          width: 20, height: 20,
          borderRadius: '50%',
          background: done
            ? 'linear-gradient(135deg, #d4af37, #a8860a)'
            : active
              ? 'linear-gradient(135deg, #d4af37cc, #d4af3788)'
              : 'rgba(255,255,255,0.08)',
          border: active
            ? '1.5px solid #d4af37'
            : done
              ? '1.5px solid #d4af37aa'
              : '1.5px solid rgba(255,255,255,0.12)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          fontSize: 9,
          fontFamily: '"Cinzel Decorative", cursive',
          fontWeight: 900,
          color: done || active ? '#1a0800' : 'rgba(245,234,208,0.3)',
        }}
      >
        {done ? '✓' : num}
      </motion.div>
      <span style={{
        fontSize: 10,
        fontFamily: '"Cinzel Decorative", cursive',
        color: active
          ? 'rgba(245,234,208,0.92)'
          : done
            ? 'rgba(212,175,55,0.6)'
            : 'rgba(245,234,208,0.28)',
        letterSpacing: '0.04em',
        transition: 'color 0.3s',
        whiteSpace: 'nowrap',
      }}>
        {label}
      </span>
    </div>
  )
}

// Entrance flash overlay
function FlashOverlay() {
  return (
    <motion.div
      initial={{ opacity: 0.6 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{
        position: 'absolute', inset: -4,
        borderRadius: 32,
        background: 'radial-gradient(ellipse at 50% 50%, rgba(212,175,55,0.5) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}
    />
  )
}

export default function TurnIndicator({ isMyTurn, selectedCard, currentPlayerName, currentPlayerColor }) {
  const cardPicked = !!selectedCard
  const needsTikiPick = selectedCard && selectedCard.type !== 'toast'

  return (
    <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <AnimatePresence mode="wait">

        {/* ── MY TURN ─────────────────────────────────────────────────────── */}
        {isMyTurn ? (
          <motion.div
            key="my-turn"
            initial={{ y: 30, opacity: 0, scale: 0.72 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -18, opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            style={{ position: 'relative' }}
          >
            {/* Outer glow ring */}
            <motion.div
              animate={{
                boxShadow: [
                  '0 0  0px rgba(212,175,55,0.0)',
                  '0 0 40px rgba(212,175,55,0.55)',
                  '0 0  0px rgba(212,175,55,0.0)',
                ],
              }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'linear-gradient(160deg, rgba(30,12,0,0.97) 0%, rgba(14,5,0,0.98) 100%)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                border: '1.5px solid rgba(212,175,55,0.55)',
                borderRadius: 30,
                padding: '10px 28px 14px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                minWidth: 240,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ['-100%', '280%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'linear', repeatDelay: 1.6 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: '36%',
                  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.15), transparent)',
                  pointerEvents: 'none',
                }}
              />

              {/* Top gold line */}
              <div style={{
                position: 'absolute', top: 0, left: 30, right: 30, height: 2,
                background: 'linear-gradient(90deg, transparent, #d4af37cc, transparent)',
                borderRadius: 2,
              }} />

              {/* YOUR TURN */}
              <motion.span
                animate={{
                  textShadow: [
                    '0 0 10px rgba(212,175,55,0.3)',
                    '0 0 28px rgba(212,175,55,0.9)',
                    '0 0 10px rgba(212,175,55,0.3)',
                  ],
                }}
                transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  color: '#d4af37',
                  fontFamily: '"Cinzel Decorative", cursive',
                  fontSize: 'clamp(15px, 1.7vw, 20px)',
                  fontWeight: 900,
                  letterSpacing: '0.14em',
                }}
              >
                YOUR TURN
              </motion.span>

              {/* Step indicators */}
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <StepDot
                  num="1"
                  label="Pick Card"
                  active={!cardPicked}
                  done={cardPicked}
                />
                {/* Connector */}
                <div style={{
                  width: 18, height: 1,
                  background: cardPicked
                    ? 'rgba(212,175,55,0.4)'
                    : 'rgba(255,255,255,0.1)',
                  transition: 'background 0.3s',
                }} />
                <StepDot
                  num="2"
                  label="Pick Tiki"
                  active={cardPicked && needsTikiPick}
                  done={false}
                />
              </div>

              <FlashOverlay key={isMyTurn ? 'flash' : 'noflash'} />
            </motion.div>
          </motion.div>

        ) : (
          /* ── ENEMY TURN ───────────────────────────────────────────────── */
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: -10, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.94 }}
            transition={{ duration: 0.22 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(160deg, rgba(14,5,0,0.94) 0%, rgba(8,3,0,0.96) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: `1.5px solid ${currentPlayerColor || '#888'}44`,
              borderRadius: 24,
              padding: '9px 20px',
              boxShadow: `0 0 18px ${currentPlayerColor || '#888'}22, 0 6px 24px rgba(0,0,0,0.65)`,
            }}
          >
            {/* Color accent left bar */}
            <div style={{
              width: 3, height: 28, borderRadius: 3,
              background: currentPlayerColor || '#888',
              boxShadow: `0 0 10px ${currentPlayerColor || '#888'}99`,
              flexShrink: 0,
            }} />

            <span style={{
              color: 'rgba(245,234,208,0.7)',
              fontSize: 'clamp(12px, 1.2vw, 15px)',
              fontFamily: '"Cinzel Decorative", cursive',
              fontWeight: 600,
              letterSpacing: '0.04em',
              maxWidth: 120,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {currentPlayerName}
            </span>

            {/* Bouncing dots */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 0.22, 0.44].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], y: [0, -4, 0] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay, ease: 'easeInOut' }}
                  style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: currentPlayerColor || '#888',
                    boxShadow: `0 0 6px ${currentPlayerColor || '#888'}88`,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  )
}
