import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { useSocketContext } from '../context/SocketContext'
import useGameStore from '../store/gameStore'
import { useAuth } from '../context/AuthContext'
import AvatarCarousel from './AvatarCarousel'
import JungleAtmosphere from './JungleAtmosphere'

// ══════════════════════════════════════════════════════════════════════════════
// TIKI TOPPLE — TEMPLE ANTECHAMBER (Ancient Tiki Theme Restored)
// Aesthetic: Riot Games × Supercell × Jungle Archaeology
// ══════════════════════════════════════════════════════════════════════════════

/* ── Global Styles ─────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600;700&display=swap');

  @keyframes hs-fireGlow {
    0%,100% {
      text-shadow:
        0 0 14px rgba(75,215,28,0.6),
        0 0 30px rgba(255,175,0,0.85),
        0 0 58px rgba(255,90,0,0.45),
        0 5px 10px rgba(0,0,0,0.98),
        3px 3px 0 rgba(5,18,2,0.96);
    }
    40% {
      text-shadow:
        0 0 22px rgba(95,250,38,0.95),
        0 0 48px rgba(255,200,0,1),
        0 0 88px rgba(255,110,0,0.65),
        0 5px 10px rgba(0,0,0,0.98),
        3px 3px 0 rgba(5,18,2,0.96);
    }
  }
  @keyframes hs-titleFloat {
    0%,100% { transform: translateY(0); }
    50%      { transform: translateY(-6px); }
  }
  @keyframes hs-btnGold {
    0%,100% { box-shadow: 0 0 18px rgba(212,175,55,0.42), 0 0 40px rgba(180,140,35,0.16), 0 8px 0 #4a3000, 0 12px 24px rgba(0,0,0,0.85), inset 0 2px 4px rgba(255,220,100,0.22); }
    50%      { box-shadow: 0 0 30px rgba(212,175,55,0.68), 0 0 60px rgba(200,160,40,0.28), 0 8px 0 #4a3000, 0 12px 24px rgba(0,0,0,0.85), inset 0 2px 4px rgba(255,220,100,0.22); }
  }
  @keyframes hs-btnGreen {
    0%,100% { box-shadow: 0 0 18px rgba(55,195,18,0.42), 0 0 38px rgba(38,168,10,0.14), 0 7px 0 #183802, 0 10px 22px rgba(0,0,0,0.8); }
    50%      { box-shadow: 0 0 28px rgba(80,228,28,0.65), 0 0 55px rgba(60,200,15,0.24), 0 7px 0 #183802, 0 10px 22px rgba(0,0,0,0.8); }
  }
  @keyframes hs-shimmer {
    0%   { left: -70%; }
    100% { left: 140%; }
  }
  @keyframes hs-rayPulse {
    0%,100% { opacity: 0.30; }
    50%      { opacity: 0.65; }
  }
  @keyframes hs-moonShimmer {
    0%   { transform: translateX(-120%) skewX(-18deg); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translateX(220%) skewX(-18deg); opacity: 0; }
  }
  @keyframes hs-moonPool {
    0%,100% { opacity: 0.28; transform: scaleX(1.0) scaleY(1.0); }
    40%     { opacity: 0.52; transform: scaleX(1.12) scaleY(1.08); }
    70%     { opacity: 0.34; transform: scaleX(0.96) scaleY(0.97); }
  }
  @keyframes hs-moonRipple {
    0%   { transform: scale(0.6); opacity: 0.7; }
    100% { transform: scale(2.8); opacity: 0; }
  }
  @keyframes hs-eyeGlow {
    0%,100% { opacity: 0; }
    50%     { opacity: 0.35; }
  }
  @keyframes hs-errorPulse {
    0%,100% { box-shadow: 0 0 12px rgba(220,40,40,0.3), inset 0 0 12px rgba(200,20,20,0.08); }
    50%     { box-shadow: 0 0 22px rgba(220,40,40,0.5), inset 0 0 20px rgba(200,20,20,0.14); }
  }

  .hs-title {
    animation: hs-fireGlow 4.1s ease-in-out infinite, hs-titleFloat 4.5s ease-in-out infinite;
    will-change: text-shadow, transform;
  }
  .hs-btn-gold {
    animation: hs-btnGold 2.8s ease-in-out infinite;
    transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), filter 0.14s ease;
  }
  .hs-btn-gold:hover:not(:disabled) { transform: translateY(-5px) scale(1.03) !important; filter: brightness(1.14); }
  .hs-btn-gold:active:not(:disabled) {
    transform: translateY(5px) scale(0.968) !important; filter: brightness(0.88); animation: none;
    box-shadow: 0 0 10px rgba(212,175,55,0.3), 0 3px 0 #4a3000, 0 5px 14px rgba(0,0,0,0.8), inset 0 4px 8px rgba(0,0,0,0.45) !important;
  }
  .hs-btn-green {
    animation: hs-btnGreen 2.5s ease-in-out infinite;
    transition: transform 0.12s cubic-bezier(0.34,1.56,0.64,1), filter 0.14s ease;
  }
  .hs-btn-green:hover:not(:disabled) { transform: translateY(-4px) scale(1.03) !important; filter: brightness(1.12); }
  .hs-btn-green:active:not(:disabled) {
    transform: translateY(4px) scale(0.97) !important; filter: brightness(0.88); animation: none;
    box-shadow: 0 0 8px rgba(55,195,18,0.28), 0 2px 0 #183802, 0 4px 12px rgba(0,0,0,0.75), inset 0 4px 8px rgba(0,0,0,0.45) !important;
  }
  .hs-eye-glow { animation: hs-eyeGlow 2.2s ease-in-out infinite; pointer-events: none; }
  .hs-stone-input:focus { outline: none; border-color: rgba(212,175,55,0.65) !important; box-shadow: inset 0 2px 8px rgba(0,0,0,0.55), 0 0 0 2px rgba(212,175,55,0.14) !important; }
  .hs-moon-pool { animation: hs-moonPool 7.4s ease-in-out infinite; }
  .hs-moon-ripple { animation: hs-moonRipple 3.2s ease-out infinite; }
  .hs-error { animation: hs-errorPulse 1.8s ease-in-out infinite; }

  @keyframes hs-mistDrift1 {
    0%   { transform: translateX(-30%); }
    100% { transform: translateX(30%); }
  }
  @keyframes hs-mistDrift2 {
    0%   { transform: translateX(25%); }
    100% { transform: translateX(-35%); }
  }
  @keyframes hs-moonGlow {
    0%,100% { box-shadow: 0 0 30px rgba(255,255,240,0.85), 0 0 65px rgba(255,230,160,0.6), 0 0 120px rgba(255,210,100,0.25); }
    50%     { box-shadow: 0 0 45px rgba(255,255,240,1.0), 0 0 90px rgba(255,230,160,0.75), 0 0 160px rgba(255,210,100,0.35); }
  }
  @keyframes hs-starFlicker {
    0%,100% { opacity: 0.72; }
    50%     { opacity: 0.16; }
  }
  @keyframes hs-mountainAura {
    0%,100% { opacity: 0.85; }
    50%     { opacity: 0.45; }
  }
`

/* ── Static star positions (deterministic, stable across renders) ─────── */
const STARS = Array.from({ length: 72 }, (_, i) => ({
  left:  ((i * 137.508) % 100).toFixed(2),
  top:   ((i * 97.3)    % 68 ).toFixed(2),
  size:  +(0.8  + (i % 3) * 0.7).toFixed(1),
  delay: +((i * 0.31)   % 4  ).toFixed(2),
  dur:   +(1.8  + (i % 5) * 0.45).toFixed(1),
  r: 220 + (i % 35), g: 200 + (i % 55), b: 175 + (i % 80),
}))

/* ── Bioluminescent ground dots (deterministic) ───────────────────────── */
const BIO_DOTS = Array.from({ length: 65 }, (_, i) => {
  const PALETTE = [
    ['rgba(0,255,148,1)',   'rgba(0,255,148,0.8)'],
    ['rgba(80,255,195,1)',  'rgba(80,255,195,0.75)'],
    ['rgba(120,255,78,1)',  'rgba(120,255,78,0.70)'],
    ['rgba(200,255,118,1)', 'rgba(200,255,118,0.65)'],
    ['rgba(0,215,255,1)',   'rgba(0,215,255,0.72)'],
  ]
  const c = PALETTE[i % PALETTE.length]
  return {
    x:         +((i * 137.508) % 100).toFixed(1),
    y:         +((i * 53.1)    % 22 + 1).toFixed(1),
    size:      +(2.5 + (i % 4) * 1.5).toFixed(1),
    color:     c[0],
    glowColor: c[1],
    dur:       +(2.0 + (i % 7) * 0.48).toFixed(2),
    delay:     +((i * 0.37)    % 6).toFixed(2),
    opacity:   +(0.55 + (i % 6) * 0.08).toFixed(2),
  }
})

/* ── frondPath: bezier palm-frond helper ─────────────────────────────────── */
function frondPath(cx, cy, aDeg, len, droop) {
  const a = aDeg * Math.PI / 180
  const ex = cx + Math.cos(a) * len, ey = cy + Math.sin(a) * len + droop
  const c1x = cx + Math.cos(a) * len * 0.33, c1y = cy + Math.sin(a) * len * 0.33 - Math.abs(droop) * 0.1
  const c2x = cx + Math.cos(a) * len * 0.70, c2y = cy + Math.sin(a) * len * 0.70 + droop * 0.55
  return `M ${cx},${cy} C ${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${ex.toFixed(1)},${ey.toFixed(1)}`
}

/* ── Firefly dots (mid-ground, yellow-green, distinct from sky bio-dots) ─── */
const FIREFLIES = Array.from({ length: 28 }, (_, i) => ({
  x: 8 + ((i * 131.4) % 84), y: 40 + ((i * 67.3) % 40),
  size: 2 + (i % 3) * 0.9,   dur: 5 + (i % 7) * 1.3,
  delay: (i * 0.71) % 9,      dx: ((i * 43.7) % 50) - 25,
  dy: ((i * 28.3) % 30) - 15, op: 0.55 + (i % 5) * 0.09,
}))

