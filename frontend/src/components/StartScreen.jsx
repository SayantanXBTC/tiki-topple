import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useAnimation } from 'framer-motion'
import { gsap } from 'gsap'

/* ── Seeded RNG ───────────────────────────────────────────────────────────── */
function mkRng(seed) {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

/* ── Leaf Canvas ─────────────────────────────────────────────────────────── */
function LeafCanvas({ canvasRef }) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight }
    resize()
    window.addEventListener('resize', resize)

    const rand = mkRng(77)
    const leaves = Array.from({ length: 34 }, () => ({
      x: rand() * window.innerWidth,
      y: rand() * window.innerHeight,
      vx: (rand() - 0.5) * 0.55,
      vy: 0.32 + rand() * 0.7,
      rot: rand() * Math.PI * 2,
      rotV: (rand() - 0.5) * 0.022,
      sc: 0.45 + rand() * 0.95,
      op: 0.3 + rand() * 0.55,
      sw: rand() * Math.PI * 2,
      swF: 0.006 + rand() * 0.011,
      swA: 16 + rand() * 26,
      hue: 92 + rand() * 40,
    }))

    function drawLeaf(l) {
      ctx.save()
      ctx.translate(l.x, l.y)
      ctx.rotate(l.rot)
      ctx.scale(l.sc, l.sc)
      ctx.globalAlpha = l.op
      ctx.beginPath()
      ctx.moveTo(0, -13)
      ctx.bezierCurveTo(9, -9, 11, 2, 5, 10)
      ctx.bezierCurveTo(2, 14, -2, 14, -5, 10)
      ctx.bezierCurveTo(-11, 2, -9, -9, 0, -13)
      ctx.closePath()
      const g = ctx.createLinearGradient(0, -13, 0, 14)
      g.addColorStop(0, `hsla(${l.hue + 18}, 68%, 38%, 1)`)
      g.addColorStop(0.55, `hsla(${l.hue}, 62%, 26%, 1)`)
      g.addColorStop(1, `hsla(${l.hue - 12}, 52%, 16%, 1)`)
      ctx.fillStyle = g
      ctx.fill()
      ctx.beginPath()
      ctx.moveTo(0, -12)
      ctx.quadraticCurveTo(1, 0, 0, 12)
      ctx.strokeStyle = `hsla(${l.hue - 22}, 58%, 18%, 0.65)`
      ctx.lineWidth = 0.9
      ctx.stroke()
      ctx.beginPath()
      ctx.ellipse(-2, -4, 3, 6, -0.4, 0, Math.PI * 2)
      ctx.fillStyle = `hsla(${l.hue + 28}, 80%, 62%, 0.1)`
      ctx.fill()
      ctx.restore()
    }

    function tick(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      leaves.forEach(l => {
        l.x += l.vx + Math.sin(l.sw) * 0.22
        l.y += l.vy
        l.rot += l.rotV
        l.sw += l.swF
        l.x += Math.cos(now * 0.00022 + l.sw * 0.3) * 0.1
        drawLeaf(l)
        if (l.y > canvas.height + 20) { l.y = -20; l.x = Math.random() * canvas.width }
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize) }
  }, [])
  return null
}

