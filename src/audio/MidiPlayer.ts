/**
 * MIDI file parser + Tone.Transport-based playback scheduler.
 *
 * Parses .mid files via @tonejs/midi, extracts all note events into a
 * normalized format, and schedules them on Tone.Transport for
 * sample-accurate audio + synchronized visual state updates.
 */

import { Midi } from '@tonejs/midi'
import * as Tone from 'tone'
import { pianoStore } from '../store/pianoStore'
import { synthEngine } from './SynthEngine'

export interface MidiFileInfo {
  name: string
  trackCount: number
  noteCount: number
  duration: number
}

interface ScheduledNote {
  time: number
  note: string
  duration: number
}

class MidiPlayer {
  private notes: ScheduledNote[] = []
  private eventIds: number[] = []
  private _info: MidiFileInfo | null = null
  private _playing = false
  private _paused = false

  /** Callback fired when playback reaches the end. */
  onComplete: (() => void) | null = null

  get info() { return this._info }
  get loaded() { return this._info !== null }
  get playing() { return this._playing }
  get paused() { return this._paused }

  /**
   * Parse a .mid ArrayBuffer and extract all note events.
   * Stops any current playback first.
   */
  load(buffer: ArrayBuffer, fileName: string): MidiFileInfo {
    this.stop()

    const midi = new Midi(buffer)
    this.notes = []

    for (const track of midi.tracks) {
      for (const note of track.notes) {
        this.notes.push({
          time: note.time,
          note: note.name,    // e.g. "C4", "F#5"
          duration: note.duration,
        })
      }
    }

    this.notes.sort((a, b) => a.time - b.time)

    this._info = {
      name: fileName.replace(/\.midi?$/i, ''),
      trackCount: midi.tracks.filter(t => t.notes.length > 0).length,
      noteCount: this.notes.length,
      duration: midi.duration,
    }

    return this._info
  }

  /**
   * Schedule all notes on Tone.Transport and start playback.
   */
  play(): void {
    if (!this.loaded) return

    if (this._paused) {
      // Resume from paused position
      Tone.getTransport().start()
      this._playing = true
      this._paused = false
      return
    }

    if (this._playing) return

    // Ensure audio context is running
    void Tone.start()

    this.clearSchedule()
    Tone.getTransport().position = 0

    const transport = Tone.getTransport()

    for (const n of this.notes) {
      // Note-on: trigger audio at precise transport time, update visual state
      const onId = transport.schedule((time) => {
        synthEngine.noteOn(n.note, time)
        // Use Tone.getDraw() to sync visual state to animation frame
        Tone.getDraw().schedule(() => {
          pianoStore.noteOn(n.note, 'midi', true)
        }, time)
      }, n.time)
      this.eventIds.push(onId)

      // Note-off
      const offId = transport.schedule((time) => {
        synthEngine.noteOff(n.note, time)
        Tone.getDraw().schedule(() => {
          pianoStore.noteOff(n.note, 'midi', true)
        }, time)
      }, n.time + n.duration)
      this.eventIds.push(offId)
    }

    // End-of-song sentinel
    const totalDuration = this.notes.length > 0
      ? Math.max(...this.notes.map(n => n.time + n.duration))
      : 0
    const endId = transport.schedule(() => {
      this.stop()
      this.onComplete?.()
    }, totalDuration + 0.3)
    this.eventIds.push(endId)

    transport.start()
    this._playing = true
    this._paused = false
  }

  pause(): void {
    if (!this._playing) return
    Tone.getTransport().pause()
    this._playing = false
    this._paused = true
    pianoStore.releaseAll('midi')
  }

  stop(): void {
    const transport = Tone.getTransport()
    transport.stop()
    transport.position = 0
    this.clearSchedule()
    pianoStore.releaseAll('midi')
    this._playing = false
    this._paused = false
  }

  private clearSchedule(): void {
    const transport = Tone.getTransport()
    for (const id of this.eventIds) {
      transport.clear(id)
    }
    this.eventIds = []
  }
}

export const midiPlayer = new MidiPlayer()
