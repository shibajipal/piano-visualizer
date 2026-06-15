import { useState, useCallback, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import PianoKeyboard from './components/PianoKeyboard'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import { midiPlayer, type MidiFileInfo } from './audio/MidiPlayer'

export default function App() {
  useKeyboardInput()

  const [midiInfo, setMidiInfo] = useState<MidiFileInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Wire up end-of-song callback
  midiPlayer.onComplete = useCallback(() => {
    setIsPlaying(false)
    setIsPaused(false)
  }, [])

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const info = midiPlayer.load(reader.result as ArrayBuffer, file.name)
      setMidiInfo(info)
      setIsPlaying(false)
      setIsPaused(false)
    }
    reader.readAsArrayBuffer(file)
  }, [])

  const handlePlayPause = useCallback(() => {
    if (!midiInfo) return
    if (isPlaying) {
      midiPlayer.pause()
      setIsPlaying(false)
      setIsPaused(true)
    } else {
      midiPlayer.play()
      setIsPlaying(true)
      setIsPaused(false)
    }
  }, [midiInfo, isPlaying])

  const handleStop = useCallback(() => {
    midiPlayer.stop()
    setIsPlaying(false)
    setIsPaused(false)
  }, [])

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-brand">
          <h1>Piano</h1>
          <span className="tag">v0.4</span>
        </div>

        {/* ── MIDI Controls ── */}
        <div className="midi-controls">
          <label className="midi-file-btn" htmlFor="midi-input">
            {midiInfo ? midiInfo.name : 'Load MIDI'}
          </label>
          <input
            ref={fileRef}
            id="midi-input"
            type="file"
            accept=".mid,.midi"
            onChange={handleFile}
            className="midi-file-input"
          />

          {midiInfo && (
            <>
              <span className="midi-meta">
                {midiInfo.noteCount.toLocaleString()} notes · {formatDuration(midiInfo.duration)}
              </span>
              <div className="midi-transport">
                <button
                  className="midi-btn"
                  onClick={handlePlayPause}
                  title={isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Play'}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>
                <button
                  className="midi-btn"
                  onClick={handleStop}
                  title="Stop"
                  disabled={!isPlaying && !isPaused}
                >
                  ■
                </button>
              </div>
            </>
          )}
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
        <span>Keys A–; → C4–E5 · Click any key · Scroll to zoom</span>
      </footer>
    </div>
  )
}
