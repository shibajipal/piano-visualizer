import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import PianoKeyboard from './components/PianoKeyboard'

export default function App() {
  return (
    <div className="app-shell">
      {/* ── Header ── */}
      <header className="header">
        <div className="header-brand">
          <h1>Piano</h1>
          <span className="tag">v0.1</span>
        </div>
        <div className="header-info">
          <span>C4 — B5</span>
          <span className="octave-badge">2 Octaves</span>
        </div>
      </header>

      {/* ── 3D Viewport ── */}
      <main className="viewport">
        <Canvas
          camera={{ position: [0, 5, 7], fov: 50 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor('#0e0e10')
          }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 8, 5]} intensity={0.8} />
          <directionalLight position={[-3, 6, -2]} intensity={0.3} />
          <PianoKeyboard />
          <OrbitControls
            enablePan={false}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={5}
            maxDistance={14}
          />
        </Canvas>
      </main>

      {/* ── Footer ── */}
      <footer className="footer">
        <span>Phase 1 — Visual Layout</span>
      </footer>
    </div>
  )
}
