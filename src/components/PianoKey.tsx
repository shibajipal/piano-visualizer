/**
 * Single 3D piano key with:
 *  - Pointer interaction (click, drag-to-play)
 *  - Imperative press/release animation via useFrame
 *  - Hover tooltip via @react-three/drei Html
 */

import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { pianoStore } from '../store/pianoStore'

/* ── Geometry constants ── */
const WHITE_W = 1.0, WHITE_H = 0.9, WHITE_D = 6.0
const BLACK_W = 0.55, BLACK_H = 0.6, BLACK_D = 3.8
const PRESS_DEPTH = 0.12

const whiteGeo = new THREE.BoxGeometry(WHITE_W, WHITE_H, WHITE_D)
const blackGeo = new THREE.BoxGeometry(BLACK_W, BLACK_H, BLACK_D)

/* ── Color targets ── */
const WHITE_REST  = new THREE.Color('#e8e8e8')
const WHITE_PRESS = new THREE.Color('#c8c8cc')
const BLACK_REST  = new THREE.Color('#1a1a1a')
const BLACK_PRESS = new THREE.Color('#2e2e34')
const EMISSIVE_ON = new THREE.Color('#444450')
const EMISSIVE_OFF = new THREE.Color('#000000')

/* ── Tooltip styles ── */
const tooltipStyle: React.CSSProperties = {
  background: 'rgba(24, 24, 27, 0.92)',
  color: '#e4e4e7',
  fontSize: '11px',
  fontFamily: "'Inter', sans-serif",
  fontWeight: 500,
  letterSpacing: '0.04em',
  padding: '3px 10px',
  borderRadius: '20px',
  border: '1px solid rgba(63, 63, 70, 0.6)',
  pointerEvents: 'none' as const,
  userSelect: 'none' as const,
  whiteSpace: 'nowrap' as const,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
}

interface PianoKeyProps {
  noteId: string
  isBlack: boolean
  position: [number, number, number]
}

export default function PianoKey({ noteId, isBlack, position }: PianoKeyProps) {
  const meshRef = useRef<THREE.Mesh>(null!)
  const matRef  = useRef<THREE.MeshStandardMaterial>(null!)
  const pointerHeld = useRef(false)
  const [hovered, setHovered] = useState(false)

  /* ── Pointer handlers ── */
  const onPointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    pointerHeld.current = true
    pianoStore.noteOn(noteId, 'pointer')
    ;(e.nativeEvent.target as HTMLElement)?.setPointerCapture?.(e.nativeEvent.pointerId)
  }, [noteId])

  const onPointerUp = useCallback((e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    pointerHeld.current = false
    pianoStore.noteOff(noteId, 'pointer')
  }, [noteId])

  const onPointerEnter = useCallback((e: ThreeEvent<PointerEvent>) => {
    setHovered(true)
    if (e.buttons === 1) {
      pointerHeld.current = true
      pianoStore.noteOn(noteId, 'pointer')
    }
  }, [noteId])

  const onPointerLeave = useCallback(() => {
    setHovered(false)
    if (pointerHeld.current) {
      pointerHeld.current = false
      pianoStore.noteOff(noteId, 'pointer')
    }
  }, [noteId])

  /* ── Per-frame animation ── */
  const restColor  = isBlack ? BLACK_REST : WHITE_REST
  const pressColor = isBlack ? BLACK_PRESS : WHITE_PRESS
  const _c = useRef(new THREE.Color())

  useFrame((_, delta) => {
    const mesh = meshRef.current
    const mat  = matRef.current
    if (!mesh || !mat) return

    const active = pianoStore.isActive(noteId)
    const speed  = active ? 22 : 14
    const t      = 1 - Math.exp(-speed * delta)

    const targetY = active ? position[1] - PRESS_DEPTH : position[1]
    mesh.position.y += (targetY - mesh.position.y) * t

    _c.current.copy(active ? pressColor : restColor)
    mat.color.lerp(_c.current, t)

    _c.current.copy(active ? EMISSIVE_ON : EMISSIVE_OFF)
    mat.emissive.lerp(_c.current, t)
  })

  // Tooltip Y offset: above the key surface
  const tooltipY = isBlack
    ? BLACK_H + 0.6
    : WHITE_H / 2 + 0.6

  return (
    <mesh
      ref={meshRef}
      geometry={isBlack ? blackGeo : whiteGeo}
      position={position}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      castShadow
      receiveShadow={!isBlack}
    >
      <meshStandardMaterial
        ref={matRef}
        color={isBlack ? '#1a1a1a' : '#e8e8e8'}
        roughness={isBlack ? 0.5 : 0.35}
        metalness={isBlack ? 0.05 : 0.02}
      />

      {/* Hover tooltip */}
      {hovered && (
        <Html
          position={[0, tooltipY, 0]}
          center
          distanceFactor={12}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div style={tooltipStyle}>{noteId}</div>
        </Html>
      )}
    </mesh>
  )
}
