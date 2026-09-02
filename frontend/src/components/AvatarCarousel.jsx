import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { AVATARS } from '../data/avatars'

// Utility for conditional class names
const cn = (...classes) => classes.filter(Boolean).join(' ')

export default function AvatarCarousel({ selectedId, onSelect }) {
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAutoRotating, setIsAutoRotating] = useState(true)
  const dragStartRef = useRef(0)
  const rotationRef = useRef(0)
  const animationFrameRef = useRef(null)
  const autoRotateTimeoutRef = useRef(null)

  const radius = 165
  const anglePerItem = 360 / AVATARS.length
  const autoRotateSpeed = 0.14

  // Auto-rotation when not interacting
  useEffect(() => {
    const autoRotate = () => {
      if (isAutoRotating && !isDragging) {
        setRotation(prev => prev + autoRotateSpeed)
      }
      animationFrameRef.current = requestAnimationFrame(autoRotate)
    }

    animationFrameRef.current = requestAnimationFrame(autoRotate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isAutoRotating, isDragging])

  // Handle mouse/touch drag
  const handleDragStart = (e) => {
    setIsDragging(true)
    setIsAutoRotating(false)
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    dragStartRef.current = clientX
    rotationRef.current = rotation

    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current)
    }
  }

  const handleDragMove = (e) => {
    if (!isDragging) return
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const delta = clientX - dragStartRef.current
    const rotationDelta = delta * 0.5 // Sensitivity
    setRotation(rotationRef.current + rotationDelta)
  }

  const handleDragEnd = () => {
    setIsDragging(false)
    
    // Resume auto-rotation after 2 seconds
    autoRotateTimeoutRef.current = setTimeout(() => {
      setIsAutoRotating(true)
    }, 2000)
  }

  // Snap to nearest avatar on click
  const handleAvatarClick = (avatar, index) => {
    onSelect(avatar.id)
    setIsAutoRotating(false)
    
    // Calculate target rotation to center this avatar
    const targetAngle = -index * anglePerItem
    const currentNormalized = rotation % 360
    const diff = targetAngle - currentNormalized
    
    // Find shortest rotation path
    let shortestDiff = diff
    if (Math.abs(diff) > 180) {
      shortestDiff = diff > 0 ? diff - 360 : diff + 360
    }
    
    setRotation(rotation + shortestDiff)

    // Resume auto-rotation after delay
    if (autoRotateTimeoutRef.current) {
      clearTimeout(autoRotateTimeoutRef.current)
    }
    autoRotateTimeoutRef.current = setTimeout(() => {
      setIsAutoRotating(true)
    }, 3000)
  }

  useEffect(() => {
    return () => {
      if (autoRotateTimeoutRef.current) {
        clearTimeout(autoRotateTimeoutRef.current)
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <div style={{
        fontSize: 10,
        letterSpacing: '0.14em',
        color: '#FFD700',
        fontFamily: '"Cinzel Decorative", cursive',
        marginBottom: 16,
        textAlign: 'center',
        textShadow: '0 2px 4px rgba(0,0,0,0.6)',
      }}>
        CHOOSE YOUR AVATAR
        {!selectedId && (
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{
              display: 'block',
              fontSize: 9,
              color: '#F5DEB3',
              fontStyle: 'italic',
              marginTop: 4,
            }}
          >
            (Drag or click to select)
          </motion.span>
        )}
      </div>

      {/* Center platform glow */}
      <div style={{
        position: 'absolute',
        bottom: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 120,
        height: 18,
        borderRadius: '50%',
        background: 'radial-gradient(ellipse, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.08) 60%, transparent 100%)',
        filter: 'blur(6px)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />

      {/* 3D Carousel Container */}
      <div
        onMouseDown={handleDragStart}
        onMouseMove={handleDragMove}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
        style={{
          position: 'relative',
          width: '100%',
          height: 252,
          perspective: '1100px',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        >
          {AVATARS.map((avatar, i) => {
            const itemAngle = i * anglePerItem
            const totalRotation = rotation % 360
            const relativeAngle = (itemAngle + totalRotation + 360) % 360
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle)

            const opacity = Math.max(0.28, 1 - (normalizedAngle / 175))
            const scale  = Math.max(0.72, 1 - (normalizedAngle / 355))
            const isSelected = selectedId === avatar.id
            const isFront = normalizedAngle < 32

            return (
              <div
                key={avatar.id}
                onClick={() => handleAvatarClick(avatar, i)}
                style={{
                  position: 'absolute',
                  width: 118,
                  height: 162,
                  left: '50%',
                  top: '50%',
                  marginLeft: -59,
                  marginTop: -81,
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  opacity,
                  transition: 'opacity 0.28s linear',
                  cursor: 'pointer',
                  pointerEvents: isFront ? 'auto' : 'none',
                }}
              >
                <motion.div
                  animate={{
                    scale: isSelected ? 1.16 : scale,
                    y: isSelected ? -12 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    overflow: 'visible',
                    position: 'relative',
                  }}
                >
                  {/* Card body — premium metallic gold frame */}
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 14,
                    overflow: 'hidden',
                    background: isSelected
                      ? 'linear-gradient(158deg, #E8C97A 0%, #C9A450 22%, #A87C30 52%, #8A6018 82%, #6A4808 100%)'
                      : 'linear-gradient(158deg, #B08848 0%, #90682A 28%, #70500A 58%, #503800 88%, #382400 100%)',
                    boxShadow: isSelected
                      ? '0 0 0 3px #FFD700, 0 0 30px rgba(255,215,0,0.75), 0 0 60px rgba(212,175,55,0.35), 0 18px 44px rgba(0,0,0,0.7), inset 0 3px 8px rgba(255,235,140,0.35), inset 0 -3px 8px rgba(0,0,0,0.35)'
                      : '0 0 0 1.5px rgba(160,120,40,0.5), 0 10px 26px rgba(0,0,0,0.55), inset 0 1px 3px rgba(255,220,100,0.14), inset 0 -3px 8px rgba(0,0,0,0.3)',
                    border: 'none',
                    position: 'relative',
                  }}>
                    {/* Corner filigree ornaments (selected only) */}
                    {isSelected && [
                      { pos: { top: 3, left: 3 },  b: { borderTop: '1.5px solid #FFD700', borderLeft: '1.5px solid #FFD700' } },
                      { pos: { top: 3, right: 3 }, b: { borderTop: '1.5px solid #FFD700', borderRight: '1.5px solid #FFD700' } },
                      { pos: { bottom: 3, left: 3 },  b: { borderBottom: '1.5px solid #FFD700', borderLeft: '1.5px solid #FFD700' } },
                      { pos: { bottom: 3, right: 3 }, b: { borderBottom: '1.5px solid #FFD700', borderRight: '1.5px solid #FFD700' } },
                    ].map((c, i) => (
                      <div key={i} style={{
                        position: 'absolute', width: 10, height: 10, opacity: 0.85, zIndex: 3,
                        ...c.pos, ...c.b,
                      }} />
                    ))}
                    {/* Grain texture overlay */}
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: 14, pointerEvents: 'none',
                      backgroundImage: 'repeating-linear-gradient(158deg, rgba(0,0,0,0.06) 0px, rgba(0,0,0,0.06) 1px, transparent 1px, transparent 3px)',
                    }} />
                    {/* Top shimmer line */}
                    <div style={{
                      position: 'absolute', top: 0, left: '15%', right: '15%',
                      height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,220,100,0.55), transparent)',
                      pointerEvents: 'none',
                    }} />

                    {/* Avatar SVG */}
                    <div
                      dangerouslySetInnerHTML={{ __html: avatar.svg }}
                      style={{
                        position: 'absolute',
                        top: 10, left: 9, right: 9,
                        height: 112,
                        overflow: 'hidden',
                        borderRadius: 9,
                        filter: isSelected ? 'none' : 'saturate(0.72) brightness(0.88)',
                        transition: 'filter 0.25s ease',
                      }}
                    />

                    {/* Name label */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      padding: '8px 6px 10px',
                      background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.72) 100%)',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        fontFamily: '"Cinzel Decorative", cursive',
                        fontSize: isSelected ? 11.5 : 9.5,
                        color: isSelected ? '#FFD700' : '#D2A94A',
                        letterSpacing: '0.08em',
                        fontWeight: 700,
                        textShadow: isSelected ? '0 0 10px rgba(255,215,0,0.7), 0 1px 3px rgba(0,0,0,0.9)' : '0 1px 3px rgba(0,0,0,0.9)',
                        transition: 'font-size 0.2s ease, color 0.2s ease',
                      }}>
                        {avatar.name}
                      </div>
                    </div>
                  </div>

                  {/* Selection outer glow ring */}
                  {isSelected && (
                    <motion.div
                      animate={{ opacity: [0.55, 1, 0.55] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                      style={{
                        position: 'absolute',
                        inset: -5, borderRadius: 17,
                        border: '2px solid rgba(255,215,0,0.9)',
                        boxShadow: '0 0 18px rgba(255,215,0,0.7), 0 0 36px rgba(212,175,55,0.35)',
                        pointerEvents: 'none',
                      }}
                    />
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Instruction hint */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        style={{
          marginTop: 12,
          textAlign: 'center',
          fontSize: 9,
          color: '#D2B48C',
          fontStyle: 'italic',
          textShadow: '0 1px 2px rgba(0,0,0,0.6)',
        }}
      >
        {isDragging ? 'Release to select' : 'Drag to rotate • Click to select'}
      </motion.div>
    </div>
  )
}
