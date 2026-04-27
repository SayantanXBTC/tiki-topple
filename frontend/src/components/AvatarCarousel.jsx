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

  const radius = 280 // Distance from center
  const anglePerItem = 360 / AVATARS.length
  const autoRotateSpeed = 0.15 // Degrees per frame

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
          height: 240,
          perspective: '1200px',
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
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {AVATARS.map((avatar, i) => {
            const itemAngle = i * anglePerItem
            const totalRotation = rotation % 360
            const relativeAngle = (itemAngle + totalRotation + 360) % 360
            const normalizedAngle = Math.abs(relativeAngle > 180 ? 360 - relativeAngle : relativeAngle)
            
            // Calculate opacity and scale based on position
            const opacity = Math.max(0.3, 1 - (normalizedAngle / 180))
            const scale = Math.max(0.7, 1 - (normalizedAngle / 360))
            const isSelected = selectedId === avatar.id
            const isFront = normalizedAngle < 30

            return (
              <div
                key={avatar.id}
                onClick={() => handleAvatarClick(avatar, i)}
                style={{
                  position: 'absolute',
                  width: 110,
                  height: 150,
                  left: '50%',
                  top: '50%',
                  marginLeft: -55,
                  marginTop: -75,
                  transform: `rotateY(${itemAngle}deg) translateZ(${radius}px)`,
                  opacity: opacity,
                  transition: 'opacity 0.3s linear',
                  cursor: 'pointer',
                  pointerEvents: isFront ? 'auto' : 'none',
                }}
              >
                <motion.div
                  animate={{
                    scale: isSelected ? 1.15 : scale,
                    y: isSelected ? -10 : 0,
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: 12,
                    overflow: 'hidden',
                    background: `
                      linear-gradient(145deg, 
                        ${isSelected ? '#D4A574' : '#A67C52'} 0%, 
                        ${isSelected ? '#C19A6B' : '#8B6F47'} 50%, 
                        ${isSelected ? '#A67C52' : '#6B5344'} 100%)
                    `,
                    boxShadow: isSelected
                      ? `
                        inset 0 4px 8px rgba(255,255,255,0.3),
                        inset 0 -4px 8px rgba(0,0,0,0.3),
                        0 0 30px rgba(255,215,0,0.6),
                        0 10px 40px rgba(0,0,0,0.5)
                      `
                      : `
                        inset 0 2px 4px rgba(255,255,255,0.2),
                        inset 0 -2px 4px rgba(0,0,0,0.4),
                        0 8px 20px rgba(0,0,0,0.4)
                      `,
                    border: isSelected ? '3px solid #FFD700' : '2px solid #6B5344',
                    position: 'relative',
                  }}
                >
                  {/* Avatar SVG */}
                  <div
                    dangerouslySetInnerHTML={{ __html: avatar.svg }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      right: 8,
                      height: 100,
                      overflow: 'hidden',
                      borderRadius: 8,
                      filter: isSelected ? 'none' : 'saturate(0.7) brightness(0.9)',
                    }}
                  />

                  {/* Name label */}
                  <div style={{
                    position: 'absolute',
                    bottom: 8,
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    padding: '4px 8px',
                    background: 'rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{
                      fontFamily: '"Cinzel Decorative", cursive',
                      fontSize: isSelected ? 11 : 9,
                      color: isSelected ? '#FFD700' : '#F5DEB3',
                      letterSpacing: '0.04em',
                      fontWeight: isSelected ? 700 : 400,
                      textShadow: isSelected ? '0 0 8px rgba(255,215,0,0.6)' : 'none',
                    }}>
                      {avatar.name}
                    </div>
                  </div>

                  {/* Selection glow */}
                  {isSelected && (
                    <motion.div
                      animate={{
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                      style={{
                        position: 'absolute',
                        inset: -4,
                        borderRadius: 14,
                        border: '2px solid #FFD700',
                        boxShadow: '0 0 20px rgba(255,215,0,0.8)',
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