/* ── Physics Vine ─────────────────────────────────────────────────────────── */
function Vine({ fromRight, offset, freq, amp, phase }) {
  const ref = useRef()
  const gid = `vg_${fromRight ? 'r' : 'l'}_${offset}`
  const cd = fromRight ? -1 : 1
  const W = 96, H = 700, cx = W / 2

  useEffect(() => {
    if (!ref.current) return
    // Compound pendulum: overlay multiple periods for organic, decaying-swing feel
    const tl = gsap.timeline({ repeat: -1 })
    tl.to(ref.current, { rotate: amp, duration: freq, ease: 'sine.inOut', transformOrigin: 'top center' })
      .to(ref.current, { rotate: -amp * 0.72, duration: freq * 0.88, ease: 'sine.inOut' })
      .to(ref.current, { rotate: amp * 0.45, duration: freq * 1.08, ease: 'sine.inOut' })
      .to(ref.current, { rotate: -amp * 0.22, duration: freq * 0.94, ease: 'sine.inOut' })
      .to(ref.current, { rotate: 0, duration: freq * 0.75, ease: 'sine.inOut' })
    tl.progress(phase)
    return () => tl.kill()
  }, [])

  const path = `M ${cx} 0 C ${cx + cd * 18} ${H * 0.19} ${cx - cd * 22} ${H * 0.39} ${cx + cd * 14} ${H * 0.59} C ${cx - cd * 16} ${H * 0.76} ${cx + cd * 9} ${H * 0.89} ${cx} ${H}`

  const leafData = [
    { t: 0.10 }, { t: 0.22 }, { t: 0.34 }, { t: 0.46 },
    { t: 0.58 }, { t: 0.70 }, { t: 0.82 }, { t: 0.91 },
  ]

  return (
    <div ref={ref} style={{
      position: 'absolute', top: 0,
      ...(fromRight ? { right: offset } : { left: offset }),
      transformOrigin: 'top center',
      zIndex: 6, pointerEvents: 'none',
    }}>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} fill="none" overflow="visible">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#051505" />
            <stop offset="35%" stopColor="#0d2e0d" />
            <stop offset="72%" stopColor="#194819" />
            <stop offset="100%" stopColor="#236823" />
          </linearGradient>
        </defs>
        <path d={path} stroke="rgba(0,0,0,0.35)" strokeWidth="10" strokeLinecap="round" opacity="0.5" />
        <path d={path} stroke={`url(#${gid})`} strokeWidth="7.5" strokeLinecap="round" />
        <path d={path} stroke="rgba(55,155,35,0.16)" strokeWidth="3.5" strokeLinecap="round" />

        {leafData.map(({ t }, idx) => {
          const ls = idx % 2 === 0 ? cd : -cd
          const px = cx + ls * (24 + (idx % 3) * 6)
          const py = H * t
          const angle = ls * (22 + (idx % 3) * 9)
          const lw = Math.max(19 - idx * 0.7, 11)
          const lh = Math.max(10 - idx * 0.3, 6)
          const fill = idx % 2 === 0 ? '#3d9230' : '#4aaa3c'
          return (
            <g key={idx} transform={`translate(${px}, ${py}) rotate(${angle})`}>
              <ellipse cx="0" cy="0" rx={lw} ry={lh} fill={fill} />
              <ellipse cx="0" cy="0" rx={lw} ry={lh} fill="none" stroke="#183e10" strokeWidth="0.7" />
              <line x1={-(lw - 2)} y1="0" x2={lw - 2} y2="0" stroke="#1e5a16" strokeWidth="0.9" />
              <ellipse cx={lw * 0.28} cy={-lh * 0.32} rx={lw * 0.33} ry={lh * 0.42} fill="rgba(110,210,55,0.11)" />
            </g>
          )
        })}

        {[H * 0.23, H * 0.49, H * 0.73].map((y, i) => {
          const tx = cx + cd * (i % 2 === 0 ? 16 : -11)
          return (
            <path key={i}
              d={`M ${tx} ${y} C ${tx + cd * 15} ${y + 14} ${tx + cd * 24} ${y + 30} ${tx + cd * 18} ${y + 52}`}
              stroke="#236823" strokeWidth="2.2" strokeLinecap="round" opacity="0.65"
            />
          )
        })}
      </svg>
    </div>
  )
}

