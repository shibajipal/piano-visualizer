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
import { buildLayout } from '../utils/keyboardLayout'

export default function PianoKeyboard() {
  const { keys } = useMemo(() => buildLayout(), [])

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

    </group>
  )
}