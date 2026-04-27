// ── Gust Scheduler ────────────────────────────────────────────────────────────
// Manages randomized gust timing

export class GustScheduler {
  constructor(onGust) {
    this.onGust = onGust
    this.minInterval = 8000 // 8 seconds
    this.maxInterval = 20000 // 20 seconds
    this.timeoutId = null
    this.isRunning = false
  }

  start() {
    if (this.isRunning) return
    this.isRunning = true
    this.scheduleNext()
  }

  stop() {
    this.isRunning = false
    if (this.timeoutId) {
      clearTimeout(this.timeoutId)
      this.timeoutId = null
    }
  }

  scheduleNext() {
    if (!this.isRunning) return

    const delay = this.minInterval + Math.random() * (this.maxInterval - this.minInterval)
    
    this.timeoutId = setTimeout(() => {
      if (this.isRunning && this.onGust) {
        this.onGust()
      }
      this.scheduleNext()
    }, delay)
  }

  triggerImmediate() {
    if (this.onGust) {
      this.onGust()
    }
  }
}
