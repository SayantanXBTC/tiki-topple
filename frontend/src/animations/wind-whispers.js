// ── Wind Whispers Animation Controller ────────────────────────────────────────
// Main animation system for ambient wind effects

import { LeafParticle } from './leaf-particle.js'
import { getRandomLeafShape } from './leaf-shapes.js'
import { GustScheduler } from './gust-scheduler.js'

export class WindWhispers {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.options = {
      idleLeafCount: 8,
      gustLeafCount: 15,
      respectReducedMotion: true,
      ...options,
    }

    // Check for reduced motion preference
    this.reducedMotion = this.options.respectReducedMotion && 
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // State
    this.idleLeaves = []
    this.gustLeaves = []
    this.windStreaks = []
    this.vignettePhase = 0
    this.canopySway = 0
    this.isGustActive = false
    this.animationFrameId = null
    this.lastTime = Date.now()

    // Gust scheduler
    this.gustScheduler = new GustScheduler(() => this.triggerGust())

    this.init()
  }

  init() {
    this.resize()
    window.addEventListener('resize', () => this.resize())

    // Create idle leaves
    for (let i = 0; i < this.options.idleLeafCount; i++) {
      this.createIdleLeaf()
    }

    // Start animation loop
    this.start()

    // Start gust scheduler
    if (!this.reducedMotion) {
      this.gustScheduler.start()
    }
  }

  resize() {
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.width = this.canvas.width
    this.height = this.canvas.height
  }

  createIdleLeaf() {
    const shape = getRandomLeafShape()
    const edge = Math.random()
    let x, y

    // Position on edges
    if (edge < 0.25) {
      // Left edge
      x = -20
      y = Math.random() * this.height
    } else if (edge < 0.5) {
      // Right edge
      x = this.width + 20
      y = Math.random() * this.height
    } else if (edge < 0.75) {
      // Top edge
      x = Math.random() * this.width
      y = -20
    } else {
      // Bottom edge
      x = Math.random() * this.width
      y = this.height + 20
    }

    this.idleLeaves.push({
      shape,
      x,
      y,
      baseX: x,
      baseY: y,
      size: 20 + Math.random() * 40,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 16, // ±8°
      driftSpeed: 4 + Math.random() * 5, // 4-9s
      driftPhase: Math.random() * Math.PI * 2,
      opacity: 0.15 + Math.random() * 0.2, // 0.15-0.35
    })
  }

  triggerGust() {
    if (this.isGustActive || this.reducedMotion) return
    this.isGustActive = true

    // Phase 1: Wind streaks (0ms)
    this.createWindStreaks()

    // Phase 2: Leaf burst (50ms)
    setTimeout(() => this.createLeafBurst(), 50)

    // Phase 3: Canopy sway (100ms)
    setTimeout(() => this.startCanopySway(), 100)

    // Phase 4: Settle (800ms)
    setTimeout(() => {
      this.isGustActive = false
    }, 800)
  }

  createWindStreaks() {
    const streakCount = 3 + Math.floor(Math.random() * 3) // 3-5 streaks

    for (let i = 0; i < streakCount; i++) {
      this.windStreaks.push({
        y: Math.random() * this.height,
        startTime: Date.now() + i * 30,
        duration: 180,
        opacity: 0.06,
      })
    }
  }

  createLeafBurst() {
    const leafCount = this.options.gustLeafCount

    for (let i = 0; i < leafCount; i++) {
      const shape = getRandomLeafShape()
      const startY = this.height * (0.1 + Math.random() * 0.8)
      const delay = i * (20 + Math.random() * 40)

      setTimeout(() => {
        const particle = new LeafParticle(shape, -80, startY, this.width, this.height)
        this.gustLeaves.push(particle)
      }, delay)
    }
  }

  startCanopySway() {
    this.canopySway = 1
    const startTime = Date.now()
    const duration = 600

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Ease in-out
      const eased = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2

      if (progress < 0.5) {
        this.canopySway = eased * 2 // 0 to 1
      } else {
        this.canopySway = 1 - (eased - 0.5) * 2 // 1 to 0
      }

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        this.canopySway = 0
      }
    }

    animate()
  }

  updateIdleLeaves(deltaTime) {
    const time = Date.now() / 1000

    this.idleLeaves.forEach(leaf => {
      // Slow drift with sine wave
      const driftX = Math.sin(time / leaf.driftSpeed + leaf.driftPhase) * 5
      const driftY = Math.cos(time / leaf.driftSpeed + leaf.driftPhase) * 5
      
      leaf.x = leaf.baseX + driftX
      leaf.y = leaf.baseY + driftY

      // Slow rotation
      leaf.rotation += leaf.rotationSpeed * deltaTime * 0.001
    })
  }

  updateGustLeaves(deltaTime) {
    this.gustLeaves = this.gustLeaves.filter(leaf => {
      const active = leaf.update(deltaTime)
      return active
    })
  }

  updateWindStreaks() {
    const now = Date.now()
    this.windStreaks = this.windStreaks.filter(streak => {
      const elapsed = now - streak.startTime
      return elapsed < streak.duration
    })
  }

  updateVignette(deltaTime) {
    // 12s cycle
    this.vignettePhase += deltaTime / 12000
    if (this.vignettePhase > 1) this.vignettePhase -= 1
  }

  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.width, this.height)

    // Draw vignette
    this.drawVignette()

    // Draw idle leaves
    this.drawIdleLeaves()

    // Draw wind streaks
    this.drawWindStreaks()

    // Draw gust leaves
    this.drawGustLeaves()
  }

  drawVignette() {
    const intensity = this.reducedMotion ? 0.3 : 1
    const phase = Math.sin(this.vignettePhase * Math.PI * 2)
    const alpha = (0.08 + (phase * 0.05)) * intensity

    const gradient = this.ctx.createRadialGradient(
      this.width / 2, this.height / 2, this.height * 0.3,
      this.width / 2, this.height / 2, this.height * 0.8
    )
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)')
    gradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`)

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  drawIdleLeaves() {
    this.idleLeaves.forEach(leaf => {
      this.ctx.save()
      this.ctx.globalAlpha = leaf.opacity
      this.ctx.translate(leaf.x, leaf.y)
      this.ctx.rotate((leaf.rotation * Math.PI) / 180)
      this.ctx.scale(leaf.size / 40, leaf.size / 40)

      this.ctx.fillStyle = leaf.shape.color
      const path = new Path2D(leaf.shape.path)
      this.ctx.fill(path)

      this.ctx.restore()
    })
  }

  drawWindStreaks() {
    const now = Date.now()

    this.windStreaks.forEach(streak => {
      const elapsed = now - streak.startTime
      if (elapsed < 0) return

      const progress = elapsed / streak.duration
      const x = this.width * progress
      const opacity = streak.opacity * (1 - progress)

      this.ctx.save()
      this.ctx.globalAlpha = opacity
      this.ctx.fillStyle = 'rgba(200, 230, 180, 1)'
      
      // Motion blur effect
      this.ctx.filter = 'blur(3px)'
      this.ctx.fillRect(x - 100, streak.y - 1, 200, 2)
      
      this.ctx.restore()
    })
  }

  drawGustLeaves() {
    this.gustLeaves.forEach(leaf => {
      leaf.draw(this.ctx)
    })
  }

  animate() {
    const now = Date.now()
    const deltaTime = now - this.lastTime
    this.lastTime = now

    // Update all systems
    this.updateIdleLeaves(deltaTime)
    this.updateGustLeaves(deltaTime)
    this.updateWindStreaks()
    this.updateVignette(deltaTime)

    // Draw
    this.draw()

    // Continue loop
    this.animationFrameId = requestAnimationFrame(() => this.animate())
  }

  start() {
    if (this.animationFrameId) return
    this.lastTime = Date.now()
    this.animate()
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
    this.gustScheduler.stop()
  }

  getCanopyTransform() {
    if (this.reducedMotion) return 'none'
    
    const skew = -1.5 * this.canopySway
    const scale = 1 + (0.008 * this.canopySway)
    return `skewX(${skew}deg) scale(${scale})`
  }

  destroy() {
    this.stop()
    window.removeEventListener('resize', () => this.resize())
  }
}
