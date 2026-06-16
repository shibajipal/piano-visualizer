import { useEffect, useRef, useState } from 'react'

const FRAME_COUNT = 50

export default function IntroSequence({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(0)
  const imagesRef = useRef<HTMLImageElement[]>([])
  
  // Preload images
  useEffect(() => {
    let loadedCount = 0
    const images: HTMLImageElement[] = []
    
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image()
      const padded = i.toString().padStart(2, '0')
      img.src = `/intro/${padded}.png`
      img.onload = () => {
        loadedCount++
        setLoaded(loadedCount)
        if (loadedCount === FRAME_COUNT && canvasRef.current) {
          drawFrame(1)
        }
      }
      images.push(img)
    }
    imagesRef.current = images
  }, [])

  const drawFrame = (frame: number) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const img = imagesRef.current[frame - 1]
    if (!img || !img.complete) return
    
    // Fit to canvas
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    
    // Cover calculation (object-fit: cover equivalent for canvas)
    const hRatio = canvas.width / img.width
    const vRatio = canvas.height / img.height
    const ratio  = Math.max(hRatio, vRatio)
    const centerShift_x = (canvas.width - img.width*ratio) / 2
    const centerShift_y = (canvas.height - img.height*ratio) / 2  
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, img.width, img.height,
                       centerShift_x, centerShift_y, img.width*ratio, img.height*ratio)
  }

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const scrollTop = target.scrollTop
    const maxScroll = target.scrollHeight - target.clientHeight
    
    if (maxScroll <= 0) return
    
    const scrollFraction = scrollTop / maxScroll
    
    const frameIndex = Math.min(
      FRAME_COUNT,
      Math.max(1, Math.ceil(scrollFraction * FRAME_COUNT))
    )
    
    requestAnimationFrame(() => drawFrame(frameIndex))
    
    // If we reach the very bottom, complete the sequence
    if (scrollFraction >= 0.99) {
      // Add a tiny delay to let the user see the final frame
      setTimeout(() => {
        onComplete()
      }, 400)
    }
  }

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Redraw current frame on resize
      if (containerRef.current) {
        const scrollTop = containerRef.current.scrollTop
        const maxScroll = containerRef.current.scrollHeight - containerRef.current.clientHeight
        const fraction = maxScroll > 0 ? scrollTop / maxScroll : 0
        const frameIndex = Math.max(1, Math.min(FRAME_COUNT, Math.ceil(fraction * FRAME_COUNT)))
        drawFrame(frameIndex)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div 
      ref={containerRef}
      className="intro-scroll-container" 
      onScroll={handleScroll}
    >
      <div className="intro-spacer" style={{ height: '500vh' }}>
        <div className="intro-sticky">
          <canvas ref={canvasRef} className="intro-canvas" />
          
          {loaded < FRAME_COUNT && (
            <div className="intro-loading">
              Loading sequence... {Math.round((loaded/FRAME_COUNT)*100)}%
            </div>
          )}
          
          {loaded === FRAME_COUNT && (
            <div className="intro-prompt">
              <span className="mouse-icon"></span>
              Scroll to unveil
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
