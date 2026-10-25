/**
 * Synthesizes a realistic paper page turn / rustle swoosh using Web Audio API.
 * Resilient, zero-external-dependencies, works offline in any modern browser.
 */
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

// Safari / iOS Safari unlock listener: unlocks Web Audio on first user interaction
if (typeof window !== 'undefined') {
  const unlockSafariAudio = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch {}
    window.removeEventListener('touchstart', unlockSafariAudio, true);
    window.removeEventListener('touchend', unlockSafariAudio, true);
    window.removeEventListener('click', unlockSafariAudio, true);
  };
  window.addEventListener('touchstart', unlockSafariAudio, true);
  window.addEventListener('touchend', unlockSafariAudio, true);
  window.addEventListener('click', unlockSafariAudio, true);
}

export function playPageTurnSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const sampleRate = ctx.sampleRate;
    const duration = 0.22; // 220ms page flip duration
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    // Generate textured paper friction noise with an envelope
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      // Envelope: quick attack, textured body, fast decay
      const envelope = progress < 0.2 
        ? Math.sin((progress / 0.2) * (Math.PI / 2))
        : Math.pow(1 - (progress - 0.2) / 0.8, 1.8);
      
      // Pink-like noise
      const whiteNoise = (Math.random() * 2 - 1);
      data[i] = whiteNoise * envelope * 0.15;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass filter to emulate the crisp frequency response of dry paper sliding
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + duration);
    filter.Q.setValueAtTime(1.8, ctx.currentTime);

    // Subtle gain stage
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.35, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noiseSource.start();
  } catch (err) {
    // Graceful fallback: silent failure if audio context is blocked by autoplay policy
    console.debug('Audio play skipped:', err);
  }
}

export function playKitchenChime() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Master Dynamics Compressor: drives maximum perceived loudness without digital clipping
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(0, now);
    compressor.ratio.setValueAtTime(18, now);
    compressor.attack.setValueAtTime(0.001, now);
    compressor.release.setValueAtTime(0.08, now);

    // Master Gain Stage: Maximum full-scale volume (1.0)
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);

    compressor.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Helper: Play a piercing dual-harmonic kitchen bell pulse
    const playBellTone = (freq1: number, freq2: number, startTime: number, duration: number) => {
      if (!ctx) return;

      // Primary High-Impact Bell Oscillator (Triangle for harmonic cut)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq1, startTime);

      // Overtone Oscillator (Sine for resonant ring)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq2, startTime);

      // Sharp High-Frequency Click Oscillator (cuts through kitchen hood noise)
      const oscClick = ctx.createOscillator();
      oscClick.type = 'sawtooth';
      oscClick.frequency.setValueAtTime(freq2 * 1.5, startTime);

      const toneGain = ctx.createGain();
      toneGain.gain.setValueAtTime(0.95, startTime);
      // Quick punchy decay with ringing tail
      toneGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.08);
      toneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(0.5, startTime);
      clickGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.03);

      osc1.connect(toneGain);
      osc2.connect(toneGain);
      oscClick.connect(clickGain);

      toneGain.connect(compressor);
      clickGain.connect(compressor);

      osc1.start(startTime);
      osc2.start(startTime);
      oscClick.start(startTime);

      osc1.stop(startTime + duration);
      osc2.stop(startTime + duration);
      oscClick.stop(startTime + 0.04);
    };

    // Pulse 1: High Attention Strike (E6: 1318.5Hz + B6: 1975.5Hz)
    playBellTone(1318.5, 1975.5, now, 0.45);

    // Pulse 2: Resonant Major Third (G#6: 1661.2Hz + E7: 2637Hz)
    playBellTone(1661.2, 2637.0, now + 0.18, 0.55);

    // Pulse 3: Secondary Wakeup Burst at +0.42s (Guarantees kitchen staff hear it over clattering dishes)
    playBellTone(1760.0, 2349.3, now + 0.45, 0.65);
  } catch (err) {
    console.debug('Kitchen loud alert chime skipped:', err);
  }
}
