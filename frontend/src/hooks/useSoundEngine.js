import { useState, useCallback, useEffect } from 'react'

/**
 * Web Audio API sound engine — singleton so every component that calls
 * useSoundEngine() shares the SAME AudioContext + master gain + ambient loop.
 *
 * AudioContext is lazy-initialised on first play() / startAmbient() call
 * because browsers block AudioContext creation before a user gesture.
 *
 * All synthesis is procedural — no audio files required.
 *
 * @returns {{ play, startAmbient, stopAmbient, toggleMute, setMasterVolume, isMuted }}
 */

// ── Module-level singletons — one shared audio graph across the whole app ──
const SOUND = {
  ctx:     null,          // AudioContext
  master:  null,          // master GainNode
  ambient: null,          // { intervalId } for ambient loop
  muted:   false,
  volume:  1,
}

// Attach a one-time global gesture listener so we can resume the AudioContext
// AND kick-start the ambient loop as soon as ANY user click/keypress happens
// (Chrome/Safari autoplay policy blocks audio pre-gesture).
if (typeof window !== 'undefined' && !window.__tikiSoundGestureBound) {
  window.__tikiSoundGestureBound = true
  const resume = () => {
    // Create ctx if needed (safe inside a gesture handler)
    if (!SOUND.ctx) {
      try {
        const ctx    = new (window.AudioContext || window.webkitAudioContext)()
        const master = ctx.createGain()
        master.gain.value = SOUND.volume
        master.connect(ctx.destination)
        SOUND.ctx    = ctx
        SOUND.master = master
      } catch { /* older browsers */ }
    }
    if (SOUND.ctx && SOUND.ctx.state === 'suspended') {
      SOUND.ctx.resume().then(() => {
        if (SOUND.pendingAmbient && !SOUND.ambient && SOUND.actuallyStartAmbient) {
          SOUND.actuallyStartAmbient()
        }
      }).catch(() => {})
    } else if (SOUND.pendingAmbient && !SOUND.ambient && SOUND.actuallyStartAmbient) {
      SOUND.actuallyStartAmbient()
    }
  }
  ;['pointerdown', 'keydown', 'touchstart', 'click'].forEach(evt =>
    window.addEventListener(evt, resume, { passive: true })
  )
}

