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
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(587.33, audioCtx.currentTime + 0.35); // D5

    gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.35);
  } catch (err) {
    console.debug('Kitchen chime skipped:', err);
  }
}