/* ── Stone Door Panel ─────────────────────────────────────────────────────── */
function StoneDoorPanel({ side }) {
  const runeRef = useRef()
  const isLeft = side === 'left'
  const RW = 170, RH = 420

  useEffect(() => {
    if (!runeRef.current) return
    const paths = runeRef.current.querySelectorAll('.rp')
    paths.forEach((p, i) => {
      const len = p.getTotalLength ? p.getTotalLength() : 80
      gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, opacity: 0.8 })
      gsap.to(p, { strokeDashoffset: 0, opacity: 1, duration: 1.8 + i * 0.25, delay: 1.6 + i * 0.12, ease: 'power2.out' })
      gsap.to(p, {
        opacity: 0.18,
        duration: 1.8 + i * 0.18,
        delay: 4.5 + i * 0.35,
        repeat: -1, yoyo: true,
        ease: 'sine.inOut',
      })
    })
  }, [])

  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0,
      [isLeft ? 'left' : 'right']: 0,
      width: 'clamp(155px, 17vw, 265px)',
      zIndex: 7,
    }}>
      {/* Stone body */}
      <div style={{
        position: 'absolute', inset: 0,
        background: isLeft
          ? 'linear-gradient(108deg, #080e07 0%, #111a0e 22%, #1a2914 48%, #111a0e 72%, #080e07 100%)'
          : 'linear-gradient(72deg,  #080e07 0%, #111a0e 28%, #1a2914 52%, #111a0e 78%, #080e07 100%)',
        boxShadow: isLeft
          ? 'inset -24px 0 55px rgba(0,0,0,0.85), inset 8px 0 25px rgba(18,40,12,0.25)'
          : 'inset 24px 0 55px rgba(0,0,0,0.85), inset -8px 0 25px rgba(18,40,12,0.25)',
      }}>
        {/* Grain */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `
            repeating-linear-gradient(${isLeft ? '89deg' : '91deg'}, transparent 0px, transparent 3px, rgba(0,0,0,0.09) 3px, rgba(0,0,0,0.09) 4px),
            repeating-linear-gradient(${isLeft ? '1.5deg' : '-1.5deg'}, transparent 0px, transparent 20px, rgba(255,255,255,0.018) 20px, rgba(255,255,255,0.018) 21px)
          `,
        }} />
        {/* Moss blotches */}
        <div style={{
          position: 'absolute', inset: 0,
          background: `
            radial-gradient(ellipse at ${isLeft ? '68%' : '32%'} 18%, rgba(18,58,9,0.38) 0%, transparent 42%),
            radial-gradient(ellipse at ${isLeft ? '38%' : '62%'} 52%, rgba(14,48,7,0.28) 0%, transparent 36%),
            radial-gradient(ellipse at ${isLeft ? '62%' : '38%'} 82%, rgba(22,68,11,0.32) 0%, transparent 32%)
          `,
        }} />
        {/* Block seams */}
        {[14, 28, 43, 58, 72, 86].map(pct => (
          <div key={pct} style={{
            position: 'absolute', top: `${pct}%`, left: '4%', right: '4%', height: 2,
            background: 'rgba(0,0,0,0.55)', boxShadow: '0 1px 0 rgba(45,90,20,0.1)',
          }} />
        ))}
        {/* Gold trim */}
        {[7, 93].map(pct => (
          <div key={pct} style={{
            position: 'absolute',
            top: pct < 50 ? `${pct}%` : undefined,
            bottom: pct > 50 ? `${100 - pct}%` : undefined,
            left: '8%', right: '8%', height: 1.5,
            background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.28), transparent)',
          }} />
        ))}
        {/* Inner edge shadow */}
        <div style={{
          position: 'absolute', inset: 0,
          boxShadow: isLeft
            ? 'inset -10px 0 20px rgba(0,0,0,0.6)'
            : 'inset 10px 0 20px rgba(0,0,0,0.6)',
        }} />
      </div>

      {/* Rune SVG */}
      <div ref={runeRef} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={RW} height={RH} viewBox={`0 0 ${RW} ${RH}`}>
          {/* Outer frame */}
          <rect className="rp" x="14" y="18" width={RW - 28} height={RH - 36} stroke="rgba(212,175,55,0.5)" strokeWidth="1.5" fill="none" rx="4" />
          {/* Inner frame */}
          <rect className="rp" x="22" y="26" width={RW - 44} height={RH - 52} stroke="rgba(212,175,55,0.22)" strokeWidth="0.8" fill="none" rx="2" />

          {/* Tiki face */}
          <ellipse className="rp" cx={RW / 2} cy="92" rx="40" ry="48" stroke="rgba(212,175,55,0.52)" strokeWidth="1.5" fill="rgba(0,0,0,0.18)" />
          {/* Brow */}
          <path className="rp" d={`M ${RW / 2 - 24} 68 L ${RW / 2 - 12} 62 L ${RW / 2} 60 L ${RW / 2 + 12} 62 L ${RW / 2 + 24} 68`} stroke="rgba(212,175,55,0.55)" strokeWidth="1.4" fill="none" />
          {/* Eyes */}
          <ellipse className="rp" cx={RW / 2 - 14} cy="84" rx="10" ry="11" stroke="rgba(212,175,55,0.62)" strokeWidth="1.3" fill="rgba(0,0,0,0.28)" />
          <ellipse className="rp" cx={RW / 2 + 14} cy="84" rx="10" ry="11" stroke="rgba(212,175,55,0.62)" strokeWidth="1.3" fill="rgba(0,0,0,0.28)" />
          <circle cx={RW / 2 - 14} cy="84" r="4.5" fill="rgba(70,210,35,0.14)" />
          <circle cx={RW / 2 + 14} cy="84" r="4.5" fill="rgba(70,210,35,0.14)" />
          {/* Nose bridge */}
          <path className="rp" d={`M ${RW / 2 - 8} 100 L ${RW / 2} 108 L ${RW / 2 + 8} 100`} stroke="rgba(212,175,55,0.48)" strokeWidth="1.2" fill="none" />
          {/* Mouth */}
          <path className="rp" d={`M ${RW / 2 - 20} 118 Q ${RW / 2} 130 ${RW / 2 + 20} 118`} stroke="rgba(212,175,55,0.48)" strokeWidth="1.3" fill="none" />
          {/* Crown */}
          <path className="rp" d={`M ${RW / 2 - 28} 50 L ${RW / 2 - 16} 40 L ${RW / 2} 37 L ${RW / 2 + 16} 40 L ${RW / 2 + 28} 50`} stroke="rgba(212,175,55,0.58)" strokeWidth="1.5" fill="none" />

          {/* Diamond rune */}
          <path className="rp" d={`M ${RW / 2} 158 L ${RW / 2 + 24} 180 L ${RW / 2} 202 L ${RW / 2 - 24} 180 Z`} stroke="rgba(212,175,55,0.44)" strokeWidth="1.3" fill="none" />
          <path className="rp" d={`M ${RW / 2} 167 L ${RW / 2 + 14} 180 L ${RW / 2} 193 L ${RW / 2 - 14} 180 Z`} stroke="rgba(212,175,55,0.28)" strokeWidth="0.8" fill="none" />

          {/* Circle cross */}
          <circle className="rp" cx={RW / 2} cy="242" r="20" stroke="rgba(212,175,55,0.38)" strokeWidth="1.2" fill="none" />
          <line className="rp" x1={RW / 2} y1="218" x2={RW / 2} y2="266" stroke="rgba(212,175,55,0.42)" strokeWidth="1.2" />
          <line className="rp" x1={RW / 2 - 24} y1="242" x2={RW / 2 + 24} y2="242" stroke="rgba(212,175,55,0.42)" strokeWidth="1.2" />

          {/* Triangle */}
          <path className="rp" d={`M ${RW / 2} 288 L ${RW / 2 + 26} 320 L ${RW / 2 - 26} 320 Z`} stroke="rgba(212,175,55,0.4)" strokeWidth="1.2" fill="none" />
          <line className="rp" x1={RW / 2} y1="288" x2={RW / 2} y2="320" stroke="rgba(212,175,55,0.22)" strokeWidth="0.8" />

          {/* Spiral */}
          <path className="rp" d={`M ${RW / 2} 352 C ${RW / 2 + 22} 352 ${RW / 2 + 22} 372 ${RW / 2} 372 C ${RW / 2 - 16} 372 ${RW / 2 - 16} 357 ${RW / 2} 357`} stroke="rgba(212,175,55,0.42)" strokeWidth="1.2" fill="none" />

          {/* Corner crosses */}
          {[[24, 32], [RW - 24, 32], [24, RH - 32], [RW - 24, RH - 32]].map(([x, y], i) => (
            <g key={i}>
              <line className="rp" x1={x - 7} y1={y} x2={x + 7} y2={y} stroke="rgba(212,175,55,0.42)" strokeWidth="1.1" />
              <line className="rp" x1={x} y1={y - 7} x2={x} y2={y + 7} stroke="rgba(212,175,55,0.42)" strokeWidth="1.1" />
            </g>
          ))}
        </svg>
      </div>

      {/* Rune ambient bloom */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: isLeft
          ? 'radial-gradient(ellipse at 62% 28%, rgba(212,175,55,0.055) 0%, transparent 55%)'
          : 'radial-gradient(ellipse at 38% 28%, rgba(212,175,55,0.055) 0%, transparent 55%)',
      }} />
    </div>
  )
}

