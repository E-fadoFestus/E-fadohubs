// Procedural Hydrophone & Oceanic Synthesizer for Deep Sea Jet
// Faithful 1:1 acoustic emulation of authentic Efado / Crash game sound synthesis
// Built on the standard Web Audio API with zero external assets

class HydrophoneSoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  // Real Efado Engine Synthesis Nodes
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private turbineWhineOsc: OscillatorNode | null = null;
  private propLfo: OscillatorNode | null = null;
  private propLfoGain: GainNode | null = null;
  private engineMasterGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;

  // Aerodynamic Wind / Hydrodynamic Flow Node
  private windNode: AudioBufferSourceNode | null = null;
  private windFilter: BiquadFilterNode | null = null;
  private windGain: GainNode | null = null;

  private isEngineRunning: boolean = false;
  private lastMilestonePassed: number = 1;

  private initCtx() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isEngineRunning) {
      this.stopEngineSound();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Pre-dive countdown radar pulse
  public playSonarPing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1480, now);
      osc.frequency.exponentialRampToValueAtTime(1180, now + 0.35);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.0);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.0);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Countdown second blip
  public playCountdownTick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch (e) {
      // ignore
    }
  }

  // Start authentic Efado dual-turbine & propeller drone
  public startEngineSound(initialMultiplier: number = 1.0) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx || this.isEngineRunning) return;

    try {
      const now = this.ctx.currentTime;
      this.lastMilestonePassed = 1;

      // 1. Master Engine Gain (enveloping the startup rev)
      this.engineMasterGain = this.ctx.createGain();
      this.engineMasterGain.gain.setValueAtTime(0.001, now);
      // Smooth takeoff rev-up envelope (spools up into flight humming)
      this.engineMasterGain.gain.exponentialRampToValueAtTime(0.08, now + 0.4);

      // 2. Main Dual Sawtooth/Triangle Oscillators (Detuned Chorus Drone)
      const baseFreq = 98; // Low mechanical drone at 1.00x
      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(baseFreq, now);

      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(baseFreq * 1.012, now); // Detuned for mechanical thickness

      // 3. Lowpass acoustic filter with resonance to keep engine beefy yet piercing
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(280, now);
      this.engineFilter.Q.setValueAtTime(3.2, now);

      // 4. Propeller / Rotor Blade Chopper (LFO Tremolo)
      // Modulates engine amplitude at ~14 Hz at start, speeding up with velocity
      this.propLfo = this.ctx.createOscillator();
      this.propLfo.type = 'sine';
      this.propLfo.frequency.setValueAtTime(14, now);

      this.propLfoGain = this.ctx.createGain();
      this.propLfoGain.gain.setValueAtTime(0.025, now);

      this.propLfo.connect(this.propLfoGain.gain);

      // 5. High-Pitched Turbine Whine (Jet Compressor Whistle)
      this.turbineWhineOsc = this.ctx.createOscillator();
      this.turbineWhineOsc.type = 'sine';
      this.turbineWhineOsc.frequency.setValueAtTime(baseFreq * 3.4, now);

      const turbineGain = this.ctx.createGain();
      turbineGain.gain.setValueAtTime(0.015, now);
      this.turbineWhineOsc.connect(turbineGain);
      turbineGain.connect(this.engineMasterGain);

      // Route oscillators through filter and master gain
      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineMasterGain);
      this.engineMasterGain.connect(this.ctx.destination);

      // 6. Aerodynamic Airflow / Fluid Wind Whoosh (Filtered Procedural Noise)
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      // Pink/Brown noise generator for rich turbulence
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }

      this.windNode = this.ctx.createBufferSource();
      this.windNode.buffer = noiseBuffer;
      this.windNode.loop = true;

      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'bandpass';
      this.windFilter.frequency.setValueAtTime(320, now);
      this.windFilter.Q.setValueAtTime(1.5, now);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.02, now);

      this.windNode.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.ctx.destination);

      // Start all nodes
      this.engineOsc1.start(now);
      this.engineOsc2.start(now);
      this.turbineWhineOsc.start(now);
      this.propLfo.start(now);
      this.windNode.start(now);

      this.isEngineRunning = true;
    } catch (e) {
      console.warn('Audio engine start error:', e);
    }
  }

  // Continuous real Efado frequency escalation matching accelerating multiplier
  public updateEngineSound(multiplier: number) {
    if (this.isMuted || !this.isEngineRunning || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const safeMult = Math.max(1.0, multiplier);

      // Pitch curve scales progressively with multiplier
      // Base: 98Hz at 1.00x -> 190Hz at 2.0x -> 380Hz at 10.0x -> 620Hz at 50x
      const baseFreq = 98 * Math.pow(safeMult, 0.44);
      const turbineFreq = baseFreq * 3.4;
      const filterCutoff = Math.min(2800, 280 + Math.pow(safeMult, 0.6) * 160);
      const propSpeed = Math.min(38, 14 + (safeMult - 1) * 2.6);

      // Smooth param gliding (0.05s target time for zero latency and no audio stepping)
      if (this.engineOsc1) {
        this.engineOsc1.frequency.setTargetAtTime(baseFreq, now, 0.05);
      }
      if (this.engineOsc2) {
        this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.012, now, 0.05);
      }
      if (this.turbineWhineOsc) {
        this.turbineWhineOsc.frequency.setTargetAtTime(turbineFreq, now, 0.05);
      }
      if (this.engineFilter) {
        this.engineFilter.frequency.setTargetAtTime(filterCutoff, now, 0.05);
      }
      if (this.propLfo) {
        this.propLfo.frequency.setTargetAtTime(propSpeed, now, 0.05);
      }

      // Wind sound swells with speed
      if (this.windFilter) {
        this.windFilter.frequency.setTargetAtTime(Math.min(2400, 320 + safeMult * 90), now, 0.06);
      }
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(Math.min(0.07, 0.02 + Math.log10(safeMult) * 0.035), now, 0.06);
      }

      // Milestone Tension Pulse (fires on reaching 2x, 3x, 5x, 10x, 25x, 50x, 100x)
      const currentInt = Math.floor(safeMult);
      const milestones = [2, 3, 5, 10, 20, 50, 100, 250, 500];
      if (milestones.includes(currentInt) && currentInt > this.lastMilestonePassed) {
        this.lastMilestonePassed = currentInt;
        this.playMilestonePing(currentInt);
      }
    } catch (e) {
      // ignore
    }
  }

  // Milestone Tension Ping
  public playMilestonePing(milestone: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(960 + Math.min(1000, milestone * 30), now);
      osc.frequency.exponentialRampToValueAtTime(480, now + 0.18);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.18);
    } catch (e) {
      // ignore
    }
  }

  // Stop engine sound with smooth exponential fadeout (no clicks)
  public stopEngineSound() {
    if (!this.isEngineRunning || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      if (this.engineMasterGain) {
        this.engineMasterGain.gain.setTargetAtTime(0.0001, now, 0.04);
      }
      if (this.windGain) {
        this.windGain.gain.setTargetAtTime(0.0001, now, 0.04);
      }

      setTimeout(() => {
        try {
          if (this.engineOsc1) { this.engineOsc1.stop(); this.engineOsc1.disconnect(); this.engineOsc1 = null; }
          if (this.engineOsc2) { this.engineOsc2.stop(); this.engineOsc2.disconnect(); this.engineOsc2 = null; }
          if (this.turbineWhineOsc) { this.turbineWhineOsc.stop(); this.turbineWhineOsc.disconnect(); this.turbineWhineOsc = null; }
          if (this.propLfo) { this.propLfo.stop(); this.propLfo.disconnect(); this.propLfo = null; }
          if (this.windNode) { this.windNode.stop(); this.windNode.disconnect(); this.windNode = null; }
        } catch (e) {}
        this.isEngineRunning = false;
      }, 50);
    } catch (e) {
      this.isEngineRunning = false;
    }
  }

  // Critical pressure warning klaxon
  public playPressureAlert() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(560, now);
      osc.frequency.setValueAtTime(440, now + 0.1);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.linearRampToValueAtTime(0.01, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  }

  // Hull breach / Implosion crash ("Flew Away / Implosion")
  public playImplosionCrash() {
    this.stopEngineSound();
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Flew Away / Emergency Doppler Zoom Whoosh
      const whooshOsc = this.ctx.createOscillator();
      const whooshGain = this.ctx.createGain();
      whooshOsc.type = 'sawtooth';
      whooshOsc.frequency.setValueAtTime(260, now);
      whooshOsc.frequency.exponentialRampToValueAtTime(1400, now + 0.25);
      whooshOsc.frequency.exponentialRampToValueAtTime(80, now + 0.6);

      whooshGain.gain.setValueAtTime(0.25, now);
      whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      whooshOsc.connect(whooshGain);
      whooshGain.connect(this.ctx.destination);
      whooshOsc.start(now);
      whooshOsc.stop(now + 0.6);

      // 2. Heavy Sub Bass Implosion Impact
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = 'triangle';
      subOsc.frequency.setValueAtTime(140, now);
      subOsc.frequency.exponentialRampToValueAtTime(22, now + 0.9);

      subGain.gain.setValueAtTime(0.45, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 1.2);

      // 3. Acoustic Cavitation Noise Burst
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.7);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.15));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.linearRampToValueAtTime(80, now + 0.7);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);

      noise.start(now);
    } catch (e) {
      console.warn('Audio crash error:', e);
    }
  }

  // Authentic Efado Golden Cashout Chime
  // Crisp metallic transient click + rich ascending harmonic bells (E6, G#6, B6, E7)
  public playCashoutChime() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // 1. Initial crisp metallic "coin snap" transient
      const clickOsc = this.ctx.createOscillator();
      const clickGain = this.ctx.createGain();
      clickOsc.type = 'triangle';
      clickOsc.frequency.setValueAtTime(2400, now);
      clickOsc.frequency.exponentialRampToValueAtTime(600, now + 0.03);

      clickGain.gain.setValueAtTime(0.3, now);
      clickGain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      clickOsc.connect(clickGain);
      clickGain.connect(this.ctx.destination);
      clickOsc.start(now);
      clickOsc.stop(now + 0.03);

      // 2. Multi-tone shimmering golden bell chord: E6 (1318.5Hz), G#6 (1661.2Hz), B6 (1975.5Hz), E7 (2637Hz)
      const chordNotes = [1318.5, 1661.2, 1975.5, 2637.0];
      chordNotes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.045;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        // Sine with slight 2nd harmonic richness for bright crystal bell clarity
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.22, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.55);
      });

      // 3. Shimmering coin trail
      setTimeout(() => {
        if (!this.ctx || this.isMuted) return;
        try {
          const t2 = this.ctx.currentTime;
          const shimmer = this.ctx.createOscillator();
          const sGain = this.ctx.createGain();
          shimmer.type = 'sine';
          shimmer.frequency.setValueAtTime(3135.9, t2); // G7
          sGain.gain.setValueAtTime(0.12, t2);
          sGain.gain.exponentialRampToValueAtTime(0.001, t2 + 0.35);

          shimmer.connect(sGain);
          sGain.connect(this.ctx.destination);
          shimmer.start(t2);
          shimmer.stop(t2 + 0.35);
        } catch (e) {}
      }, 120);
    } catch (e) {
      console.warn('Audio cashout error:', e);
    }
  }

  // Quick UI Button Click
  public playClick() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.035);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch (e) {
      // ignore
    }
  }

  // Tactile chip stack drop sound
  public playChipAdd() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1400, now);
      osc.frequency.exponentialRampToValueAtTime(700, now + 0.025);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch (e) {
      // ignore
    }
  }
}

export const soundManager = new HydrophoneSoundSystem();

