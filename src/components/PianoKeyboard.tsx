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
import { buildLayout, WHITE_KEY_HEIGHT, WHITE_KEY_DEPTH } from '../utils/keyboardLayout'

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