import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

// ── Vector helpers ────────────────────────────────────────────────────────────
class Vector2D {
  constructor(x, y) { this.x = x; this.y = y }
  static random(min, max) { return min + Math.random() * (max - min) }
}

class Vector3D {
  constructor(x, y, z) { this.x = x; this.y = y; this.z = z }
}

// ── Star ──────────────────────────────────────────────────────────────────────
class Star {
  constructor(cameraZ, cameraTravelDistance) {
    this.angle            = Math.random() * Math.PI * 2
    this.distance         = 30 * Math.random() + 15
    this.rotationDirection = Math.random() > 0.5 ? 1 : -1
    this.expansionRate    = 1.2 + Math.random() * 0.8
    this.finalScale       = 0.7 + Math.random() * 0.6
    this.dx               = this.distance * Math.cos(this.angle)
    this.dy               = this.distance * Math.sin(this.angle)
    this.spiralLocation   = (1 - Math.pow(1 - Math.random(), 3.0)) / 1.3
    this.z                = Vector2D.random(0.5 * cameraZ, cameraTravelDistance + cameraZ)
    const lerp = (s, e, t) => s * (1 - t) + e * t
    this.z                = lerp(this.z, cameraTravelDistance / 2, 0.3 * this.spiralLocation)
    this.strokeWeightFactor = Math.pow(Math.random(), 2.0)
  }

  render(p, c) {
    const spiralPos = c.spiralPath(this.spiralLocation)
    const q = p - this.spiralLocation
    if (q <= 0) return

    const dp = c.constrain(4 * q, 0, 1)
    const linear  = dp
    const elastic = c.easeOutElastic(dp)
    const power   = Math.pow(dp, 2)

    let easing
    if (dp < 0.3)      easing = c.lerp(linear, power, dp / 0.3)
    else if (dp < 0.7) easing = c.lerp(power, elastic, (dp - 0.3) / 0.4)  // eslint-disable-line no-unused-vars
    else               easing = elastic

    let sx, sy
    if (dp < 0.3) {
      sx = c.lerp(spiralPos.x, spiralPos.x + this.dx * 0.3, easing / 0.3)
      sy = c.lerp(spiralPos.y, spiralPos.y + this.dy * 0.3, easing / 0.3)
    } else if (dp < 0.7) {
      const mp  = (dp - 0.3) / 0.4
      const cs  = Math.sin(mp * Math.PI) * this.rotationDirection * 1.5
      const bx  = spiralPos.x + this.dx * 0.3,  by  = spiralPos.y + this.dy * 0.3
      const tx  = spiralPos.x + this.dx * 0.7,  ty  = spiralPos.y + this.dy * 0.7
      const px  = -this.dy * 0.4 * cs,          py  = this.dx * 0.4 * cs
      sx = c.lerp(bx, tx, mp) + px * mp
      sy = c.lerp(by, ty, mp) + py * mp
    } else {
      const fp  = (dp - 0.7) / 0.3
      const bx  = spiralPos.x + this.dx * 0.7,  by  = spiralPos.y + this.dy * 0.7
      const td  = this.distance * this.expansionRate * 1.5
      const sa  = this.angle + 1.2 * this.rotationDirection * fp * Math.PI
      sx = c.lerp(bx, spiralPos.x + td * Math.cos(sa), fp)
      sy = c.lerp(by, spiralPos.y + td * Math.sin(sa), fp)
    }

    const vx  = (this.z - c.cameraZ) * sx / c.viewZoom
    const vy  = (this.z - c.cameraZ) * sy / c.viewZoom
    const pos = new Vector3D(vx, vy, this.z)

    let sm = 1.0
    if (dp < 0.6) sm = 1.0 + dp * 0.2
    else          sm = 1.2 * (1 - (dp - 0.6) / 0.4) + this.finalScale * ((dp - 0.6) / 0.4)

    c.showProjectedDot(pos, 8.5 * this.strokeWeightFactor * sm)
  }
}

// ── Animation controller ──────────────────────────────────────────────────────
class AnimationController {
  constructor(canvas, ctx, dpr, size) {
    this.canvas  = canvas
    this.ctx     = ctx
    this.dpr     = dpr
    this.size    = size
    this.time    = 0
    this.stars   = []

    this.changeEventTime      = 0.32
    this.cameraZ              = -400
    this.cameraTravelDistance = 3400
    this.startDotYOffset      = 28
    this.viewZoom             = 100
    this.numberOfStars        = 5000
    this.trailLength          = 80

    this.timeline = gsap.timeline({ repeat: -1 })
    this._initStars()
    this._setupTimeline()
  }

