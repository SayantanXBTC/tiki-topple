import { useEffect, useRef } from 'react'
import { WindWhispers as WindWhispersEngine } from '../animations/wind-whispers.js'

export function WindWhispers() {
  const canvasRef = useRef(null)
  const engineRef = useRef(null)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize wind whispers engine
    engineRef.current = new WindWhispersEngine(canvasRef.current, {
      idleLeafCount: 8,
      gustLeafCount: 15,
      respectReducedMotion: true,
    })

    // Cleanup
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 2, // Behind game UI (z-index 4+) but above static background
      }}
    />
  )
}
