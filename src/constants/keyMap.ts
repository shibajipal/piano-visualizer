/**
 * QWERTY → note mapping (C4–E5) and reverse lookup.
 * Shared between useKeyboardInput and PianoKey tooltip.
 */

export const KEY_TO_NOTE: Record<string, string> = {
  'a': 'C4',   'w': 'C#4',
  's': 'D4',   'e': 'D#4',
  'd': 'E4',
  'f': 'F4',   't': 'F#4',
  'g': 'G4',   'y': 'G#4',
  'h': 'A4',   'u': 'A#4',
  'j': 'B4',
  'k': 'C5',   'o': 'C#5',
  'l': 'D5',   'p': 'D#5',
  'm': 'E5',
}

// Reverse: noteId -> display label for keyboard key
const _reverse = new Map<string, string>()
for (const [key, noteId] of Object.entries(KEY_TO_NOTE)) {
  _reverse.set(noteId, key.toUpperCase())
}

/** Returns the mapped keyboard key label for a noteId, or null if unmapped. */
export function getKeyLabel(noteId: string): string | null {
  if (_reverse.has(noteId)) return _reverse.get(noteId)!

  const match = noteId.match(/^([A-G]#?)(\d)$/)
  if (!match) return null

  const noteStr = match[1]
  const octave = parseInt(match[2], 10)

  // Check if reachable via Shift (base octave is 1 lower)
  const shiftBase = `${noteStr}${octave - 1}`
  if (_reverse.has(shiftBase)) return `SHIFT + ${_reverse.get(shiftBase)}`

  // Check if reachable via Alt (base octave is 1 higher)
  const altBase = `${noteStr}${octave + 1}`
  if (_reverse.has(altBase)) return `ALT + ${_reverse.get(altBase)}`

  return null
}
