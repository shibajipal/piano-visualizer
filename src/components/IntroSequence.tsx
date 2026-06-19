import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const START_FRAME = 1
const END_FRAME = 100
const FRAME_COUNT = END_FRAME - START_FRAME + 1

export default function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const spacerRef = useRef<HTMLDivElement>(null)
  const [loadedCount, setLoadedCount] = useState(0)
  const [hasScrolled, setHasScrolled] = useState(false)
  const [showSkip, setShowSkip] = useState(false)
  const imagesRef = useRef<HTMLImageElement[]>([])

  // Preload images
  useEffect(() => {
    let loaded = 0
    const images: HTMLImageElement[] = []

    for (let i = START_FRAME; i <= END_FRAME; i++) {
      const img = new Image()
      const padded = i.toString().padStart(3, '0')
      img.src = `/intro-final/${padded}.png`
      img.onload = () => {
        loaded++
        setLoadedCount(loaded)
        if (loaded === FRAME_COUNT && canvasRef.current) {
          // Draw the very first valid frame immediately
          drawFrame(0)
        }
      }
      images.push(img)
    }
    imagesRef.current = images
  }, [])

  // Show skip button after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowSkip(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  const drawFrame = (index: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imagesRef.current[index]
    if (!img || !img.complete) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)
  }

  // Setup GSAP ScrollTrigger
  useEffect(() => {
    if (loadedCount < FRAME_COUNT || !containerRef.current || !spacerRef.current) return

    const animationObj = { frame: 0 }

    const tween = gsap.to(animationObj, {
      frame: FRAME_COUNT - 1,
      snap: 'frame',
      ease: 'none',
      scrollTrigger: {
        scroller: containerRef.current,
        trigger: spacerRef.current,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.5,
        onUpdate: (self) => {
          if (self.progress > 0.01) {
            setHasScrolled(true)
          }
          if (self.progress >= 0.99) {
            setTimeout(() => {
              onComplete()
            }, 400)
          }
        }
      },
      onUpdate: () => {
        drawFrame(animationObj.frame)
      }
    })

    return () => {
      if (tween.scrollTrigger) tween.scrollTrigger.kill()
      tween.kill()
    }
  }, [loadedCount, onComplete])

  return (
    <div
      ref={containerRef}
      className="intro-scroll-container"
    >
      <div className="intro-spacer" ref={spacerRef} style={{ height: '300vh' }}>
        <div className="intro-sticky">
          <canvas
            ref={canvasRef}
            className="intro-canvas"
            style={{ width: '100%', height: '100%' }}
          />

          {loadedCount < FRAME_COUNT && (
            <div className="intro-loading">
              Loading sequence... {Math.round((loadedCount / FRAME_COUNT) * 100)}%
            </div>
          )}

          {loadedCount === FRAME_COUNT && !hasScrolled && (
            <div className="intro-prompt-wrapper">
              <div className="intro-prompt">
                Scroll to unveil
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: '2px' }}>
                  <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
                </svg>
              </div>
            </div>
          )}

        </div>
      </div>

      {showSkip && (
        <button className="intro-skip-btn" onClick={onComplete}>
          Skip
        </button>
      )}
    </div>
  )
}

