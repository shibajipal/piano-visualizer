import { useMemo } from 'react'
import type { JSX } from 'react'
import * as THREE from 'three'

/*
 * Piano geometry constants (real-world proportions scaled to scene units).
 *
 * A standard piano key has these approximate ratios:
 *   White key: ~23.5mm wide, ~150mm long, ~23mm tall (front face)
 *   Black key: ~11mm wide, ~95mm long, ~10mm above white key surface
 *
 * We normalise white key width to 1.0 unit and derive everything else.
 */

const WHITE_KEY_WIDTH = 1.0
const WHITE_KEY_GAP = 0.06            // gap between adjacent white keys
const WHITE_KEY_DEPTH = 6.0           // front-to-back length
const WHITE_KEY_HEIGHT = 0.9          // vertical thickness

const BLACK_KEY_WIDTH = 0.55
const BLACK_KEY_DEPTH = 3.8
const BLACK_KEY_HEIGHT = 0.6          // protrusion above white surface

const WHITE_KEY_PITCH = WHITE_KEY_WIDTH + WHITE_KEY_GAP  // center-to-center

/*
 * Note layout for one octave (C to B).
 * Each entry: [semitone offset, isBlack]
 *
 * Black key horizontal offsets within the octave are NOT evenly spaced on a
 * real piano. They follow specific cluster patterns:
 *   Group of 2: C#, D#    (between C-D and D-E)
 *   Group of 3: F#, G#, A# (between F-G, G-A, and A-B)
 *
 * We map each black key to its fractional position between the two
 * neighbouring white keys it sits between.
 */

// White keys in one octave in order: C D E F G A B → indices 0–6
// Black keys: C# D# F# G# A#

interface KeyDef {
  note: string
  octave: number
  semitone: number     // 0-11 within the octave
  isBlack: boolean
  x: number            // computed world x position
}

const OCTAVE_WHITE_NOTES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
const OCTAVE_SEMITONES   = [0,   2,   4,   5,   7,   9,   11]  // white key semitones

// Black key definitions: [semitone, whiteKeyLeftIndex, fractionalOffset]
// fractionalOffset: where between left white key and right white key the black key center sits
// Real piano offsets (derived from Steinway measurements):
const BLACK_KEY_DEFS: [number, number, number][] = [
  [1,  0, 0.55],   // C#  — between C(0) and D(1), slightly right of center
  [3,  1, 0.45],   // D#  — between D(1) and E(2), slightly left of center
  [6,  3, 0.52],   // F#  — between F(3) and G(4)
  [8,  4, 0.50],   // G#  — between G(4) and A(5), centered
  [10, 5, 0.48],   // A#  — between A(5) and B(6), slightly left
]

const SEMITONE_TO_NAME: Record<number, string> = {
  0: 'C', 1: 'C#', 2: 'D', 3: 'D#', 4: 'E',
  5: 'F', 6: 'F#', 7: 'G', 8: 'G#', 9: 'A',
  10: 'A#', 11: 'B',
}

/**
 * Generate all key definitions for the requested octave range.
 * startOctave=4, numOctaves=2 → C4 to B5 (24 notes)
 */
function generateKeys(startOctave: number, numOctaves: number): KeyDef[] {
  const keys: KeyDef[] = []

  for (let oct = 0; oct < numOctaves; oct++) {
    const octave = startOctave + oct
    const octaveBaseX = oct * OCTAVE_WHITE_NOTES.length * WHITE_KEY_PITCH

    // White keys
    for (let i = 0; i < OCTAVE_WHITE_NOTES.length; i++) {
      keys.push({
        note: OCTAVE_WHITE_NOTES[i],
        octave,
        semitone: OCTAVE_SEMITONES[i],
        isBlack: false,
        x: octaveBaseX + i * WHITE_KEY_PITCH,
      })
    }

    // Black keys
    for (const [semitone, leftWhiteIdx, frac] of BLACK_KEY_DEFS) {
      const leftX = octaveBaseX + leftWhiteIdx * WHITE_KEY_PITCH
      const rightX = octaveBaseX + (leftWhiteIdx + 1) * WHITE_KEY_PITCH
      keys.push({
        note: SEMITONE_TO_NAME[semitone],
        octave,
        semitone,
        isBlack: true,
        x: leftX + (rightX - leftX) * frac,
      })
    }
  }

  return keys
}

/* ── Materials (shared instances) ── */
const whiteKeyMaterial = new THREE.MeshStandardMaterial({
  color: '#e8e8e8',
  roughness: 0.35,
  metalness: 0.02,
})

const blackKeyMaterial = new THREE.MeshStandardMaterial({
  color: '#1a1a1a',
  roughness: 0.5,
  metalness: 0.05,
})

/* ── Geometries (shared instances) ── */
const whiteKeyGeometry = new THREE.BoxGeometry(
  WHITE_KEY_WIDTH,
  WHITE_KEY_HEIGHT,
  WHITE_KEY_DEPTH,
)

const blackKeyGeometry = new THREE.BoxGeometry(
  BLACK_KEY_WIDTH,
  BLACK_KEY_HEIGHT,
  BLACK_KEY_DEPTH,
)

/* ── Rounded edge helper: we bevel just the top edges via a subtle chamfer ── */
// For Phase 1 we use clean box geometry. Beveling can be added later via
// ExtrudeGeometry + RoundedRectShape if desired.

export default function PianoKeyboard() {
  const keys = useMemo(() => generateKeys(4, 2), [])

  // Center the keyboard at origin
  const totalWhiteKeys = 14 // 7 per octave × 2
  const totalWidth = (totalWhiteKeys - 1) * WHITE_KEY_PITCH
  const offsetX = -totalWidth / 2

  const whiteKeys: JSX.Element[] = []
  const blackKeys: JSX.Element[] = []

  for (const key of keys) {
    const id = `${key.note}${key.octave}`

    if (key.isBlack) {
      blackKeys.push(
        <mesh
          key={id}
          geometry={blackKeyGeometry}
          material={blackKeyMaterial}
          position={[
            key.x + offsetX,
            WHITE_KEY_HEIGHT / 2 + BLACK_KEY_HEIGHT / 2,
            -(WHITE_KEY_DEPTH - BLACK_KEY_DEPTH) / 2,
          ]}
          castShadow
        />
      )
    } else {
      whiteKeys.push(
        <mesh
          key={id}
          geometry={whiteKeyGeometry}
          material={whiteKeyMaterial}
          position={[
            key.x + offsetX,
            0,
            0,
          ]}
          castShadow
          receiveShadow
        />
      )
    }
  }

  return (
    <group>
      {/* Render white keys first, then black keys on top */}
      {whiteKeys}
      {blackKeys}

      {/* Subtle base platform beneath the keys */}
      <mesh
        position={[0, -WHITE_KEY_HEIGHT / 2 - 0.08, -0.2]}
        receiveShadow
      >
        <boxGeometry args={[totalWidth + 2.0, 0.15, WHITE_KEY_DEPTH + 1.0]} />
        <meshStandardMaterial color="#111113" roughness={0.8} metalness={0.1} />
      </mesh>
    </group>
  )
}
