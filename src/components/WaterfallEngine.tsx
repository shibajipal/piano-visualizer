import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import * as Tone from 'tone'
import { midiPlayer } from '../audio/MidiPlayer'
import { waterfallStore, type ManualNote, type ImpactParticle } from '../store/waterfallStore'
import { buildLayout, WHITE_KEY_HEIGHT, WHITE_KEY_DEPTH, BLACK_KEY_DEPTH } from '../utils/keyboardLayout'

const BLOCK_DEPTH = 0.8 // Z-thickness of falling blocks
const PARTICLE_LIFETIME = 0.4 // seconds

// Shared geometry & materials for all blocks
const blockGeo = new THREE.BoxGeometry(1, 1, 1)
const edgesGeo = new THREE.EdgesGeometry(blockGeo, 15)

// The solid black material gets pushed slightly back into the depth buffer so the white lines render cleanly on top
const solidMat = new THREE.MeshBasicMaterial({ 
  color: '#111111', 
  toneMapped: false,
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1
})

const edgeMat = new THREE.LineBasicMaterial({ 
  color: '#333333', 
  toneMapped: false 
})

export default function WaterfallEngine({ speed }: { speed: number }) {
  const groupRef = useRef<THREE.Group>(null!)
  
  // Track active state to trigger re-renders when manual notes / particles change
  // We use a fast polling ref approach for position updates to avoid React overhead,
  // but we still need React to map the DOM nodes for manual notes and particles.
  const [manualNotes, setManualNotes] = useState<ManualNote[]>([])
  const [particles, setParticles] = useState<ImpactParticle[]>([])

  const { keys } = useMemo(() => buildLayout(), [])
  
  // Map noteId -> X position and color
  const keyMap = useMemo(() => {
    const map = new Map<string, { x: number, isBlack: boolean, z: number }>()
    for (const k of keys) {
      map.set(k.noteId, {
        x: k.position[0],
        isBlack: k.isBlack,
        z: k.isBlack ? -(WHITE_KEY_DEPTH - BLACK_KEY_DEPTH) / 2 : 0
      })
    }
    return map
  }, [keys])

  // ── MIDI InstancedMesh Setup ──
  // We build this once when a MIDI file is loaded.
  // The entire mesh just translates down on the Y axis during playback!
  const midiNotes = (midiPlayer as any).notes as {time: number, duration: number, note: string}[]
  const hasMidi = midiPlayer.loaded && midiNotes && midiNotes.length > 0

  useEffect(() => {
    if (!hasMidi || !groupRef.current) return
    const group = groupRef.current

    midiNotes.forEach((note) => {
      const info = keyMap.get(note.note)
      if (!info) return

      const length = Math.max(note.duration * speed, 0.1)
      const yCenter = note.time * speed + length / 2
      const baseWidth = info.isBlack ? 0.51 : 0.93
      
      const mesh = new THREE.Mesh(blockGeo, solidMat)
      mesh.position.set(info.x, yCenter, info.z - BLOCK_DEPTH / 2 - 0.5)
      mesh.scale.set(baseWidth, length, BLOCK_DEPTH)
      
      // Attach authentic edge lines
      const edges = new THREE.LineSegments(edgesGeo, edgeMat)
      mesh.add(edges)
      
      group.add(mesh)
    })

    return () => {
      // Cleanup native meshes
      while (group.children.length > 0) {
        group.remove(group.children[0])
      }
    }
  }, [hasMidi, midiNotes, keyMap, speed])

  // ── Animation Loop ──
  useFrame(() => {
    const now = Tone.now()
    waterfallStore.cleanup(now)
    
    // Sync React state (throttled/batched by fiber)
    setManualNotes([...waterfallStore.manualNotes])
    setParticles([...waterfallStore.particles])

    // Move MIDI group
    if (groupRef.current && midiPlayer.playing) {
      groupRef.current.position.y = -Tone.getTransport().seconds * waterfallStore.speed
    }
  })

  // ── Render ──
  if (!waterfallStore.effectsEnabled) return null

  const now = Tone.now()

  return (
    <group>
      {/* MIDI Waterfall */}
      <group ref={groupRef} />

      {/* Manual Waterfall */}
      {manualNotes.map(note => {
        const info = keyMap.get(note.noteId)
        if (!info) return null

        // Calculate dynamic dimensions
        const bottomY = (note.startTime - now) * waterfallStore.speed
        const topY = ((note.endTime ?? now) - now) * waterfallStore.speed
        const length = Math.max(topY - bottomY, 0.1)
        const yCenter = (topY + bottomY) / 2

        const baseWidth = info.isBlack ? 0.51 : 0.93

        return (
          <mesh
            key={note.id}
            position={[info.x, yCenter + WHITE_KEY_HEIGHT/2, info.z - BLOCK_DEPTH / 2 - 0.5]}
            scale={[baseWidth, length, BLOCK_DEPTH]}
            geometry={blockGeo}
            material={solidMat}
          >
            <lineSegments geometry={edgesGeo} material={edgeMat} />
          </mesh>
        )
      })}

      {/* Particle Impacts */}
      {particles.map(p => {
        const info = keyMap.get(p.noteId)
        if (!info) return null
        
        const age = now - p.startTime
        const progress = Math.min(age / PARTICLE_LIFETIME, 1)
        const scale = 1 + progress * 2
        const opacity = 1 - Math.pow(progress, 1.5)

        return (
          <mesh
            key={p.id}
            position={[info.x, WHITE_KEY_HEIGHT/2 + 0.1, info.z]}
            rotation={[-Math.PI / 2, 0, 0]}
            scale={[scale, scale, scale]}
          >
            <ringGeometry args={[0.3, 0.4, 32]} />
            <meshBasicMaterial
              color="#111111"
              transparent
              opacity={opacity * 0.8}
              depthWrite={false}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}