  _initStars() {
    const orig = Math.random
    let seed   = 1234
    Math.random = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280 }
    for (let i = 0; i < this.numberOfStars; i++)
      this.stars.push(new Star(this.cameraZ, this.cameraTravelDistance))
    Math.random = orig
  }

  _setupTimeline() {
    this.timeline.to(this, { time: 1, duration: 15, repeat: -1, ease: 'none', onUpdate: () => this.render() })
  }

  ease(p, g) {
    return p < 0.5 ? 0.5 * Math.pow(2 * p, g) : 1 - 0.5 * Math.pow(2 * (1 - p), g)
  }

  easeOutElastic(x) {
    const c4 = (2 * Math.PI) / 4.5
    if (x <= 0) return 0
    if (x >= 1) return 1
    return Math.pow(2, -8 * x) * Math.sin((x * 8 - 0.75) * c4) + 1
  }

  map(v, s1, e1, s2, e2)          { return s2 + (e2 - s2) * ((v - s1) / (e1 - s1)) }
  constrain(v, mn, mx)             { return Math.min(Math.max(v, mn), mx) }
  lerp(s, e, t)                    { return s * (1 - t) + e * t }

  spiralPath(p) {
    p = this.constrain(1.2 * p, 0, 1)
    p = this.ease(p, 1.8)
    const theta = 2 * Math.PI * 6 * Math.sqrt(p)
    const r     = 170 * Math.sqrt(p)
    return new Vector2D(r * Math.cos(theta), r * Math.sin(theta) + this.startDotYOffset)
  }

  rotate(v1, v2, p, orientation) {
    const mx = (v1.x + v2.x) / 2, my = (v1.y + v2.y) / 2
    const dx = v1.x - mx,          dy = v1.y - my
    const angle  = Math.atan2(dy, dx)
    const o      = orientation ? -1 : 1
    const r      = Math.sqrt(dx * dx + dy * dy)
    const bounce = Math.sin(p * Math.PI) * 0.05 * (1 - p)
    const rot    = angle + o * Math.PI * this.easeOutElastic(p)
    return new Vector2D(mx + r * (1 + bounce) * Math.cos(rot), my + r * (1 + bounce) * Math.sin(rot))
  }

  showProjectedDot(position, sizeFactor) {
    const t2       = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    const newCamZ  = this.cameraZ + this.ease(Math.pow(t2, 1.2), 1.8) * this.cameraTravelDistance
    if (position.z <= newCamZ) return
    const depth = position.z - newCamZ
    const x     = this.viewZoom * position.x / depth
    const y     = this.viewZoom * position.y / depth
    const sw    = 400 * sizeFactor / depth
    this.ctx.lineWidth = sw
    this.ctx.beginPath()
    this.ctx.arc(x, y, 0.5, 0, Math.PI * 2)
    this.ctx.fill()
  }

  _drawStartDot() {
    if (this.time <= this.changeEventTime) return
    const dy = this.cameraZ * this.startDotYOffset / this.viewZoom
    this.showProjectedDot(new Vector3D(0, dy, this.cameraTravelDistance), 2.5)
  }

  _drawTrail(t1) {
    for (let i = 0; i < this.trailLength; i++) {
      const f   = this.map(i, 0, this.trailLength, 1.1, 0.1)
      const sw  = (1.3 * (1 - t1) + 3.0 * Math.sin(Math.PI * t1)) * f
      this.ctx.fillStyle = 'white'
      this.ctx.lineWidth = sw
      const pos     = this.spiralPath(t1 - 0.00015 * i)
      const offset  = new Vector2D(pos.x + 5, pos.y + 5)
      const rotated = this.rotate(pos, offset, Math.sin(this.time * Math.PI * 2) * 0.5 + 0.5, i % 2 === 0)
      this.ctx.beginPath()
      this.ctx.arc(rotated.x, rotated.y, sw / 2, 0, Math.PI * 2)
      this.ctx.fill()
    }
  }

  render() {
    const { ctx, size } = this
    if (!ctx) return
    ctx.fillStyle = 'black'
    ctx.fillRect(0, 0, size, size)
    ctx.save()
    ctx.translate(size / 2, size / 2)
    const t1 = this.constrain(this.map(this.time, 0, this.changeEventTime + 0.25, 0, 1), 0, 1)
    const t2 = this.constrain(this.map(this.time, this.changeEventTime, 1, 0, 1), 0, 1)
    ctx.rotate(-Math.PI * this.ease(t2, 2.7))
    this._drawTrail(t1)
    ctx.fillStyle = 'white'
    for (const star of this.stars) star.render(t1, this)
    this._drawStartDot()
    ctx.restore()
  }

  pause()   { this.timeline.pause() }
  resume()  { this.timeline.play() }
  destroy() { this.timeline.kill() }
}

// ── React component ───────────────────────────────────────────────────────────
export function SpiralAnimation() {
  const canvasRef    = useRef(null)
  const animationRef = useRef(null)
  const [dims, setDims] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const onResize = () => setDims({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr  = window.devicePixelRatio || 1
    const size = Math.max(dims.width, dims.height)

    canvas.width        = size * dpr
    canvas.height       = size * dpr
    canvas.style.width  = `${dims.width}px`
    canvas.style.height = `${dims.height}px`
    ctx.scale(dpr, dpr)

    animationRef.current = new AnimationController(canvas, ctx, dpr, size)
    return () => {
      animationRef.current?.destroy()
      animationRef.current = null
    }
  }, [dims])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
    </div>
  )
}
