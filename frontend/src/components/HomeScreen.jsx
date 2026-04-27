import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { gsap } from 'gsap'
import { useSocketContext } from '../context/SocketContext'
import useGameStore from '../store/gameStore'
import { AVATARS } from '../data/avatars'
import { useAuth } from '../context/AuthContext'

// ══════════════════════════════════════════════════════════════════════════════
// TIKI TOPPLE — TEMPLE ANTECHAMBER
// Aesthetic: Riot Games × Supercell × Jungle Archaeology
// You stand in the stone antechamber before the ancient trials begin.
// Every element is carved, weighted, amber-lit, moss-grown.
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
    0%,100% { opacity: 0.04; }
    50%      { opacity: 0.10; }
  }
  @keyframes hs-torchAmb {
    0%,100% { opacity: 0.45; }
    33%     { opacity: 0.68; }
    66%     { opacity: 0.38; }
  }
  @keyframes hs-runeDrawIn {
    to { stroke-dashoffset: 0; opacity: 0.85; }
  }
  @keyframes hs-runeBreath {
    0%,100% { opacity: 0.55; }
    50%     { opacity: 0.18; }
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
  .hs-avatar-card { transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s ease; }
  .hs-avatar-card:hover:not(.selected) { transform: translateY(-6px) scale(1.06); }
  .hs-avatar-card.selected { transform: translateY(-8px) scale(1.1); }
  .hs-eye-glow { animation: hs-eyeGlow 2.2s ease-in-out infinite; pointer-events: none; }
  .hs-stone-input:focus { outline: none; border-color: rgba(212,175,55,0.65) !important; box-shadow: inset 0 2px 8px rgba(0,0,0,0.55), 0 0 0 2px rgba(212,175,55,0.14) !important; }
  .hs-torch-amb { animation: hs-torchAmb 1.9s ease-in-out infinite; }
  .hs-error { animation: hs-errorPulse 1.8s ease-in-out infinite; }
`

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
  return (
    <div ref={ref} style={{ position: 'absolute', top: 0, ...(fromRight ? { right: offset } : { left: offset }), transformOrigin: 'top center', zIndex: 6, pointerEvents: 'none' }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" overflow="visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#041404" /><stop offset="35%" stopColor="#0c2c0c" />
            <stop offset="72%" stopColor="#184518" /><stop offset="100%" stopColor="#206520" />
          </linearGradient>
        </defs>
        <path d={path} stroke="rgba(0,0,0,0.32)" strokeWidth="9" strokeLinecap="round" opacity="0.45" />
        <path d={path} stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" />
        <path d={path} stroke="rgba(52,148,32,0.15)" strokeWidth="3" strokeLinecap="round" />
        {leafData.map((t, idx) => {
          const ls = idx % 2 === 0 ? cd : -cd
          const px = cx + ls * (22 + (idx % 3) * 5); const py = H * t
          const angle = ls * (21 + (idx % 3) * 8)
          const lw = Math.max(18 - idx * 0.6, 11); const lh = Math.max(9 - idx * 0.25, 6)
          return (
            <g key={idx} transform={`translate(${px}, ${py}) rotate(${angle})`}>
              <ellipse cx="0" cy="0" rx={lw} ry={lh} fill={idx % 2 === 0 ? '#3a8e2c' : '#48a23a'} />
              <ellipse cx="0" cy="0" rx={lw} ry={lh} fill="none" stroke="#163c0e" strokeWidth="0.65" />
              <line x1={-(lw - 2)} y1="0" x2={lw - 2} y2="0" stroke="#1c5614" strokeWidth="0.85" />
            </g>
          )
        })}
        {[H * 0.24, H * 0.5, H * 0.74].map((y, i) => {
          const tx = cx + cd * (i % 2 === 0 ? 14 : -10)
          return <path key={i} d={`M ${tx} ${y} C ${tx + cd * 14} ${y + 13} ${tx + cd * 22} ${y + 29} ${tx + cd * 16} ${y + 50}`} stroke="#206520" strokeWidth="2" strokeLinecap="round" opacity="0.62" />
        })}
      </svg>
    </div>
  )
}

/* ── GSAP Torch ────────────────────────────────────────────────────────────── */
function Torch({ left }) {
  const outerRef = useRef(), innerRef = useRef(), glowRef = useRef()
  useEffect(() => {
    const bld = (el, fs) => { const t = gsap.timeline({ repeat: -1 }); fs.forEach(f => t.to(el, { ...f, ease: 'none' })); return t }
    const t1 = bld(outerRef.current, [
      { scaleX: 1, scaleY: 1, dur: 0.08 }, { scaleX: 0.74, scaleY: 1.4, duration: 0.13 },
      { scaleX: 1.2, scaleY: 0.83, duration: 0.09 }, { scaleX: 0.88, scaleY: 1.24, duration: 0.15 },
      { scaleX: 1.1, scaleY: 0.88, duration: 0.07 }, { scaleX: 0.94, scaleY: 1.16, duration: 0.12 },
      { scaleX: 1, scaleY: 1, duration: 0.09 },
    ])
    const t2 = bld(innerRef.current, [
      { scaleX: 1, scaleY: 1, duration: 0.10 }, { scaleX: 0.66, scaleY: 1.46, duration: 0.12 },
      { scaleX: 1.24, scaleY: 0.76, duration: 0.08 }, { scaleX: 0.8, scaleY: 1.28, duration: 0.14 },
      { scaleX: 1, scaleY: 1, duration: 0.10 },
    ])
    gsap.to(glowRef.current, { opacity: 0.78, scale: 1.28, duration: 1.6, repeat: -1, yoyo: true, ease: 'sine.inOut' })
    return () => { t1.kill(); t2.kill(); gsap.killTweensOf(glowRef.current) }
  }, [])
  return (
    <div style={{ position: 'absolute', left, top: 0, width: 60, height: 125, zIndex: 9, pointerEvents: 'none' }}>
      <div ref={glowRef} style={{ position: 'absolute', top: 42, left: '50%', transform: 'translate(-50%,0)', width: 105, height: 105, borderRadius: '50%', opacity: 0.48, background: 'radial-gradient(ellipse, rgba(255,120,10,0.4) 0%, rgba(255,65,0,0.12) 52%, transparent 70%)' }} />
      <div style={{ position: 'absolute', top: 55, left: '50%', transform: 'translateX(-50%)', width: 6, height: 50, background: 'linear-gradient(180deg, #5a3c10 0%, #2c1a06 100%)', borderRadius: '2px 2px 0 0' }} />
      <div style={{ position: 'absolute', top: 40, left: '50%', transform: 'translateX(-50%)', width: 18, height: 14, background: 'linear-gradient(180deg, #7a5520 0%, #3c2408 100%)', borderRadius: '3px 3px 5px 5px' }} />
      <div ref={outerRef} style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 22, height: 38, background: 'linear-gradient(180deg, rgba(255,42,0,0) 0%, rgba(255,92,0,0.9) 48%, rgba(192,42,0,1) 100%)', borderRadius: '50% 50% 32% 32%', transformOrigin: 'bottom center', filter: 'blur(1.3px)' }} />
      <div ref={innerRef} style={{ position: 'absolute', top: 14, left: '50%', transform: 'translateX(-50%)', width: 12, height: 25, background: 'linear-gradient(180deg, rgba(255,255,90,0) 0%, rgba(255,225,40,0.98) 100%)', borderRadius: '50% 50% 26% 26%', transformOrigin: 'bottom center', filter: 'blur(0.6px)' }} />
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
      {/* Distant temple silhouette */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1 }}>
        <svg viewBox="0 0 1440 300" width="100%" height="300" preserveAspectRatio="none">
          {/* Mountain range */}
          <path d="M0 300 L0 230 L70 200 L110 148 L150 200 L220 175 L280 105 L340 175 L395 155 L450 85 L510 155 L565 118 L620 58 L680 118 L740 138 L800 78 L860 138 L920 98 L978 155 L1038 172 L1098 118 L1158 195 L1218 158 L1278 198 L1340 218 L1440 230 L1440 300Z" fill="#0a1606" opacity="0.92" />
          {/* Temple pyramid stepped */}
          <rect x="278" y="38" width="4" height="12" fill="#0e1c05" />
          <rect x="272" y="50" width="16" height="10" fill="#0e1c05" rx="1" />
          <rect x="264" y="60" width="32" height="10" fill="#101f06" rx="1" />
          <rect x="254" y="70" width="52" height="10" fill="#122208" rx="1" />
          <rect x="642" y="18" width="5" height="14" fill="#0b1804" />
          <rect x="634" y="32" width="21" height="12" fill="#0c1a05" rx="1" />
          <rect x="622" y="44" width="45" height="12" fill="#0e1e06" rx="1" />
          <rect x="608" y="56" width="73" height="14" fill="#102208" rx="1" />
          <rect x="1038" y="30" width="4" height="12" fill="#0e1c05" />
          <rect x="1032" y="42" width="16" height="10" fill="#0e1c05" rx="1" />
          <rect x="1023" y="52" width="34" height="10" fill="#101f06" rx="1" />
          <rect x="1012" y="62" width="56" height="10" fill="#122208" rx="1" />
          {/* Ground */}
          <path d="M0 300 L0 285 Q360 268 720 270 Q1080 268 1440 285 L1440 300Z" fill="#0e1a06" opacity="0.96" />
        </svg>
      </div>
      {/* Volumetric light shafts */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
        {[{ l: '32%', r: -10, d: '0s' }, { l: '45%', r: -2, d: '0.6s' }, { l: '54%', r: 3, d: '1.2s' }, { l: '64%', r: 10, d: '0.3s' }].map((ray, i) => (
          <div key={i} style={{ position: 'absolute', top: 0, left: ray.l, width: 62, height: '100vh', background: 'linear-gradient(180deg, rgba(148,192,68,0.07) 0%, rgba(192,152,42,0.1) 32%, rgba(245,108,16,0.048) 72%, transparent 100%)', transform: `rotate(${ray.r}deg)`, transformOrigin: 'top center', animation: `hs-rayPulse ${4.8 + i * 0.7}s ${ray.d} ease-in-out infinite` }} />
        ))}
      </div>
      {/* Torch ambient wall glow */}
      <div className="hs-torch-amb" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'radial-gradient(ellipse at 4% 14%, rgba(245,90,12,0.14) 0%, transparent 26%), radial-gradient(ellipse at 96% 14%, rgba(245,90,12,0.14) 0%, transparent 26%)' }} />
      {/* Vignette */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 46%, transparent 10%, rgba(2,8,2,0.58) 68%), linear-gradient(180deg, rgba(2,8,2,0.88) 0%, rgba(2,8,2,0.06) 40%, rgba(2,8,2,0.25) 72%, rgba(2,8,2,0.92) 100%)' }} />
    </div>
  )
}

/* ── Avatar Selection Ring SVG ─────────────────────────────────────────────── */
function AvatarRing({ isSelected }) {
  return (
    <svg viewBox="0 0 104 104" style={{ position: 'absolute', inset: -4, width: 'calc(100% + 8px)', height: 'calc(100% + 8px)', overflow: 'visible', pointerEvents: 'none', zIndex: 3 }}>
      <circle cx="52" cy="52" r="48" fill="none" stroke="rgba(212,175,55,0.15)" strokeWidth="1.5" />
      <motion.circle
        cx="52" cy="52" r="48" fill="none" stroke="#d4af37" strokeWidth="2.5" strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: isSelected ? 1 : 0, opacity: isSelected ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ rotate: -90 }}
      />
      {isSelected && [0, 90, 180, 270].map(deg => (
        <motion.circle key={deg}
          cx={52 + 48 * Math.cos((deg - 90) * Math.PI / 180)}
          cy={52 + 48 * Math.sin((deg - 90) * Math.PI / 180)}
          r="3" fill="#d4af37"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.32, type: 'spring', stiffness: 380 }}
        />
      ))}
    </svg>
  )
}

/* ── Avatar Card ───────────────────────────────────────────────────────────── */
function AvatarCard({ avatar, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`hs-avatar-card ${isSelected ? 'selected' : ''}`}
      style={{
        position: 'relative', width: 96, height: 122, padding: 0,
        borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
        background: isSelected
          ? 'linear-gradient(160deg, #382c08 0%, #261e04 100%)'
          : 'linear-gradient(160deg, #1c1808 0%, #121006 100%)',
        boxShadow: isSelected
          ? '0 0 22px rgba(212,175,55,0.38), 0 10px 24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,175,55,0.16)'
          : '0 5px 14px rgba(0,0,0,0.55)',
        outline: 'none',
      }}
    >
      {/* Stone grain */}
      <div style={{ position: 'absolute', inset: 0, borderRadius: 10, backgroundImage: 'repeating-linear-gradient(87deg, transparent 0px, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)', pointerEvents: 'none' }} />
      {/* Desat overlay for unselected */}
      {!isSelected && <div style={{ position: 'absolute', inset: 0, borderRadius: 10, background: 'rgba(0,0,0,0)', mixBlendMode: 'color', backdropFilter: 'saturate(0.45)', pointerEvents: 'none' }} />}
      {/* SVG avatar */}
      <div dangerouslySetInnerHTML={{ __html: avatar.svg }}
        style={{ position: 'absolute', top: 6, left: 6, right: 6, height: 84, overflow: 'hidden', borderRadius: '6px 6px 0 0', filter: isSelected ? 'none' : 'saturate(0.55) brightness(0.82)', transition: 'filter 0.28s ease' }}
      />
      {/* Eye glow hover overlay (simulates tiki eyes lighting up) */}
      {!isSelected && (
        <div className="hs-eye-glow" style={{ position: 'absolute', top: 24, left: 6, right: 6, height: 44, borderRadius: 6, background: 'radial-gradient(ellipse at 50% 55%, rgba(55,220,28,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
      )}
      {/* Name label */}
      <div style={{ position: 'absolute', bottom: 6, left: 0, right: 0, textAlign: 'center', fontFamily: '"Cinzel Decorative", cursive', fontSize: 8, letterSpacing: '0.08em', color: isSelected ? '#d4af37' : 'rgba(195,172,88,0.5)', textShadow: isSelected ? '0 0 8px rgba(212,175,55,0.6)' : 'none', transition: 'color 0.25s ease' }}>
        {avatar.name}
      </div>
      {/* Gold top edge on selected */}
      {isSelected && <div style={{ position: 'absolute', top: 0, left: 12, right: 12, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.5), transparent)' }} />}
      {/* Check badge */}
      {isSelected && (
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, borderRadius: '50%', background: '#d4af37', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: '#1a0d00' }}>✓</motion.div>
      )}
      {/* Selection ring */}
      <AvatarRing isSelected={isSelected} />
    </button>
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
      {/* Hidden real input */}
      <input
        value={value}
        onChange={e => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4))}
        onKeyDown={e => e.key === 'Enter' && !disabled && onSubmit()}
        maxLength={4}
        autoFocus
        style={{ position: 'absolute', opacity: 0, width: 1, height: 1, pointerEvents: 'none' }}
        aria-label="Room code"
      />
      {/* Visual 4-slot display */}
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
  const [showJoinForm, setShowJoinForm]     = useState(false)
  const [roomCode, setRoomCode]             = useState('')

  const { createRoom, joinRoom } = useSocketContext()
  const errorMessage = useGameStore(s => s.errorMessage)
  const clearError   = useGameStore(s => s.clearError)
  const { user, logout } = useAuth()

  const canSubmit   = playerName.trim().length >= 1 && selectedAvatar !== null
  const canJoin     = canSubmit && roomCode.length === 4

  const handleCreate = useCallback(() => { if (canSubmit) createRoom(playerName.trim(), selectedAvatar) }, [canSubmit, playerName, selectedAvatar, createRoom])
  const handleJoin   = useCallback(() => { if (canJoin)  joinRoom(roomCode, playerName.trim(), selectedAvatar) }, [canJoin, roomCode, playerName, selectedAvatar, joinRoom])

  // ── Refs for GSAP entry ──
  const canvasRef   = useRef()
  const titleRef    = useRef()
  const panelRef    = useRef()
  const footerRef   = useRef()

  // GSAP entry timeline
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
        <TempleBackground />
        {/* Leaf canvas */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 4, pointerEvents: 'none' }} />
        <LeafCanvas canvasRef={canvasRef} />
        {/* Vine clusters */}
        <Vine fromRight={false} offset={-25} freq={4.2} amp={3.2} phase={0.00} />
        <Vine fromRight={false} offset={55}  freq={3.7} amp={2.7} phase={0.38} />
        <Vine fromRight={true}  offset={-25} freq={3.9} amp={3.0} phase={0.18} />
        <Vine fromRight={true}  offset={55}  freq={4.6} amp={2.5} phase={0.52} />
        {/* Torches */}
        <Torch left="14px" />
        <Torch left="calc(100% - 74px)" />
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

          {/* ── Title block ─────────────────────────────────────────────── */}
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

          {/* ── Stone panel ─────────────────────────────────────────────── */}
          <div ref={panelRef} style={{ opacity: 0, width: '100%' }}>
            <StonePanel>

              {/* Avatar picker */}
              <RuneLabel>CHOOSE YOUR AVATAR</RuneLabel>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 22 }}>
                {AVATARS.map(av => (
                  <AvatarCard key={av.id} avatar={av} isSelected={selectedAvatar === av.id} onClick={() => setSelectedAvatar(av.id)} />
                ))}
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

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <ActionButton onClick={handleCreate} disabled={!canSubmit} variant="gold">
                  ⚡ Create Room
                </ActionButton>
                <ActionButton onClick={() => { setShowJoinForm(v => !v); clearError() }} variant="green">
                  {showJoinForm ? '✕ Cancel' : '⛩ Join Room'}
                </ActionButton>
              </div>

              {/* Join form */}
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
                    <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px solid rgba(212,175,55,0.12)' }}>
                      <RuneLabel>ROOM CODE</RuneLabel>
                      <RoomCodeInput value={roomCode} onChange={setRoomCode} onSubmit={handleJoin} disabled={!canJoin} />
                      <ActionButton onClick={handleJoin} disabled={!canJoin} variant="gold">
                        ↵ Enter the Temple
                      </ActionButton>
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

          {/* ── Footer ──────────────────────────────────────────────────── */}
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