/* ── Torch ─────────────────────────────────────────────────────────────────── */
function Torch({ left }) {
  const outerRef = useRef(), innerRef = useRef(), glowRef = useRef()

  useEffect(() => {
    const buildFlicker = (el, frames) => {
      const tl = gsap.timeline({ repeat: -1 })
      frames.forEach(f => tl.to(el, { ...f, ease: 'none' }))
      return tl
    }

    const tl1 = buildFlicker(outerRef.current, [
      { scaleX: 1, scaleY: 1, duration: 0.08 },
      { scaleX: 0.76, scaleY: 1.38, duration: 0.13 },
      { scaleX: 1.18, scaleY: 0.85, duration: 0.09 },
      { scaleX: 0.88, scaleY: 1.22, duration: 0.15 },
      { scaleX: 1.08, scaleY: 0.9, duration: 0.07 },
      { scaleX: 0.94, scaleY: 1.14, duration: 0.12 },
      { scaleX: 1, scaleY: 1, duration: 0.09 },
    ])
    const tl2 = buildFlicker(innerRef.current, [
      { scaleX: 1, scaleY: 1, duration: 0.10 },
      { scaleX: 0.68, scaleY: 1.44, duration: 0.12 },
      { scaleX: 1.22, scaleY: 0.78, duration: 0.08 },
      { scaleX: 0.82, scaleY: 1.26, duration: 0.14 },
      { scaleX: 1, scaleY: 1, duration: 0.10 },
    ])
    gsap.to(glowRef.current, { opacity: 0.75, scale: 1.25, duration: 1.5, repeat: -1, yoyo: true, ease: 'sine.inOut' })

    return () => { tl1.kill(); tl2.kill(); gsap.killTweensOf(glowRef.current) }
  }, [])

  return (
    <div style={{ position: 'absolute', left, bottom: '20%', width: 60, height: 130, zIndex: 9, pointerEvents: 'none' }}>
      <div ref={glowRef} style={{
        position: 'absolute', bottom: 55, left: '50%', transform: 'translate(-50%, 0)',
        width: 110, height: 110, borderRadius: '50%', opacity: 0.5,
        background: 'radial-gradient(ellipse, rgba(255,125,10,0.42) 0%, rgba(255,70,0,0.14) 50%, transparent 70%)',
      }} />
      {/* Handle */}
      <div style={{
        position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)',
        width: 6, height: 52,
        background: 'linear-gradient(180deg, #5c3c10 0%, #2c1a06 100%)', borderRadius: '2px 2px 0 0',
      }} />
      {/* Cup */}
      <div style={{
        position: 'absolute', bottom: 48, left: '50%', transform: 'translateX(-50%)',
        width: 19, height: 15,
        background: 'linear-gradient(180deg, #7a5520 0%, #3c2408 100%)',
        borderRadius: '3px 3px 6px 6px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
      }} />
      {/* Outer flame */}
      <div ref={outerRef} style={{
        position: 'absolute', bottom: 59, left: '50%', transform: 'translateX(-50%)',
        width: 24, height: 40,
        background: 'linear-gradient(180deg, rgba(255,45,0,0) 0%, rgba(255,95,0,0.92) 48%, rgba(195,45,0,1) 100%)',
        borderRadius: '50% 50% 34% 34%', transformOrigin: 'bottom center', filter: 'blur(1.2px)',
      }} />
      {/* Inner flame */}
      <div ref={innerRef} style={{
        position: 'absolute', bottom: 60, left: '50%', transform: 'translateX(-50%)',
        width: 13, height: 26,
        background: 'linear-gradient(180deg, rgba(255,255,100,0) 0%, rgba(255,228,45,0.98) 100%)',
        borderRadius: '50% 50% 28% 28%', transformOrigin: 'bottom center', filter: 'blur(0.6px)',
      }} />
    </div>
  )
}

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function StartScreen({ onEnter }) {
  const [gateOpening, setGateOpening] = useState(false)
  const leftGateAnim = useAnimation()
  const rightGateAnim = useAnimation()

  const sceneRef = useRef()
  const canvasRef = useRef()
  const titleRef = useRef()
  const subtitleRef = useRef()
  const btnRef = useRef()
  const rafRef = useRef()
  const mouse = useRef({ x: 0, y: 0 })
  const tilt = useRef({ x: 0, y: 0 })

  /* Mouse parallax */
  useEffect(() => {
    const onMove = e => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    const loop = () => {
      tilt.current.x += (mouse.current.x * 8 - tilt.current.x) * 0.055
      tilt.current.y += (mouse.current.y * -4 - tilt.current.y) * 0.055
      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `perspective(1400px) rotateY(${tilt.current.x}deg) rotateX(${tilt.current.y}deg)`
      }
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(rafRef.current) }
  }, [])

  /* Entry timeline */
  useEffect(() => {
    const tl = gsap.timeline()
    tl.fromTo(titleRef.current,
      { opacity: 0, y: -45, scale: 0.82 },
      { opacity: 1, y: 0, scale: 1, duration: 1.3, ease: 'back.out(1.5)', delay: 0.7 }
    )
    .fromTo(subtitleRef.current,
      { opacity: 0, letterSpacing: '0.55em' },
      { opacity: 1, letterSpacing: '0.3em', duration: 1.1, ease: 'power2.out' }, '-=0.45'
    )
    .fromTo(btnRef.current,
      { opacity: 0, y: 32, scale: 0.78 },
      { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: 'back.out(1.8)' }, '-=0.35'
    )
    return () => tl.kill()
  }, [])

  const handleEnter = useCallback(async () => {
    if (gateOpening) return
    setGateOpening(true)
    if (sceneRef.current) {
      gsap.timeline()
        .to(sceneRef.current, { x: -7, duration: 0.06, ease: 'none' })
        .to(sceneRef.current, { x: 6, duration: 0.08, ease: 'none' })
        .to(sceneRef.current, { x: -4, duration: 0.07, ease: 'none' })
        .to(sceneRef.current, { x: 3, duration: 0.06, ease: 'none' })
        .to(sceneRef.current, { x: 0, duration: 0.05, ease: 'none' })
    }
    await Promise.all([
      leftGateAnim.start({ rotateY: -88, x: '-98%', transition: { duration: 1.25, ease: [0.25, 0.1, 0.25, 1] } }),
      rightGateAnim.start({ rotateY: 88, x: '98%', transition: { duration: 1.25, ease: [0.25, 0.1, 0.25, 1] } }),
    ])
    setTimeout(() => onEnter?.(), 380)
  }, [gateOpening, leftGateAnim, rightGateAnim, onEnter])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#020902' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Cinzel:wght@400;600&display=swap');

        @keyframes fireGlow {
          0%, 100% {
            text-shadow:
              0 0 12px rgba(75,215,28,0.65),
              0 0 28px rgba(255,175,0,0.88),
              0 0 55px rgba(255,95,0,0.52),
              0 0 95px rgba(255,50,0,0.22),
              0 5px 10px rgba(0,0,0,0.98),
              3px 3px 0 rgba(6,22,3,0.96),
              -1px -1px 0 rgba(6,22,3,0.8);
          }
          38% {
            text-shadow:
              0 0 20px rgba(95,250,38,0.95),
              0 0 45px rgba(255,198,0,1),
              0 0 82px rgba(255,115,0,0.72),
              0 0 130px rgba(255,55,0,0.32),
              0 5px 10px rgba(0,0,0,0.98),
              3px 3px 0 rgba(6,22,3,0.96),
              -1px -1px 0 rgba(6,22,3,0.8);
          }
          68% {
            text-shadow:
              0 0 14px rgba(55,195,22,0.72),
              0 0 34px rgba(255,155,0,0.92),
              0 0 65px rgba(255,75,0,0.58),
              0 0 108px rgba(255,40,0,0.26),
              0 5px 10px rgba(0,0,0,0.98),
              3px 3px 0 rgba(6,22,3,0.96),
              -1px -1px 0 rgba(6,22,3,0.8);
          }
        }
        @keyframes titleFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-9px); }
        }
        @keyframes btnPulse {
          0%, 100% { box-shadow: 0 0 22px rgba(55,195,18,0.52), 0 0 48px rgba(38,175,10,0.2), 0 9px 20px rgba(0,0,0,0.92), inset 0 3px 5px rgba(255,255,255,0.24), inset 0 -3px 5px rgba(0,0,0,0.42), 0 7px 0 #183802; }
          50% { box-shadow: 0 0 36px rgba(80,228,28,0.72), 0 0 70px rgba(60,208,18,0.3), 0 9px 20px rgba(0,0,0,0.92), inset 0 3px 5px rgba(255,255,255,0.24), inset 0 -3px 5px rgba(0,0,0,0.42), 0 7px 0 #183802; }
        }
        @keyframes shimmer {
          0%   { left: -65%; }
          100% { left: 130%; }
        }
        @keyframes ambientTorch {
          0%, 100% { opacity: 0.5; }
          33%  { opacity: 0.72; }
          66%  { opacity: 0.42; }
        }
        @keyframes rayPulse {
          0%, 100% { opacity: 0.055; }
          50% { opacity: 0.13; }
        }
        .tiki-title {
          animation: fireGlow 3.9s ease-in-out infinite, titleFloat 4.3s ease-in-out infinite;
          will-change: text-shadow, transform;
        }
        .enter-btn {
          animation: btnPulse 2.6s ease-in-out infinite;
          transition: transform 0.13s cubic-bezier(0.34,1.56,0.64,1), filter 0.14s ease;
        }
        .enter-btn:hover:not(:disabled) {
          transform: translateY(-6px) scale(1.05) !important;
          filter: brightness(1.18) saturate(1.1);
        }
        .enter-btn:active:not(:disabled) {
          transform: translateY(5px) scale(0.965) !important;
          filter: brightness(0.88);
          animation: none;
          box-shadow: 0 0 14px rgba(55,195,18,0.38), 0 3px 10px rgba(0,0,0,0.92), inset 0 5px 10px rgba(0,0,0,0.52), 0 2px 0 #183802 !important;
          transition: transform 0.06s ease, filter 0.06s ease;
        }
        .torch-amb { animation: ambientTorch 1.85s ease-in-out infinite; }
      `}</style>

      {/* 3D scene root */}
      <div ref={sceneRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>

        {/* ── Background ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #020902 0%, #030e04 22%, #050f05 50%, #030e04 78%, #020902 100%)',
          }} />
          {/* Stone block grid */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `
              repeating-linear-gradient(0deg,   rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 82px),
              repeating-linear-gradient(90deg,  rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 124px)
            `,
          }} />
          {/* Fine diagonal grain */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.008) 0px, rgba(255,255,255,0.008) 1px, transparent 1px, transparent 3px)',
          }} />
          {/* Scattered moss patches */}
          {['7% 12%','21% 40%','79% 26%','90% 60%','14% 75%','84% 82%','44% 8%','54% 92%','32% 56%','67% 44%','48% 30%','72% 70%'].map((pos, i) => {
            const [l, t] = pos.split(' ')
            return (
              <div key={i} style={{
                position: 'absolute', left: l, top: t,
                width: 38 + (i % 4) * 18, height: 18 + (i % 3) * 12,
                background: 'radial-gradient(ellipse, rgba(16,52,8,0.48) 0%, transparent 70%)',
                borderRadius: '50%',
              }} />
            )
          })}
        </div>

        {/* ── Vignette + depth fog ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at 50% 46%, transparent 10%, rgba(2,9,2,0.62) 68%),
            linear-gradient(180deg, rgba(2,9,2,0.85) 0%, rgba(2,9,2,0.08) 42%, rgba(2,9,2,0.28) 72%, rgba(2,9,2,0.9) 100%)
          `,
        }} />

        {/* ── God rays ── */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', overflow: 'hidden' }}>
          {[
            { l: '34%', r: -9, d: '0s' }, { l: '46%', r: -1, d: '0.6s' },
            { l: '53%', r: 4,  d: '1.3s' }, { l: '63%', r: 11, d: '0.3s' },
          ].map((ray, i) => (
            <div key={i} style={{
              position: 'absolute', top: 0, left: ray.l,
              width: 65, height: '100vh',
              background: 'linear-gradient(180deg, rgba(150,195,72,0.08) 0%, rgba(195,155,45,0.11) 32%, rgba(248,112,18,0.055) 72%, transparent 100%)',
              transform: `rotate(${ray.r}deg)`, transformOrigin: 'top center',
              animation: `rayPulse ${4.6 + i * 0.68}s ${ray.d} ease-in-out infinite`,
            }} />
          ))}
        </div>

        {/* ── Torch ambient wall glow ── */}
        <div className="torch-amb" style={{
          position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
          background: `
            radial-gradient(ellipse at 29% 64%, rgba(248,92,14,0.13) 0%, transparent 28%),
            radial-gradient(ellipse at 71% 64%, rgba(248,92,14,0.13) 0%, transparent 28%)
          `,
        }} />

        {/* ── Leaf canvas ── */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }} />
        <LeafCanvas canvasRef={canvasRef} />

        {/* ── Vines left ── */}
        <Vine fromRight={false} offset={-28} freq={4.3} amp={3.4} phase={0.00} />
        <Vine fromRight={false} offset={58}  freq={3.7} amp={2.9} phase={0.38} />
        <Vine fromRight={false} offset={138} freq={5.2} amp={2.3} phase={0.68} />

        {/* ── Vines right ── */}
        <Vine fromRight={true}  offset={-28} freq={4.0} amp={3.1} phase={0.18} />
        <Vine fromRight={true}  offset={58}  freq={4.8} amp={2.7} phase={0.52} />
        <Vine fromRight={true}  offset={138} freq={3.5} amp={2.5} phase={0.82} />

        {/* ── Left stone door (gate animation wrapper) ── */}
        <motion.div
          animate={leftGateAnim}
          initial={{ rotateY: 0, x: 0 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, transformStyle: 'preserve-3d', transformOrigin: 'left center', zIndex: 7 }}
        >
          <StoneDoorPanel side="left" />
        </motion.div>

        {/* ── Right stone door ── */}
        <motion.div
          animate={rightGateAnim}
          initial={{ rotateY: 0, x: 0 }}
          style={{ position: 'absolute', top: 0, bottom: 0, right: 0, transformStyle: 'preserve-3d', transformOrigin: 'right center', zIndex: 7 }}
        >
          <StoneDoorPanel side="right" />
        </motion.div>

        {/* ── Torches ── */}
        <Torch left="calc(50% - 205px)" />
        <Torch left="calc(50% + 150px)" />

        {/* ── Top canopy bar ── */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 4, zIndex: 10,
          background: 'linear-gradient(90deg, transparent, rgba(38,135,18,0.42), rgba(66,195,38,0.6), rgba(38,135,18,0.42), transparent)',
        }} />

        {/* ── Center UI ── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Title block */}
          <div ref={titleRef} style={{ opacity: 0, marginBottom: 24, textAlign: 'center' }}>
            <div
              className="tiki-title"
              style={{
                fontFamily: '"Cinzel Decorative", cursive',
                fontSize: 'clamp(46px, 7.8vw, 94px)',
                fontWeight: 900,
                color: '#ffe055',
                letterSpacing: '0.12em',
                lineHeight: 1,
                userSelect: 'none',
              }}
            >
              TIKI TOPPLE
            </div>
          </div>

          {/* Subtitle + divider */}
          <div ref={subtitleRef} style={{ opacity: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 42 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 72, height: 1, background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.62))' }} />
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#d4af37', boxShadow: '0 0 10px rgba(212,175,55,0.85)' }} />
              <div style={{ width: 72, height: 1, background: 'linear-gradient(90deg, rgba(212,175,55,0.62), transparent)' }} />
            </div>
            <div style={{
              fontFamily: '"Cinzel", serif',
              fontSize: 'clamp(11px, 1.35vw, 17px)',
              color: 'rgba(168,225,112,0.88)',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              fontWeight: 600,
              textShadow: '0 2px 14px rgba(0,0,0,0.96), 0 0 22px rgba(55,195,28,0.3)',
            }}>
              Ancient Trials Await
            </div>
          </div>

          {/* Enter button */}
          <button
            ref={btnRef}
            className="enter-btn"
            onClick={handleEnter}
            disabled={gateOpening}
            style={{
              pointerEvents: 'auto',
              opacity: 0,
              fontFamily: '"Cinzel Decorative", cursive',
              fontSize: 'clamp(13px, 1.85vw, 23px)',
              fontWeight: 700,
              background: 'linear-gradient(180deg, #c6ee58 0%, #8cc01e 16%, #60a00e 46%, #428000 80%, #2a5202 100%)',
              border: '3px solid #1c4804',
              borderRadius: 11,
              padding: 'clamp(14px, 1.9vh, 22px) clamp(38px, 5.5vw, 76px)',
              cursor: gateOpening ? 'default' : 'pointer',
              letterSpacing: '0.08em',
              position: 'relative',
              outline: 'none',
              color: '#041002',
              overflow: 'hidden',
            }}
          >
            {/* Stone grain on button */}
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 9, pointerEvents: 'none',
              backgroundImage: 'repeating-linear-gradient(86deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 4px)',
            }} />
            {/* Shimmer */}
            <div style={{
              position: 'absolute', top: 0, width: '48%', height: '100%',
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.38), transparent)',
              transform: 'skewX(-22deg)',
              animation: 'shimmer 3.2s 2.8s ease-in-out infinite',
              pointerEvents: 'none',
            }} />
            <span style={{ position: 'relative', zIndex: 1 }}>
              {gateOpening ? 'ENTERING...' : 'ENTER THE TRIAL'}
            </span>
          </button>
        </div>

        {/* ── Gate flash ── */}
        <motion.div
          animate={{ opacity: gateOpening ? 1 : 0, scale: gateOpening ? 2.8 : 0.25 }}
          transition={{ duration: 1.9, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '48vw', height: '68vh', marginLeft: '-24vw', marginTop: '-34vh',
            background: 'radial-gradient(ellipse, rgba(115,252,75,0.68) 0%, rgba(195,252,95,0.28) 42%, transparent 70%)',
            zIndex: 20, pointerEvents: 'none',
          }}
        />

        {/* ── Bottom edge glow ── */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, zIndex: 10,
          background: 'linear-gradient(90deg, transparent, rgba(38,135,18,0.38), rgba(58,175,28,0.52), rgba(38,135,18,0.38), transparent)',
        }} />
      </div>
    </div>
  )
}
