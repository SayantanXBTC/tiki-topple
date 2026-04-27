import { useRef, useState, useCallback } from 'react'

/**
 * Web Audio API sound engine.
 * AudioContext is lazy-initialised on first play() / startAmbient() call
 * because browsers block AudioContext creation before a user gesture.
 *
 * All synthesis is procedural — no audio files required.
 *
 * @returns {{ play, startAmbient, stopAmbient, toggleMute, setMasterVolume, isMuted }}
 */
export function useSoundEngine() {
  const ctxRef        = useRef(null)   // AudioContext
  const masterRef     = useRef(null)   // master GainNode (mute control)
  const ambientRef    = useRef(null)   // { nodes[], intervalId } for ambient loop
  const [isMuted, setIsMuted] = useState(false)

  // ── Context bootstrap ──────────────────────────────────────────────────────

  function getCtx() {
    if (!ctxRef.current) {
      const ctx    = new (window.AudioContext || window.webkitAudioContext)()
      const master = ctx.createGain()
      master.gain.value = 1
      master.connect(ctx.destination)
      ctxRef.current  = ctx
      masterRef.current = master
    }
    // Resume if browser suspended it (e.g. tab lost focus)
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return { ctx: ctxRef.current, master: masterRef.current }
  }

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

  // ── Ambient engine ─────────────────────────────────────────────────────────

  /**
   * Schedule one bar of a tropical ambient rhythm pattern.
   * Called repeatedly by setInterval to keep the rhythm going.
   * @param {AudioContext} ctx
   * @param {number}       barStart  ctx time to start this bar
   */
  function scheduleAmbientBar(ctx, barStart) {
    const bpm      = 88
    const beat     = 60 / bpm
    const bar      = beat * 4   // 4/4 time

    const g = ctx.createGain()
    g.gain.value = 0.28
    g.connect(masterRef.current)

    // Kick drum on beats 1 and 3
    [0, 2].forEach(b => {
      const t = barStart + b * beat
      osc(ctx, g, 'sine', 60, t, 0.005, 0.18, 0.55)
      noise(ctx, g, 120, 0.8, t, 0.15, 0.3)
    })

    // Hi-hat on every eighth note
    for (let e = 0; e < 8; e++) {
      noise(ctx, g, 8000, 15, barStart + e * beat * 0.5, 0.04, 0.15)
    }

    // Snare / rim on beats 2 and 4
    [1, 3].forEach(b => {
      const t = barStart + b * beat
      noise(ctx, g, 2000, 3, t, 0.06, 0.25)
      osc(ctx, g, 'triangle', 220, t, 0.002, 0.05, 0.2)
    })

    // Marimba melody — tropical pentatonic figure
    const melody = [
      { beat: 0,   freq: 523.25 },
      { beat: 0.5, freq: 659.25 },
      { beat: 1,   freq: 783.99 },
      { beat: 2,   freq: 659.25 },
      { beat: 2.5, freq: 523.25 },
      { beat: 3,   freq: 392.00 },
      { beat: 3.5, freq: 440.00 },
    ]
    melody.forEach(({ beat: b, freq }) => {
      const t = barStart + b * beat
      osc(ctx, g, 'sine',     freq,     t, 0.005, 0.15, 0.22)
      osc(ctx, g, 'triangle', freq * 2, t, 0.005, 0.08, 0.06)
    })

    return bar  // duration of one bar in seconds
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  const play = useCallback((soundName) => {
    try {
      const { ctx } = getCtx()
      switch (soundName) {
        case 'tiki_move':        playTikiMove(ctx);        break
        case 'round_end_reveal': playRoundEndReveal(ctx);  break
        case 'game_over_fanfare':playGameOverFanfare(ctx); break
        case 'error_buzz':       playErrorBuzz(ctx);       break
        default: break
      }
    } catch (e) {
      // Audio errors are non-fatal — swallow silently
    }
  }, [])

  const startAmbient = useCallback(() => {
    if (ambientRef.current) return   // already running
    try {
      const { ctx } = getCtx()
      const bpm     = 88
      const beat    = 60 / bpm
      const barLen  = beat * 4

      let nextBar = ctx.currentTime + 0.05
      scheduleAmbientBar(ctx, nextBar)
      nextBar += barLen

      // Schedule the next bar slightly before this one ends
      const intervalMs = (barLen - 0.1) * 1000
      const intervalId = setInterval(() => {
        try {
          const c = ctxRef.current
          if (!c) return
          if (c.state === 'suspended') c.resume()
          scheduleAmbientBar(c, nextBar)
          nextBar += barLen
        } catch (_) { /* non-fatal */ }
      }, intervalMs)

      ambientRef.current = { intervalId }
    } catch (e) { /* non-fatal */ }
  }, [])

  const stopAmbient = useCallback(() => {
    if (!ambientRef.current) return
    clearInterval(ambientRef.current.intervalId)
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
    if (masterRef.current) {
      masterRef.current.gain.value = clamped
    }
    if (clamped === 0) setIsMuted(true)
    else setIsMuted(false)
  }, [])

  return { play, startAmbient, stopAmbient, toggleMute, setMasterVolume, isMuted }
}
