// ── Leaf Particle Class ───────────────────────────────────────────────────────
// Manages individual leaf particle state and rendering

export class LeafParticle {
  constructor(shape, startX, startY, screenWidth, screenHeight) {
    this.shape = shape
    this.x = startX
    this.y = startY
    this.startY = startY
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
    
    // Random properties
    this.size = 12 + Math.random() * 33 // 12-45px
    this.speed = 0.6 + Math.random() * 0.8 // 0.6-1.4s
    this.drift = (Math.random() - 0.5) * 240 // ±120px vertical drift
    this.rotation = Math.random() * 720 - 360 // ±360° rotation
    this.spinSpeed = (Math.random() - 0.5) * 2 // Spin variation
    
    // Animation state
    this.progress = 0
    this.opacity = 0
    this.currentRotation = Math.random() * 360
    this.active = true
    this.startTime = Date.now()
    this.duration = this.speed * 1000 // Convert to ms
  }

  update(deltaTime) {
    if (!this.active) return false

    const elapsed = Date.now() - this.startTime
    this.progress = Math.min(elapsed / this.duration, 1)

    // Cubic bezier easing (0.25, 0.1, 0.4, 1.0)
    const t = this.progress
    const eased = t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2

    // Update position
    this.x = -80 + (this.screenWidth + 160) * eased
    this.y = this.startY + this.drift * Math.sin(eased * Math.PI)

    // Update rotation
    this.currentRotation = this.rotation * eased

    // Opacity arc: fade in, peak, fade out
    if (this.progress < 0.2) {
      this.opacity = (this.progress / 0.2) * 0.7
    } else if (this.progress > 0.8) {
      this.opacity = ((1 - this.progress) / 0.2) * 0.7
    } else {
      this.opacity = 0.7
    }

    // Deactivate when complete
    if (this.progress >= 1) {
      this.active = false
      return false
    }

    return true
  }

  draw(ctx) {
    if (!this.active || this.opacity <= 0) return

    ctx.save()
    ctx.globalAlpha = this.opacity
    ctx.translate(this.x, this.y)
    ctx.rotate((this.currentRotation * Math.PI) / 180)
    ctx.scale(this.size / 40, this.size / 40) // Normalize to viewBox

    // Draw leaf shape
    ctx.fillStyle = this.shape.color
    const path = new Path2D(this.shape.path)
    ctx.fill(path)

    ctx.restore()
  }

  reset(startX, startY) {
    this.x = startX
    this.y = startY
    this.startY = startY
    this.progress = 0
    this.opacity = 0
    this.currentRotation = Math.random() * 360
    this.active = true
    this.startTime = Date.now()
    
    // Randomize properties again
    this.size = 12 + Math.random() * 33
    this.speed = 0.6 + Math.random() * 0.8
    this.drift = (Math.random() - 0.5) * 240
    this.rotation = Math.random() * 720 - 360
    this.duration = this.speed * 1000
  }
}
