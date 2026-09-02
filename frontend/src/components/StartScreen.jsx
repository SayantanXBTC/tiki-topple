import { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
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
      ctx.quadraticCurveTo(1, 0, 12, 12)
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

/* ── Main ──────────────────────────────────────────────────────────────────── */
export default function StartScreen({ authLoading, onEnter }) {
  const [progress, setProgress] = useState(0)
  const [gateOpening, setGateOpening] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  // Image dimension tracking for perfect responsive clip-path
  const [imgDims, setImgDims] = useState({ w: 1920, h: 1080, a: 1920 / 1080 })
  const [winDims, setWinDims] = useState({ w: typeof window !== 'undefined' ? window.innerWidth : 1920, h: typeof window !== 'undefined' ? window.innerHeight : 1080 })

  const sceneRef = useRef()
  const canvasRef = useRef()

  useEffect(() => {
    const handleResize = () => setWinDims({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Calculate the exact dimensions the image will take to simulate object-fit: cover
  // This allows our percentage-based clip-path to perfectly map to the image's intrinsic features
  const windowRatio = winDims.w / winDims.h
  const renderWidth = windowRatio > imgDims.a ? winDims.w : winDims.h * imgDims.a
  const renderHeight = windowRatio > imgDims.a ? winDims.w / imgDims.a : winDims.h

  // Simulate loading progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(timer)
          return 100
        }
        return Math.min(p + Math.random() * 15 + 5, 100)
      })
    }, 200)
    return () => clearInterval(timer)
  }, [])

  const isReady = progress >= 100 && !authLoading

  const handleEnter = useCallback(async () => {
    if (!isReady || gateOpening) return
    setGateOpening(true)

    // Camera shake effect
    if (sceneRef.current) {
      gsap.timeline()
        .to(sceneRef.current, { x: -7, duration: 0.06, ease: 'none' })
        .to(sceneRef.current, { x: 6, duration: 0.08, ease: 'none' })
        .to(sceneRef.current, { x: -4, duration: 0.07, ease: 'none' })
        .to(sceneRef.current, { x: 3, duration: 0.06, ease: 'none' })
        .to(sceneRef.current, { x: 0, duration: 0.05, ease: 'none' })
    }

    setTimeout(() => onEnter?.(), 600)
  }, [gateOpening, isReady, onEnter])

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', background: '#0a0806' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        .material-symbols-outlined { font-variation-settings: "FILL" 0, "wght" 400, "GRAD" 0, "opsz" 24; }

        @keyframes slide-stripes {
          0% { background-position: 0 0; }
          100% { background-position: 28.28px 0; }
        }
        .animate-stripes {
          animation: slide-stripes 1.5s linear infinite;
        }
      `}</style>

      {/* 3D scene root */}
      <div ref={sceneRef} style={{ position: 'absolute', inset: 0, transformStyle: 'preserve-3d' }}>

        {/* ── Perfect Aspect Ratio Background Container ── */}
        {/* This container perfectly mimics the bounds of an object-fit: cover image */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: renderWidth,
          height: renderHeight,
          transform: 'translate(-50%, -50%) scale(1.06)', // Scaled to hide watermark
          pointerEvents: 'none'
        }}>

          {/* Base Image */}
          <img
            style={{ width: '100%', height: '100%', opacity: 0.95, filter: 'saturate(1.1) contrast(1.1)' }}
            alt="Jungle Background"
            src="/Tiki2.png"
            onLoad={(e) => setImgDims({ w: e.target.naturalWidth, h: e.target.naturalHeight, a: e.target.naturalWidth / e.target.naturalHeight })}
          />

          {/* Dark overlay to make UI pop slightly */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, transparent 30%, rgba(5, 10, 5, 0.7) 100%)', pointerEvents: 'none' }} />

          {/* ── Interactive Extracted Button Layer ── */}
          {isReady && !gateOpening && (
            <div
              style={{
                position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none',
                filter: isHovered
                  ? 'drop-shadow(0 20px 30px rgba(20,200,50,0.35)) brightness(1.2) contrast(1.1)'
                  : 'drop-shadow(0 5px 15px rgba(0,0,0,0.5)) brightness(1)',
                transition: 'filter 0.25s ease'
              }}
            >
              <div
                style={{
                  position: 'absolute', inset: 0, pointerEvents: 'auto',
                  // Precise crop based on image's intrinsic coordinates (not viewport)
                  clipPath: 'inset(74% 39% 14% 39% round 12px)',
                  transform: isHovered ? 'translateY(-1.5%) scale(1.01)' : 'translateY(0px) scale(1)',
                  transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleEnter}
              >
                <img
                  src="/Tiki2.png"
                  style={{ width: '100%', height: '100%', opacity: 0.95, filter: 'saturate(1.1) contrast(1.1)' }}
                  alt=""
                />
                {/* Subtle inner highlight to make it pop like glass */}
                <div className="absolute inset-0 bg-white/5 opacity-0 transition-opacity duration-300" style={{ opacity: isHovered ? 1 : 0 }} />
              </div>
            </div>
          )}
        </div>

        {/* ── Leaf canvas ── */}
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, zIndex: 3, pointerEvents: 'none' }} />
        <LeafCanvas canvasRef={canvasRef} />

        {/* ── Loading Overlay (Only shown when not ready) ── */}
        {!isReady && (
          <div style={{ position: 'absolute', bottom: '5vh', left: '0', right: '0', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', pointerEvents: 'none' }}>
            <div style={{ width: '100%', maxWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h2 style={{ fontFamily: '"Cinzel", serif', color: '#80da8d', fontSize: 'clamp(14px, 2vw, 22px)', marginBottom: '12px', letterSpacing: '0.2em', textTransform: 'uppercase', textShadow: '0 2px 8px rgba(0,0,0,1)', fontWeight: 700 }}>
                Summoning the Tikis...
              </h2>

              {/* Progress Bar */}
              <div style={{ position: 'relative', width: '70%', height: '18px', backgroundColor: 'rgba(28,25,23,0.8)', border: '2px solid rgba(128,218,141,0.3)', borderRadius: '9999px', overflow: 'hidden', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)', padding: '2px', backdropFilter: 'blur(4px)' }}>
                <div
                  style={{ height: '100%', background: 'linear-gradient(to right, #107232, #80da8d)', borderRadius: '9999px', position: 'relative', boxShadow: '0 0 15px rgba(128,218,141,0.6)', transition: 'width 200ms ease-out', width: `${progress}%` }}
                >
                  {/* Spiraling Spirit Essence */}
                  <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.2)_10px,rgba(255,255,255,0.2)_20px)] animate-stripes" style={{ borderRadius: '9999px' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Gate flash transition ── */}
        <motion.div
          animate={{ opacity: gateOpening ? 1 : 0, scale: gateOpening ? 3 : 0.25 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          style={{
            position: 'absolute', top: '50%', left: '50%',
            width: '48vw', height: '68vh', marginLeft: '-24vw', marginTop: '-34vh',
            background: 'radial-gradient(ellipse, rgba(115,252,75,0.85) 0%, rgba(195,252,95,0.35) 45%, transparent 75%)',
            zIndex: 20, pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  )
}

