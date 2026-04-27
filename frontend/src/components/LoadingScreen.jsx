import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Animated tiki face ────────────────────────────────────────────────────────

function AnimatedTiki() {
  const [blink, setBlink] = useState(false)
  const [mouth, setMouth] = useState(false)

  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 180)
    }, 2800)

    const mouthInterval = setInterval(() => {
      setMouth(v => !v)
    }, 900)

    return () => {
      clearInterval(blinkInterval)
      clearInterval(mouthInterval)
    }
  }, [])

  return (
    <motion.svg
      viewBox="0 0 80 100"
      width={80}
      height={100}
      animate={{ y: [0, -5, 0] }}
      transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      {/* Body */}
      <ellipse cx="40" cy="54" rx="32" ry="40" fill="#b8860b"/>
      <ellipse cx="40" cy="54" rx="29" ry="37" fill="#c9981d"/>
      {/* Crown band */}
      <path d="M12 30 Q40 16 68 30" stroke="#d4af37" strokeWidth="3.5" strokeLinecap="round" fill="none"/>
      <path d="M16 34 Q40 22 64 34" stroke="#ffd700" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="4 3" fill="none"/>
      {/* Brow ridges */}
      <path d="M16 46 Q27 40 37 45" stroke="#7a5200" strokeWidth="3" strokeLinecap="round" fill="none"/>
      <path d="M43 45 Q53 40 64 46" stroke="#7a5200" strokeWidth="3" strokeLinecap="round" fill="none"/>
      {/* Eyes — blink by collapsing height */}
      <ellipse cx="26" cy="51" rx="8" ry={blink ? 1 : 8} fill="#1a0800" style={{ transition: 'ry 0.08s' }}/>
      <ellipse cx="54" cy="51" rx="8" ry={blink ? 1 : 8} fill="#1a0800" style={{ transition: 'ry 0.08s' }}/>
      {!blink && <><circle cx="24" cy="49" r="3" fill="white" opacity="0.9"/><circle cx="52" cy="49" r="3" fill="white" opacity="0.9"/></>}
      {/* Nose */}
      <polygon points="40,61 34,72 46,72" fill="#8a6200"/>
      {/* Mouth — open/close */}
      <rect x="23" y="76" width="34" height={mouth ? 14 : 10} rx="3" fill="#1a0800" style={{ transition: 'height 0.3s' }}/>
      {!mouth && <>
        <rect x="26" y="76" width="7" height="8" rx="2" fill="#f5ead0"/>
        <rect x="37" y="76" width="6" height="8" rx="2" fill="#f5ead0"/>
        <rect x="47" y="76" width="7" height="8" rx="2" fill="#f5ead0"/>
      </>}
      {/* Cheek notches */}
      <path d="M10 58 Q8 66 12 73" stroke="#8a6200" strokeWidth="2" strokeLinecap="round" fill="none"/>
      <path d="M70 58 Q72 66 68 73" stroke="#8a6200" strokeWidth="2" strokeLinecap="round" fill="none"/>
      {/* Gem */}
      <motion.circle
        cx="40" cy="24" r="4"
        fill="#d4af37"
        animate={{ opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 1.2, repeat: Infinity }}
      />
    </motion.svg>
  )
}

// ── Torch corners ─────────────────────────────────────────────────────────────

function CornerTorch({ corner }) {
  const isLeft = corner.includes('left')
  const isTop  = corner.includes('top')
  return (
    <div style={{
      position: 'absolute',
      [isTop ? 'top' : 'bottom']: 24,
      [isLeft ? 'left' : 'right']: 16,
      pointerEvents: 'none',
    }}>
      <div style={{ width: 6, height: 80, background: 'linear-gradient(#3d1f0a, #2a1000)', borderRadius: '0 0 3px 3px', margin: '0 auto' }} />
      <motion.div
        animate={{ scaleY: [1, 1.4, 0.8, 1.2, 1], scaleX: [1, 0.75, 1.1, 0.9, 1] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut', delay: Math.random() }}
        style={{ transformOrigin: 'bottom center', marginTop: -3 }}
      >
        <svg viewBox="0 0 24 40" width={24} height={40} style={{ display: 'block', margin: '0 auto' }}>
          <path d="M12 38 C 3 30 5 20 12 8 C 19 20 21 30 12 38Z" fill="#ff6b1a"/>
          <path d="M12 34 C 6 28 8 20 12 14 C 16 20 18 28 12 34Z" fill="#ffb347"/>
          <path d="M12 28 C 9 23 10 18 12 15 C 14 18 15 23 12 28Z" fill="#ffe066"/>
        </svg>
      </motion.div>
    </div>
  )
}

// ── Animated dots ─────────────────────────────────────────────────────────────

function ThreeDots() {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.18 }}
          style={{
            width: 8, height: 8,
            borderRadius: '50%',
            background: '#d4af37',
          }}
        />
      ))}
    </div>
  )
}

// ── LoadingScreen ─────────────────────────────────────────────────────────────

export default function LoadingScreen({ message = 'Loading Tiki Island...' }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed', inset: 0,
        background: '#0d0400',
        backgroundImage: `
          repeating-linear-gradient(90deg,  rgba(255,255,255,0.015) 0px, rgba(255,255,255,0.015) 1px, transparent 1px, transparent 60px),
          repeating-linear-gradient(180deg, rgba(255,255,255,0.01)  0px, rgba(255,255,255,0.01)  1px, transparent 1px, transparent 40px)
        `,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        zIndex: 1000,
      }}
      role="status"
      aria-live="polite"
      aria-label={message}
    >
      {/* Corner torches */}
      <CornerTorch corner="top-left" />
      <CornerTorch corner="top-right" />
      <CornerTorch corner="bottom-left" />
      <CornerTorch corner="bottom-right" />

      {/* Center glow */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        width: 360, height: 360,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(212,175,55,0.07) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Tiki face */}
      <AnimatedTiki />

      {/* Loading text */}
      <div style={{
        fontFamily: '"Cinzel Decorative", cursive',
        fontSize: 14,
        color: '#d4af37',
        letterSpacing: '0.1em',
        textShadow: '0 0 16px rgba(212,175,55,0.4)',
      }}>
        {message}
      </div>

      {/* Animated dots */}
      <ThreeDots />

      {/* Decorative divider */}
      <div style={{
        width: 140,
        height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.4), transparent)',
      }} />

      <div style={{
        fontSize: 10,
        color: 'rgba(245,234,208,0.3)',
        fontFamily: '"Crimson Text", serif',
        fontStyle: 'italic',
        letterSpacing: '0.06em',
      }}>
        Summoning the Ancient Tikis…
      </div>
    </motion.div>
  )
}
