let audioContext: AudioContext | null = null;

type AudioContextConstructor = typeof AudioContext;

function getAudioContextClass(): AudioContextConstructor | null {
  if (typeof window === "undefined") return null;

  const extendedWindow = window as Window & {
    webkitAudioContext?: AudioContextConstructor;
  };

  return window.AudioContext ?? extendedWindow.webkitAudioContext ?? null;
}

function getAudioContext(): AudioContext | null {
  const AudioContextClass = getAudioContextClass();
  if (!AudioContextClass) return null;

  if (!audioContext) {
    audioContext = new AudioContextClass();
  }

  if (audioContext.state === "suspended") {
    void audioContext.resume();
  }

  return audioContext;
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  start: number,
  duration: number,
  volume = 0.2,
): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export function playCorrectGuessSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    playTone(ctx, 523.25, now, 0.12, 0.18);
    playTone(ctx, 659.25, now + 0.08, 0.14, 0.16);
    playTone(ctx, 783.99, now + 0.15, 0.22, 0.14);
  } catch {
    // Audio is optional — ignore failures on restrictive browsers.
  }
}

export function playWrongGuessSound(): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    playTone(ctx, 220, now, 0.18, 0.16);
    playTone(ctx, 165, now + 0.1, 0.22, 0.14);
  } catch {
    // Audio is optional — ignore failures on restrictive browsers.
  }
}

export function primeAudio(): void {
  void getAudioContext()?.resume();
}
