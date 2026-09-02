import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

// Premium Dense Jungle Atmosphere - Reference-matched implementation
export default function JungleAtmosphere({ hideBackground = false }) {
  const [particles, setParticles] = useState([])
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Generate floating particles
  useEffect(() => {
    const count = isMobile ? 10 : 28
    const colors = [
      'rgba(255, 240, 180, 0.7)',
      'rgba(220, 255, 200, 0.6)',
      'rgba(255, 255, 255, 0.5)',
      'rgba(255, 200, 100, 0.5)',
    ]

    const newParticles = Array.from({ length: count }, (_, i) => ({
      id: i,
      size: 2 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      startX: 10 + Math.random() * 80,
      startY: 20 + Math.random() * 70,
      driftX: -60 + Math.random() * 120,
      driftY: -80 - Math.random() * 100,
      rotate: -180 + Math.random() * 360,
      duration: 12 + Math.random() * 10,
      delay: Math.random() * 15,
      opacity: 0.4 + Math.random() * 0.4,
    }))

    setParticles(newParticles)
  }, [isMobile])

  return (
    <>
      {/* LAYER 0 — Deep Background Gradient */}
      {!hideBackground && (
        <div
          id="jungle-bg-deep"
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 0,
            background: `
              radial-gradient(ellipse 28% 45% at 50% 38%, rgba(160, 230, 130, 0.22) 0%, rgba(100, 190, 80, 0.14) 25%, rgba(60, 140, 40, 0.07) 55%, transparent 80%),
              radial-gradient(ellipse 15% 30% at 52% 25%, rgba(220, 255, 180, 0.18) 0%, transparent 60%),
              radial-gradient(ellipse 40% 100% at -5% 50%, rgba(2, 12, 4, 0.92) 0%, rgba(5, 20, 8, 0.7) 40%, transparent 70%),
              radial-gradient(ellipse 40% 100% at 105% 50%, rgba(2, 12, 4, 0.92) 0%, rgba(5, 20, 8, 0.7) 40%, transparent 70%),
              radial-gradient(ellipse 100% 40% at 50% -10%, rgba(1, 8, 2, 0.95) 0%, transparent 70%),
              radial-gradient(ellipse 80% 25% at 50% 105%, rgba(90, 70, 15, 0.35) 0%, transparent 60%),
              linear-gradient(180deg, #020a03 0%, #041008 8%, #071a0c 20%, #0c2a12 38%, #123318 55%, #0e2810 72%, #091a09 88%, #050e05 100%)
            `,
            animation: 'jungleBreath 16s ease-in-out infinite',
          }}
        />
      )}

      {/* LAYER 3 — Light Rays */}
      <div
        id="jungle-light-rays"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {/* Wide ambient glow */}
        <motion.div
          animate={{ opacity: [0.03, 0.05, 0.03] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute',
            top: '-20%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 200,
            height: '130%',
            background: 'linear-gradient(180deg, rgba(180, 240, 120, 0.06) 0%, rgba(160, 220, 100, 0.04) 40%, transparent 100%)',
            borderRadius: '50%',
            filter: 'blur(12px)',
          }}
        />
        {[
          { left: '42%', rotate: -6, width: 55, opacity: 0.08, duration: 11 },
          { left: '48%', rotate: -2, width: 70, opacity: 0.10, duration: 15 },
          { left: '52%', rotate: 3, width: 50, opacity: 0.07, duration: 13 },
          { left: '45%', rotate: -10, width: 40, opacity: 0.06, duration: 9 },
          { left: '58%', rotate: 8, width: 45, opacity: 0.07, duration: 12 },
        ].map((ray, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: [ray.rotate - 2, ray.rotate + 2, ray.rotate - 2],
              x: [-4, 4, -4],
              opacity: [ray.opacity * 0.7, ray.opacity, ray.opacity * 0.7],
            }}
            transition={{
              duration: ray.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'absolute',
              top: '-20%',
              left: ray.left,
              width: ray.width,
              height: '130%',
              background: 'linear-gradient(180deg, rgba(180, 240, 120, 0.06) 0%, rgba(160, 220, 100, 0.04) 30%, transparent 100%)',
              borderRadius: '50%',
              transformOrigin: 'top center',
              filter: 'blur(8px)',
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      {/* LAYER 4 — Floating Particles */}
      <div
        id="jungle-particles"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 4,
          pointerEvents: 'none',
          overflow: 'hidden',
        }}
      >
        {particles.map((p) => (
          <motion.div
            key={p.id}
            animate={{
              x: [0, p.driftX],
              y: [0, p.driftY],
              rotate: [0, p.rotate],
              opacity: [0, p.opacity, p.opacity, 0],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              left: `${p.startX}%`,
              top: `${p.startY}%`,
              width: p.size,
              height: p.size,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
              willChange: 'transform',
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes jungleBreath {
          0%, 100% { filter: brightness(1.0) saturate(1.0); }
          40% { filter: brightness(1.06) saturate(1.08); }
          70% { filter: brightness(0.97) saturate(0.96); }
        }
        
        @media (prefers-reduced-motion: reduce) {
          #jungle-light-rays *, 
          #jungle-particles * {
            animation: none !important;
          }
        }
      `}</style>
    </>
  )
}
