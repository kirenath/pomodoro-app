// A soft, generated chime — no alarm, no audio files.
// Two quiet sine tones (~440Hz + a gentle fifth) with a slow fade-out.

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  return ctx
}

function playTone(
  audio: AudioContext,
  frequency: number,
  startOffset: number,
  duration: number,
  peakGain: number,
) {
  const osc = audio.createOscillator()
  const gain = audio.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency

  const t0 = audio.currentTime + startOffset
  gain.gain.setValueAtTime(0.0001, t0)
  gain.gain.exponentialRampToValueAtTime(peakGain, t0 + 0.08)
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration)

  osc.connect(gain)
  gain.connect(audio.destination)
  osc.start(t0)
  osc.stop(t0 + duration + 0.05)
}

/** Play a gentle two-note chime. Safe to call from a user gesture or timer. */
export function playChime(): void {
  const audio = getContext()
  if (!audio) return
  if (audio.state === 'suspended') {
    void audio.resume()
  }
  // Root ~440Hz then a soft perfect fifth, both fading out.
  playTone(audio, 440, 0, 1.6, 0.12)
  playTone(audio, 660, 0.18, 1.5, 0.08)
}
