import { useMemo } from 'react'
import * as THREE from 'three'
import { Edges } from '@react-three/drei'

// Materials for the sketch aesthetic
const whiteMat = new THREE.MeshBasicMaterial({ color: '#f4f0e6', toneMapped: false })
const blackMat = new THREE.MeshBasicMaterial({ color: '#111111', toneMapped: false })
const edgeColor = "#111111"

export default function GrandPianoBody() {
  // Create a curved shape for the grand piano rim
  const rimShape = useMemo(() => {
    const shape = new THREE.Shape()
    const width = 56 // Wraps the 54-unit 88-key layout
    const depth = 45 // How deep the grand piano goes
    
    // Start at bottom left (player's left)
    shape.moveTo(-width / 2 - 1, 2)
    // Go up to the back left corner
    shape.lineTo(-width / 2 - 1, -10)
    // Curve to the back point
    shape.bezierCurveTo(-width / 2, -depth, width / 4, -depth, width / 2 - 2, -15)
    // Curve to the front right
    shape.bezierCurveTo(width / 2, -10, width / 2 + 1, -5, width / 2 + 1, 2)
    // Close the shape (front edge)
    shape.lineTo(-width / 2 - 1, 2)
    return shape
  }, [])

  const extrudeSettings = {
    depth: 4,
    bevelEnabled: false
  }

  return (
    <group position={[0, -0.5, 0]}>
      {/* Main Body (Rim and soundboard area) */}
      <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[rimShape, extrudeSettings]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>

      {/* Left Cheek Block */}
      <mesh position={[-27.5, 1, 0]}>
        <boxGeometry args={[2, 2, 7]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>

      {/* Right Cheek Block */}
      <mesh position={[27.5, 1, 0]}>
        <boxGeometry args={[2, 2, 7]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>

      {/* Angled Fallboard */}
      <mesh position={[0, 2.5, -3.5]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[57, 4.5, 0.5]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>
      
      {/* Music Stand Ledge */}
      <mesh position={[0, 3.5, -4.5]} rotation={[-0.1, 0, 0]}>
        <boxGeometry args={[28, 0.4, 2]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>

      {/* Music Stand Backing */}
      <mesh position={[0, 6, -5]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[26, 6, 0.2]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>

      {/* Legs (with subtle taper by using cylinder or just nice boxes) */}
      <mesh position={[-26.5, -11, 0]}>
        <boxGeometry args={[2, 14, 2]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>
      <mesh position={[26.5, -11, 0]}>
        <boxGeometry args={[2, 14, 2]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>
      <mesh position={[8, -11, -28]}>
        <boxGeometry args={[2, 14, 2]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>
      
      {/* Lyre Box (Pedals holder) */}
      <group position={[0, -7, -3]}>
        {/* Main pillars */}
        <mesh position={[-1.5, 0, 0]}>
          <boxGeometry args={[0.8, 10, 0.8]} />
          <primitive object={whiteMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        <mesh position={[1.5, 0, 0]}>
          <boxGeometry args={[0.8, 10, 0.8]} />
          <primitive object={whiteMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        {/* Pedal Box */}
        <mesh position={[0, -4.5, 0.5]}>
          <boxGeometry args={[5, 1.5, 2]} />
          <primitive object={whiteMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        {/* Pedals (Brass/Dark) */}
        <mesh position={[-1.2, -4.5, 1.8]}>
          <boxGeometry args={[0.4, 0.2, 1.5]} />
          <primitive object={blackMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        <mesh position={[0, -4.5, 1.8]}>
          <boxGeometry args={[0.4, 0.2, 1.5]} />
          <primitive object={blackMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        <mesh position={[1.2, -4.5, 1.8]}>
          <boxGeometry args={[0.4, 0.2, 1.5]} />
          <primitive object={blackMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
      </group>
      
      {/* Internal Details (Strings & Iron Plate Struts) */}
      <group position={[0, -2, -15]}>
        {/* Soundboard grid/strings layer */}
        {/* <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0.2]}>
          <planeGeometry args={[40, 30, 20, 15]} />
          <meshBasicMaterial color="#111111" wireframe={true} toneMapped={false} />
        </mesh> */}
        
        {/* Iron Struts (Thick structural bars) */}
        <mesh position={[-10, 0.5, -0.5]} rotation={[0, 0.3, 0]}>
          <boxGeometry args={[2, 1.5, 30]} />
          <primitive object={whiteMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        <mesh position={[10, 0.5, 2.5]} rotation={[0, -0.4, 0]}>
          <boxGeometry args={[2, 1.5, 25]} />
          <primitive object={whiteMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
        <mesh position={[0, 0.5, 5]} rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[2, 1.5, 35]} />
          <primitive object={whiteMat} attach="material" />
          <Edges color={edgeColor} threshold={15} />
        </mesh>
      </group>

      {/* Folded back flat lid (exposing the interior) */}
      <mesh position={[0, 3.6, -16]} rotation={[Math.PI / 2, 0, 0]}>
        <extrudeGeometry args={[rimShape, { depth: 0.5, bevelEnabled: false }]} />
        <primitive object={whiteMat} attach="material" />
        <Edges color={edgeColor} threshold={15} />
      </mesh>
    </group>
  )
}
