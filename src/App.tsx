import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import PianoKeyboard from './components/PianoKeyboard'
import { useKeyboardInput } from './hooks/useKeyboardInput'

export default function App() {
  useKeyboardInput()

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-brand">
          <h1>Piano</h1>
          <span className="tag">v0.3</span>
        </div>
        <div className="header-info">
          <span>A0 — C8</span>
          <span className="octave-badge">88 Keys</span>
        </div>
      </header>

      <main className="viewport">
        <Canvas
          camera={{ position: [0, 14, 32], fov: 58 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => { gl.setClearColor('#0e0e10') }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[8, 12, 8]} intensity={0.8} />
          <directionalLight position={[-6, 10, -4]} intensity={0.3} />
          <PianoKeyboard />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={12}
            maxDistance={50}
          />
        </Canvas>
      </main>

      <footer className="footer">
        <span>Keys A–; → C4–E5 · Mouse click any key · Scroll to zoom</span>
      </footer>
    </div>
  )
}
