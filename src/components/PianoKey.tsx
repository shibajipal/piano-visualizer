import { useRef, useCallback, useState } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { pianoStore } from '../store/pianoStore'
import { getKeyLabel } from '../constants/keyMap'

/* ── Geometry ── */
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
const pillStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '1px',
  background: '#09090b',
  border: '1px solid #27272a',
  borderRadius: '6px',
  padding: '5px 12px 4px',
  pointerEvents: 'none',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
}

const noteStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '13px',
  fontWeight: 600,
  color: '#fafafa',
  letterSpacing: '0.03em',
  lineHeight: 1.2,
}

const keyStyle: React.CSSProperties = {
  fontFamily: "'Inter', sans-serif",
  fontSize: '9px',
  fontWeight: 400,
  color: '#71717a',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  lineHeight: 1.2,
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

  const keyLabel = getKeyLabel(noteId)

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

  /* ── Animation ── */
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

  const tooltipY = isBlack ? BLACK_H + 0.6 : WHITE_H / 2 + 0.6

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

      {hovered && (
        <Html
          position={[0, tooltipY, 0]}
          center
          distanceFactor={12}
          zIndexRange={[100, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div style={pillStyle}>
            <span style={noteStyle}>{noteId}</span>
            {keyLabel && <span style={keyStyle}>key: {keyLabel}</span>}
          </div>
        </Html>
      )}
    </mesh>
  )
}