export function useSoundEngine() {
  const [isMuted, setIsMuted] = useState(SOUND.muted)

  // ── Context bootstrap ──────────────────────────────────────────────────────

  function getCtx() {
    if (!SOUND.ctx) {
      const ctx    = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = SOUND.volume
      master.connect(ctx.destination)
      SOUND.ctx    = ctx
      SOUND.master = master
    }
    // Resume if browser suspended it (e.g. tab lost focus / autoplay block)
    if (SOUND.ctx.state === 'suspended') SOUND.ctx.resume()
    return { ctx: SOUND.ctx, master: SOUND.master }
  }
  // Legacy refs used elsewhere in the file — remap to singleton
  const ctxRef    = { get current() { return SOUND.ctx    }, set current(v) { SOUND.ctx = v    } }
  const masterRef = { get current() { return SOUND.master }, set current(v) { SOUND.master = v } }
  const ambientRef= { get current() { return SOUND.ambient}, set current(v) { SOUND.ambient = v} }
  // Suppress unused var lints — refs are read via closures below
  void ctxRef; void masterRef; void ambientRef

  useEffect(() => { /* no-op mount hook to keep hook stable */ }, [])

  // ── Low-level helpers ──────────────────────────────────────────────────────

  /**
   * Create a GainNode routed through master.
   * @param {AudioContext} ctx
   * @param {number}       volume  0–1
   */
  function makeGain(ctx, volume) {
    const g = ctx.createGain()
    g.gain.value = volume
    g.connect(masterRef.current)
    return g
  }

  /**
   * One-shot oscillator with envelope.
   * @param {AudioContext} ctx
   * @param {GainNode}     dest
   * @param {string}       type    OscillatorType
   * @param {number}       freq    Hz
   * @param {number}       start   ctx.currentTime offset
   * @param {number}       attack  seconds
   * @param {number}       decay   seconds
   * @param {number}       vol     peak gain
   */
  function osc(ctx, dest, type, freq, start, attack, decay, vol = 0.4) {
    const o = ctx.createOscillator()
    const g = ctx.createGain()
    o.type = type
    o.frequency.value = freq
    o.connect(g)
    g.connect(dest)
    g.gain.setValueAtTime(0, start)
    g.gain.linearRampToValueAtTime(vol, start + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)
    o.start(start)
    o.stop(start + attack + decay + 0.01)
  }

  /**
   * One-shot noise burst (white noise through a bandpass filter).
   * @param {AudioContext} ctx
   * @param {GainNode}     dest
   * @param {number}       centerFreq  Hz
   * @param {number}       q           bandpass Q
   * @param {number}       start       ctx.currentTime offset
   * @param {number}       duration    seconds
   * @param {number}       vol
   */
  function noise(ctx, dest, centerFreq, q, start, duration, vol = 0.3) {
    const bufLen = Math.ceil(ctx.sampleRate * duration)
    const buf    = ctx.createBuffer(1, bufLen, ctx.sampleRate)
    const data   = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1

    const src = ctx.createBufferSource()
    src.buffer = buf

    const bp = ctx.createBiquadFilter()
    bp.type            = 'bandpass'
    bp.frequency.value = centerFreq
    bp.Q.value         = q

    const g = ctx.createGain()
    g.gain.setValueAtTime(vol, start)
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    src.connect(bp)
    bp.connect(g)
    g.connect(dest)
    src.start(start)
    src.stop(start + duration + 0.01)
  }

  // ── Sound definitions ──────────────────────────────────────────────────────

  /**
   * Short woody "tok" — wooden percussion hit.
   * Uses a noise burst + pitched body resonance.
   */
  function playTikiMove(ctx) {
    const g = makeGain(ctx, 0.6)
    const t = ctx.currentTime
    // Body thud
    osc(ctx, g, 'sine', 180, t,      0.002, 0.08, 0.5)
    // Woody click
    noise(ctx, g, 1200, 8, t,        0.04,  0.4)
    // High transient tick
    noise(ctx, g, 4000, 12, t,       0.015, 0.2)
  }

  /**
   * Round-end reveal — ascending marimba arpeggio + shimmer.
   */
  function playRoundEndReveal(ctx) {
    const g = makeGain(ctx, 0.5)
    const t = ctx.currentTime
    // Ascending pentatonic arpeggio: C5 D5 E5 G5 A5
    const notes = [523.25, 587.33, 659.25, 783.99, 880.00]
    notes.forEach((freq, i) => {
      const start = t + i * 0.12
      osc(ctx, g, 'sine',     freq,       start, 0.01, 0.4, 0.35)
      osc(ctx, g, 'triangle', freq * 2,   start, 0.01, 0.2, 0.1)
    })
    // Final chord shimmer
    const chord = [523.25, 659.25, 783.99]
    chord.forEach(freq => {
      osc(ctx, g, 'sine', freq, t + 0.65, 0.02, 0.8, 0.15)
    })
  }

  /**
   * Game-over fanfare — triumphant rising fifth + resolution.
   */
  function playGameOverFanfare(ctx) {
    const g = makeGain(ctx, 0.55)
    const t = ctx.currentTime
    // Fanfare motif: C4 → G4 → C5 → E5 (rise)
    const motif = [
      { f: 261.63, s: 0.0 },
      { f: 392.00, s: 0.2 },
      { f: 523.25, s: 0.4 },
      { f: 659.25, s: 0.6 },
    ]
    motif.forEach(({ f, s }) => {
      osc(ctx, g, 'sawtooth', f,     t + s, 0.01, 0.3, 0.2)
      osc(ctx, g, 'square',   f * 2, t + s, 0.01, 0.25, 0.08)
    })
    // Final resolution chord — C major triad held
    const resolution = [261.63, 329.63, 392.00, 523.25]
    resolution.forEach(f => {
      osc(ctx, g, 'sine', f, t + 0.9, 0.03, 1.6, 0.18)
    })
    // Percussion roll at start
    for (let i = 0; i < 4; i++) {
      noise(ctx, g, 200, 1, t + i * 0.05, 0.08, 0.25)
    }
  }

  /**
   * Error buzz — short dissonant sawtooth growl.
   */
  function playErrorBuzz(ctx) {
    const g = makeGain(ctx, 0.4)
    const t = ctx.currentTime
    osc(ctx, g, 'sawtooth', 110, t,      0.005, 0.12, 0.45)
    osc(ctx, g, 'sawtooth', 116, t,      0.005, 0.12, 0.3)   // beating dissonance
    osc(ctx, g, 'square',   55,  t,      0.005, 0.08, 0.2)
    noise(ctx, g, 300, 2,        t,      0.10,  0.2)
  }

  function playTikiPush(ctx) {
    const g = makeGain(ctx, 0.5)
    const t = ctx.currentTime
    osc(ctx, g, 'sine', 300, t, 0.05, 0.15, 0.4)
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type = 'triangle'
    o2.frequency.setValueAtTime(300, t)
    o2.frequency.exponentialRampToValueAtTime(800, t + 0.15)
    o2.connect(g2)
    g2.connect(g)
    g2.gain.setValueAtTime(0, t)
    g2.gain.linearRampToValueAtTime(0.3, t + 0.05)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.2)
    o2.start(t)
    o2.stop(t + 0.25)
  }

  function playTikiToast(ctx) {
    const g = makeGain(ctx, 0.5)
    const t = ctx.currentTime
    noise(ctx, g, 1500, 1, t, 0.4, 0.5)
    osc(ctx, g, 'sawtooth', 80, t, 0.1, 0.3, 0.3)
  }

  function playTikiTopple(ctx) {
    const g = makeGain(ctx, 0.6)
    const t = ctx.currentTime
    osc(ctx, g, 'square', 120, t, 0.01, 0.3, 0.4)
    const o2 = ctx.createOscillator()
    const g2 = ctx.createGain()
    o2.type = 'sine'
    o2.frequency.setValueAtTime(150, t)
    o2.frequency.exponentialRampToValueAtTime(40, t + 0.3)
    o2.connect(g2)
    g2.connect(g)
    g2.gain.setValueAtTime(0, t)
    g2.gain.linearRampToValueAtTime(0.5, t + 0.02)
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4)
    o2.start(t)
    o2.stop(t + 0.45)
    noise(ctx, g, 400, 2, t, 0.4, 0.4)
  }

  // ── Ambient engine ─────────────────────────────────────────────────────────

  /**
   * Schedule one bar of a tropical ambient rhythm pattern.
   * Called repeatedly by setInterval to keep the rhythm going.
   * @param {AudioContext} ctx
   * @param {number}       barStart  ctx time to start this bar
   */
  /**
   * Sparse jungle ambience — no sustained tones (no drone / pad / siren).
   * Only percussive events with fast decay: soft hand drum, wood clicks,
   * plucked marimba notes, occasional bird chirp, brief rain-stick swells.
   * Bar-to-bar variation avoids the "loop siren" feel.
   */
  function scheduleAmbientBar(ctx, dest, barStart) {
    const bpm  = 68
    const beat = 60 / bpm
    const bar  = beat * 4
    const barIndex = Math.floor((barStart / bar) + 0.5)

    // Hand drum on beats 1 and 3 every bar (steady pulse)
    ;[0, 2].forEach(b => {
      const t = barStart + b * beat
      osc(ctx, dest, 'sine', 95 + (b === 2 ? 15 : 0), t, 0.004, 0.22, 0.42)
      noise(ctx, dest, 210, 1.2, t, 0.10, 0.20)
    })
    // Off-beat shaker
    ;[1, 3].forEach(b => {
      const t = barStart + b * beat
      noise(ctx, dest, 5200, 6, t, 0.05, 0.14)
    })

    // Wooden click accents — different position each bar
    const clickBeats = [
      [1.5], [0.75, 2.75], [1.25, 3.5], [2.5],
    ][barIndex % 4]
    clickBeats.forEach(b => {
      const t = barStart + b * beat
      osc(ctx, dest, 'triangle', 720 + (barIndex % 3) * 40, t, 0.001, 0.04, 0.06)
    })

    // Marimba pluck — 1 to 2 notes per bar, drawn from A minor pentatonic.
    // Fast decay = no held tone.
    const scale = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 659.25]
    const noteCount = (barIndex % 2 === 0) ? 3 : 2
    for (let i = 0; i < noteCount; i++) {
      const b = 0.25 + Math.floor(((barIndex * 7 + i * 13) % 7)) * 0.5
      const f = scale[(barIndex * 3 + i * 5) % scale.length]
      const t = barStart + b * beat
      osc(ctx, dest, 'sine',     f,     t, 0.003, 0.4, 0.16)
      osc(ctx, dest, 'triangle', f * 2, t, 0.003, 0.18, 0.05)
    }

    // Occasional bird chirp — every ~5 bars, high frequency sweep
    if (barIndex % 5 === 2) {
      const t = barStart + 1.25 * beat
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = 'sine'
      o.frequency.setValueAtTime(1800, t)
      o.frequency.exponentialRampToValueAtTime(2600, t + 0.06)
      o.frequency.exponentialRampToValueAtTime(1400, t + 0.12)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(0.05, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
      o.connect(g); g.connect(dest)
      o.start(t); o.stop(t + 0.16)
    }

    // Rain-stick brush — brief filtered noise swell every ~4 bars
    if (barIndex % 4 === 3) {
      const dur = beat * 1.4
      const t0  = barStart + 1.2 * beat
      const bufLen = Math.ceil(ctx.sampleRate * dur)
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate)
      const d = buf.getChannelData(0)
      for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * 0.35
      const src = ctx.createBufferSource(); src.buffer = buf
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'
      bp.frequency.value = 4200; bp.Q.value = 1.5
      const g = ctx.createGain()
      g.gain.setValueAtTime(0, t0)
      g.gain.linearRampToValueAtTime(0.035, t0 + dur * 0.4)
      g.gain.linearRampToValueAtTime(0.0001, t0 + dur)
      src.connect(bp); bp.connect(g); g.connect(dest)
      src.start(t0); src.stop(t0 + dur + 0.05)
    }

    return bar
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  const play = useCallback((soundName) => {
    try {
      const { ctx } = getCtx()
      switch (soundName) {
        case 'tiki_move':        playTikiMove(ctx);        break
        case 'tiki_push':        playTikiPush(ctx);        break
        case 'tiki_toast':       playTikiToast(ctx);       break
        case 'tiki_topple':      playTikiTopple(ctx);      break
        case 'round_end_reveal': playRoundEndReveal(ctx);  break
        case 'game_over_fanfare':playGameOverFanfare(ctx); break
        case 'error_buzz':       playErrorBuzz(ctx);       break
        default: break
      }
    } catch (e) {
      // Audio errors are non-fatal — swallow silently
    }
  }, [])

  const actuallyStartAmbient = () => {
    if (ambientRef.current) return
    const ctx = SOUND.ctx
    if (!ctx) return
    const bpm    = 68
    const beat   = 60 / bpm
    const barLen = beat * 4

    // Persistent gain node — every scheduled bar routes through this so
    // stopAmbient() can silence the entire loop in one ramp.
    const loopGain = ctx.createGain()
    loopGain.gain.value = 0.95
    loopGain.connect(masterRef.current)

    let nextBar = ctx.currentTime + 0.05
    scheduleAmbientBar(ctx, loopGain, nextBar)
    nextBar += barLen

    const intervalMs = (barLen - 0.1) * 1000
    const intervalId = setInterval(() => {
      try {
        const c = ctxRef.current
        if (!c) return
        if (c.state === 'suspended') c.resume()
        scheduleAmbientBar(c, loopGain, nextBar)
        nextBar += barLen
      } catch (_) { /* non-fatal */ }
    }, intervalMs)

    ambientRef.current = { intervalId, killGain: loopGain }
    SOUND.pendingAmbient = false
  }

  const startAmbient = useCallback(() => {
    if (ambientRef.current) return   // already running
    try {
      const { ctx } = getCtx()
      if (ctx.state === 'running') {
        actuallyStartAmbient()
      } else {
        // Suspended — flag as pending; the global gesture listener OR the
        // resume() promise below will start the loop as soon as ctx is ready.
        SOUND.pendingAmbient = true
        try {
          ctx.resume().then(() => {
            if (SOUND.pendingAmbient && !ambientRef.current) actuallyStartAmbient()
          }).catch(() => { /* pre-gesture */ })
        } catch (_) { /* non-fatal */ }
      }
    } catch (e) {
      SOUND.pendingAmbient = true
    }
  }, [])

  // Register both the pending-aware entry and the direct starter so the
  // global gesture listener can pick whichever path is safe.
  SOUND.startAmbientFn = startAmbient
  SOUND.actuallyStartAmbient = actuallyStartAmbient

  const stopAmbient = useCallback(() => {
    SOUND.pendingAmbient = false
    if (!ambientRef.current) return
    clearInterval(ambientRef.current.intervalId)
    // Kill any oscillators/gains still queued from the last scheduled bar so
    // audio stops immediately instead of trailing out for ~2s.
    if (ambientRef.current.killGain) {
      try {
        const t = SOUND.ctx?.currentTime ?? 0
        ambientRef.current.killGain.gain.cancelScheduledValues(t)
        ambientRef.current.killGain.gain.setValueAtTime(ambientRef.current.killGain.gain.value, t)
        ambientRef.current.killGain.gain.linearRampToValueAtTime(0, t + 0.05)
      } catch { /* non-fatal */ }
    }
    ambientRef.current = null
  }, [])

  const toggleMute = useCallback(() => {
    if (!masterRef.current) {
      setIsMuted(prev => !prev)
      return
    }
    const muted = masterRef.current.gain.value > 0
    masterRef.current.gain.value = muted ? 0 : 1
    setIsMuted(muted)
  }, [])

  const setMasterVolume = useCallback((v) => {
    const clamped = Math.max(0, Math.min(1, v))
    SOUND.volume = clamped
    // Ensure the audio graph exists so the volume takes effect immediately
    // even if the user hasn't clicked anywhere yet. Suspended context is OK —
    // resume happens on the global gesture listener.
    if (!SOUND.ctx) {
      try { getCtx() } catch { /* pre-gesture browsers may throw */ }
    }
    if (SOUND.master) SOUND.master.gain.value = clamped
    if (clamped === 0) setIsMuted(true)
    else setIsMuted(false)
  }, [])

  return { play, startAmbient, stopAmbient, toggleMute, setMasterVolume, isMuted }
}
