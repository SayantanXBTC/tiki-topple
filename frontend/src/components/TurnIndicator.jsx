import { motion, AnimatePresence } from 'framer-motion'

export default function TurnIndicator({ isMyTurn, selectedCard, currentPlayerName, currentPlayerColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', pointerEvents: 'none' }}>
      <AnimatePresence mode="wait">
        {isMyTurn ? (
          <motion.div
            key="my-turn"
            initial={{ y: -26, opacity: 0, scale: 0.88 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.93 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 4px 24px rgba(0,0,0,0.55), 0 0 0px rgba(212,175,55,0)',
                  '0 4px 34px rgba(0,0,0,0.65), 0 0 24px rgba(212,175,55,0.48)',
                  '0 4px 24px rgba(0,0,0,0.55), 0 0 0px rgba(212,175,55,0)',
                ],
              }}
              transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
              style={{
                background: 'linear-gradient(160deg, rgba(26,9,0,0.97) 0%, rgba(14,5,0,0.98) 100%)',
                backdropFilter: 'blur(14px)',
                WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(212,175,55,0.52)',
                borderRadius: 28,
                padding: '10px 32px 11px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                minWidth: 218,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Shimmer sweep */}
              <motion.div
                animate={{ x: ['-100%', '260%'] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: 'linear', repeatDelay: 1.4 }}
                style={{
                  position: 'absolute', top: 0, bottom: 0, width: '38%',
                  background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.14), transparent)',
                  pointerEvents: 'none',
                }}
              />

              {/* YOUR TURN label */}
              <motion.span
                animate={{
                  textShadow: [
                    '0 0 8px rgba(212,175,55,0.3)',
                    '0 0 20px rgba(212,175,55,0.72)',
                    '0 0 8px rgba(212,175,55,0.3)',
                  ],
                }}
                transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  color: '#d4af37',
                  fontFamily: '"Cinzel Decorative", cursive',
                  fontSize: 'clamp(13px, 1.55vw, 18px)',
                  fontWeight: 900,
                  letterSpacing: '0.1em',
                }}
              >
                YOUR TURN
              </motion.span>

              {/* Sub-hint */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
                  transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
                  style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: selectedCard ? '#d4af37' : 'rgba(245,234,208,0.28)',
                    flexShrink: 0,
                    transition: 'background 0.3s',
                  }}
                />
                <span style={{
                  color: selectedCard ? 'rgba(245,234,208,0.88)' : 'rgba(245,234,208,0.38)',
                  fontFamily: '"Crimson Text", serif',
                  fontSize: 'clamp(11px, 1.1vw, 14px)',
                  fontStyle: 'italic',
                  letterSpacing: '0.02em',
                  transition: 'color 0.3s',
                }}>
                  {selectedCard ? 'Tap a tiki on the board' : 'Select a card below'}
                </span>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.24 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              background: 'linear-gradient(160deg, rgba(14,5,0,0.92) 0%, rgba(8,3,0,0.94) 100%)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              border: '1.5px solid rgba(212,175,55,0.14)',
              borderRadius: 22,
              padding: '8px 18px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.6)',
            }}
          >
            {/* Bouncing dots in player color */}
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              {[0, 0.25, 0.5].map((delay, i) => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 1, 0.2], scale: [0.65, 1.25, 0.65] }}
                  transition={{ duration: 1.3, repeat: Infinity, delay, ease: 'easeInOut' }}
                  style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: currentPlayerColor || '#888',
                    boxShadow: `0 0 7px ${currentPlayerColor || '#888'}99`,
                  }}
                />
              ))}
            </div>

            <span style={{
              color: 'rgba(245,234,208,0.58)',
              fontSize: 'clamp(12px, 1.2vw, 15px)',
              fontFamily: '"Crimson Text", serif',
              fontStyle: 'italic',
            }}>
              {currentPlayerName}&rsquo;s turn…
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
