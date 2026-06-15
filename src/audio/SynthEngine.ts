

const midiToFreq = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12)

const SEMI: Record<string, number> = {
  'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
  'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11,
}

export function noteIdToMidi(noteId: string): number {
  const m = noteId.match(/^([A-G]#?)(\d+)$/)
  if (!m) return 60
  return 12 * (parseInt(m[2]) + 1) + (SEMI[m[1]] ?? 0)
}


const ATTACK  = 0.015   // percussive snap
const DECAY   = 0.30    // quick fall to sustain
const SUSTAIN = 0.35    // sustain level (fraction of peak)
const RELEASE = 1.50    // long ring-out


function keytrackGain(midi: number): number {
  if (midi <= 60) {
    const t = (60 - midi) / 39 // 0 at C4, 1 at A0
    return 1.0 + 0.8 * Math.pow(t, 1.3)
  }
  // Above C4: progressive cut
  const t = (midi - 60) / 48 // 0 at C4, 1 at C8
  return Math.max(0.3, 1.0 - 0.65 * Math.pow(t, 0.9))
}


function sawMix(midi: number): number {
  if (midi <= 36) return 0.65   // A0–C2: heavy saw
  if (midi >= 72) return 0.0    // C5+: pure triangle
  // Linear fade between
  return 0.65 * (1 - (midi - 36) / 36)
}


function lpfCutoff(freq: number, midi: number): number {
  // Low notes: wide cutoff lets harmonics through
  // High notes: narrow cutoff prevents shrillness
  const mult = midi < 40 ? 10 : midi < 60 ? 7 : midi < 80 ? 4.5 : 3
  return Math.min(freq * mult, 14000)
}

interface Voice {
  tri: OscillatorNode
  saw: OscillatorNode
  triGain: GainNode
  sawGain: GainNode
  lpf1: BiquadFilterNode
  lpf2: BiquadFilterNode
  env: GainNode
  kt: GainNode
}

class SynthEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voices = new Map<string, Voice>()

  private ensure(): AudioContext {
    if (!this.ctx) {
      this.ctx = new AudioContext()

      const comp = this.ctx.createDynamicsCompressor()
      comp.threshold.value = -14
      comp.knee.value = 10
      comp.ratio.value = 12
      comp.attack.value = 0.001
      comp.release.value = 0.05

      this.master = this.ctx.createGain()
      this.master.gain.value = 0.28

      this.master.connect(comp)
      comp.connect(this.ctx.destination)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
    return this.ctx
  }

  noteOn(noteId: string): void {
    if (this.voices.has(noteId)) return
    const ctx = this.ensure()
    const now = ctx.currentTime
    const midi = noteIdToMidi(noteId)
    const freq = midiToFreq(midi)

    // ── Oscillators ──
    const tri = ctx.createOscillator()
    tri.type = 'triangle'
    tri.frequency.setValueAtTime(freq, now)

    const saw = ctx.createOscillator()
    saw.type = 'sawtooth'
    saw.frequency.setValueAtTime(freq, now)

    // ── Per-osc gain (blend) ──
    const sm = sawMix(midi)
    const triGain = ctx.createGain()
    triGain.gain.value = 1.0

    const sawGain = ctx.createGain()
    sawGain.gain.value = sm

    // ── 2nd-order Butterworth LPF ──
    const cutoff = lpfCutoff(freq, midi)
    const lpf1 = ctx.createBiquadFilter()
    lpf1.type = 'lowpass'
    lpf1.frequency.setValueAtTime(cutoff, now)
    lpf1.Q.value = 0.7071

    const lpf2 = ctx.createBiquadFilter()
    lpf2.type = 'lowpass'
    lpf2.frequency.setValueAtTime(cutoff, now)
    lpf2.Q.value = 0.7071

    // ── ADSR envelope ──
    const peak = 0.4
    const env = ctx.createGain()
    env.gain.setValueAtTime(0.0001, now)
    // Attack
    env.gain.linearRampToValueAtTime(peak, now + ATTACK)
    
    env.gain.exponentialRampToValueAtTime(
      Math.max(0.0001, peak * SUSTAIN),
      now + ATTACK + DECAY
    )

    
    const kt = ctx.createGain()
    kt.gain.value = keytrackGain(midi)

   
    tri.connect(triGain)
    saw.connect(sawGain)
    triGain.connect(lpf1)
    sawGain.connect(lpf1)
    lpf1.connect(lpf2)
    lpf2.connect(env)
    env.connect(kt)
    kt.connect(this.master!)

    tri.start(now)
    saw.start(now)

    this.voices.set(noteId, { tri, saw, triGain, sawGain, lpf1, lpf2, env, kt })
  }

  noteOff(noteId: string): void {
    const v = this.voices.get(noteId)
    if (!v) return
    const now = this.ctx!.currentTime

    // ── Release phase ──
    v.env.gain.cancelScheduledValues(now)
    v.env.gain.setValueAtTime(Math.max(0.0001, v.env.gain.value), now)
    v.env.gain.exponentialRampToValueAtTime(0.0001, now + RELEASE)

    // Stop oscillators after release completes
    v.tri.stop(now + RELEASE + 0.05)
    v.saw.stop(now + RELEASE + 0.05)

    // Cleanup after everything stops
    const cleanup = () => {
      v.tri.disconnect(); v.saw.disconnect()
      v.triGain.disconnect(); v.sawGain.disconnect()
      v.lpf1.disconnect(); v.lpf2.disconnect()
      v.env.disconnect(); v.kt.disconnect()
    }
    setTimeout(cleanup, (RELEASE + 0.1) * 1000)

    this.voices.delete(noteId)
  }
}

export const synthEngine = new SynthEngine()
