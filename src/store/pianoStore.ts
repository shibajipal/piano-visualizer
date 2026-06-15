/**
 * Minimal reactive store for active piano notes.
 *
 * Tracks activation sources ('pointer' | 'keyboard') per note so that
 * simultaneous mouse + keyboard presses on the same key don't conflict.
 * Audio noteOn/noteOff fires only on aggregate state transitions.
 */

import { synthEngine } from '../audio/SynthEngine'

type Source = 'pointer' | 'keyboard'

class PianoStore {
  private sources = new Map<string, Set<Source>>()

  noteOn(noteId: string, source: Source): void {
    const wasActive = this.isActive(noteId)
    let s = this.sources.get(noteId)
    if (!s) {
      s = new Set()
      this.sources.set(noteId, s)
    }
    s.add(source)
    if (!wasActive) synthEngine.noteOn(noteId)
  }

  noteOff(noteId: string, source: Source): void {
    const s = this.sources.get(noteId)
    if (!s) return
    s.delete(source)
    if (s.size === 0) {
      this.sources.delete(noteId)
      synthEngine.noteOff(noteId)
    }
  }

  isActive(noteId: string): boolean {
    const s = this.sources.get(noteId)
    return !!s && s.size > 0
  }

  releaseAll(source: Source): void {
    const ids = [...this.sources.entries()]
      .filter(([, s]) => s.has(source))
      .map(([id]) => id)
    for (const id of ids) this.noteOff(id, source)
  }
}

export const pianoStore = new PianoStore()
