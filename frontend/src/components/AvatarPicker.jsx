import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AVATARS } from '../data/avatars'

// ── Selection ring SVG ────────────────────────────────────────────────────────

function SelectionRing({ isSelected, color }) {
  const circumference = 2 * Math.PI * 44  // r=44 for a 90×90 viewBox

  return (
    <svg
      viewBox="0 0 96 96"
      style={{
        position: 'absolute', inset: -4,
        width: 'calc(100% + 8px)',
        height: 'calc(100% + 8px)',
        overflow: 'visible',
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      {/* Background ring — always visible, faint */}
      <circle
        cx="48" cy="48" r="44"
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth="2"
      />
      {/* Animated selection ring */}
      <motion.circle
        cx="48" cy="48" r="44"
        fill="none"
        stroke="#d4af37"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{
          pathLength: isSelected ? 1 : 0,
          opacity:    isSelected ? 1 : 0,
        }}
        transition={{ duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ rotate: -90 }}
      />
      {/* Corner accent marks */}
      {isSelected && (
        <>
          {[0, 90, 180, 270].map(deg => (
            <motion.circle
              key={deg}
              cx={48 + 44 * Math.cos((deg - 90) * Math.PI / 180)}
              cy={48 + 44 * Math.sin((deg - 90) * Math.PI / 180)}
              r="2.5"
              fill="#d4af37"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 400 }}
            />
          ))}
        </>
      )}
    </svg>
  )
}

// ── Avatar card ───────────────────────────────────────────────────────────────

function AvatarCard({ avatar, isSelected, onSelect, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={isSelected
        ? { scale: 1.12, y: -8, opacity: 1 }
        : { scale: 1.0,  y: 0,  opacity: 1 }
      }
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 280,
        damping: 22,
      }}
      whileHover={!isSelected ? { scale: 1.06, y: -4 } : {}}
      onClick={() => onSelect(avatar.id)}
      style={{
        position: 'relative',
        width: 100,
        height: 132,
        borderRadius: 10,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      {/* Card background */}
      <motion.div
        animate={{
          boxShadow: isSelected
            ? '0 0 20px rgba(212,175,55,0.8), 0 8px 24px rgba(0,0,0,0.7)'
            : '0 4px 12px rgba(0,0,0,0.5)',
          borderColor: isSelected ? 'rgba(212,175,55,0.8)' : 'rgba(255,255,255,0.1)',
        }}
        style={{
          position: 'absolute', inset: 0,
          borderRadius: 10,
          background: 'radial-gradient(ellipse at 50% 30%, rgba(60,30,0,0.9) 0%, rgba(13,4,0,0.95) 100%)',
          border: '2px solid rgba(255,255,255,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Wood grain texture overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `repeating-linear-gradient(
            87deg,
            transparent 0px, transparent 3px,
            rgba(255,255,255,0.012) 3px, rgba(255,255,255,0.012) 4px
          )`,
          pointerEvents: 'none',
        }} />

        {/* Desaturate when not selected */}
        <motion.div
          animate={{ opacity: isSelected ? 0 : 0.45 }}
          style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0.0)',
            filter: 'saturate(0.3)',
            pointerEvents: 'none',
            mixBlendMode: 'color',
          }}
        />
      </motion.div>

      {/* SVG avatar */}
      <div
        dangerouslySetInnerHTML={{ __html: avatar.svg }}
        style={{
          position: 'absolute',
          top: 4,
          left: 4,
          right: 4,
          height: 92,
          overflow: 'hidden',
          borderRadius: '6px 6px 0 0',
          filter: isSelected ? 'none' : 'saturate(0.65) brightness(0.85)',
          transition: 'filter 0.3s ease',
        }}
      />

      {/* Name label */}
      <div style={{
        position: 'absolute',
        bottom: 6,
        left: 0, right: 0,
        textAlign: 'center',
      }}>
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 9,
                color: '#d4af37',
                letterSpacing: '0.06em',
                lineHeight: 1.2,
                padding: '0 4px',
                textShadow: '0 0 8px rgba(212,175,55,0.6)',
              }}
            >
              {avatar.name}
            </motion.div>
          )}
        </AnimatePresence>
        {!isSelected && (
          <div style={{
            fontFamily: '"Cinzel Decorative", cursive',
            fontSize: 8,
            color: 'rgba(245,234,208,0.45)',
            letterSpacing: '0.04em',
            padding: '0 4px',
          }}>
            {avatar.name.split(' ').pop()}
          </div>
        )}
      </div>

      {/* Selection ring */}
      <SelectionRing isSelected={isSelected} />
    </motion.div>
  )
}

// ── AvatarPicker ───────────────────────────────────────────────────────────────

export default function AvatarPicker({ selectedId, onSelect }) {
  const scrollRef = useRef(null)

  // Auto-scroll to keep selected card centered
  useEffect(() => {
    if (!scrollRef.current || !selectedId) return
    const idx = AVATARS.findIndex(a => a.id === selectedId)
    if (idx === -1) return
    const el = scrollRef.current
    const cardW = 100 + 12  // card width + gap
    const targetScroll = idx * cardW - el.clientWidth / 2 + cardW / 2
    el.scrollTo({ left: targetScroll, behavior: 'smooth' })
  }, [selectedId])

  return (
    <div style={{ width: '100%' }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.14em',
        color: 'rgba(212,175,55,0.7)',
        fontFamily: '"Cinzel Decorative", cursive',
        marginBottom: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        CHOOSE YOUR AVATAR
        {!selectedId && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ fontSize: 9, color: 'rgba(212,175,55,0.5)', fontStyle: 'italic' }}
          >
            (required)
          </motion.span>
        )}
      </div>

      {/* Scrollable row */}
      <div
        ref={scrollRef}
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 8,
          paddingTop: 12,
          paddingLeft: 4,
          paddingRight: 4,
          // Hide scrollbar but keep scroll
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {AVATARS.map((avatar, i) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            isSelected={selectedId === avatar.id}
            onSelect={onSelect}
            index={i}
          />
        ))}
      </div>

      {/* Fade edges */}
      <div style={{
        position: 'relative',
        pointerEvents: 'none',
        marginTop: -8,
        height: 0,
      }}>
        <div style={{
          position: 'absolute', left: 0, top: -128, bottom: 0, width: 24,
          background: 'linear-gradient(90deg, rgba(13,4,0,0.8), transparent)',
        }} />
        <div style={{
          position: 'absolute', right: 0, top: -128, bottom: 0, width: 24,
          background: 'linear-gradient(270deg, rgba(13,4,0,0.8), transparent)',
        }} />
      </div>
    </div>
  )
}
