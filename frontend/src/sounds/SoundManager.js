class SoundManager {
  constructor() {
    this.ctx = null;
    this.bgmOscillators = [];
    this.isInitialized = false;
    this.masterGain = null;
  }

  init() {
    if (this.isInitialized) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 0.6;
    this.masterGain.connect(this.ctx.destination);
    
    this.isInitialized = true;
  }

  // Resumes context if suspended (needed for browsers requiring user gesture)
  ensureContext() {
    if (!this.isInitialized) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  startBGM() {
    this.ensureContext();
    if (!this.ctx || this.bgmOscillators.length > 0) return;

    // Create a low, modern, atmospheric rumble using two detuned oscillators
    const freqs = [55, 55.5]; // Low A
    
    freqs.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.value = freq;

      filter.type = 'lowpass';
      filter.frequency.value = 150; // Keep it very low and rumbly
      filter.Q.value = 1;

      // Slow LFO for the filter to make it "breathe"
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + (Math.random() * 0.05); // Slow sweep
      lfoGain.gain.value = 100; // Sweep range
      
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();

      gain.gain.value = 0.15; // Low volume for BGM

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);

      osc.start();
      
      this.bgmOscillators.push({ osc, gain, lfo, lfoGain });
    });
  }

  stopBGM() {
    this.bgmOscillators.forEach(({ osc, lfo }) => {
      osc.stop();
      lfo.stop();
      osc.disconnect();
    });
    this.bgmOscillators = [];
  }

  playPush() {
    this.ensureContext();
    if (!this.ctx) return;

    // A swift, ascending sound (whoosh + bright tone)
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    
    // Pitch sweep up
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
    
    // Volume envelope (quick attack, short decay)
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.4, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playToast() {
    this.ensureContext();
    if (!this.ctx) return;

    // A fiery, burning noise sound
    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.5; // 0.5 seconds of noise
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Generate pinkish noise
    let b0, b1, b2, b3, b4, b5, b6;
    b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
    for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        data[i] *= 0.11; // (roughly) compensate for gain
        b6 = white * 0.115926;
    }

    const noiseSrc = this.ctx.createBufferSource();
    noiseSrc.buffer = buffer;
    
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    // Sweep filter down to simulate fading embers
    filter.frequency.setValueAtTime(2000, t);
    filter.frequency.exponentialRampToValueAtTime(200, t + 0.4);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.5, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.45);
    
    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    
    noiseSrc.start(t);
  }

  playTopple() {
    this.ensureContext();
    if (!this.ctx) return;

    // A heavy, tumbling / crashing sound (low frequency impact + noise)
    const t = this.ctx.currentTime;
    
    // Impact tone
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    // Pitch drop
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.2);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.8, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
    
    osc.connect(gain);
    gain.connect(this.masterGain);
    
    osc.start(t);
    osc.stop(t + 0.5);

    // Rumble
    this.playToast(); // Reuse the noise but shorter? Actually let's make a dedicated rumble if we have time. 
    // The impact + a small toast sound gives a nice fiery crash.
  }
}

const soundManager = new SoundManager();
export default soundManager;
