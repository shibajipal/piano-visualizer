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
  { name: 'Billy Joel - Piano Man', path: '/midi/Billy Joel - Piano Man.mid' },
  { name: 'Eminem - The Real Slim Shady', path: '/midi/Eminem - The Real Slim Shady.mid' },
  { name: 'Imagine Dragons - Radioactive', path: '/midi/Imagine dragons - Radioactive.mid' },
  { name: 'Never Gonna Give You Up', path: '/midi/Never-Gonna-Give-You-Up-3.mid' },
  { name: 'Pokemon Center Theme', path: '/midi/Pokemon - Pokemon Center Theme.mid' },
  { name: 'Kanye West - Runaway (Westworld)', path: '/midi/Runaway - Kanye West (Westworld).mid.mid' },
  { name: 'Boney M - Rasputin', path: '/midi/BONEY M.Rasputin K.mid' },
  { name: 'Jingle Bells', path: '/midi/Jingle-Bells.mid' },
  { name: 'My Heart Will Go On (Titanic)', path: "/midi/My-Heart-Will-Go-On-(From-'Titanic').mid" },
  { name: 'Queen - Bohemian Rhapsody', path: '/midi/Queen - Bohemian Rhapsody.mid' },
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
  const [showSettings, setShowSettings] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const selectRef = useRef<HTMLSelectElement>(null)

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
    midiPlayer.clear()
    waterfallStore.clearAll()
    setMidiInfo(null)
    setIsPlaying(false)
    setIsPaused(false)
    // Clear out the file input so you can re-upload the same file if needed
    if (fileRef.current) fileRef.current.value = ''
    if (selectRef.current) selectRef.current.value = ''
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
          <div className="header-title-stack">
            <h1>Piano</h1>
            <h1>Visualizer</h1>
          </div>
          <span className="tag">v1.2</span>
        </div>

        {/* Dashboard Controls */}
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
            
            <select ref={selectRef} className="midi-preset-select" onChange={loadPreset} defaultValue="">
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
                    {isPlaying ? (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                        <rect x="6" y="4" width="4" height="16" />
                        <rect x="14" y="4" width="4" height="16" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor" style={{ marginLeft: '2px' }}>
                        <polygon points="7,4 21,12 7,20" />
                      </svg>
                    )}
                  </button>
                  <button
                    className="midi-btn"
                    onClick={handleStop}
                    title="Stop"
                    disabled={!isPlaying && !isPaused}
                  >
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
                      <rect x="5" y="5" width="14" height="14" />
                    </svg>
                  </button>
                  <button
                    className="midi-btn"
                    onClick={handleClearMidi}
                    title="Clear/Eject MIDI"
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                      <polygon points="12,4 4,14 20,14" />
                      <rect x="4" y="16" width="16" height="4" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div className={`fx-controls ${showSettings ? 'show-mobile' : ''}`}>
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
          <a href="https://github.com/shibajipal/piano-visualizer" target="_blank" rel="noopener noreferrer" className="github-link" title="View Source on GitHub">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
          </a>
          <span>A0 — C8</span>
          <span className="octave-badge">88 Keys</span>
          <button className="settings-btn mobile-only" onClick={() => setShowSettings(!showSettings)}>Menu</button>
          <button className="help-btn" onClick={() => setShowHelp(true)}>?</button>
        </div>
      </header>

      {showHelp && (
        <div className="help-modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="help-modal-content" onClick={e => e.stopPropagation()}>
            <h3>Keyboard Controls</h3>
            <p>You can play the piano using your computer keyboard!</p>
            <div className="help-grid">
              <div className="help-key">A ... M</div><div className="help-desc">Play middle octave (C4 - E5)</div>
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
            minPolarAngle={0}
            maxPolarAngle={Math.PI * 3 / 5}
            minDistance={12}
            maxDistance={120}
            autoRotate={autoRotate}
            autoRotateSpeed={0.5}
          />
        </Canvas>
      </main>

      <footer className="footer">
        <span>Keys A–M → C4–E5 · Click any key · Scroll to zoom</span>
      </footer>
    </div>
  )
}
