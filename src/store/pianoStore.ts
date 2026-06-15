/**
 * Active-notes state store with source tracking.
 *
 * Sources: 'pointer' | 'keyboard' | 'midi'
 *
 * When skipAudio is true, the store only manages visual state — audio
 * is handled externally (e.g., by MidiPlayer for precise scheduling).
 */

import { synthEngine } from '../audio/SynthEngine'

type Source = 'pointer' | 'keyboard' | 'midi'

class PianoStore {
  private sources = new Map<string, Set<Source>>()

  noteOn(noteId: string, source: Source, skipAudio = false): void {
    const wasActive = this.isActive(noteId)
    let s = this.sources.get(noteId)
    if (!s) {
      s = new Set()
      this.sources.set(noteId, s)
    }
    s.add(source)
    if (!wasActive && !skipAudio) synthEngine.noteOn(noteId)
  }

  noteOff(noteId: string, source: Source, skipAudio = false): void {
    const s = this.sources.get(noteId)
    if (!s) return
    s.delete(source)
    if (s.size === 0) {
      this.sources.delete(noteId)
      if (!skipAudio) synthEngine.noteOff(noteId)
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
