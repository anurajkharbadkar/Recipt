/**
 * Temple Bell & Auspicious Chimes Synthesizer using Web Audio API
 * Zero network payload, zero latency, runs offline on all modern mobile & desktop browsers.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Synthesizes an authentic Indian Temple Brass Bell (घंटेचा नाद)
 * Fundamental frequency ~523.25 Hz (C5) with rich metallic harmonics and natural acoustic decay.
 */
export function playTempleBell(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  
  // Harmonic overtone ratios for authentic tuned brass bell
  const harmonics = [
    { freq: 523.25, gain: 0.8, decay: 3.2 },   // Fundamental C5
    { freq: 1046.5, gain: 0.45, decay: 2.4 },  // 1st overtone
    { freq: 1568.0, gain: 0.3, decay: 1.8 },   // 2nd overtone
    { freq: 2093.0, gain: 0.2, decay: 1.2 },   // 3rd overtone
    { freq: 3136.0, gain: 0.1, decay: 0.8 },   // Shimmer
  ];

  harmonics.forEach(({ freq, gain, decay }) => {
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Subtle pitch dip at strike for metallic resonance
    osc.frequency.exponentialRampToValueAtTime(freq * 0.998, now + 0.1);

    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(gain, now + 0.008); // Sharp strike attack
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + decay);
  });
}

/**
 * Sound of wax seal cracking with golden shimmer burst
 */
export function playSealCrackSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Short noise burst for crisp crack
  const bufferSize = ctx.sampleRate * 0.05;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(1200, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.6, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);

  noise.start(now);
  noise.stop(now + 0.05);

  // Play bell immediately after seal crack
  setTimeout(() => {
    playTempleBell();
  }, 120);
}

/**
 * Gentle auspicious melody for Ashirwad blessing slide
 */
export function playAshirwadChimes(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;
  // Auspicious Raag Bhupali / Shankh frequency notes: Sa, Re, Ga, Pa, Dha
  const notes = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];

  notes.forEach((freq, index) => {
    const noteTime = now + index * 0.15;
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, noteTime);

    gainNode.gain.setValueAtTime(0, noteTime);
    gainNode.gain.linearRampToValueAtTime(0.25, noteTime + 0.03);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, noteTime + 1.8);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(noteTime);
    osc.stop(noteTime + 1.8);
  });
}
