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
  ';': 'E5',
}

// Reverse: noteId → display label for keyboard key
const _reverse = new Map<string, string>()
for (const [key, noteId] of Object.entries(KEY_TO_NOTE)) {
  _reverse.set(noteId, key === ';' ? ';' : key.toUpperCase())
}

/** Returns the mapped keyboard key label for a noteId, or null if unmapped. */
export function getKeyLabel(noteId: string): string | null {
  return _reverse.get(noteId) ?? null
}
