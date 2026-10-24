/**
 * Synthesizes a realistic paper page turn / rustle swoosh using Web Audio API.
 * Resilient, zero-external-dependencies, works offline in any modern browser.
 */
let audioCtx: AudioContext | null = null;

export function playPageTurnSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const sampleRate = audioCtx.sampleRate;
    const duration = 0.22; // 220ms page flip duration
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = audioCtx.createBuffer(1, bufferSize, sampleRate);
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

    const noiseSource = audioCtx.createBufferSource();
    noiseSource.buffer = buffer;

    // Bandpass filter to emulate the crisp frequency response of dry paper sliding
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1400, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + duration);
    filter.Q.setValueAtTime(1.8, audioCtx.currentTime);

    // Subtle gain stage
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);

    noiseSource.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    noiseSource.start();
  } catch (err) {
    // Graceful fallback: silent failure if audio context is blocked by autoplay policy
    console.debug('Audio play skipped:', err);
  }
}

export function playKitchenChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    if (!audioCtx) audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Master Dynamics Compressor: drives maximum perceived loudness without digital clipping
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-12, now);
    compressor.knee.setValueAtTime(0, now);
    compressor.ratio.setValueAtTime(18, now);
    compressor.attack.setValueAtTime(0.001, now);
    compressor.release.setValueAtTime(0.08, now);

    // Master Gain Stage: Maximum full-scale volume (1.0)
    const masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(1.0, now);

    compressor.connect(masterGain);
    masterGain.connect(audioCtx.destination);

    // Helper: Play a piercing dual-harmonic kitchen bell pulse
    const playBellTone = (freq1: number, freq2: number, startTime: number, duration: number) => {
      if (!audioCtx) return;

      // Primary High-Impact Bell Oscillator (Triangle for harmonic cut)
      const osc1 = audioCtx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq1, startTime);

      // Overtone Oscillator (Sine for resonant ring)
      const osc2 = audioCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq2, startTime);

      // Sharp High-Frequency Click Oscillator (cuts through kitchen hood noise)
      const oscClick = audioCtx.createOscillator();
      oscClick.type = 'sawtooth';
      oscClick.frequency.setValueAtTime(freq2 * 1.5, startTime);

      const toneGain = audioCtx.createGain();
      toneGain.gain.setValueAtTime(0.95, startTime);
      // Quick punchy decay with ringing tail
      toneGain.gain.exponentialRampToValueAtTime(0.3, startTime + 0.08);
      toneGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      const clickGain = audioCtx.createGain();
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
