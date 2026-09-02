import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

function seededRandom(seed) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

// ── Volcanic Atmosphere ────────────────────────────────────────────────────────
export default function VolcanicAtmosphere() {
  const [sparks, setSparks] = useState([])
  const canvasRef = useRef(null)
  const animRef   = useRef(null)

  // ── Canvas lava glow removed in favor of 3D lava in TikiBoard3D ──

  // ── Volcanic ember sparks ──────────────────────────────────────────────────
  useEffect(() => {
    const rng = seededRandom(42)
    const count = 28
    const generated = Array.from({ length: count }, (_, i) => ({
      id:      i,
      startX:  5  + rng() * 90,
      startY:  40 + rng() * 50,
      driftX:  -50 + rng() * 100,
      driftY:  -(50 + rng() * 130),
      size:    1.0 + rng() * 2.2,
      opacity: 0.35 + rng() * 0.50,
      dur:     6   + rng() * 12,
      delay:   rng() * 14,
      color:   rng() > 0.55 ? '#ff4010' : rng() > 0.3 ? '#ff8020' : '#cc1500',
    }))
    setSparks(generated)
  }, [])

  return (
    <>
      {/* ── Layer 0: Deep volcanic base ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: `
          radial-gradient(ellipse 80% 50% at 50% 108%, rgba(200, 40, 5, 0.35) 0%, rgba(100, 15, 3, 0.20) 40%, transparent 65%),
          radial-gradient(ellipse 50% 35% at 50% 90%,  rgba(140, 25, 5, 0.22) 0%, transparent 55%),
          radial-gradient(ellipse 95% 42% at 50% 0%,   rgba(5, 0, 10, 0.90) 0%, transparent 50%),
          linear-gradient(180deg,
            #050008 0%,
            #080010 8%,
            #0a0012 18%,
            #0e0010 30%,
            #100008 50%,
            #0e0006 70%,
            #0a0003 85%,
            #070001 100%
          )
        `,
      }} />

      {/* ── Layer 1: Volcanic smoke wisps ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 1, overflow: 'hidden', pointerEvents: 'none' }}>
        {[
          { top: '8%',  left: '10%',  w: 240, h: 160, color: 'rgba(60,10,5,0.10)',  dur: 22 },
          { top: '12%', right: '8%',  w: 200, h: 140, color: 'rgba(50,8,3,0.08)',   dur: 28 },
          { top: '42%', left: '5%',   w: 160, h: 200, color: 'rgba(120,20,5,0.07)', dur: 18 },
          { top: '40%', right: '6%',  w: 180, h: 180, color: 'rgba(140,25,8,0.07)', dur: 24 },
          { top: '68%', left: '25%',  w: 300, h: 160, color: 'rgba(180,35,8,0.08)', dur: 16 },
        ].map((n, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.35, 0.80, 0.35], scale: [0.94, 1.07, 0.94] }}
            transition={{ duration: n.dur, repeat: Infinity, ease: 'easeInOut', delay: i * 3.2 }}
            style={{
              position: 'absolute',
              top: n.top, left: n.left, right: n.right,
              width: n.w, height: n.h,
              background: `radial-gradient(ellipse at 50% 50%, ${n.color} 0%, transparent 70%)`,
              filter: 'blur(32px)',
              borderRadius: '50%',
            }}
          />
        ))}
      </div>

      {/* ── Layer 2: Distant stars (cool volcanic sky) ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, overflow: 'hidden', pointerEvents: 'none' }}>
        {Array.from({ length: 50 }, (_, i) => {
          const rng = seededRandom(i * 13 + 7)
          const x   = rng() * 100
          const y   = rng() * 50
          const s   = 0.5 + rng() * 1.4
          const d   = 2.2 + rng() * 4.5
          const del = rng() * 6
          const col = rng() > 0.85 ? '#ffc0a0' : rng() > 0.65 ? '#e0d0ff' : '#f0f0ff'
          return (
            <motion.div
              key={i}
              animate={{ opacity: [0.08, 0.55, 0.08], scale: [1, 1.25, 1] }}
              transition={{ duration: d, repeat: Infinity, ease: 'easeInOut', delay: del }}
              style={{
                position: 'absolute',
                left: `${x}%`, top: `${y}%`,
                width: s, height: s,
                borderRadius: '50%',
                background: col,
                boxShadow: `0 0 ${s * 2.5}px ${col}`,
              }}
            />
          )
        })}
      </div>

      {/* ── Layer 3: Removed ── */}

      {/* ── Layer 4: Volcanic ember/ash sparks ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 4, overflow: 'hidden', pointerEvents: 'none' }}>
        {sparks.map(e => (
          <motion.div
            key={e.id}
            animate={{
              x:       [0, e.driftX],
              y:       [0, e.driftY],
              opacity: [0, e.opacity, e.opacity * 0.6, 0],
              scale:   [1, 1.2, 0.4],
            }}
            transition={{ duration: e.dur, delay: e.delay, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              left:    `${e.startX}%`,
              top:     `${e.startY}%`,
              width:   e.size,
              height:  e.size,
              borderRadius: '50%',
              background: e.color,
              boxShadow: `0 0 ${e.size * 3}px ${e.color}`,
            }}
          />
        ))}
      </div>

      {/* ── Layer 5: Vignette ── */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(2,0,5,0.25) 58%, rgba(0,0,3,0.65) 100%)',
      }} />
    </>
  )
}
