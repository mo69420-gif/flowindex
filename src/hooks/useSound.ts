let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

// Initialize on first user interaction
if (typeof window !== 'undefined') {
  const initAudio = () => {
    getCtx();
    window.removeEventListener('pointerdown', initAudio);
    window.removeEventListener('keydown', initAudio);
  };
  window.addEventListener('pointerdown', initAudio, { once: true });
  window.addEventListener('keydown', initAudio, { once: true });
}

function playTone(freq: number, type: OscillatorType, duration: number, volume: number) {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Audio not available
  }
}

export type SoundType = 'purge' | 'claim' | 'exile' | 'deploy' | 'default';

export function playSound(sound: SoundType) {
  switch (sound) {
    case 'purge':
      playTone(180, 'sawtooth', 0.07, 0.09);
      break;
    case 'claim':
      playTone(1100, 'sine', 0.025, 0.04);
      break;
    case 'exile':
      playTone(500, 'triangle', 0.05, 0.05);
      break;
    case 'deploy':
      playTone(700, 'square', 0.06, 0.07);
      setTimeout(() => playTone(900, 'square', 0.06, 0.07), 80);
      break;
    default:
      playTone(650, 'square', 0.035, 0.05);
      break;
  }
}
