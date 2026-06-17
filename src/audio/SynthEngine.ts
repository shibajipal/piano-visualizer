/**
 * Sample-based piano engine — Tone.Sampler + Salamander Grand Piano.
 * Supports optional precise time parameter for Transport-scheduled playback.
 */

import * as Tone from 'tone'

const BASE_URL = 'https://tonejs.github.io/audio/salamander/'

const SAMPLE_URLS: Record<string, string> = {
  'A0': 'A0.mp3',  'C1': 'C1.mp3',  'D#1': 'Ds1.mp3', 'F#1': 'Fs1.mp3',
  'A1': 'A1.mp3',  'C2': 'C2.mp3',  'D#2': 'Ds2.mp3', 'F#2': 'Fs2.mp3',
  'A2': 'A2.mp3',  'C3': 'C3.mp3',  'D#3': 'Ds3.mp3', 'F#3': 'Fs3.mp3',
  'A3': 'A3.mp3',  'C4': 'C4.mp3',  'D#4': 'Ds4.mp3', 'F#4': 'Fs4.mp3',
  'A4': 'A4.mp3',  'C5': 'C5.mp3',  'D#5': 'Ds5.mp3', 'F#5': 'Fs5.mp3',
  'A5': 'A5.mp3',  'C6': 'C6.mp3',  'D#6': 'Ds6.mp3', 'F#6': 'Fs6.mp3',
  'A6': 'A6.mp3',  'C7': 'C7.mp3',  'D#7': 'Ds7.mp3', 'F#7': 'Fs7.mp3',
  'A7': 'A7.mp3',  'C8': 'C8.mp3',
}

class SynthEngine {
  private sampler: Tone.Sampler | null = null
  private reverb: Tone.Reverb | null = null
  private ready = false
  private pending: Array<{ noteId: string; action: 'on' | 'off' }> = []

  constructor() {
    this.init()
  }

  private init(): void {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    if (isMobile) {
      Tone.setContext(new Tone.Context({ latencyHint: 'playback' }))
    }

    if (!isMobile) {
      this.reverb = new Tone.Reverb({ decay: 2, wet: 0.25 })
    }

    this.sampler = new Tone.Sampler({
      urls: SAMPLE_URLS,
      baseUrl: BASE_URL,
      release: 1.5,
      onload: () => {
        this.ready = true
        for (const p of this.pending) {
          if (p.action === 'on') this.sampler!.triggerAttack(p.noteId)
          else this.sampler!.triggerRelease(p.noteId)
        }
        this.pending = []
      },
    })

    // @ts-ignore - Limit polyphony to prevent buffer underruns
    this.sampler.maxPolyphony = isMobile ? 16 : 32;

    if (this.reverb) {
      this.sampler.chain(this.reverb, Tone.getDestination())
    } else {
      this.sampler.connect(Tone.getDestination())
    }
  }

  /** Trigger note attack. Optional `time` for Transport-scheduled precision. */
  noteOn(noteId: string, time?: number): void {
    if (Tone.getContext().state !== 'running') {
      void Tone.start()
    }
    if (!this.ready) {
      this.pending.push({ noteId, action: 'on' })
      return
    }
    this.sampler!.triggerAttack(noteId, time)
  }

  /** Trigger note release. Optional `time` for Transport-scheduled precision. */
  noteOff(noteId: string, time?: number): void {
    if (!this.ready) {
      this.pending.push({ noteId, action: 'off' })
      return
    }
    this.sampler!.triggerRelease(noteId, time)
  }
}

export const synthEngine = new SynthEngine()