/* ── Mountain Background ─────────────────────────────────────────────────── */
function MountainBackground() {
  const starsRef      = useRef(null)
  const moonGroupRef  = useRef(null)
  const farMtnRef     = useRef(null)
  const midMtnRef     = useRef(null)
  const shootRef      = useRef(null)
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  /* GSAP mouse parallax */
  useEffect(() => {
    if (reducedMotion.current) return
    const els = [starsRef, moonGroupRef, farMtnRef, midMtnRef]
    if (els.some(r => !r.current)) return
    const qSX = gsap.quickTo(starsRef.current,     'x', { duration: 1.1, ease: 'power2.out' })
    const qSY = gsap.quickTo(starsRef.current,     'y', { duration: 1.1, ease: 'power2.out' })
    const qMX = gsap.quickTo(moonGroupRef.current, 'x', { duration: 1.3, ease: 'power2.out' })
    const qMY = gsap.quickTo(moonGroupRef.current, 'y', { duration: 1.3, ease: 'power2.out' })
    const qFX = gsap.quickTo(farMtnRef.current,    'x', { duration: 0.9, ease: 'power2.out' })
    const qFY = gsap.quickTo(farMtnRef.current,    'y', { duration: 0.9, ease: 'power2.out' })
    const qDX = gsap.quickTo(midMtnRef.current,    'x', { duration: 0.7, ease: 'power2.out' })
    const qDY = gsap.quickTo(midMtnRef.current,    'y', { duration: 0.7, ease: 'power2.out' })
    const onMove = (e) => {
      const cx = (e.clientX / window.innerWidth  - 0.5) * 2
      const cy = (e.clientY / window.innerHeight - 0.5) * 2
      qSX(cx * 14); qSY(cy * 8)
      qMX(cx * 22); qMY(cy * 14)
      qFX(cx * 7);  qFY(cy * 4)
      qDX(cx * 3);  qDY(cy * 2)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  /* Shooting star GSAP loop */
  useEffect(() => {
    if (reducedMotion.current) return
    let timeout
    const fire = () => {
      const el = shootRef.current; if (!el) return
      const sx = 15 + Math.random() * 55
      const sy = 4  + Math.random() * 22
      gsap.set(el, { x: `${sx}vw`, y: `${sy}vh`, opacity: 0 })
      gsap.timeline()
        .to(el, { opacity: 1, duration: 0.08 })
        .to(el, { x: `${sx + 20}vw`, y: `${sy + 13}vh`, opacity: 0, duration: 0.5, ease: 'power1.in' })
      timeout = setTimeout(fire, 6000 + Math.random() * 9000)
    }
    timeout = setTimeout(fire, 1500 + Math.random() * 3500)
    return () => clearTimeout(timeout)
  }, [])

  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <style>{`
        @keyframes hs-nebulaPulse {
          0%,100% { opacity: 0.55; transform: scale(1); }
          50%     { opacity: 0.80; transform: scale(1.04); }
        }
        @keyframes hs-bioGlow {
          0%,100% { box-shadow: var(--bio-shadow-lo); opacity: var(--bio-op-lo); }
          50%     { box-shadow: var(--bio-shadow-hi); opacity: var(--bio-op-hi); }
        }
        @keyframes hs-coronaPulse {
          0%,100% { opacity: 0.18; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.33; transform: translate(-50%,-50%) scale(1.035); }
        }
        @keyframes hs-starBloom {
          0%,100% { filter: blur(0px) brightness(1); }
          50%     { filter: blur(0.5px) brightness(1.7); }
        }
      `}</style>

      {/* Night sky gradient */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #010407 0%, #020b11 14%, #030e18 30%, #041518 50%, #041410 68%, #030d08 84%, #020905 100%)' }} />

      {/* Nebula patches */}
      {[
        { top: '2%',  left: '5%',  w: 380, h: 220, color: 'rgba(90,20,180,0.55)',  dur: 18, delay: 0  },
        { top: '0%',  left: '50%', w: 320, h: 200, color: 'rgba(20,80,160,0.50)',  dur: 22, delay: 3  },
        { top: '8%',  left: '74%', w: 280, h: 180, color: 'rgba(120,15,110,0.45)', dur: 16, delay: 7  },
        { top: '15%', left: '28%', w: 420, h: 240, color: 'rgba(15,60,100,0.42)',  dur: 26, delay: 11 },
      ].map((n, i) => (
        <div key={i} style={{
          position: 'absolute', top: n.top, left: n.left,
          width: n.w, height: n.h, borderRadius: '50%',
          background: `radial-gradient(ellipse, ${n.color} 0%, transparent 70%)`,
          filter: 'blur(28px)', pointerEvents: 'none',
          animation: `hs-nebulaPulse ${n.dur}s ${n.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Stars — parallax layer */}
      <div ref={starsRef} style={{ position: 'absolute', inset: 0, willChange: 'transform' }}>
        {STARS.map((s, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${s.left}%`, top: `${s.top}%`,
            width: s.size * 1.6, height: s.size * 1.6, borderRadius: '50%',
            background: `rgba(${s.r},${s.g},${s.b},1)`,
            boxShadow: `0 0 ${s.size * 5}px rgba(${s.r},${s.g},${s.b},0.8), 0 0 ${s.size * 10}px rgba(${s.r},${s.g},${s.b},0.4)`,
            animation: `hs-starFlicker ${s.dur}s ${s.delay}s ease-in-out infinite, hs-starBloom ${+(s.dur * 1.3).toFixed(1)}s ${s.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Shooting star */}
      <div ref={shootRef} style={{
        position: 'fixed', top: 0, left: 0, pointerEvents: 'none', zIndex: 2,
        width: 80, height: 2, borderRadius: 2,
        background: 'linear-gradient(90deg, rgba(255,255,240,0) 0%, rgba(255,255,220,0.95) 55%, rgba(255,255,255,0.4) 100%)',
        boxShadow: '0 0 6px rgba(255,255,200,0.8)', opacity: 0, willChange: 'transform, opacity',
      }} />

      {/* Moon group — parallax layer */}
      <div ref={moonGroupRef} style={{ position: 'absolute', top: '6%', right: '16%', willChange: 'transform' }}>
        {/* Corona rings */}
        {[280, 200, 148].map((sz, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            width: sz, height: sz, borderRadius: '50%',
            background: i === 0
              ? 'radial-gradient(circle, rgba(255,230,130,0.18) 0%, rgba(255,210,80,0.10) 40%, transparent 70%)'
              : i === 1
              ? 'radial-gradient(circle, rgba(255,240,160,0.22) 0%, rgba(255,220,100,0.12) 50%, transparent 72%)'
              : 'radial-gradient(circle, rgba(255,250,180,0.28) 0%, rgba(255,235,130,0.15) 55%, transparent 75%)',
            border: `1px solid rgba(255,235,150,${[0.12, 0.20, 0.30][i]})`,
            animation: `hs-coronaPulse ${11 + i * 3}s ${i * 1.5}s ease-in-out infinite`,
            pointerEvents: 'none',
          }} />
        ))}
        {/* Moon disc 96px + craters */}
        <div style={{
          position: 'relative', width: 96, height: 96, borderRadius: '50%',
          background: 'radial-gradient(circle at 36% 36%, #FFFDE7 0%, #FFF9C4 42%, #FFE082 80%, #FFD54F 100%)',
          animation: 'hs-moonGlow 9s ease-in-out infinite', overflow: 'hidden',
        }}>
          <svg width="96" height="96" style={{ position: 'absolute', inset: 0, opacity: 0.18 }}>
            <circle cx="28" cy="30" r="8"  fill="none" stroke="rgba(180,140,60,0.6)" strokeWidth="1"/>
            <circle cx="62" cy="22" r="5"  fill="none" stroke="rgba(180,140,60,0.5)" strokeWidth="1"/>
            <circle cx="48" cy="58" r="11" fill="none" stroke="rgba(180,140,60,0.4)" strokeWidth="1.5"/>
            <circle cx="72" cy="52" r="6"  fill="none" stroke="rgba(180,140,60,0.45)" strokeWidth="1"/>
            <circle cx="20" cy="64" r="4"  fill="none" stroke="rgba(180,140,60,0.35)" strokeWidth="0.8"/>
            <ellipse cx="38" cy="44" rx="6" ry="4" fill="rgba(160,120,40,0.08)"/>
            <ellipse cx="65" cy="36" rx="4" ry="3" fill="rgba(160,120,40,0.06)"/>
          </svg>
        </div>
        {/* God rays from moon */}
        {[-32, -16, 0, 16, 30].map((angle, i) => (
          <div key={i} style={{
            position: 'absolute', top: '50%', left: '50%',
            transformOrigin: 'top center',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            width: [55, 75, 90, 68, 50][i], height: '140vh',
            background: 'linear-gradient(180deg, rgba(255,235,150,0.55) 0%, rgba(255,220,100,0.22) 20%, rgba(255,210,80,0.08) 50%, transparent 80%)',
            filter: 'blur(8px)', pointerEvents: 'none',
            animation: `hs-rayPulse ${[11,13,15,12,10][i]}s ${i * 1.2}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Wispy clouds — Framer Motion */}
      {[
        { top: '7%',  left: '-5%', w: 500, h: 90,  blur: 12, op: 0.22, dur: 38, drift: 120  },
        { top: '12%', left: '28%', w: 380, h: 70,  blur: 9,  op: 0.18, dur: 52, drift: -90  },
        { top: '5%',  left: '62%', w: 440, h: 80,  blur: 14, op: 0.20, dur: 44, drift: 100  },
      ].map((cl, i) => (
        <motion.div key={i}
          animate={{ x: [0, cl.drift, 0] }}
          transition={{ duration: cl.dur, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: cl.top, left: cl.left,
            width: cl.w, height: cl.h, borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(210,230,255,0.65) 0%, rgba(190,215,255,0.30) 50%, transparent 80%)',
            filter: `blur(${cl.blur}px)`, opacity: cl.op,
            pointerEvents: 'none', zIndex: 2,
          }}
        />
      ))}

      {/* Aurora — 3 sub-layers */}
      {[
        { top: '32%', left: '5%',  w: '90%', h: '28%', color: 'rgba(30,130,55,0.60)',  blur: 40, dur: 14, delay: 0  },
        { top: '38%', left: '18%', w: '64%', h: '20%', color: 'rgba(0,220,120,0.38)',  blur: 32, dur: 19, delay: 3  },
        { top: '28%', left: '32%', w: '36%', h: '15%', color: 'rgba(100,255,160,0.28)', blur: 24, dur: 11, delay: 6  },
      ].map((a, i) => (
        <div key={i} style={{
          position: 'absolute', top: a.top, left: a.left,
          width: a.w, height: a.h, borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 100%, ${a.color} 0%, transparent 80%)`,
          filter: `blur(${a.blur}px)`, pointerEvents: 'none', zIndex: 1,
          animation: `hs-mountainAura ${a.dur}s ${a.delay}s ease-in-out infinite`,
        }} />
      ))}

      {/* Far mountains — parallax layer */}
      <svg ref={farMtnRef} preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: '44%', left: 0, width: '100%', height: '36%', zIndex: 1, willChange: 'transform' }}
        viewBox="0 0 1440 230">
        <defs>
          <linearGradient id="far-mountains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(18,40,70,0.6)" />
            <stop offset="100%" stopColor="rgba(8,18,34,0.7)" />
          </linearGradient>
        </defs>
        <path d="M0 230 L0 188 C60 170 120 148 180 152 C240 156 300 130 360 124 C420 118 480 140 540 110 C600 80 660 100 720 88 C780 76 840 92 900 68 C960 44 1020 80 1080 64 C1140 48 1200 68 1260 54 C1320 40 1380 62 1440 70 L1440 230 Z"
          fill="url(#far-mountains)" />
        <path d="M525 116 Q540 110 555 116" stroke="rgba(200,220,255,0.14)" strokeWidth="1.5" fill="none"/>
        <path d="M700 90 Q718 82 738 90" stroke="rgba(200,220,255,0.14)" strokeWidth="1.5" fill="none"/>
        <path d="M885 71 Q900 68 915 71" stroke="rgba(200,220,255,0.14)" strokeWidth="1.5" fill="none"/>
        <path d="M1065 68 Q1080 64 1095 68" stroke="rgba(200,220,255,0.14)" strokeWidth="1.5" fill="none"/>
      </svg>

      {/* Mid mountains — parallax layer */}
      <svg ref={midMtnRef} preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: '22%', left: 0, width: '100%', height: '48%', zIndex: 2, willChange: 'transform' }}
        viewBox="0 0 1440 295">
        <defs>
          <linearGradient id="mid-mountains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(12,38,24,0.9)" />
            <stop offset="100%" stopColor="rgba(4,14,8,0.95)" />
          </linearGradient>
        </defs>
        <path d="M0 295 L0 255 C80 230 160 190 240 200 C320 210 400 170 480 160 C560 150 640 180 720 150 C800 120 880 160 960 130 C1040 100 1120 140 1200 120 C1280 100 1360 140 1440 138 L1440 295 Z"
          fill="url(#mid-mountains)" />
        <path d="M460 162 Q480 160 500 162" stroke="rgba(180,220,200,0.1)" strokeWidth="1.5" fill="none"/>
        <path d="M700 154 Q720 150 740 154" stroke="rgba(180,220,200,0.1)" strokeWidth="1.5" fill="none"/>
        <path d="M940 134 Q960 130 980 134" stroke="rgba(180,220,200,0.1)" strokeWidth="1.5" fill="none"/>
      </svg>

      {/* Near mountains */}
      <svg preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '40%', zIndex: 3 }}
        viewBox="0 0 1440 255">
        <defs>
          <linearGradient id="near-mountains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(4,16,8,0.98)" />
            <stop offset="100%" stopColor="rgba(1,4,2,1)" />
          </linearGradient>
        </defs>
        <path d="M0 255 L0 198 C100 150 200 180 300 140 C400 100 500 160 600 130 C700 100 800 140 900 110 C1000 80 1100 140 1200 120 C1300 100 1370 130 1440 120 L1440 255 Z"
          fill="url(#near-mountains)" />
      </svg>

      {/* Plains */}
      <svg preserveAspectRatio="none"
        style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '25%', zIndex: 4 }}
        viewBox="0 0 1440 150">
        <defs>
          <linearGradient id="plains" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(8,26,12,0.95)" />
            <stop offset="100%" stopColor="rgba(2,10,4,1)" />
          </linearGradient>
        </defs>
        <path d="M0 150 L0 80 Q 200 120 400 70 T 800 60 T 1200 80 T 1440 60 L1440 150 Z" fill="url(#plains)" />
        <path d="M0 150 L0 110 Q 300 140 600 90 T 1100 100 T 1440 90 L1440 150 Z" fill="rgba(4,18,8,0.98)" />
      </svg>

      {/* Bioluminescent ground dots */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '35%', zIndex: 5, pointerEvents: 'none' }}>
        {BIO_DOTS.map((d, i) => (
          <div key={i} style={{
            position: 'absolute', left: `${d.x}%`, bottom: `${d.y}%`,
            width: d.size, height: d.size, borderRadius: '50%',
            background: d.color,
            '--bio-op-lo': d.opacity * 0.35,
            '--bio-op-hi': d.opacity,
            '--bio-shadow-lo': `0 0 ${d.size * 2}px ${d.glowColor}`,
            '--bio-shadow-hi': `0 0 ${d.size * 4}px ${d.glowColor}, 0 0 ${d.size * 8}px ${d.glowColor}`,
            opacity: d.opacity,
            animation: `hs-bioGlow ${d.dur}s ${d.delay}s ease-in-out infinite`,
          }} />
        ))}
      </div>

      {/* Moonlight ground illumination */}
      <MoonlightGround />

      {/* Ground atmospheric haze */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '26%', zIndex: 6, pointerEvents: 'none',
        background: 'linear-gradient(180deg, transparent 0%, rgba(3,10,5,0.38) 52%, rgba(2,7,3,0.82) 100%)',
      }} />
    </div>
  )
}

/* ── Leaf Canvas ─────────────────────────────────────────────────────────── */
function LeafCanvas({ canvasRef }) {
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return
    const ctx = cv.getContext('2d'); let raf
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight }
    resize(); window.addEventListener('resize', resize)
    let s = 44
    const r = () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
    const leaves = Array.from({ length: 20 }, () => ({
      x: r() * window.innerWidth, y: r() * window.innerHeight,
      vx: (r() - 0.5) * 0.45, vy: 0.28 + r() * 0.55,
      rot: r() * Math.PI * 2, rotV: (r() - 0.5) * 0.018,
      sc: 0.4 + r() * 0.8, op: 0.28 + r() * 0.48,
      sw: r() * Math.PI * 2, swF: 0.006 + r() * 0.009,
      hue: 94 + r() * 38,
    }))
    function draw(l) {
      ctx.save(); ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.scale(l.sc, l.sc); ctx.globalAlpha = l.op
      ctx.beginPath(); ctx.moveTo(0, -12)
      ctx.bezierCurveTo(8, -8, 10, 2, 4, 9); ctx.bezierCurveTo(1, 13, -1, 13, -4, 9)
      ctx.bezierCurveTo(-10, 2, -8, -8, 0, -12); ctx.closePath()
      const g = ctx.createLinearGradient(0, -12, 0, 13)
      g.addColorStop(0, `hsla(${l.hue + 16}, 66%, 36%, 1)`)
      g.addColorStop(0.55, `hsla(${l.hue}, 60%, 24%, 1)`)
      g.addColorStop(1, `hsla(${l.hue - 10}, 50%, 15%, 1)`)
      ctx.fillStyle = g; ctx.fill()
      ctx.beginPath(); ctx.moveTo(0, -11); ctx.quadraticCurveTo(1, 0, 0, 11)
      ctx.strokeStyle = `hsla(${l.hue - 20}, 55%, 17%, 0.6)`; ctx.lineWidth = 0.8; ctx.stroke()
      ctx.restore()
    }
    function tick() {
      ctx.clearRect(0, 0, cv.width, cv.height)
      leaves.forEach(l => {
        l.x += l.vx + Math.sin(l.sw) * 0.2; l.y += l.vy; l.rot += l.rotV; l.sw += l.swF
        draw(l); if (l.y > cv.height + 18) { l.y = -18; l.x = Math.random() * cv.width }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return null
}

/* ── Physics Vine (compound pendulum) ─────────────────────────────────────── */
function Vine({ fromRight, offset, freq, amp, phase }) {
  const ref = useRef(); const gid = `hs_vg_${fromRight ? 'r' : 'l'}_${offset}`
  const cd = fromRight ? -1 : 1; const W = 88, H = 680, cx = W / 2
  useEffect(() => {
    if (!ref.current) return
    const tl = gsap.timeline({ repeat: -1 })
    tl.to(ref.current, { rotate: amp, duration: freq, ease: 'sine.inOut', transformOrigin: 'top center' })
      .to(ref.current, { rotate: -amp * 0.7, duration: freq * 0.86, ease: 'sine.inOut' })
      .to(ref.current, { rotate: amp * 0.42, duration: freq * 1.1, ease: 'sine.inOut' })
      .to(ref.current, { rotate: -amp * 0.2, duration: freq * 0.92, ease: 'sine.inOut' })
      .to(ref.current, { rotate: 0, duration: freq * 0.72, ease: 'sine.inOut' })
    tl.progress(phase); return () => tl.kill()
  }, [])
  const path = `M ${cx} 0 C ${cx + cd * 16} ${H * 0.18} ${cx - cd * 20} ${H * 0.38} ${cx + cd * 12} ${H * 0.58} C ${cx - cd * 15} ${H * 0.76} ${cx + cd * 8} ${H * 0.88} ${cx} ${H}`
  const leafData = [0.10,0.22,0.34,0.46,0.58,0.70,0.82,0.91]
  const leafFills  = ['#3a9c28','#2d7e1a','#46b030','#236014','#3a9028','#1c5210','#42a832','#286818']
  const leafFills2 = ['#2d7e1a','#206010','#389224','#1a4c0e','#2e8020','#163e0c','#369028','#1e5010']

  return (
    <div ref={ref} style={{ position: 'absolute', top: 0, ...(fromRight ? { right: offset } : { left: offset }), transformOrigin: 'top center', zIndex: 6, pointerEvents: 'none' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" overflow="visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#091809" />
            <stop offset="28%"  stopColor="#143814" />
            <stop offset="62%"  stopColor="#245a1c" />
            <stop offset="100%" stopColor="#367828" />
          </linearGradient>
        </defs>

        {/* Stem: shadow → body → highlight */}
        <path d={path} stroke="rgba(0,0,0,0.42)" strokeWidth="11" strokeLinecap="round" opacity="0.5" />
        <path d={path} stroke={`url(#${gid})`}   strokeWidth="8"  strokeLinecap="round" />
        <path d={path} stroke="rgba(90,200,50,0.14)" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="18 9" />
        <path d={path} stroke="rgba(140,255,80,0.08)" strokeWidth="1.5" strokeLinecap="round" />

        {leafData.map((t, idx) => {
          const ls    = idx % 2 === 0 ? cd : -cd
          const px    = cx + ls * (24 + (idx % 3) * 6)
          const py    = H * t
          const angle = ls * (26 + (idx % 3) * 9)
          const age   = idx / (leafData.length - 1)               // 0=young top, 1=old bottom
          const lw    = 13 + age * 10                              // wider with age
          const lh    = 7  + age * 5
          const fill  = leafFills[idx]
          const fill2 = leafFills2[idx]

          // Organic leaf bezier (pointed tip + base, bulged sides)
          const lp = [
            `M 0 ${-lh}`,
            `C ${lw*0.48} ${-lh*0.72} ${lw*0.98} ${-lh*0.08} ${lw*0.62} ${lh*0.42}`,
            `Q ${lw*0.22} ${lh*0.9} 0 ${lh}`,
            `Q ${-lw*0.22} ${lh*0.9} ${-lw*0.62} ${lh*0.42}`,
            `C ${-lw*0.98} ${-lh*0.08} ${-lw*0.48} ${-lh*0.72} 0 ${-lh} Z`,
          ].join(' ')

          // Lateral veins: 3 per side
          const veinLines = []
          for (let v = 0; v < 3; v++) {
            const vy  = -lh * 0.55 + v * lh * 0.52
            const vl  = lw * (0.58 - v * 0.08)
            const va  = (32 + v * 10) * Math.PI / 180
            const vex = Math.cos(va) * vl
            const vey = Math.sin(va) * lh * 0.28
            veinLines.push([0, vy,  vex, vy + vey])
            veinLines.push([0, vy, -vex, vy + vey])
          }

          return (
            <g key={idx} transform={`translate(${px}, ${py}) rotate(${angle})`}>
              {/* Leaf body */}
              <path d={lp} fill={fill}  stroke={fill2} strokeWidth="0.7" />
              {/* Subtle highlight */}
              <path d={lp} fill="rgba(160,255,80,0.08)" />
              {/* Midrib */}
              <line x1="0" y1={-lh * 0.88} x2="0" y2={lh * 0.88}
                stroke="#1a5c10" strokeWidth="0.9" opacity="0.75" />
              {/* Lateral veins */}
              {veinLines.map(([x1,y1,x2,y2], vi) => (
                <line key={vi} x1={x1} y1={y1} x2={x2} y2={y2}
                  stroke="#1a5010" strokeWidth="0.5" opacity="0.38" />
              ))}
              {/* Highlight spot (light hitting upper-left) */}
              <ellipse cx={-lw * 0.18} cy={-lh * 0.28} rx={lw * 0.28} ry={lh * 0.22}
                fill="rgba(180,255,100,0.11)" />
            </g>
          )
        })}

        {/* Tendrils — curlier multi-segment paths */}
        {[H * 0.24, H * 0.50, H * 0.74].map((y, i) => {
          const tx = cx + cd * (i % 2 === 0 ? 15 : -11)
          return (
            <path key={i}
              d={`M ${tx} ${y} C ${tx+cd*20} ${y+7} ${tx+cd*30} ${y+22} ${tx+cd*24} ${y+38} C ${tx+cd*16} ${y+54} ${tx+cd*6} ${y+60} ${tx+cd*10} ${y+72} C ${tx+cd*14} ${y+84} ${tx+cd*22} ${y+88} ${tx+cd*18} ${y+100}`}
              stroke="#2a7820" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.65" />
          )
        })}

        {/* Aerial rootlets hanging from stem */}
        {[H*0.38, H*0.62, H*0.84].map((y, i) => {
          const tx = cx - cd * 2
          return (
            <path key={i}
              d={`M ${tx} ${y} Q ${tx+cd*5} ${y+12} ${tx+cd*2} ${y+26}`}
              stroke="rgba(20,50,10,0.45)" strokeWidth="0.9" strokeLinecap="round" fill="none" />
          )
        })}
      </svg>
    </div>
  )
}

/* ── Jungle Forest Silhouettes (left & right) ────────────────────────────── */
function JungleForest({ side }) {
  const isRight = side === 'right'
  const C1 = 'rgba(10,32,13,1)', C2 = 'rgba(15,46,18,1)', C3 = 'rgba(20,62,24,1)'
  const FP = frondPath
  return (
    <svg overflow="visible" style={{
      position: 'absolute', bottom: 0,
      [isRight ? 'right' : 'left']: 0,
      width: '28%', height: '90%', zIndex: 5, pointerEvents: 'none',
      ...(isRight ? { transform: 'scaleX(-1)' } : {}),
    }} viewBox="0 0 400 900" preserveAspectRatio="xMinYMax meet">

      {/* Back palm – far depth */}
      <g opacity={0.65}>
        <path d="M 285,900 Q 287,700 290,510 Q 291,400 292,330 L 301,330 Q 303,400 305,510 Q 309,700 295,900 Z" fill={C3} />
        {[[-145,100,35],[-115,120,30],[-85,130,25],[-55,125,30],[-25,108,35],[5,88,40],[35,66,44]].map(([a,l,d],i) => (
          <path key={i} d={FP(292,330,a,l,d)} fill="none" stroke={C3} strokeWidth={2.5} strokeLinecap="round"/>
        ))}
      </g>

      {/* Tiki ruin silhouette behind mid-tree */}
      <g opacity={0.55}>
        <rect x="196" y="580" width="22" height="120" rx="3" fill={C3} />
        <rect x="188" y="576" width="38" height="14" rx="2" fill={C3} />
        <rect x="192" y="558" width="30" height="20" rx="2" fill={C3} />
        <ellipse cx="207" cy="556" rx="10" ry="8" fill={C3} />
        <rect x="200" y="528" width="14" height="28" rx="2" fill={C3} />
        <rect x="197" y="525" width="20" height="8" rx="2" fill={C3} />
      </g>

      {/* Mid broad-leaf tree */}
      <g opacity={0.82}>
        <path d="M 169,900 C 171,700 174,520 178,400 L 196,402 C 195,522 191,702 191,900 Z" fill={C2} />
        <ellipse cx="184" cy="330" rx="82" ry="98" fill={C2} />
        <ellipse cx="136" cy="370" rx="58" ry="72" fill={C2} />
        <ellipse cx="232" cy="360" rx="60" ry="78" fill={C2} />
        <ellipse cx="182" cy="280" rx="50" ry="62" fill={C1} opacity={0.9} />
        <ellipse cx="110" cy="328" rx="44" ry="56" fill={C2} />
        <path d="M 158,900 Q 135,820 115,862 Q 142,868 158,900 Z" fill={C2} />
        <path d="M 195,900 Q 218,832 240,870 Q 218,876 195,900 Z" fill={C2} />
      </g>

      {/* Front tall palm – dominant tree */}
      <g opacity={0.95}>
        <path d="M 56,900 C 59,680 52,460 48,320 Q 47,260 50,220 L 62,218 Q 66,258 68,318 C 72,458 74,678 72,900 Z" fill={C1} />
        {[[-140,175,70],[-112,198,60],[-84,210,50],[-56,205,55],[-28,185,65],[0,158,72],[28,126,80],[55,95,88]].map(([a,l,d],i) => (
          <path key={i} d={FP(50,220,a,l,d)} fill="none" stroke={C1} strokeWidth={3.2} strokeLinecap="round"/>
        ))}
      </g>

      {/* Foreground shrubs + undergrowth */}
      <g opacity={0.98}>
        <ellipse cx="90"  cy="875" rx="88" ry="44" fill="rgba(8,28,10,1)" />
        <ellipse cx="38"  cy="888" rx="58" ry="34" fill="rgba(10,32,13,1)" />
        <ellipse cx="158" cy="879" rx="68" ry="40" fill="rgba(9,30,12,1)" />
        <path d="M 28,870 Q 5,838 -16,850 Q 10,858 28,870 Z"     fill="rgba(11,35,14,1)" />
        <path d="M 88,856 Q 66,820 44,832 Q 70,844 88,856 Z"      fill="rgba(8,28,10,1)" />
        <path d="M 158,860 Q 184,824 206,838 Q 182,850 158,860 Z" fill="rgba(10,32,13,1)" />
        <path d="M 122,852 Q 104,810 86,822 Q 108,836 122,852 Z"  fill="rgba(12,38,15,1)" />
      </g>
    </svg>
  )
}

/* ── Mid-ground Fireflies ─────────────────────────────────────────────────── */
function Fireflies() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none' }}>
      {FIREFLIES.map((f, i) => (
        <motion.div key={i}
          animate={{
            x: [0, f.dx, -f.dx * 0.5, 0],
            y: [0, f.dy,  f.dy * 0.3, 0],
            opacity: [0, f.op, f.op * 0.2, f.op, 0],
          }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
            width: f.size, height: f.size, borderRadius: '50%',
            background: 'rgba(188,255,80,1)',
            boxShadow: `0 0 ${f.size * 3}px rgba(188,255,80,0.95), 0 0 ${f.size * 7}px rgba(145,220,50,0.55)`,
            willChange: 'transform',
          }}
        />
      ))}
    </div>
  )
}

/* ── Corner Foliage (cinematic jungle framing) ───────────────────────────── */
function CornerFoliage() {
  const svgContent = (
    <>
      {/* Leaf A – largest, furthest back */}
      <path d="M 0,500 Q -25,370 60,230 Q 130,120 260,55 Q 215,135 185,220 Q 150,315 105,400 Q 60,460 0,500 Z" fill="rgba(14,42,17,0.82)" />
      <path d="M 0,500 Q 75,310 260,55" fill="none" stroke="rgba(22,65,26,0.72)" strokeWidth="3.5" strokeLinecap="round" />
      {/* Leaf B – mid */}
      <path d="M -8,500 Q 25,340 140,190 Q 220,100 330,28 Q 278,115 245,210 Q 208,315 148,418 Q 85,488 -8,500 Z" fill="rgba(10,34,13,0.75)" />
      <path d="M -8,500 Q 95,290 330,28" fill="none" stroke="rgba(18,55,22,0.62)" strokeWidth="3" strokeLinecap="round" />
      {/* Leaf C – front, darkest */}
      <path d="M 0,500 Q -30,400 30,290 Q 75,205 148,168 Q 118,240 98,315 Q 68,410 0,500 Z" fill="rgba(9,28,12,0.95)" />
      <path d="M 0,500 Q 48,355 148,168" fill="none" stroke="rgba(16,48,20,0.82)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Lateral veins on Leaf A */}
      {[0.22, 0.42, 0.62, 0.80].map((t, i) => {
        const bx = t * 260, by = 500 - t * 445
        return <line key={i} x1={bx} y1={by} x2={bx - 28 + i * 6} y2={by - 48 + i * 8}
          stroke="rgba(26,75,30,0.42)" strokeWidth="1.4" strokeLinecap="round" />
      })}
      {/* Ground cover at base */}
      <ellipse cx="80"  cy="488" rx="95" ry="28" fill="rgba(7,24,9,1)" />
      <ellipse cx="20"  cy="496" rx="60" ry="18" fill="rgba(6,20,8,1)" />
      <path d="M -10,480 Q 20,455 50,470 Q 30,480 -10,480 Z" fill="rgba(10,32,13,0.9)" />
      <path d="M 60,478 Q 100,448 130,462 Q 108,474 60,478 Z" fill="rgba(9,28,12,0.9)" />
    </>
  )
  return (
    <>
      <svg style={{ position: 'absolute', bottom: -5, left: -5, width: '36%', height: '52%', zIndex: 8, pointerEvents: 'none' }}
        viewBox="-20 0 360 510" preserveAspectRatio="xMinYMax meet">
        {svgContent}
      </svg>
      <svg style={{ position: 'absolute', bottom: -5, right: -5, width: '36%', height: '52%', zIndex: 8, pointerEvents: 'none', transform: 'scaleX(-1)' }}
        viewBox="-20 0 360 510" preserveAspectRatio="xMinYMax meet">
        {svgContent}
      </svg>
    </>
  )
}

/* ── Hanging Vines from top edge ─────────────────────────────────────────── */
function HangingVinesTop() {
  const strands = [
    { x: '5%',  len: 110, delay: 0.2, dur: 6.0, sway:  5 },
    { x: '13%', len:  80, delay: 1.0, dur: 5.4, sway: -4 },
    { x: '20%', len: 135, delay: 0.5, dur: 7.2, sway:  6 },
    { x: '80%', len: 120, delay: 1.5, dur: 5.8, sway: -5 },
    { x: '87%', len:  90, delay: 0.8, dur: 6.6, sway:  4 },
    { x: '94%', len: 145, delay: 0.2, dur: 7.5, sway: -6 },
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 6, pointerEvents: 'none', overflow: 'hidden' }}>
      {strands.map((s, i) => (
        <motion.div key={i}
          animate={{ rotate: [s.sway, -s.sway, s.sway] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', top: 0, left: s.x, transformOrigin: 'top center', width: 20 }}
        >
          <svg width="20" height={s.len} style={{ overflow: 'visible' }}>
            <path d={`M 10,0 C 8,${(s.len * 0.32).toFixed(0)} 13,${(s.len * 0.62).toFixed(0)} 10,${s.len}`}
              stroke="rgba(18,55,12,0.80)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {[0.28, 0.52, 0.74, 0.90].map((t, li) => {
              const vy = t * s.len, sd = li % 2 === 0 ? 1 : -1
              return <ellipse key={li}
                cx={10 + sd * 11} cy={vy} rx={5 + (li % 2) * 3} ry={3.5}
                transform={`rotate(${sd * 32} ${10 + sd * 11} ${vy})`}
                fill="rgba(12,42,8,0.72)" />
            })}
          </svg>
        </motion.div>
      ))}
    </div>
  )
}

/* ── Moonlight Ground ────────────────────────────────────────────────────────── */
const MOON_POOLS = [
  { cx: '18%', cy: '88%', rx: '12%', ry: '3.2%', delay: 0,    dur: 7.4 },
  { cx: '42%', cy: '91%', rx: '18%', ry: '4.1%', delay: 1.8,  dur: 9.1 },
  { cx: '68%', cy: '89%', rx: '14%', ry: '3.6%', delay: 0.9,  dur: 8.3 },
  { cx: '85%', cy: '93%', rx: '9%',  ry: '2.8%', delay: 2.5,  dur: 7.0 },
  { cx: '8%',  cy: '95%', rx: '7%',  ry: '2.2%', delay: 3.4,  dur: 6.5 },
]
const MOON_RIPPLES = [
  { cx: '42%', cy: '91%', delay: 0,   dur: 3.2 },
  { cx: '68%', cy: '89%', delay: 1.6, dur: 3.8 },
  { cx: '18%', cy: '88%', delay: 2.9, dur: 2.9 },
]

function MoonlightGround() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', overflow: 'hidden' }}>

      {/* Moving moonbeam sweep — silver streak across ground */}
      {[
        { top: '78%', delay: '0s',   dur: '14s',  opacity: 0.38, width: '55%', height: 28 },
        { top: '84%', delay: '5.2s', dur: '18s',  opacity: 0.28, width: '70%', height: 18 },
        { top: '91%', delay: '2.8s', dur: '22s',  opacity: 0.22, width: '45%', height: 14 },
        { top: '74%', delay: '9.0s', dur: '16s',  opacity: 0.18, width: '60%', height: 10 },
      ].map((b, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: b.top,
          left: '-30%',
          width: b.width,
          height: b.height,
          background: `linear-gradient(90deg,
            transparent 0%,
            rgba(190,230,255,${b.opacity * 0.4}) 20%,
            rgba(220,245,255,${b.opacity}) 50%,
            rgba(190,230,255,${b.opacity * 0.4}) 80%,
            transparent 100%)`,
          borderRadius: '50%',
          filter: 'blur(6px)',
          transform: 'skewX(-12deg)',
          animation: `hs-moonShimmer ${b.dur} ${b.delay} ease-in-out infinite`,
          willChange: 'transform',
        }} />
      ))}

      {/* Stationary moonlight pools — ellipses on ground */}
      {MOON_POOLS.map((p, i) => (
        <div key={i} className="hs-moon-pool" style={{
          position: 'absolute',
          left: p.cx, top: p.cy,
          transform: 'translate(-50%, -50%)',
          width: p.rx, height: p.ry,
          background: 'radial-gradient(ellipse, rgba(200,235,255,0.45) 0%, rgba(160,210,255,0.28) 40%, transparent 70%)',
          filter: 'blur(8px)',
          borderRadius: '50%',
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.dur}s`,
        }} />
      ))}

      {/* Ripple rings expanding from moon pools */}
      {MOON_RIPPLES.map((r, i) => (
        <div key={i} className="hs-moon-ripple" style={{
          position: 'absolute',
          left: r.cx, top: r.cy,
          transform: 'translate(-50%, -50%)',
          width: 60, height: 20,
          border: '1px solid rgba(180,220,255,0.55)',
          borderRadius: '50%',
          filter: 'blur(1.5px)',
          animationDelay: `${r.delay}s`,
          animationDuration: `${r.dur}s`,
        }} />
      ))}

      {/* Broad silver ambient wash — entire lower ground */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        height: '32%',
        background: `
          radial-gradient(ellipse 80% 60% at 50% 110%,
            rgba(160,210,255,0.18) 0%,
            rgba(130,190,240,0.10) 40%,
            transparent 70%)
        `,
        filter: 'blur(12px)',
        pointerEvents: 'none',
      }} />

      {/* Specular glint — sharp bright dots on terrain */}
      {[
        { l: '22%', t: '86%', s: 3, delay: '0s',   dur: '4.1s' },
        { l: '45%', t: '89%', s: 4, delay: '1.3s', dur: '5.7s' },
        { l: '61%', t: '84%', s: 2, delay: '2.9s', dur: '3.8s' },
        { l: '77%', t: '91%', s: 3, delay: '0.7s', dur: '6.2s' },
        { l: '12%', t: '93%', s: 2, delay: '4.1s', dur: '4.5s' },
        { l: '88%', t: '87%', s: 2, delay: '3.5s', dur: '5.0s' },
      ].map((g, i) => (
        <motion.div key={i}
          animate={{ opacity: [0, 0.9, 0.3, 0.8, 0], scale: [0.8, 1.2, 0.9, 1.1, 0.8] }}
          transition={{ duration: parseFloat(g.dur), delay: parseFloat(g.delay), repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: g.l, top: g.t,
            width: g.s, height: g.s, borderRadius: '50%',
            background: 'rgba(220,245,255,1)',
            boxShadow: `0 0 ${g.s * 3}px rgba(180,220,255,0.9), 0 0 ${g.s * 8}px rgba(140,200,255,0.5)`,
          }}
        />
      ))}
    </div>
  )
}

/* ── Canvas Torch ────────────────────────────────────────────────────────────── */
function Torch({ left }) {
  const canvasRef = useRef()

  useEffect(() => {
    const cv = canvasRef.current
    if (!cv) return
    const W = 60, H = 125
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = W * dpr; cv.height = H * dpr
    const ctx = cv.getContext('2d')
    ctx.scale(dpr, dpr)
    const t0 = performance.now()
    let raf

    // 3-octave trig noise — no imports needed
    const ns = (x, y, t) =>
      Math.sin(x * 2.1 + t * 1.7) * Math.cos(y * 1.9 - t * 0.9) * 0.50 +
      Math.sin(x * 4.3 - t * 2.4 + y) * Math.cos(y * 3.3 + t * 1.5) * 0.30 +
      Math.sin(x * 8.7 + t * 3.9 - y * 2) * Math.cos(y * 6.0 - t * 2.8) * 0.20

    const BY = 52  // bowl-top y in canvas px

    function frame() {
      const t = (performance.now() - t0) / 1000
      ctx.clearRect(0, 0, W, H)

      // Bowl glow halo
      ctx.globalCompositeOperation = 'source-over'
      const halo = ctx.createRadialGradient(W/2, BY + 5, 0, W/2, BY + 5, 28)
      halo.addColorStop(0,   'rgba(255,230,110,0.52)')
      halo.addColorStop(0.3, 'rgba(255,130,20,0.26)')
      halo.addColorStop(0.7, 'rgba(255,50,0,0.10)')
      halo.addColorStop(1,   'rgba(255,10,0,0)')
      ctx.fillStyle = halo
      ctx.beginPath(); ctx.ellipse(W/2, BY + 5, 28, 16, 0, 0, Math.PI * 2); ctx.fill()

      // Flame tongues — additive blending stacks naturally
      ctx.globalCompositeOperation = 'lighter'
      for (let k = 0; k < 8; k++) {
        const kt = t + k * 0.618
        const fl = 0.68 + Math.sin(kt * 3.8 + k * 1.3) * 0.22 + Math.sin(kt * 7.2 - k * 0.9) * 0.10
        const fh = (20 + fl * 26) * (1 - k * 0.04)
        const fw = 3.5 + (1 - k / 8) * 4.0
        const dx = ns(kt * 0.55, k * 0.85, t) * 5.5
        const tlt = ns(kt * 0.35, k * 0.5 + 1.2, t) * 4.0

        const bx = W/2 + dx * 0.25, by2 = BY + 1
        const tx = W/2 + dx + tlt,  ty  = BY - fh
        const c1x = bx + ns(kt, 0.2, t) * fw * 2.4,     c1y = by2 - fh * (0.30 + Math.sin(kt * 4.0) * 0.07)
        const c2x = tx + ns(kt * 1.1, 1.1, t) * fw,      c2y = ty  + fh * 0.24

        const a = (0.42 - k * 0.036) * fl
        const g = ctx.createLinearGradient(bx, by2, tx, ty)
        g.addColorStop(0,    `rgba(255,255,230,${(a * 0.88).toFixed(3)})`)
        g.addColorStop(0.18, `rgba(255,215,55,${a.toFixed(3)})`)
        g.addColorStop(0.48, `rgba(255,95,5,${(a * 0.76).toFixed(3)})`)
        g.addColorStop(0.78, `rgba(210,25,0,${(a * 0.38).toFixed(3)})`)
        g.addColorStop(1,    'rgba(120,0,0,0)')

        ctx.strokeStyle = g; ctx.lineWidth = fw; ctx.lineCap = 'round'
        ctx.beginPath(); ctx.moveTo(bx, by2); ctx.bezierCurveTo(c1x, c1y, c2x, c2y, tx, ty); ctx.stroke()
      }

      // White-hot core at flame base
      const core = ctx.createRadialGradient(W/2, BY - 2, 0, W/2, BY - 2, 9)
      core.addColorStop(0,    'rgba(255,255,255,0.75)')
      core.addColorStop(0.45, 'rgba(255,255,180,0.32)')
      core.addColorStop(1,    'rgba(255,200,0,0)')
      ctx.fillStyle = core
      ctx.beginPath(); ctx.arc(W/2, BY - 2, 9, 0, Math.PI * 2); ctx.fill()

      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div style={{ position: 'absolute', left, top: 0, width: 60, height: 125, zIndex: 9, pointerEvents: 'none' }}>
      {/* Ambient wall haze */}
      <div className="hs-torch-amb" style={{
        position: 'absolute', top: 40, left: '50%',
        transform: 'translate(-50%,0)',
        width: 114, height: 114, borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(255,120,15,0.36) 0%, rgba(255,55,0,0.11) 56%, transparent 76%)',
      }} />
      {/* Stick */}
      <div style={{
        position: 'absolute', top: 62, left: '50%',
        transform: 'translateX(-50%)',
        width: 7, height: 58,
        background: 'linear-gradient(180deg, #7a5020 0%, #3c2008 100%)',
        borderRadius: '2px 2px 0 0',
        boxShadow: 'inset -2px 0 4px rgba(0,0,0,0.45)',
      }} />
      {/* Bowl */}
      <div style={{
        position: 'absolute', top: 52, left: '50%',
        transform: 'translateX(-50%)',
        width: 22, height: 16,
        background: 'linear-gradient(180deg, #9a7030 0%, #5a3818 100%)',
        borderRadius: '4px 4px 7px 7px',
        boxShadow: 'inset 0 2px 5px rgba(0,0,0,0.55), 0 2px 10px rgba(255,100,10,0.45)',
      }} />
      {/* Ember glow at bowl top */}
      <div style={{
        position: 'absolute', top: 46, left: '50%',
        transform: 'translateX(-50%)',
        width: 18, height: 9,
        background: 'radial-gradient(ellipse, rgba(255,220,80,0.95) 0%, rgba(255,90,0,0.5) 100%)',
        borderRadius: '50%', filter: 'blur(2px)',
      }} />
      {/* Flame canvas */}
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: 60, height: 125, pointerEvents: 'none' }} />
    </div>
  )
}

/* ── Temple Background ─────────────────────────────────────────────────────── */
function TempleBackground() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 0 }}>
      {/* Deep base */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, #020a02 0%, #040e04 20%, #060f05 48%, #040e04 76%, #020a02 100%)' }} />
      {/* Stone block grid */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.26) 0px, rgba(0,0,0,0.26) 1px, transparent 1px, transparent 78px), repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 118px)' }} />
      {/* Fine diagonal grain */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.007) 0px, rgba(255,255,255,0.007) 1px, transparent 1px, transparent 3px)' }} />
      

      {/* Moss scatter */}
      {['6% 14%','19% 38%','80% 24%','92% 58%','12% 72%','86% 80%','42% 9%','56% 88%','30% 52%','68% 42%','72% 18%','28% 82%'].map((p, i) => {
        const [l, t] = p.split(' ')
        return <div key={i} style={{ position: 'absolute', left: l, top: t, width: 36 + (i % 4) * 16, height: 16 + (i % 3) * 10, background: 'radial-gradient(ellipse, rgba(14,50,7,0.44) 0%, transparent 70%)', borderRadius: '50%' }} />
      })}
      
      
      {/* Volumetric light shafts */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        {[{ l: '32%', r: -10, d: '0s' }, { l: '45%', r: -2, d: '0.6s' }, { l: '54%', r: 3, d: '1.2s' }, { l: '64%', r: 10, d: '0.3s' }].map((ray, i) => (
          <div key={i} style={{ position: 'absolute', top: 0, left: ray.l, width: 62, height: '100vh', background: 'linear-gradient(180deg, rgba(148,192,68,0.07) 0%, rgba(192,152,42,0.1) 32%, rgba(245,108,16,0.048) 72%, transparent 100%)', transform: `rotate(${ray.r}deg)`, transformOrigin: 'top center', animation: `hs-rayPulse ${4.8 + i * 0.7}s ${ray.d} ease-in-out infinite` }} />
        ))}
      </div>
      
    </div>
  )
}

/* ── Stone Panel ───────────────────────────────────────────────────────────── */
function StonePanel({ children }) {
  return (
    <div style={{
      position: 'relative', width: '100%', borderRadius: 18, overflow: 'hidden',
      background: `
        repeating-linear-gradient(0deg, transparent, transparent 32px, rgba(0,0,0,0.16) 32px, rgba(0,0,0,0.16) 33px),
        linear-gradient(158deg, rgba(24,18,8,0.97) 0%, rgba(16,11,4,0.99) 100%)
      `,
      border: '1px solid rgba(180,140,58,0.28)',
      boxShadow: '0 28px 65px rgba(0,0,0,0.75), inset 0 1px 0 rgba(212,175,55,0.1), 0 0 0 1px rgba(212,175,55,0.055)',
    }}>
      {/* Gold shimmer top */}
      <div style={{ position: 'absolute', top: 0, left: '10%', right: '10%', height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.55), transparent)' }} />
      {/* Carved corner ornaments */}
      {[
        { top: 0, left: 0, borderWidth: '2px 0 0 2px' }, { top: 0, right: 0, borderWidth: '2px 2px 0 0' },
        { bottom: 0, left: 0, borderWidth: '0 0 2px 2px' }, { bottom: 0, right: 0, borderWidth: '0 2px 2px 0' },
      ].map((s, i) => (
        <div key={i} style={{ position: 'absolute', width: 22, height: 22, borderStyle: 'solid', borderColor: 'rgba(212,175,55,0.38)', ...s }} />
      ))}
      {/* Inner stone light (torch warmth hitting stone face) */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, rgba(255,140,30,0.04) 0%, transparent 55%)', pointerEvents: 'none' }} />
      <div style={{ padding: '28px 28px', position: 'relative' }}>{children}</div>
    </div>
  )
}

/* ── Rune Divider Label ─────────────────────────────────────────────────────── */
function RuneLabel({ children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.32))' }} />
      <span style={{ fontFamily: '"Cinzel Decorative", cursive', fontSize: 8.5, letterSpacing: '4px', color: 'rgba(212,175,55,0.62)', whiteSpace: 'nowrap' }}>{children}</span>
      <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.32), transparent)' }} />
    </div>
  )
}

/* ── Stone Input ───────────────────────────────────────────────────────────── */
function StoneInput({ value, onChange, placeholder, maxLength, inputStyle = {}, ...props }) {
  return (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className="hs-stone-input"
      style={{
        width: '100%', boxSizing: 'border-box',
        padding: '14px 16px', fontSize: 18,
        fontFamily: '"Cinzel", serif', fontWeight: 600,
        borderRadius: 10, border: '1px solid rgba(212,175,55,0.22)',
        background: 'rgba(6,4,1,0.72)',
        color: '#f0d870', caretColor: '#d4af37',
        boxShadow: 'inset 0 2px 9px rgba(0,0,0,0.58)',
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(0,0,0,0.18) 22px, rgba(0,0,0,0.18) 23px)',
        outline: 'none', transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        ...inputStyle,
      }}
      {...props}
    />
  )
}

/* ── Action Button ─────────────────────────────────────────────────────────── */
function ActionButton({ children, onClick, disabled, variant = 'gold' }) {
  const isGold = variant === 'gold'
  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={isGold ? 'hs-btn-gold' : 'hs-btn-green'}
      style={{
        position: 'relative', width: '100%', height: 62,
        fontFamily: '"Cinzel Decorative", cursive', fontSize: 14, fontWeight: 900,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        borderRadius: 11, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.42 : 1, outline: 'none', overflow: 'hidden',
        color: isGold ? '#1a0d00' : '#041002',
        background: isGold
          ? 'linear-gradient(180deg, #e8c848 0%, #c8a828 18%, #a88818 48%, #886800 82%, #604800 100%)'
          : 'linear-gradient(180deg, #c4ec54 0%, #88be1c 16%, #5e9e0c 46%, #3e7e00 80%, #285000 100%)',
      }}
    >
      {/* Grain texture */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, backgroundImage: 'repeating-linear-gradient(86deg, rgba(0,0,0,0.055) 0px, rgba(0,0,0,0.055) 1px, transparent 1px, transparent 4px)', pointerEvents: 'none' }} />
      {/* Shimmer sweep */}
      <div style={{ position: 'absolute', top: 0, width: '45%', height: '100%', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.34), transparent)', transform: 'skewX(-22deg)', animation: 'hs-shimmer 3.5s 3s ease-in-out infinite', pointerEvents: 'none' }} />
      <span style={{ position: 'relative', zIndex: 1 }}>{children}</span>
    </button>
  )
}

/* ── Temple Arch SVG ───────────────────────────────────────────────────────── */
function TempleArch() {
  const paths = useRef([])
  useEffect(() => {
    paths.current.forEach((p, i) => {
      if (!p) return
      const len = p.getTotalLength ? p.getTotalLength() : 120
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0 })
      gsap.to(p, { strokeDashoffset: 0, opacity: 1, duration: 1.4 + i * 0.2, delay: 0.4 + i * 0.1, ease: 'power2.out' })
    })
  }, [])
  return (
    <svg width="260" height="32" viewBox="0 0 260 32" style={{ display: 'block', margin: '0 auto 10px' }}>
      <path ref={el => paths.current[0] = el} d="M12 32 L12 18 Q12 4 130 2 Q248 4 248 18 L248 32" stroke="rgba(212,175,55,0.42)" strokeWidth="1" fill="none" />
      <circle ref={el => paths.current[1] = el} cx="12" cy="32" r="3.5" fill="none" stroke="rgba(212,175,55,0.38)" strokeWidth="1" />
      <circle ref={el => paths.current[2] = el} cx="248" cy="32" r="3.5" fill="none" stroke="rgba(212,175,55,0.38)" strokeWidth="1" />
      <circle ref={el => paths.current[3] = el} cx="130" cy="2.5" r="2.5" fill="rgba(212,175,55,0.5)" />
      <line ref={el => paths.current[4] = el} x1="60" y1="32" x2="200" y2="32" stroke="rgba(212,175,55,0.18)" strokeWidth="0.6" />
    </svg>
  )
}

/* ── Room Code Input (4 carved slots) ────────────────────────────────────── */
function RoomCodeInput({ value, onChange, onSubmit, disabled }) {
  const chars = value.split('').concat(Array(4).fill('')).slice(0, 4)
  return (
    <div>
      <input
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
        onKeyDown={e => e.key === 'Enter' && !disabled && onSubmit()}
        maxLength={4}
        autoFocus
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
        aria-label="Room code"
      />
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 16 }}
        onClick={() => document.querySelector('[aria-label="Room code"]')?.focus()}
      >
        {chars.map((ch, i) => (
          <div key={i} style={{
            width: 58, height: 68,
            borderRadius: 8, border: `2px solid ${ch ? 'rgba(212,175,55,0.65)' : 'rgba(212,175,55,0.18)'}`,
            background: 'rgba(6,4,1,0.8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: '"Cinzel Decorative", cursive', fontSize: 26, fontWeight: 900,
            color: ch ? '#f0d870' : 'rgba(212,175,55,0.18)',
            boxShadow: ch ? '0 0 12px rgba(212,175,55,0.2), inset 0 2px 6px rgba(0,0,0,0.6)' : 'inset 0 2px 6px rgba(0,0,0,0.5)',
            cursor: 'text',
            transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(0,0,0,0.18) 20px, rgba(0,0,0,0.18) 21px)',
          }}>
            {ch || (i === value.length ? <span style={{ width: 2, height: 28, background: '#d4af37', borderRadius: 1, animation: 'hs-eyeGlow 0.9s ease-in-out infinite', display: 'block' }} /> : null)}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN HOMESCREEN
══════════════════════════════════════════════════════════════════════════════ */

export default function HomeScreen() {
  const [playerName, setPlayerName]         = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState(null)
  const [mode, setMode]                     = useState(null)   // null | 'computer' | 'friends'
  const [botCount, setBotCount]             = useState(2)
  const [showJoinForm, setShowJoinForm]     = useState(false)
  const [roomCode, setRoomCode]             = useState('')

  const { createRoom, joinRoom, startVsComputer } = useSocketContext()
  const errorMessage = useGameStore(s => s.errorMessage)
  const clearError   = useGameStore(s => s.clearError)
  const setScreen    = useGameStore(s => s.setScreen)
  const { user, logout } = useAuth()

  const canSubmit   = playerName.trim().length >= 1 && selectedAvatar !== null
  const canJoin     = canSubmit && roomCode.length === 4

  const handleCreate       = useCallback(() => { if (canSubmit) createRoom(playerName.trim(), selectedAvatar) }, [canSubmit, playerName, selectedAvatar, createRoom])
  const handleJoin         = useCallback(() => { if (canJoin)  joinRoom(roomCode, playerName.trim(), selectedAvatar) }, [canJoin, roomCode, playerName, selectedAvatar, joinRoom])
  const handleVsComputer   = useCallback(() => { if (canSubmit) startVsComputer(botCount, playerName.trim(), selectedAvatar) }, [canSubmit, botCount, playerName, selectedAvatar, startVsComputer])

  const handleModeSelect = (m) => {
    setMode(prev => prev === m ? null : m)
    setShowJoinForm(false)
    clearError()
  }

  // GSAP entry timeline
  const canvasRef   = useRef()
  const titleRef    = useRef()
  const panelRef    = useRef()
  const footerRef   = useRef()

  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(titleRef.current,
      { opacity: 0, y: -38, scale: 0.84 },
      { opacity: 1, y: 0, scale: 1, duration: 1.2, ease: 'back.out(1.4)', delay: 0.5 }
    ).fromTo(panelRef.current,
      { opacity: 0, y: 32, scale: 0.96 },
      { opacity: 1, y: 0, scale: 1, duration: 1.0, ease: 'back.out(1.2)' }, '-=0.4'
    ).fromTo(footerRef.current,
      { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.2'
    )
    return () => tl.kill()
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflowY: 'auto', overflowX: 'hidden', WebkitOverflowScrolling: 'touch' }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Fixed background ──────────────────────────────────────────────── */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <MountainBackground />

        {/* Atmosphere overlay (fireflies, light rays) */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, opacity: 0.48 }}>
          <JungleAtmosphere hideBackground={true} />
        </div>

        {/* Leaf canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }} />
        <LeafCanvas canvasRef={canvasRef} />

        {/* Dense jungle tree silhouettes */}
        <JungleForest side="left" />
        <JungleForest side="right" />

        {/* Mid-ground fireflies */}
        <Fireflies />

        {/* Hanging vines from top edge */}
        <HangingVinesTop />

        {/* Vine clusters */}
        <Vine fromRight={false} offset={-25} freq={4.2} amp={3.2} phase={0.00} />
        <Vine fromRight={false} offset={55}  freq={3.7} amp={2.7} phase={0.38} />
        <Vine fromRight={true}  offset={-25} freq={3.9} amp={3.0} phase={0.18} />
        <Vine fromRight={true}  offset={55}  freq={4.6} amp={2.5} phase={0.52} />

        {/* Vignette above 3D scene for depth framing */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 7, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 46%, transparent 10%, rgba(2,8,2,0.58) 68%), linear-gradient(180deg, rgba(2,8,2,0.88) 0%, rgba(2,8,2,0.06) 40%, rgba(2,8,2,0.25) 72%, rgba(2,8,2,0.92) 100%)' }} />

        {/* Corner foliage — cinematic jungle framing */}
        <CornerFoliage />

      </div>

      {/* ── User pill (top-right) ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
        style={{ position: 'fixed', top: 14, right: 16, zIndex: 20, display: 'flex', alignItems: 'center', gap: 8 }}
      >
        {user && (
          <span style={{ fontFamily: '"Cinzel", serif', fontSize: 9, letterSpacing: '1.5px', color: 'rgba(212,175,55,0.65)', maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.displayName || user.email?.split('@')[0]}
          </span>
        )}
        {/* Profile button */}
        <button
          onClick={() => setScreen('profile')}
          style={{
            fontFamily: '"Cinzel Decorative", cursive', fontWeight: 900, fontSize: 8.5, letterSpacing: '2px',
            color: '#d4af37', background: 'linear-gradient(180deg, #1e1500 0%, #110c00 100%)',
            border: '1px solid rgba(212,175,55,0.4)', borderRadius: 20,
            padding: '7px 15px', cursor: 'pointer', outline: 'none',
            boxShadow: '0 4px 0 rgba(0,0,0,0.65), 0 6px 14px rgba(0,0,0,0.4), 0 0 14px rgba(212,175,55,0.12)',
            transition: 'transform 0.12s ease, box-shadow 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.65), 0 8px 18px rgba(0,0,0,0.4), 0 0 20px rgba(212,175,55,0.22)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 rgba(0,0,0,0.65), 0 6px 14px rgba(0,0,0,0.4), 0 0 14px rgba(212,175,55,0.12)' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.65)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.65), 0 8px 18px rgba(0,0,0,0.4)' }}
        >
          ✦ Profile
        </button>
        <button
          onClick={logout}
          style={{
            fontFamily: '"Cinzel Decorative", cursive', fontWeight: 900, fontSize: 8.5, letterSpacing: '2px',
            color: '#c8a830', background: 'linear-gradient(180deg, #28200a 0%, #181204 100%)',
            border: '1px solid rgba(212,175,55,0.28)', borderRadius: 20,
            padding: '7px 15px', cursor: 'pointer', outline: 'none',
            boxShadow: '0 4px 0 rgba(0,0,0,0.65), 0 6px 14px rgba(0,0,0,0.4)',
            transition: 'transform 0.12s ease, box-shadow 0.12s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.65), 0 8px 18px rgba(0,0,0,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 0 rgba(0,0,0,0.65), 0 6px 14px rgba(0,0,0,0.4)' }}
          onMouseDown={e => { e.currentTarget.style.transform = 'translateY(2px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.65)' }}
          onMouseUp={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 0 rgba(0,0,0,0.65), 0 8px 18px rgba(0,0,0,0.4)' }}
        >
          ✦ Logout
        </button>
      </motion.div>

      {/* ── Scrollable content ────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 72, paddingBottom: 100 }}>
        <div style={{ width: '100%', maxWidth: 520, padding: '0 18px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

          {/* Title block */}
          <div ref={titleRef} style={{ opacity: 0, textAlign: 'center', marginBottom: 20, width: '100%' }}>
            <TempleArch />
            <div
              className="hs-title"
              style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 'clamp(44px, 9vw, 88px)',
                fontWeight: 900, color: '#ffe055', letterSpacing: '0.11em',
                lineHeight: 1, userSelect: 'none',
              }}
            >
              TIKI TOPPLE
            </div>
            {/* Subtitle divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '14px 0 8px' }}>
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5))' }} />
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#d4af37', boxShadow: '0 0 10px rgba(212,175,55,0.8)' }} />
              <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.5), transparent)' }} />
            </div>
            <div style={{ fontFamily: '"Cinzel", serif', fontSize: 'clamp(10px, 1.2vw, 13px)', color: 'rgba(168,225,108,0.75)', letterSpacing: '0.26em', textTransform: 'uppercase', textShadow: '0 2px 12px rgba(0,0,0,0.95)' }}>
              The Ancient Game of Totem Domination
            </div>
          </div>

          {/* Stone panel */}
          <div ref={panelRef} style={{ opacity: 0, width: '100%' }}>
            <StonePanel>

              {/* Avatar picker */}
              <div style={{ marginBottom: 22 }}>
                <AvatarCarousel selectedId={selectedAvatar} onSelect={setSelectedAvatar} />
              </div>

              {/* Player name */}
              <RuneLabel>YOUR WARRIOR NAME</RuneLabel>
              <div style={{ marginBottom: 22 }}>
                <StoneInput
                  value={playerName}
                  onChange={e => setPlayerName(e.target.value)}
                  placeholder="Enter your name…"
                  maxLength={20}
                  onKeyDown={e => e.key === 'Enter' && handleCreate()}
                />
                {/* Char count */}
                <div style={{ textAlign: 'right', marginTop: 5, fontFamily: '"Cinzel", serif', fontSize: 9, color: 'rgba(212,175,55,0.35)', letterSpacing: '1px' }}>
                  {playerName.length} / 20
                </div>
              </div>

              {/* Mode selector */}
              <RuneLabel>CHOOSE YOUR BATTLE</RuneLabel>
              <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                {/* VS Computer */}
                <button
                  onClick={() => handleModeSelect('computer')}
                  disabled={!canSubmit}
                  style={{
                    flex: 1, height: 58,
                    fontFamily: '"Cinzel Decorative", cursive', fontSize: 11, fontWeight: 900,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderRadius: 11, border: mode === 'computer' ? '2px solid rgba(255,120,30,0.8)' : '2px solid rgba(180,80,20,0.35)',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    opacity: canSubmit ? 1 : 0.42, outline: 'none', overflow: 'hidden',
                    color: '#1a0800',
                    background: mode === 'computer'
                      ? 'linear-gradient(180deg, #ff9a3c 0%, #e07010 22%, #b85808 54%, #8a3c00 82%, #5c2400 100%)'
                      : 'linear-gradient(180deg, #c87828 0%, #a05e18 22%, #7c4408 54%, #582c00 82%, #3c1800 100%)',
                    boxShadow: mode === 'computer'
                      ? '0 0 22px rgba(255,120,30,0.55), 0 6px 0 #3c1800, 0 10px 20px rgba(0,0,0,0.8)'
                      : '0 4px 0 #3c1800, 0 8px 18px rgba(0,0,0,0.7)',
                    transition: 'all 0.18s ease',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 10, backgroundImage: 'repeating-linear-gradient(86deg, rgba(0,0,0,0.055) 0px, rgba(0,0,0,0.055) 1px, transparent 1px, transparent 4px)', pointerEvents: 'none' }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>⚔ VS Computer</span>
                </button>

                {/* With Friends */}
                <button
                  onClick={() => handleModeSelect('friends')}
                  disabled={!canSubmit}
                  className={canSubmit ? 'hs-btn-green' : ''}
                  style={{
                    flex: 1, height: 58,
                    fontFamily: '"Cinzel Decorative", cursive', fontSize: 11, fontWeight: 900,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    borderRadius: 11, border: mode === 'friends' ? '2px solid rgba(80,228,28,0.65)' : '2px solid rgba(38,168,10,0.3)',
                    cursor: canSubmit ? 'pointer' : 'not-allowed',
                    opacity: canSubmit ? 1 : 0.42, outline: 'none', overflow: 'hidden',
                    color: '#041002',
                    background: 'linear-gradient(180deg, #c4ec54 0%, #88be1c 16%, #5e9e0c 46%, #3e7e00 80%, #285000 100%)',
                    position: 'relative',
                  }}
                >
                  <div style={{ position: 'absolute', inset: 0, borderRadius: 10, backgroundImage: 'repeating-linear-gradient(86deg, rgba(0,0,0,0.055) 0px, rgba(0,0,0,0.055) 1px, transparent 1px, transparent 4px)', pointerEvents: 'none' }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>⛩ With Friends</span>
                </button>
              </div>

              {/* VS Computer expanded */}
              <AnimatePresence>
                {mode === 'computer' && (
                  <motion.div
                    key="computer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(255,120,30,0.18)' }}>
                      <RuneLabel>NUMBER OF PLAYERS</RuneLabel>
                      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                        {[2, 3, 4].map(n => (
                          <button
                            key={n}
                            onClick={() => setBotCount(n)}
                            style={{
                              flex: 1, height: 64,
                              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                              fontFamily: '"Cinzel Decorative", cursive', fontWeight: 900,
                              borderRadius: 10,
                              border: botCount === n ? '2px solid rgba(255,120,30,0.75)' : '2px solid rgba(180,80,20,0.28)',
                              background: botCount === n
                                ? 'linear-gradient(158deg, rgba(255,120,30,0.22) 0%, rgba(180,60,0,0.12) 100%)'
                                : 'rgba(6,4,1,0.72)',
                              color: botCount === n ? '#ffb060' : 'rgba(212,175,55,0.55)',
                              cursor: 'pointer', outline: 'none',
                              boxShadow: botCount === n ? '0 0 14px rgba(255,120,30,0.3)' : 'inset 0 2px 6px rgba(0,0,0,0.5)',
                              transition: 'all 0.18s ease',
                            }}
                          >
                            <span style={{ fontSize: 22, lineHeight: 1 }}>{n}</span>
                            <span style={{ fontSize: 7, letterSpacing: '2px', opacity: 0.7 }}>PLAYERS</span>
                          </button>
                        ))}
                      </div>
                      <div style={{
                        marginBottom: 14, padding: '8px 12px', borderRadius: 8,
                        background: 'rgba(255,120,30,0.07)',
                        border: '1px solid rgba(255,120,30,0.15)',
                        fontFamily: '"Cinzel", serif', fontSize: 11,
                        color: 'rgba(255,180,80,0.65)', letterSpacing: '0.04em', textAlign: 'center',
                      }}>
                        You vs {botCount - 1} bot{botCount - 1 > 1 ? 's' : ''}
                      </div>
                      <ActionButton onClick={handleVsComputer} disabled={!canSubmit} variant="gold">
                        ⚔ Start Battle
                      </ActionButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* With Friends expanded */}
              <AnimatePresence>
                {mode === 'friends' && (
                  <motion.div
                    key="friends"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid rgba(80,228,28,0.18)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <ActionButton onClick={handleCreate} disabled={!canSubmit} variant="gold">
                        ⚡ Create Room
                      </ActionButton>
                      <ActionButton onClick={() => { setShowJoinForm(v => !v); clearError() }} variant="green">
                        {showJoinForm ? '✕ Cancel' : '⛩ Join Room'}
                      </ActionButton>

                      <AnimatePresence>
                        {showJoinForm && (
                          <motion.div
                            key="join"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.32, ease: 'easeInOut' }}
                            style={{ overflow: 'hidden' }}
                          >
                            <div style={{ paddingTop: 16, borderTop: '1px solid rgba(212,175,55,0.12)' }}>
                              <RuneLabel>ROOM CODE</RuneLabel>
                              <RoomCodeInput value={roomCode} onChange={setRoomCode} onSubmit={handleJoin} disabled={!canJoin} />
                              <ActionButton onClick={handleJoin} disabled={!canJoin} variant="gold">
                                ↵ Enter the Temple
                              </ActionButton>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error message */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.div
                    key="error"
                    initial={{ opacity: 0, y: -10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    className="hs-error"
                    style={{
                      marginTop: 16, borderRadius: 10,
                      border: '1px solid rgba(220,55,55,0.35)',
                      background: 'rgba(160,15,15,0.14)',
                      padding: '12px 16px',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    }}
                  >
                    <span style={{ fontFamily: '"Cinzel", serif', fontSize: 13, color: '#f08080', letterSpacing: '0.04em' }}>{errorMessage}</span>
                    <button onClick={clearError} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,100,100,0.65)', fontSize: 16, fontWeight: 900, marginLeft: 12, lineHeight: 1 }}>✕</button>
                  </motion.div>
                )}
              </AnimatePresence>

            </StonePanel>
          </div>

          {/* Footer */}
          <div ref={footerRef} style={{ opacity: 0, marginTop: 28, textAlign: 'center' }}>
            <div style={{ fontFamily: '"Cinzel Decorative", cursive', fontSize: 8.5, letterSpacing: '4px', color: 'rgba(212,175,55,0.28)' }}>
              ✦ 2 – 4 PLAYERS · TURN-BASED STRATEGY ✦
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
