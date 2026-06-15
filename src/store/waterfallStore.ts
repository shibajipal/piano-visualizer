/**
 * State store for the cascading 3D waterfall and particle engine.
 *
 * Tracks manual note inputs and visual effects settings.
 * MIDI note blocks are rendered directly from the MidiPlayer timeline,
 * while manual notes require this store because their duration is unknown
 * until the note is released.
 */

import * as Tone from 'tone'

export interface ManualNote {
  id: string
  noteId: string
  startTime: number
  endTime: number | null
}

export interface ImpactParticle {
  id: string
  noteId: string
  startTime: number
}

class WaterfallStore {
  public speed = 18 // units per second
  public effectsEnabled = true

  public manualNotes: ManualNote[] = []
  public particles: ImpactParticle[] = []

  private nextId = 0

  addManualNote(noteId: string): string {
    const id = `manual_${this.nextId++}`
    this.manualNotes.push({
      id,
      noteId,
      startTime: Tone.now(),
      endTime: null,
    })
    return id
  }

  releaseManualNote(noteId: string): void {
    const now = Tone.now()
    // Find the oldest active note with this ID
    const note = this.manualNotes.find(n => n.noteId === noteId && n.endTime === null)
    if (note) {
      note.endTime = now
    }
  }

  spawnParticle(noteId: string): void {
    if (!this.effectsEnabled) return
    this.particles.push({
      id: `p_${this.nextId++}`,
      noteId,
      startTime: Tone.now(),
    })
  }

  setSpeed(speed: number) {
    this.speed = speed
  }

  setEffectsEnabled(enabled: boolean) {
    this.effectsEnabled = enabled
  }

  /**
   * Garbage collection called periodically from the rendering loop.
   */
  cleanup(currentTime: number): void {
    // Remove manual notes that have completely fallen past the viewport (-20 units)
    this.manualNotes = this.manualNotes.filter(n => {
      if (n.endTime === null) return true
      const distanceFallenSinceEnd = (currentTime - n.endTime) * this.speed
      return distanceFallenSinceEnd < 30
    })

    // Remove particles older than 1 second
    this.particles = this.particles.filter(p => currentTime - p.startTime < 1.0)
  }
}

export const waterfallStore = new WaterfallStore()
