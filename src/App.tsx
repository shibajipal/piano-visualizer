import { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, SoftShadows } from '@react-three/drei'
import PianoKeyboard from './components/PianoKeyboard'
import WaterfallEngine from './components/WaterfallEngine'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import { midiPlayer, type MidiFileInfo } from './audio/MidiPlayer'
import { waterfallStore } from './store/waterfallStore'

export default function App() {
  useKeyboardInput()

  const [midiInfo, setMidiInfo] = useState<MidiFileInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(waterfallStore.speed)
  const [effectsOn, setEffectsOn] = useState(waterfallStore.effectsEnabled)
  const fileRef = useRef<HTMLInputElement>(null)

  // Wire up end-of-song callback
  useEffect(() => {
    midiPlayer.onComplete = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }
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

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = Number(e.target.value)
    setSpeed(v)
    waterfallStore.setSpeed(v)
  }

  const handleToggleFX = () => {
    const next = !effectsOn
    setEffectsOn(next)
    waterfallStore.setEffectsEnabled(next)
  }

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

        {/* ── Dashboard Controls ── */}
        <div className="header-center-stack">
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
          
          <div className="fx-controls">
            <label className="fx-label">
              Speed
              <input
                type="range"
                min="5" max="40"
                value={speed}
                onChange={handleSpeedChange}
                className="minimal-slider"
              />
            </label>
            <button
              className={`fx-toggle ${effectsOn ? 'active' : ''}`}
              onClick={handleToggleFX}
            >
              FX: {effectsOn ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="header-info">
          <span>A0 — C8</span>
          <span className="octave-badge">88 Keys</span>
        </div>
      </header>

      <main className="viewport">
        <Canvas
          shadows
          camera={{ position: [0, 20, 28], fov: 60 }}
          dpr={[1, 2]}
          gl={{ antialias: true, alpha: false, toneMapping: THREE.ACESFilmicToneMapping }}
          onCreated={({ gl }) => { gl.setClearColor('#0e0e10') }}
        >
          <SoftShadows size={25} samples={10} focus={0.5} />
          
          <ambientLight intensity={0.15} />
          <directionalLight
            position={[10, 25, 10]}
            intensity={1.2}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-left={-25}
            shadow-camera-right={25}
            shadow-camera-top={15}
            shadow-camera-bottom={-15}
            shadow-bias={-0.0001}
          />
          <pointLight position={[0, 15, -5]} intensity={0.8} color="#e4e4e7" distance={40} />
          
          <WaterfallEngine />
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
