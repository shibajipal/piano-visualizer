/**
 * Full 88-key grand piano keyboard (A0 → C8).
 *
 * Layout:
 *   Keys 1–3:   A0, A#0, B0          (partial octave)
 *   Keys 4–87:  C1–B7                 (7 complete octaves)
 *   Key 88:     C8                    (single top key)
 *
 * 52 white keys, 36 black keys.
 * Black key offsets use Steinway-derived fractional positioning.
 */

import { useMemo } from 'react'
import PianoKey from './PianoKey'

/* ── Layout constants ── */
const WHITE_KEY_WIDTH  = 1.0
const WHITE_KEY_GAP    = 0.06
const WHITE_KEY_DEPTH  = 6.0
const WHITE_KEY_HEIGHT = 0.9
const BLACK_KEY_HEIGHT = 0.6
const BLACK_KEY_DEPTH  = 3.8
const WHITE_KEY_PITCH  = WHITE_KEY_WIDTH + WHITE_KEY_GAP

/* ── Note helpers ── */
const BLACK_SEMITONES = new Set([1, 3, 6, 8, 10])

const SEMI_NAME: Record<number, string> = {
  0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E', 5: 'F',
  6: 'F#', 7: 'G', 8: 'G#', 9: 'A', 10: 'A#', 11: 'B',
}

// Steinway fractional offsets: where the black key center sits
// between its two neighbouring white keys (0 = left edge, 1 = right edge)
const BLACK_FRAC: Record<number, number> = {
  1: 0.55,   // C#
  3: 0.45,   // D#
  6: 0.52,   // F#
  8: 0.50,   // G#
  10: 0.48,  // A#
}

interface KeyLayout {
  noteId: string
  midi: number
  isBlack: boolean
  position: [number, number, number]
}

/**
 * Build the full 88-key layout.
 * MIDI range: 21 (A0) → 108 (C8).
 */
function buildLayout(): { keys: KeyLayout[]; totalWidth: number } {
  const keys: KeyLayout[] = []

  // ── Pass 1: index all white key X positions by MIDI number ──
  const whiteX = new Map<number, number>()
  let wIdx = 0
  for (let midi = 21; midi <= 108; midi++) {
    if (!BLACK_SEMITONES.has(midi % 12)) {
      whiteX.set(midi, wIdx * WHITE_KEY_PITCH)
      wIdx++
    }
  }
  const totalWhite = wIdx              // 52
  const totalWidth = (totalWhite - 1) * WHITE_KEY_PITCH
  const offsetX = -totalWidth / 2

  // ── Pass 2: generate key definitions ──
  for (let midi = 21; midi <= 108; midi++) {
    const semi = midi % 12
    const octave = Math.floor(midi / 12) - 1
    const noteId = `${SEMI_NAME[semi]}${octave}`
    const isBlack = BLACK_SEMITONES.has(semi)

    if (!isBlack) {
      keys.push({
        noteId,
        midi,
        isBlack: false,
        position: [whiteX.get(midi)! + offsetX, 0, 0],
      })
    } else {
      // Find the two neighbouring white keys
      let leftMidi = midi - 1
      while (BLACK_SEMITONES.has(leftMidi % 12)) leftMidi--
      let rightMidi = midi + 1
      while (BLACK_SEMITONES.has(rightMidi % 12)) rightMidi++

      const lx = whiteX.get(leftMidi)!
      const rx = whiteX.get(rightMidi)!
      const frac = BLACK_FRAC[semi] ?? 0.5
      const x = lx + (rx - lx) * frac + offsetX

      keys.push({
        noteId,
        midi,
        isBlack: true,
        position: [
          x,
          WHITE_KEY_HEIGHT / 2 + BLACK_KEY_HEIGHT / 2,
          -(WHITE_KEY_DEPTH - BLACK_KEY_DEPTH) / 2,
        ],
      })
    }
  }

  return { keys, totalWidth }
}

export default function PianoKeyboard() {
  const { keys, totalWidth } = useMemo(() => buildLayout(), [])

  // Render whites first so blacks are on top for raycasting priority
  const whites = keys.filter(k => !k.isBlack)
  const blacks = keys.filter(k =>  k.isBlack)

  return (
    <group>
      {whites.map(k => (
        <PianoKey key={k.noteId} noteId={k.noteId} isBlack={false} position={k.position} />
      ))}
      {blacks.map(k => (
        <PianoKey key={k.noteId} noteId={k.noteId} isBlack={true} position={k.position} />
      ))}

      {/* Base platform */}
      <mesh position={[0, -WHITE_KEY_HEIGHT / 2 - 0.08, -0.2]} receiveShadow>
        <boxGeometry args={[totalWidth + 2.5, 0.15, WHITE_KEY_DEPTH + 1.0]} />
        <meshStandardMaterial color="#111113" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  )
}