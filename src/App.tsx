import { useState, useCallback, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as Tone from 'tone'
import PianoKeyboard from './components/PianoKeyboard'
import WaterfallEngine from './components/WaterfallEngine'
import GrandPianoBody from './components/GrandPianoBody'
import IntroSequence from './components/IntroSequence'
import { useKeyboardInput } from './hooks/useKeyboardInput'
import { midiPlayer, type MidiFileInfo } from './audio/MidiPlayer'
import { waterfallStore } from './store/waterfallStore'
import { pianoStore } from './store/pianoStore'

const PRESET_MIDIS = [
  { name: 'Eminem - The Real Slim Shady', path: '/midi/Eminem - The Real Slim Shady.mid' },
  { name: 'Imagine Dragons - Radioactive', path: '/midi/Imagine dragons - Radioactive.mid' },
  { name: 'Never Gonna Give You Up', path: '/midi/Never-Gonna-Give-You-Up-3.mid' },
  { name: 'Pokemon Center Theme', path: '/midi/Pokemon - Pokemon Center Theme.mid' },
]

export default function App() {
  useKeyboardInput()

  const [introComplete, setIntroComplete] = useState(false)
  const [midiInfo, setMidiInfo] = useState<MidiFileInfo | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [speed, setSpeed] = useState(waterfallStore.speed)
  const [effectsOn, setEffectsOn] = useState(waterfallStore.effectsEnabled)
  const [keysLocked, setKeysLocked] = useState(false)
  const [autoRotate, setAutoRotate] = useState(true)
  const [manualSpin, setManualSpin] = useState(true)
  const [showHelp, setShowHelp] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Wire up end-of-song callback
  useEffect(() => {
    midiPlayer.onComplete = () => {
      setIsPlaying(false)
      setIsPaused(false)
    }
  }, [])

  const handleIntroComplete = useCallback(() => {
    setIntroComplete(true)
    
    // Play a quick ascending arpeggio to welcome the user
    const startAudio = async () => {
      await Tone.start()
      const now = Tone.now()
      const notes = ['C3', 'E3', 'G3', 'C4', 'E4', 'G4', 'C5']
      notes.forEach((note, i) => {
        const time = now + 0.1 * i
        Tone.getDraw().schedule(() => pianoStore.noteOn(note, 'midi'), time)
        Tone.getDraw().schedule(() => pianoStore.noteOff(note, 'midi'), time + 0.2)
      })
    }
    void startAudio()
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

  const loadPreset = useCallback(async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const path = e.target.value
    if (!path) return
    const name = e.target.options[e.target.selectedIndex].text

    try {
      const res = await fetch(path)
      const buffer = await res.arrayBuffer()
      const info = midiPlayer.load(buffer, name)
      setMidiInfo(info)
      setIsPlaying(false)
      setIsPaused(false)
    } catch (err) {
      console.error("Failed to load preset MIDI:", err)
    }
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

  const handleClearMidi = useCallback(() => {
    midiPlayer.stop()
    setMidiInfo(null)
    setIsPlaying(false)
    setIsPaused(false)
    // Clear out the file input so you can re-upload the same file if needed
    if (fileRef.current) fileRef.current.value = ''
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

  const handleToggleLock = () => {
    const next = !keysLocked
    setKeysLocked(next)
    pianoStore.pointerLocked = next
  }

  const handleToggleRotate = () => {
    setAutoRotate(!autoRotate)
  }

  const handleToggleManualSpin = () => {
    setManualSpin(!manualSpin)
  }

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  if (!introComplete) {
    return <IntroSequence onComplete={handleIntroComplete} />
  }

  return (
    <div className="app-shell fadeIn">
      <header className="header">
        <div className="header-brand">
          <h1>Piano</h1>
          <span className="tag">v0.4</span>
        </div>

        {/* ── Dashboard Controls ── */}
        <div className="header-center-stack">
          <div className="midi-controls">
            {midiInfo ? (
              <div className="midi-title-marquee">
                <div className="marquee-content">{midiInfo.name}</div>
              </div>
            ) : (
              <label className="midi-file-btn" htmlFor="midi-input">
                Upload MIDI
              </label>
            )}
            
            <select className="midi-preset-select" onChange={loadPreset} defaultValue="">
              <option value="" disabled>Library</option>
              {PRESET_MIDIS.map(p => (
                <option key={p.path} value={p.path}>{p.name}</option>
              ))}
            </select>

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
                  <button
                    className="midi-btn"
                    onClick={handleClearMidi}
                    title="Clear/Eject MIDI"
                  >
                    ⏏
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
            <button
              className={`fx-toggle ${keysLocked ? 'active' : ''}`}
              onClick={handleToggleLock}
              title="Lock keys to prevent accidental clicks while dragging"
            >
              LOCK: {keysLocked ? 'ON' : 'OFF'}
            </button>
            <button
              className={`fx-toggle ${autoRotate ? 'active' : ''}`}
              onClick={handleToggleRotate}
              title="Toggle automatic rotation"
            >
              SPIN: {autoRotate ? 'ON' : 'OFF'}
            </button>
            <button
              className={`fx-toggle ${manualSpin ? 'active' : ''}`}
              onClick={handleToggleManualSpin}
              title="Lock ability to manually drag/spin the camera"
            >
              DRAG: {manualSpin ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="header-info">
          <span>A0 — C8</span>
          <span className="octave-badge">88 Keys</span>
          <button className="help-btn" onClick={() => setShowHelp(true)}>?</button>
        </div>
      </header>

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Keyboard Controls</h3>
            <p>You can play the piano using your computer keyboard!</p>
            <div className="help-grid">
              <div className="help-key">A ... ;</div><div className="help-desc">Play middle octave (C4 - E5)</div>
              <div className="help-key">W E T Y U O P</div><div className="help-desc">Play black keys</div>
              <div className="help-key">SHIFT + Key</div><div className="help-desc">Play 1 octave HIGHER</div>
              <div className="help-key">ALT + Key</div><div className="help-desc">Play 1 octave LOWER</div>
            </div>
            <button className="help-close-btn" onClick={() => setShowHelp(false)}>Got it</button>
          </div>
        </div>
      )}

      <main className="viewport canvas-blend">

        <Canvas
          camera={{ position: [0, 20, 28], fov: 60 }}
          dpr={[1, 2]}
          gl={{ antialias: true, toneMapping: THREE.NoToneMapping }}
        >
          <color attach="background" args={['#f4f0e6']} />
          <WaterfallEngine speed={speed} />
          <GrandPianoBody />
          <PianoKeyboard />
          
          <OrbitControls
            enablePan={false}
            enableRotate={manualSpin}
            minPolarAngle={Math.PI / 8}
            maxPolarAngle={Math.PI / 2.5}
            minDistance={12}
            maxDistance={120}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </main>

      <footer className="footer">
        <span>Keys A–; → C4–E5 · Click any key · Scroll to zoom</span>
      </footer>
    </div>
  )
}
