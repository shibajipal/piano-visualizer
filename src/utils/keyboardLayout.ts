/* Layout constants */
export const WHITE_KEY_WIDTH  = 1.0
export const WHITE_KEY_GAP    = 0.06
export const WHITE_KEY_DEPTH  = 6.0
export const WHITE_KEY_HEIGHT = 0.9
export const BLACK_KEY_HEIGHT = 0.6
export const BLACK_KEY_DEPTH  = 3.8
export const WHITE_KEY_PITCH  = WHITE_KEY_WIDTH + WHITE_KEY_GAP

/* Note helpers */
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

export interface KeyLayout {
  noteId: string
  midi: number
  isBlack: boolean
  position: [number, number, number]
}

/**
 * Build the full 88-key layout.
 * MIDI range: 21 (A0) → 108 (C8).
 */
export function buildLayout(): { keys: KeyLayout[]; totalWidth: number } {
  const keys: KeyLayout[] = []

  // Pass 1: index all white key X positions by MIDI number
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

  // Pass 2: generate key definitions
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
