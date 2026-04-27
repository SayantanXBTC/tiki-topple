import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'

// ══════════════════════════════════════════════════════════════════════════════
// TIKI TOPPLE 3D BOARD - Three.js r128
// Linear track of 9 slots with animated tiki figurines
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ─────────────────────────────────────────────────────────────────
const TIKI_REST_Y = 0.4
const TIKI_RISE_Y = 2.9
const TIKI_HOVER_Y = 0.7
const Z_FAR = -7
const SLOT_SPACING = 1.75
const NUM_SLOTS = 9
const ORBIT_RADIUS = 18
const ORBIT_HEIGHT = 8
const ORBIT_SPEED = 0.0003

// Track layout constants for 35 numbered positions
const TRACK_POSITIONS = 35
const TRACK_RADIUS = 8 // Radius of the circular track

// ── Tiki Data (Enhanced vibrant colors) ──────────────────────────────────────
const TIKI_DATA = {
  hookipa: { name: 'Hookipa', color: '#b0b0b0', symbol: 'Starfish' },
  lani: { name: 'Lani', color: '#9d4edd', symbol: 'Starfish' },
  kai: { name: 'Kai', color: '#e74c3c', symbol: 'Starfish' },
  malu: { name: 'Malu', color: '#ff2d95', symbol: 'Shells' },
  nalu: { name: 'Nalu', color: '#ffb627', symbol: 'Shells' },
  pele: { name: 'Pele', color: '#ff8533', symbol: 'Shells' },
  honu: { name: 'Honu', color: '#2ecc71', symbol: 'Fishbones' },
  mana: { name: 'Mana', color: '#3498db', symbol: 'Fishbones' },
  koa: { name: 'Koa', color: '#a1887f', symbol: 'Fishbones' },
}

// ── Easing Functions ──────────────────────────────────────────────────────────
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)
const easeInCubic = (t) => Math.pow(t, 3)
const easeInOutCubic = (t) => t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2

// ── Slot Z Position ───────────────────────────────────────────────────────────
const slotZ = (index) => Z_FAR + index * SLOT_SPACING

// ── Lighten Color Helper ──────────────────────────────────────────────────────
function lightenColor(hex, amount = 0.25) {
  const color = new THREE.Color(hex)
  color.r = Math.min(1, color.r + amount)
  color.g = Math.min(1, color.g + amount)
  color.b = Math.min(1, color.b + amount)
  return color
}

// ── Create Player Pawn (Premium materials) ───────────────────────────────────
function createPlayerPawn(playerColor, playerId) {
  const group = new THREE.Group()
  group.userData.playerId = playerId
  group.userData.currentScore = 0
  
  const pawnColor = new THREE.Color(playerColor)
  
  // Base cylinder with premium material
  const baseGeo = new THREE.CylinderGeometry(0.30, 0.36, 0.18, 16)
  const baseMat = new THREE.MeshStandardMaterial({
    color: pawnColor.clone().multiplyScalar(0.7),
    emissive: pawnColor.clone().multiplyScalar(0.15),
    emissiveIntensity: 0.4,
    roughness: 0.5,
    metalness: 0.3,
  })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = 0.09
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)
  
  // Body sphere with glossy finish
  const bodyGeo = new THREE.SphereGeometry(0.32, 16, 16)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: pawnColor.clone(),
    emissive: pawnColor.clone().multiplyScalar(0.25),
    emissiveIntensity: 0.6,
    roughness: 0.4,
    metalness: 0.4,
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.42
  body.scale.set(1, 1.4, 1)
  body.castShadow = true
  body.receiveShadow = true
  group.add(body)
  
  // Top knob with bright finish
  const knobGeo = new THREE.SphereGeometry(0.14, 12, 12)
  const knobMat = new THREE.MeshStandardMaterial({
    color: pawnColor.clone().multiplyScalar(1.3),
    emissive: pawnColor.clone().multiplyScalar(0.4),
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.5,
  })
  const knob = new THREE.Mesh(knobGeo, knobMat)
  knob.position.y = 0.82
  knob.castShadow = true
  group.add(knob)
  
  // Premium glow ring at base
  const ringGeo = new THREE.TorusGeometry(0.38, 0.05, 10, 20)
  const ringMat = new THREE.MeshStandardMaterial({
    color: pawnColor.clone(),
    emissive: pawnColor.clone(),
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.7,
    roughness: 0.2,
    metalness: 0.6,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.03
  group.add(ring)
  
  return group
}

// ── Create Number Sprite (Premium Design) ────────────────────────────────────
function createNumberSprite(number) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')

  const centerX = 128
  const centerY = 128
  const radius = 110

  // Outer glow
  const outerGlow = ctx.createRadialGradient(centerX, centerY, radius * 0.7, centerX, centerY, radius)
  outerGlow.addColorStop(0, 'rgba(212,175,55,0.3)')
  outerGlow.addColorStop(1, 'rgba(212,175,55,0)')
  ctx.fillStyle = outerGlow
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
  ctx.fill()

  // Premium wood texture background
  const woodGradient = ctx.createRadialGradient(centerX, centerY - 20, 20, centerX, centerY, radius * 0.85)
  woodGradient.addColorStop(0, '#e8c896')
  woodGradient.addColorStop(0.3, '#d4a574')
  woodGradient.addColorStop(0.7, '#b8935a')
  woodGradient.addColorStop(1, '#8b6914')
  ctx.fillStyle = woodGradient
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2)
  ctx.fill()

  // Inner shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.5)'
  ctx.shadowBlur = 15
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 5
  ctx.strokeStyle = '#5c3d1a'
  ctx.lineWidth = 8
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2)
  ctx.stroke()
  ctx.shadowColor = 'transparent'

  // Gold border ring
  const goldGradient = ctx.createLinearGradient(0, centerY - radius * 0.85, 0, centerY + radius * 0.85)
  goldGradient.addColorStop(0, '#f4e4a6')
  goldGradient.addColorStop(0.5, '#d4af37')
  goldGradient.addColorStop(1, '#8b6914')
  ctx.strokeStyle = goldGradient
  ctx.lineWidth = 12
  ctx.beginPath()
  ctx.arc(centerX, centerY, radius * 0.75, 0, Math.PI * 2)
  ctx.stroke()

  // Inner gold highlight
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.arc(centerX, centerY - 5, radius * 0.75, Math.PI * 1.2, Math.PI * 1.8)
  ctx.stroke()

  // Number text with premium styling
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Text shadow for depth
  ctx.shadowColor = 'rgba(0,0,0,0.7)'
  ctx.shadowBlur = 8
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 4

  // Main number
  const fontSize = number > 9 ? 110 : 130
  ctx.font = `900 ${fontSize}px "Cinzel Decorative", serif`
  
  // Gold gradient for text
  const textGradient = ctx.createLinearGradient(0, centerY - 60, 0, centerY + 60)
  textGradient.addColorStop(0, '#ffd700')
  textGradient.addColorStop(0.5, '#d4af37')
  textGradient.addColorStop(1, '#8b6914')
  ctx.fillStyle = textGradient
  ctx.fillText(number.toString(), centerX, centerY + 5)

  // Text outline
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#3d1f0a'
  ctx.lineWidth = 6
  ctx.strokeText(number.toString(), centerX, centerY + 5)

  // Highlight on text
  ctx.fillStyle = 'rgba(255,255,255,0.3)'
  ctx.font = `900 ${fontSize}px "Cinzel Decorative", serif`
  ctx.fillText(number.toString(), centerX - 2, centerY + 2)

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({ 
    map: texture,
    transparent: true,
    depthTest: false,
  })
  const sprite = new THREE.Sprite(material)
  sprite.scale.set(1.2, 1.2, 1)
  
  return sprite
}

// ── Create Tiki Group (Ultra-premium carved tiki idol) ───────────────────────
function createTikiGroup(tikId, color, slotIndex) {
  const group = new THREE.Group()
  group.userData.tikId = tikId

  const bodyColor = new THREE.Color(color)
  const faceColor = lightenColor(color, 0.28)
  const darkWood   = new THREE.Color(0x2a1005)
  const goldColor  = new THREE.Color(0xd4af37)

  // ─ 1. Main body – slightly tapered cylinder ─
  const bodyGeo = new THREE.CylinderGeometry(0.48, 0.56, 1.75, 18)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: bodyColor.clone(),
    emissive: bodyColor.clone().multiplyScalar(0.25),
    emissiveIntensity: 0.45,
    roughness: 0.55,
    metalness: 0.18,
  })
  const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat)
  bodyMesh.position.y = 0
  bodyMesh.castShadow = true
  bodyMesh.receiveShadow = true
  group.add(bodyMesh)
  group.userData.bodyMesh = bodyMesh

  // ─ 2. Carved horizontal bands on body ─
  const bandPositions = [-0.55, -0.05, 0.45]
  bandPositions.forEach(yPos => {
    const bandGeo = new THREE.TorusGeometry(0.53, 0.045, 8, 22)
    const bandMat = new THREE.MeshStandardMaterial({
      color: darkWood,
      roughness: 0.85,
      metalness: 0.05,
    })
    const band = new THREE.Mesh(bandGeo, bandMat)
    band.rotation.x = Math.PI / 2
    band.position.y = yPos
    band.castShadow = true
    group.add(band)
  })

  // ─ 3. Face plate – rounded rectangle ─
  const facePlateGeo = new THREE.CylinderGeometry(0.49, 0.50, 1.3, 18, 1, false, -Math.PI * 0.3, Math.PI * 0.6)
  const facePlateMat = new THREE.MeshStandardMaterial({
    color: faceColor,
    emissive: faceColor.clone().multiplyScalar(0.18),
    emissiveIntensity: 0.28,
    roughness: 0.48,
    metalness: 0.12,
    side: THREE.FrontSide,
  })
  const facePlate = new THREE.Mesh(facePlateGeo, facePlateMat)
  facePlate.position.y = 0.1
  facePlate.castShadow = true
  group.add(facePlate)

  // ─ 4. Eyes – deep-set oval whites + dark pupils + gold ring ─
  const eyePositions = [{ x: -0.22 }, { x: 0.22 }]
  eyePositions.forEach(({ x }) => {
    // White sclera
    const scleraGeo = new THREE.SphereGeometry(0.14, 12, 12)
    const scleraMat = new THREE.MeshStandardMaterial({
      color: 0xf8f4e8,
      roughness: 0.25,
      metalness: 0.05,
    })
    const sclera = new THREE.Mesh(scleraGeo, scleraMat)
    sclera.position.set(x, 0.34, 0.50)
    sclera.scale.set(1, 1.15, 0.85)
    sclera.castShadow = true
    group.add(sclera)

    // Dark iris
    const irisGeo = new THREE.SphereGeometry(0.085, 10, 10)
    const irisMat = new THREE.MeshStandardMaterial({ color: 0x0d0500, roughness: 0.4 })
    const iris = new THREE.Mesh(irisGeo, irisMat)
    iris.position.set(x, 0.34, 0.565)
    group.add(iris)

    // Gold eye ring accent
    const eyeRingGeo = new THREE.TorusGeometry(0.145, 0.025, 8, 18)
    const eyeRingMat = new THREE.MeshStandardMaterial({
      color: goldColor,
      emissive: goldColor,
      emissiveIntensity: 0.6,
      roughness: 0.3,
      metalness: 0.9,
    })
    const eyeRing = new THREE.Mesh(eyeRingGeo, eyeRingMat)
    eyeRing.position.set(x, 0.34, 0.49)
    eyeRing.rotation.y = Math.PI / 2 * (x < 0 ? -1 : 1) * 0.1
    group.add(eyeRing)
  })

  // ─ 5. Heavy tribal nose ─
  const noseGeo = new THREE.BoxGeometry(0.21, 0.19, 0.18)
  const noseMat = new THREE.MeshStandardMaterial({ color: faceColor, roughness: 0.65 })
  const nose = new THREE.Mesh(noseGeo, noseMat)
  nose.position.set(0, 0.06, 0.565)
  nose.castShadow = true
  group.add(nose)

  // Wide nostrils
  ;[-0.08, 0.08].forEach(nx => {
    const nostrilGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 8)
    const nostrilMat = new THREE.MeshStandardMaterial({ color: 0x0a0200, roughness: 0.9 })
    const nostril = new THREE.Mesh(nostrilGeo, nostrilMat)
    nostril.rotation.x = Math.PI / 2
    nostril.position.set(nx, -0.01, 0.61)
    group.add(nostril)
  })

  // ─ 6. Angry mouth – carved slot with teeth ─
  const mouthGeo = new THREE.BoxGeometry(0.46, 0.10, 0.14)
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x0d0100, roughness: 0.95 })
  const mouth = new THREE.Mesh(mouthGeo, mouthMat)
  mouth.position.set(0, -0.19, 0.56)
  mouth.castShadow = true
  group.add(mouth)

  // Teeth row
  for (let t = 0; t < 4; t++) {
    const toothGeo = new THREE.BoxGeometry(0.07, 0.09, 0.08)
    const toothMat = new THREE.MeshStandardMaterial({ color: 0xf0e8c8, roughness: 0.5 })
    const tooth = new THREE.Mesh(toothGeo, toothMat)
    tooth.position.set(-0.165 + t * 0.11, -0.165, 0.58)
    group.add(tooth)
  }

  // ─ 7. Brow ridge ─
  const browGeo = new THREE.BoxGeometry(0.58, 0.1, 0.15)
  const browMat = new THREE.MeshStandardMaterial({ color: faceColor.clone().multiplyScalar(0.7), roughness: 0.7 })
  const brow = new THREE.Mesh(browGeo, browMat)
  brow.position.set(0, 0.52, 0.50)
  brow.rotation.x = -0.2
  brow.castShadow = true
  group.add(brow)

  // Brow notch (furrowed look)
  const notchGeo = new THREE.BoxGeometry(0.09, 0.06, 0.16)
  const notchMat = new THREE.MeshStandardMaterial({ color: 0x0d0200, roughness: 0.9 })
  const notch = new THREE.Mesh(notchGeo, notchMat)
  notch.position.set(0, 0.53, 0.52)
  group.add(notch)

  // ─ 8. Forehead jewel ─
  const gemGeo = new THREE.OctahedronGeometry(0.10)
  const gemMat = new THREE.MeshStandardMaterial({
    color: goldColor,
    emissive: goldColor,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0.95,
  })
  const gem = new THREE.Mesh(gemGeo, gemMat)
  gem.position.set(0, 0.72, 0.48)
  gem.rotation.z = Math.PI / 4
  group.add(gem)
  group.userData.gem = gem

  // ─ 9. Spiked crown (5 spikes) ─
  const crownBaseGeo = new THREE.CylinderGeometry(0.50, 0.50, 0.12, 18)
  const crownBaseMat = new THREE.MeshStandardMaterial({
    color: goldColor,
    emissive: goldColor.clone().multiplyScalar(0.5),
    emissiveIntensity: 0.7,
    roughness: 0.25,
    metalness: 0.92,
  })
  const crownBase = new THREE.Mesh(crownBaseGeo, crownBaseMat)
  crownBase.position.y = 0.96
  group.add(crownBase)

  for (let s = 0; s < 5; s++) {
    const angle = (s / 5) * Math.PI * 2
    const spikeGeo = new THREE.ConeGeometry(0.085, 0.42, 7)
    const spikeMat = new THREE.MeshStandardMaterial({
      color: goldColor,
      emissive: goldColor.clone().multiplyScalar(0.4),
      emissiveIntensity: 0.6,
      roughness: 0.2,
      metalness: 0.95,
    })
    const spike = new THREE.Mesh(spikeGeo, spikeMat)
    spike.position.set(Math.cos(angle) * 0.38, 1.18 + Math.sin(angle) * 0.03, Math.sin(angle) * 0.38)
    spike.rotation.z = Math.cos(angle) * 0.28
    spike.rotation.x = Math.sin(angle) * 0.28
    spike.castShadow = true
    group.add(spike)
  }

  // ─ 10. Base glow disc ─
  const glowGeo = new THREE.CylinderGeometry(0.64, 0.70, 0.06, 18)
  const glowMat = new THREE.MeshStandardMaterial({
    color: bodyColor.clone(),
    emissive: bodyColor.clone(),
    emissiveIntensity: 0.7,
    transparent: true,
    opacity: 0.45,
    roughness: 0.3,
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.y = -0.88
  group.add(glow)
  group.userData.glowDisc = glow

  return group
}

// ── Animation System ──────────────────────────────────────────────────────────
class AnimationQueue {
  constructor() {
    this.animations = []
  }

  add(animation) {
    this.animations.push({
      start: Date.now(),
      ...animation,
    })
  }

  update() {
    const now = Date.now()
    this.animations = this.animations.filter(anim => {
      const elapsed = now - anim.start
      const t = Math.min(1, elapsed / anim.duration)
      anim.update(t)
      if (t >= 1 && anim.onComplete) {
        anim.onComplete()
        return false
      }
      return t < 1
    })
  }

  clear() {
    this.animations = []
  }
}

// ── Animate Tiki Move (Enhanced physical movement) ───────────────────────────
function animateTikiMove(animQueue, tikiGroup, fromZ, toZ, cardType = 'up1') {
  const duration = 2200 // Extended for more dramatic movement
  const startY = TIKI_REST_Y
  const startRot = tikiGroup.rotation.y
  
  const movingForward = toZ < fromZ
  const distance = Math.abs(toZ - fromZ)
  const slots = Math.round(distance / SLOT_SPACING)
  const riseHeight = TIKI_RISE_Y + (slots * 0.5) // Higher rise based on distance

  tikiGroup.userData.isAnimating = true

  // Store original emissive for pulse effect
  const bodyMesh = tikiGroup.userData.bodyMesh
  const originalEmissive = bodyMesh.material.emissiveIntensity

  animQueue.add({
    duration,
    update: (t) => {
      if (t < 0.25) {
        // Phase 1: Dramatic rise with anticipation
        const t1 = t / 0.25
        const eased = easeOutCubic(t1)
        tikiGroup.position.y = startY + (riseHeight - startY) * eased
        tikiGroup.position.z = fromZ
        
        // Rotation during rise
        tikiGroup.rotation.y = startRot + Math.sin(t1 * Math.PI) * 0.2
        tikiGroup.rotation.x = Math.sin(t1 * Math.PI * 0.5) * 0.15
        
        // Strong pulse glow during rise
        bodyMesh.material.emissiveIntensity = originalEmissive + (t1 * 0.6)
        
        // Scale up slightly for emphasis
        const scale = 1 + (t1 * 0.1)
        tikiGroup.scale.set(scale, scale, scale)
      } else if (t < 0.7) {
        // Phase 2: Physical travel through air with pronounced arc
        const t2 = (t - 0.25) / 0.45
        const eased = easeInOutCubic(t2)
        
        // Pronounced arc motion - goes higher in the middle
        const arcProgress = Math.sin(t2 * Math.PI)
        tikiGroup.position.y = riseHeight + arcProgress * 1.2
        
        // Smooth Z-axis travel
        tikiGroup.position.z = fromZ + (toZ - fromZ) * eased
        
        // Direction-aware rotation with more spin
        if (movingForward) {
          tikiGroup.rotation.y = startRot + (t2 * Math.PI * 0.8) // Forward spin
          tikiGroup.rotation.x = -0.15 + Math.sin(t2 * Math.PI) * 0.1
        } else {
          tikiGroup.rotation.y = startRot - (t2 * Math.PI * 0.8) // Backward spin
          tikiGroup.rotation.x = 0.15 + Math.sin(t2 * Math.PI) * 0.1
        }
        
        // Maintain strong glow during travel
        bodyMesh.material.emissiveIntensity = originalEmissive + 0.6
        
        // Keep scale
        tikiGroup.scale.set(1.1, 1.1, 1.1)
      } else {
        // Phase 3: Landing with bounce and settle
        const t3 = (t - 0.7) / 0.3
        const eased = easeOutBounce(t3)
        tikiGroup.position.y = riseHeight + (TIKI_REST_Y - riseHeight) * eased
        tikiGroup.position.z = toZ
        
        // Settle rotation smoothly
        tikiGroup.rotation.y = tikiGroup.rotation.y * (1 - t3)
        tikiGroup.rotation.x = tikiGroup.rotation.x * (1 - t3)
        
        // Scale back to normal
        const scale = 1.1 - (0.1 * t3)
        tikiGroup.scale.set(scale, scale, scale)
        
        // Fade glow
        bodyMesh.material.emissiveIntensity = originalEmissive + (0.6 * (1 - t3))
      }
    },
    onComplete: () => {
      tikiGroup.position.y = TIKI_REST_Y
      tikiGroup.position.z = toZ
      tikiGroup.rotation.y = 0
      tikiGroup.rotation.x = 0
      tikiGroup.scale.set(1, 1, 1)
      bodyMesh.material.emissiveIntensity = originalEmissive
      tikiGroup.userData.isAnimating = false
    },
  })
}

// Easing function for bounce effect
function easeOutBounce(t) {
  const n1 = 7.5625
  const d1 = 2.75
  if (t < 1 / d1) {
    return n1 * t * t
  } else if (t < 2 / d1) {
    return n1 * (t -= 1.5 / d1) * t + 0.75
  } else if (t < 2.5 / d1) {
    return n1 * (t -= 2.25 / d1) * t + 0.9375
  } else {
    return n1 * (t -= 2.625 / d1) * t + 0.984375
  }
}

// ── Animate Toast (Premium exit with particles) ──────────────────────────────
function animateToast(animQueue, tikiGroup, scene, onDone) {
  const duration = 1400
  const startScale = tikiGroup.scale.x
  const startY = tikiGroup.position.y
  const startRot = tikiGroup.rotation.y

  tikiGroup.userData.isAnimating = true

  animQueue.add({
    duration,
    update: (t) => {
      if (t < 0.2) {
        // Phase 1: Anticipation - compress slightly
        const t1 = t / 0.2
        const eased = easeInCubic(t1)
        tikiGroup.position.y = startY - 0.1 * eased
        const scale = startScale * (1 - 0.1 * eased)
        tikiGroup.scale.set(scale, scale, scale)
      } else if (t < 0.35) {
        // Phase 2: Explosive rise and scale
        const t2 = (t - 0.2) / 0.15
        const eased = easeOutCubic(t2)
        tikiGroup.position.y = startY - 0.1 + (0.8 * eased)
        const scale = startScale * (0.9 + 0.6 * eased)
        tikiGroup.scale.set(scale, scale, scale)
        tikiGroup.rotation.y = startRot + t2 * Math.PI * 0.5
        
        // Increase emissive during explosion
        tikiGroup.traverse(obj => {
          if (obj.material && obj.material.emissiveIntensity !== undefined) {
            obj.material.emissiveIntensity *= (1 + t2)
          }
        })
      } else if (t < 0.5) {
        // Phase 3: Peak moment
        const t3 = (t - 0.35) / 0.15
        tikiGroup.position.y = startY + 0.7
        tikiGroup.scale.set(1.5, 1.5, 1.5)
        tikiGroup.rotation.y = startRot + (0.5 + t3 * 0.5) * Math.PI
      } else {
        // Phase 4: Graceful ascent and fade
        const t4 = (t - 0.5) / 0.5
        const eased = easeInCubic(t4)
        
        // Float upward with spiral
        tikiGroup.position.y = startY + 0.7 + t4 * 5
        tikiGroup.position.x += Math.sin(t4 * Math.PI * 2) * 0.3
        tikiGroup.position.z += Math.cos(t4 * Math.PI * 2) * 0.2
        
        // Elegant spin
        tikiGroup.rotation.y = startRot + Math.PI + t4 * Math.PI * 3
        tikiGroup.rotation.x = t4 * Math.PI * 1.2
        tikiGroup.rotation.z = Math.sin(t4 * Math.PI) * 0.3
        
        // Shrink and fade
        const scale = 1.5 * (1 - eased)
        tikiGroup.scale.set(scale, scale, scale)
        
        tikiGroup.traverse(obj => {
          if (obj.material) {
            obj.material.opacity = 1 - eased
            obj.material.transparent = true
            if (obj.material.emissiveIntensity !== undefined) {
              obj.material.emissiveIntensity *= (1 - eased * 0.5)
            }
          }
        })
      }
    },
    onComplete: () => {
      tikiGroup.visible = false
      scene.remove(tikiGroup)
      tikiGroup.userData.isAnimating = false
      if (onDone) onDone()
    },
  })
}

// ── Animate Topple (Premium dramatic fall) ───────────────────────────────────
function animateTopple(animQueue, tikiGroup, fromZ, toZ) {
  const duration = 2000
  const startY = TIKI_REST_Y
  const startRot = tikiGroup.rotation.y
  const riseHeight = TIKI_RISE_Y + 1.0

  tikiGroup.userData.isAnimating = true
  
  const bodyMesh = tikiGroup.userData.bodyMesh
  const originalEmissive = bodyMesh.material.emissiveIntensity

  animQueue.add({
    duration,
    update: (t) => {
      if (t < 0.25) {
        // Phase 1: Dramatic rise with backward lean
        const t1 = t / 0.25
        const eased = easeOutCubic(t1)
        tikiGroup.position.y = startY + (riseHeight - startY) * eased
        tikiGroup.position.z = fromZ
        tikiGroup.rotation.x = eased * 0.4
        tikiGroup.rotation.y = startRot + Math.sin(t1 * Math.PI) * 0.25
        
        // Pulse effect
        bodyMesh.material.emissiveIntensity = originalEmissive + (t1 * 0.5)
      } else if (t < 0.7) {
        // Phase 2: Tumbling backward with rotation
        const t2 = (t - 0.25) / 0.45
        const eased = easeInOutCubic(t2)
        
        // Dramatic arc
        const arcProgress = Math.sin(t2 * Math.PI)
        tikiGroup.position.y = riseHeight + arcProgress * 0.6
        tikiGroup.position.z = fromZ + (toZ - fromZ) * eased
        
        // Multiple rotation axes for tumble effect
        tikiGroup.rotation.x = 0.4 + t2 * Math.PI * 1.8
        tikiGroup.rotation.y = startRot + t2 * Math.PI * 2.5
        tikiGroup.rotation.z = Math.sin(t2 * Math.PI * 2) * 0.3
        
        bodyMesh.material.emissiveIntensity = originalEmissive + 0.5
      } else {
        // Phase 3: Impact and settle
        const t3 = (t - 0.7) / 0.3
        const eased = easeInCubic(t3)
        tikiGroup.position.y = riseHeight * 0.3 + (TIKI_REST_Y - riseHeight * 0.3) * eased
        tikiGroup.position.z = toZ
        
        // Settle all rotations
        tikiGroup.rotation.x = (0.4 + Math.PI * 1.8) * (1 - eased)
        tikiGroup.rotation.y = (startRot + Math.PI * 2.5) * (1 - eased)
        tikiGroup.rotation.z = tikiGroup.rotation.z * (1 - eased)
        
        // Dramatic bounce
        if (t3 > 0.5) {
          const bounceT = (t3 - 0.5) / 0.5
          tikiGroup.position.y = TIKI_REST_Y + Math.sin(bounceT * Math.PI) * 0.15
        }
        
        // Fade glow
        bodyMesh.material.emissiveIntensity = originalEmissive + (0.5 * (1 - t3))
      }
    },
    onComplete: () => {
      tikiGroup.position.y = TIKI_REST_Y
      tikiGroup.position.z = toZ
      tikiGroup.rotation.y = 0
      tikiGroup.rotation.x = 0
      tikiGroup.rotation.z = 0
      bodyMesh.material.emissiveIntensity = originalEmissive
      tikiGroup.userData.isAnimating = false
    },
  })
}

// ── Premium Particle Burst ───────────────────────────────────────────────────
function spawnParticleBurst(animQueue, scene, origin) {
  const particles = []
  const particleGeo = new THREE.SphereGeometry(0.10, 6, 6)
  const colors = [0xff6b1a, 0xffd700, 0xff8c00, 0xffaa00]

  for (let i = 0; i < 20; i++) {
    const particleMat = new THREE.MeshStandardMaterial({ 
      color: colors[Math.floor(Math.random() * colors.length)],
      emissive: new THREE.Color(colors[Math.floor(Math.random() * colors.length)]),
      emissiveIntensity: 1.0,
      transparent: true,
    })
    const particle = new THREE.Mesh(particleGeo, particleMat)
    particle.position.copy(origin)
    
    const angle = (i / 20) * Math.PI * 2
    const speed = 2.5 + Math.random() * 1.5
    const vx = Math.cos(angle) * speed
    const vy = 3.5 + Math.random() * 2.5
    const vz = Math.sin(angle) * speed
    
    particle.userData.velocity = { x: vx, y: vy, z: vz }
    particle.castShadow = true
    scene.add(particle)
    particles.push(particle)
  }

  animQueue.add({
    duration: 1000,
    update: (t) => {
      particles.forEach(p => {
        const v = p.userData.velocity
        p.position.x += v.x * 0.016
        p.position.y += v.y * 0.016 - 6.0 * t * t * 0.016
        p.position.z += v.z * 0.016
        
        // Spin particles
        p.rotation.x += 0.1
        p.rotation.y += 0.15
        
        // Fade and shrink
        p.material.opacity = 1 - t
        const scale = 1 - t * 0.7
        p.scale.set(scale, scale, scale)
      })
    },
    onComplete: () => {
      particles.forEach(p => {
        scene.remove(p)
        p.geometry.dispose()
        p.material.dispose()
      })
    },
  })
}

// ── Animate Pawn Movement (Premium smooth glide beside sprites) ──────────────
function animatePawnToScore(animQueue, pawn, targetScore, spritePositions) {
  const duration = 1200
  const startPos = pawn.position.clone()
  
  // Find target position based on score
  let targetX, targetZ
  
  if (targetScore === 0) {
    // Starting position - outside the track
    targetX = -6.5
    targetZ = 11.5
  } else {
    // Find the sprite position for this score
    const spritePos = spritePositions.find(sp => sp.position === targetScore)
    if (spritePos) {
      // Position pawn BESIDE the sprite, not on top of it
      // Offset inward from the sprite position
      if (spritePos.x < 0) {
        // Left side - move pawn to the right of sprite
        targetX = spritePos.x + 1.2
      } else {
        // Right side - move pawn to the left of sprite
        targetX = spritePos.x - 1.2
      }
      
      // For top side, move pawn below the sprite
      if (spritePos.z < -9) {
        targetZ = spritePos.z + 1.2
      } else {
        targetZ = spritePos.z
      }
    } else {
      return // Invalid score
    }
  }
  
  pawn.userData.isAnimating = true
  
  // Get pawn's ring for pulse effect
  const ring = pawn.children.find(child => child.geometry && child.geometry.type === 'TorusGeometry')
  const originalRingIntensity = ring ? ring.material.emissiveIntensity : 1.2
  
  animQueue.add({
    duration,
    update: (t) => {
      const eased = easeInOutCubic(t)
      
      // Smooth glide along path
      pawn.position.x = startPos.x + (targetX - startPos.x) * eased
      pawn.position.z = startPos.z + (targetZ - startPos.z) * eased
      
      // Elegant hop with arc
      const hopHeight = Math.sin(t * Math.PI) * 1.0
      pawn.position.y = 0.4 + hopHeight
      
      // Smooth rotation
      pawn.rotation.y = easeInOutCubic(t) * Math.PI * 2
      
      // Pulse glow ring
      if (ring) {
        ring.material.emissiveIntensity = originalRingIntensity + Math.sin(t * Math.PI * 4) * 0.4
      }
    },
    onComplete: () => {
      pawn.position.set(targetX, 0.4, targetZ)
      pawn.rotation.y = 0
      if (ring) {
        ring.material.emissiveIntensity = originalRingIntensity
      }
      pawn.userData.isAnimating = false
      pawn.userData.currentScore = targetScore
    },
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const TikiBoard = forwardRef(({ board, boardState, validTargets = [], onTikiSelect, isInteractive = true, isMyTurn, selectedCard, onTikiClick, validTikiIds, roundNumber, players = [] }, ref) => {
  const containerRef = useRef()
  const sceneRef = useRef()
  const cameraRef = useRef()
  const rendererRef = useRef()
  const tikiGroupsRef = useRef([])
  const playerPawnsRef = useRef([])
  const animQueueRef = useRef(new AnimationQueue())
  const validTargetIdsRef = useRef([])
  const hoveredTikiRef = useRef(null)
  const tikiClickCbRef = useRef(null)
  const mouseRef = useRef(new THREE.Vector2())
  const raycasterRef = useRef(new THREE.Raycaster())
  const cameraAngleRef = useRef(0)
  const isInteractingRef = useRef(false)
  const touchStartRef = useRef({ x: 0, angle: 0 })
  const frameIdRef = useRef(null)
  const startTimeRef = useRef(Date.now())

  // ── Initialize Scene ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    // Scene with transparent background for jungle atmosphere
    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera - Premium angled perspective view
    const camera = new THREE.PerspectiveCamera(
      40, // Tighter FOV for more dramatic perspective
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(8, 22, 28)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer with premium settings
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: 'high-performance',
    })
    renderer.setClearColor(0x000000, 0) // Transparent background
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Cap at 2x for performance
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.2
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Dramatic volcanic lighting
    const ambientLight = new THREE.AmbientLight(0x1a0a2a, 0.6)
    scene.add(ambientLight)

    const sunLight = new THREE.DirectionalLight(0xff8040, 2.8)
    sunLight.position.set(5, 20, 10)
    sunLight.castShadow = true
    sunLight.shadow.mapSize.width = 2048
    sunLight.shadow.mapSize.height = 2048
    sunLight.shadow.camera.near = 0.5
    sunLight.shadow.camera.far = 60
    sunLight.shadow.camera.left = -22
    sunLight.shadow.camera.right = 22
    sunLight.shadow.camera.top = 22
    sunLight.shadow.camera.bottom = -22
    sunLight.shadow.bias = -0.0001
    scene.add(sunLight)

    const fillLight = new THREE.DirectionalLight(0x6030c0, 0.30)
    fillLight.position.set(-12, 14, -6)
    scene.add(fillLight)

    const torchLeft = new THREE.PointLight(0xff4a10, 4.0, 22)
    torchLeft.position.set(-4, 6, -7)
    torchLeft.castShadow = true
    torchLeft.shadow.mapSize.width = 512
    torchLeft.shadow.mapSize.height = 512
    scene.add(torchLeft)

    const torchRight = new THREE.PointLight(0xff4a10, 4.0, 22)
    torchRight.position.set(4, 6, -7)
    torchRight.castShadow = true
    torchRight.shadow.mapSize.width = 512
    torchRight.shadow.mapSize.height = 512
    scene.add(torchRight)

    const overheadFill = new THREE.SpotLight(0xff9040, 0.7)
    overheadFill.position.set(0, 24, 4)
    overheadFill.angle = Math.PI / 3.8
    overheadFill.penumbra = 0.5
    overheadFill.decay = 1.5
    overheadFill.distance = 45
    overheadFill.castShadow = false
    scene.add(overheadFill)
    scene.add(overheadFill.target)

    // ── Premium board base ────────────────────────────────────────────────
    const plankGeo = new THREE.BoxGeometry(6.5, 0.5, 22)
    const plankMat = new THREE.MeshStandardMaterial({ 
      color: 0x3d1f0a,
      emissive: 0x0a1a05,
      emissiveIntensity: 0.06,
      roughness: 0.7,
      metalness: 0.1,
    })
    const plank = new THREE.Mesh(plankGeo, plankMat)
    plank.position.set(0, 0, 0)
    plank.castShadow = true
    plank.receiveShadow = true
    scene.add(plank)

    // Wood grain bands with depth
    for (let i = 0; i < 7; i++) {
      const stripGeo = new THREE.BoxGeometry(6.5, 0.02, 0.12)
      const stripMat = new THREE.MeshStandardMaterial({ 
        color: 0x1a0800,
        roughness: 0.9,
      })
      const strip = new THREE.Mesh(stripGeo, stripMat)
      strip.position.set(0, 0.26, -9 + i * 3)
      strip.receiveShadow = true
      scene.add(strip)
    }

    // Carved tiki channel with premium materials
    const grooveGeo = new THREE.BoxGeometry(2.0, 0.6, 21)
    const grooveMat = new THREE.MeshStandardMaterial({ 
      color: 0x0d0400,
      roughness: 0.95,
      metalness: 0.05,
    })
    const groove = new THREE.Mesh(grooveGeo, grooveMat)
    groove.position.set(0, 0.28, 0)
    groove.receiveShadow = true
    scene.add(groove)

    // Channel inner shadow line
    const channelEdgeGeo = new THREE.BoxGeometry(2.05, 0.04, 21.3)
    const channelEdgeMat = new THREE.MeshStandardMaterial({ 
      color: 0x1a0800,
      roughness: 0.85,
    })
    const channelEdge = new THREE.Mesh(channelEdgeGeo, channelEdgeMat)
    channelEdge.position.set(0, 0.59, 0)
    channelEdge.receiveShadow = true
    scene.add(channelEdge)

    // Premium side rails with better materials
    const railPositions = [-2.8, 2.8]
    railPositions.forEach(xOff => {
      const railGeo = new THREE.BoxGeometry(0.22, 0.35, 21.8)
      const railMat = new THREE.MeshStandardMaterial({ 
        color: 0x6b3a1f,
        roughness: 0.6,
        metalness: 0.15,
      })
      const rail = new THREE.Mesh(railGeo, railMat)
      rail.position.set(xOff, 0.175, 0)
      rail.castShadow = true
      rail.receiveShadow = true
      scene.add(rail)

      // Premium gold trim with metallic finish
      const trimGeo = new THREE.BoxGeometry(0.10, 0.05, 21.8)
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: new THREE.Color(0x8b6914),
        emissiveIntensity: 0.6,
        roughness: 0.3,
        metalness: 0.8,
      })
      const trim = new THREE.Mesh(trimGeo, trimMat)
      trim.position.set(xOff, 0.355, 0)
      trim.castShadow = true
      scene.add(trim)
    })

    // Number sprites floating around the track
    const spritePositions = []

    // Left side: positions 1-13 (bottom to top)
    for (let i = 0; i < 13; i++) {
      const t = i / 12
      const x = -5.2
      const z = 10 - (t * 20)
      const sprite = createNumberSprite(i + 1)
      sprite.position.set(x, 1.2, z)
      scene.add(sprite)
      spritePositions.push({ position: i + 1, x, z })
    }

    // Top arc: positions 14-17 (left to right, curved)
    for (let i = 0; i < 4; i++) {
      const t = i / 3
      const x = -4.5 + (t * 9)
      const z = -11.2 + Math.sin(t * Math.PI) * 0.8
      const sprite = createNumberSprite(14 + i)
      sprite.position.set(x, 1.2, z)
      scene.add(sprite)
      spritePositions.push({ position: 14 + i, x, z })
    }

    // Right side: positions 18-35 (top to bottom)
    for (let i = 0; i < 18; i++) {
      const t = i / 17
      const x = 5.2
      const z = -10 + (t * 20)
      const sprite = createNumberSprite(18 + i)
      sprite.position.set(x, 1.2, z)
      scene.add(sprite)
      spritePositions.push({ position: 18 + i, x, z })
    }

    // Store sprite positions for pawn animations
    sceneRef.current.userData.spritePositions = spritePositions

    // Premium torch posts with enhanced materials
    const torchPositions = [{ x: -3.5 }, { x: 3.5 }]
    torchPositions.forEach(({ x }) => {
      // Post shaft with wood texture
      const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 7, 12)
      const postMat = new THREE.MeshStandardMaterial({ 
        color: 0x2a1005,
        roughness: 0.8,
        metalness: 0.1,
      })
      const post = new THREE.Mesh(postGeo, postMat)
      post.position.set(x, 3.5, -8)
      post.castShadow = true
      post.receiveShadow = true
      scene.add(post)

      // Premium gold torch cup with metallic finish
      const cupGeo = new THREE.CylinderGeometry(0.30, 0.18, 0.35, 12)
      const cupMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: new THREE.Color(0x8b6914),
        emissiveIntensity: 0.7,
        roughness: 0.25,
        metalness: 0.85,
      })
      const cup = new THREE.Mesh(cupGeo, cupMat)
      cup.position.set(x, 7.175, -8)
      cup.castShadow = true
      scene.add(cup)

      // Premium flame with better shape
      const flameGeo = new THREE.SphereGeometry(0.38, 12, 12)
      const flameMat = new THREE.MeshStandardMaterial({
        color: 0xff8c00,
        emissive: new THREE.Color(0xff3300),
        emissiveIntensity: 1.5,
        transparent: true,
        opacity: 0.9,
      })
      const flame = new THREE.Mesh(flameGeo, flameMat)
      flame.position.set(x, 7.70, -8)
      flame.scale.set(0.75, 1.8, 0.75)
      flame.userData.isTorchFlame = true
      scene.add(flame)

      // Brighter inner flame core
      const coreGeo = new THREE.SphereGeometry(0.18, 10, 10)
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0xffff80,
        emissive: new THREE.Color(0xffee00),
        emissiveIntensity: 2.0,
        transparent: true,
        opacity: 0.95,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      core.position.set(x, 7.50, -8)
      core.scale.set(0.6, 1.2, 0.6)
      core.userData.isTorchCore = true
      scene.add(core)
    })

    // Animation loop
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate)
      const elapsed = (Date.now() - startTimeRef.current) / 1000

      // Update animations
      animQueueRef.current.update()

      // Camera is now fixed - no orbit animation

      // Torch flame flicker
      scene.traverse(obj => {
        if (obj.userData.isTorchFlame) {
          const ft = elapsed * 3.8
          obj.scale.set(
            0.65 * (1 + Math.sin(ft * 1.7) * 0.10),
            1.50 * (1 + Math.sin(ft) * 0.20 + Math.sin(ft * 2.3) * 0.08),
            0.65 * (1 + Math.sin(ft * 2.1) * 0.07)
          )
          obj.material.emissiveIntensity = 1.0 * (0.75 + Math.sin(ft * 2.0) * 0.22 + Math.sin(ft * 3.7) * 0.10)
        }
        if (obj.userData.isTorchCore) {
          const ft = elapsed * 3.8 + 1.9
          obj.scale.set(
            0.33 * (1 + Math.sin(ft * 1.7) * 0.10),
            1.00 * (1 + Math.sin(ft) * 0.20 + Math.sin(ft * 2.3) * 0.08),
            0.33 * (1 + Math.sin(ft * 2.1) * 0.07)
          )
          obj.material.emissiveIntensity = 1.0 * (0.75 + Math.sin(ft * 2.0) * 0.22 + Math.sin(ft * 3.7) * 0.10)
        }
      })

      // Idle bob, hover float, and highlight pulse
      tikiGroupsRef.current.forEach((tikiGroup, index) => {
        if (!tikiGroup.visible) return

        const isAnimating = tikiGroup.userData.isAnimating
        const isHovered   = hoveredTikiRef.current === tikiGroup.userData.tikId
        const isValid     = validTargetIdsRef.current.includes(tikiGroup.userData.tikId)
        const bodyMesh    = tikiGroup.userData.bodyMesh
        const gem         = tikiGroup.userData.gem
        const glowDisc    = tikiGroup.userData.glowDisc

        if (!isAnimating) {
          if (isHovered && isValid) {
            // Hovered valid target: elevated hover with gentle sway
            tikiGroup.position.y = TIKI_HOVER_Y + Math.sin(elapsed * 3.5) * 0.06
            tikiGroup.rotation.z = Math.sin(elapsed * 2.8) * 0.04
          } else if (isValid) {
            // Valid (not hovered): float slightly above rest with inviting bounce
            tikiGroup.position.y = TIKI_REST_Y + 0.18 + Math.sin(elapsed * 2.2 + index * 0.8) * 0.07
            tikiGroup.rotation.z = 0
          } else {
            // Normal idle bob
            tikiGroup.position.y = TIKI_REST_Y + Math.sin(elapsed * 1.4 + index * 0.55) * 0.035
            tikiGroup.rotation.z = 0
          }
        }

        // Emissive pulse on body
        if (isValid && validTargetIdsRef.current.length > 0) {
          const pulse = (Math.sin(elapsed * 4.0 + index * 0.3) + 1) * 0.5
          const baseColor = new THREE.Color(bodyMesh.material.color)
          const intensity = isHovered ? 0.55 + pulse * 0.25 : 0.25 + pulse * 0.25
          bodyMesh.material.emissive = baseColor.clone().multiplyScalar(intensity)
          bodyMesh.material.emissiveIntensity = 1.0
          // Gem sparkle
          if (gem) gem.material.emissiveIntensity = 1.5 + pulse * 1.0
          // Glow disc pulse
          if (glowDisc) glowDisc.material.emissiveIntensity = 0.8 + pulse * 0.8
        } else {
          bodyMesh.material.emissive.set(0x000000)
          bodyMesh.material.emissiveIntensity = 0.45
          if (gem) gem.material.emissiveIntensity = 1.0
          if (glowDisc) glowDisc.material.emissiveIntensity = 0.7
        }
      })

      // Raycasting for hover
      if (isInteractive) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera)
        const bodyMeshes = tikiGroupsRef.current
          .filter(g => g.visible)
          .map(g => g.userData.bodyMesh)
        const intersects = raycasterRef.current.intersectObjects(bodyMeshes)

        if (intersects.length > 0) {
          const hitTiki = intersects[0].object.parent
          hoveredTikiRef.current = hitTiki.userData.tikId
          renderer.domElement.style.cursor = validTargetIdsRef.current.includes(hitTiki.userData.tikId)
            ? 'pointer'
            : 'default'
        } else {
          hoveredTikiRef.current = null
          renderer.domElement.style.cursor = 'default'
        }
      }

      renderer.render(scene, camera)
    }

    animate()

    // Event listeners
    const handleMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const handleClick = () => {
      if (!isInteractive || !hoveredTikiRef.current) return
      if (validTargetIdsRef.current.includes(hoveredTikiRef.current)) {
        if (tikiClickCbRef.current) {
          tikiClickCbRef.current(hoveredTikiRef.current)
        }
        if (onTikiSelect) {
          onTikiSelect(hoveredTikiRef.current)
        }
      }
    }

    const handleMouseDown = () => {
      // Camera rotation disabled - no interaction needed
    }

    const handleMouseUp = () => {
      // Camera rotation disabled - no interaction needed
    }

    const handleTouchStart = (e) => {
      // Camera rotation disabled - no interaction needed
    }

    const handleTouchMove = (e) => {
      // Camera rotation disabled - no interaction needed
    }

    const handleTouchEnd = () => {
      // Camera rotation disabled - no interaction needed
    }

    let resizeTimeout
    const handleResize = () => {
      clearTimeout(resizeTimeout)
      resizeTimeout = setTimeout(() => {
        if (!containerRef.current) return
        const width = containerRef.current.clientWidth
        const height = containerRef.current.clientHeight
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height)
      }, 150)
    }

    renderer.domElement.addEventListener('mousemove', handleMouseMove)
    renderer.domElement.addEventListener('click', handleClick)
    renderer.domElement.addEventListener('mousedown', handleMouseDown)
    renderer.domElement.addEventListener('mouseup', handleMouseUp)
    renderer.domElement.addEventListener('touchstart', handleTouchStart)
    renderer.domElement.addEventListener('touchmove', handleTouchMove)
    renderer.domElement.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      cancelAnimationFrame(frameIdRef.current)
      renderer.domElement.removeEventListener('mousemove', handleMouseMove)
      renderer.domElement.removeEventListener('click', handleClick)
      renderer.domElement.removeEventListener('mousedown', handleMouseDown)
      renderer.domElement.removeEventListener('mouseup', handleMouseUp)
      renderer.domElement.removeEventListener('touchstart', handleTouchStart)
      renderer.domElement.removeEventListener('touchmove', handleTouchMove)
      renderer.domElement.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', handleResize)
      
      tikiGroupsRef.current.forEach(group => {
        group.traverse(obj => {
          if (obj.geometry) obj.geometry.dispose()
          if (obj.material) {
            if (Array.isArray(obj.material)) {
              obj.material.forEach(mat => mat.dispose())
            } else {
              obj.material.dispose()
            }
          }
        })
      })
      
      renderer.dispose()
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // ── Public API Functions ───────────────────────────────────────────────────
  const initBoard = (tikiList) => {
    const scene = sceneRef.current
    if (!scene) return

    // Clear old tikis
    tikiGroupsRef.current.forEach(group => {
      scene.remove(group)
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    })
    tikiGroupsRef.current = []

    // Sort by position
    const sorted = [...tikiList].sort((a, b) => a.position - b.position)

    // Create tiki groups
    sorted.forEach((tiki, index) => {
      const data = TIKI_DATA[tiki.id] || { color: '#8a8a8a', name: tiki.name || tiki.id }
      const group = createTikiGroup(tiki.id, data.color, index)
      group.position.set(0, TIKI_REST_Y, slotZ(index))
      scene.add(group)
      tikiGroupsRef.current.push(group)
    })
  }

  const initPawns = (playersList) => {
    const scene = sceneRef.current
    if (!scene) return

    // Clear old pawns
    playerPawnsRef.current.forEach(pawn => {
      scene.remove(pawn)
      pawn.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(mat => mat.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    })
    playerPawnsRef.current = []

    // Create pawns for each player at starting position (score 0)
    playersList.forEach((player, index) => {
      const pawn = createPlayerPawn(player.color, player.id)
      
      // Starting position - outside the track, staggered
      const startX = -6.5 - (index * 0.7)
      const startZ = 11.5
      pawn.position.set(startX, 0.4, startZ)
      
      scene.add(pawn)
      playerPawnsRef.current.push(pawn)
    })
  }

  const updatePawnScores = (playersList) => {
    const scene = sceneRef.current
    if (!scene || !scene.userData.spritePositions) return

    const spritePositions = scene.userData.spritePositions

    playersList.forEach(player => {
      const pawn = playerPawnsRef.current.find(p => p.userData.playerId === player.id)
      if (pawn && pawn.userData.currentScore !== player.score) {
        animatePawnToScore(animQueueRef.current, pawn, player.score, spritePositions)
      }
    })
  }

  const updateBoard = (newBoardState) => {
    if (!newBoardState || !Array.isArray(newBoardState)) return

    newBoardState.forEach((item, newIndex) => {
      const tikId = typeof item === 'string' ? item : item.id
      const tikiGroup = tikiGroupsRef.current.find(g => g.userData.tikId === tikId)
      
      if (tikiGroup) {
        const currentZ = tikiGroup.position.z
        const targetZ = slotZ(newIndex)
        
        // Only animate if position actually changed
        if (Math.abs(currentZ - targetZ) > 0.1) {
          tikiGroup.userData.isAnimating = true
          
          // Determine animation type based on movement
          const movingBackward = targetZ > currentZ
          const distance = Math.abs(targetZ - currentZ)
          const slots = Math.round(distance / SLOT_SPACING)
          
          // If moving to last position (topple), use topple animation
          if (newIndex === newBoardState.length - 1 && slots > 3) {
            animateTopple(animQueueRef.current, tikiGroup, currentZ, targetZ)
          } else {
            // Regular move animation
            animateTikiMove(animQueueRef.current, tikiGroup, currentZ, targetZ)
          }
        }
      }
    })
  }

  const toastTiki = (tikId, onDone) => {
    const scene = sceneRef.current
    const tikiGroup = tikiGroupsRef.current.find(g => g.userData.tikId === tikId)
    
    if (tikiGroup && scene) {
      spawnParticleBurst(animQueueRef.current, scene, tikiGroup.position.clone())
      animateToast(animQueueRef.current, tikiGroup, scene, onDone)
    }
  }

  const highlightValidTargets = (tikIds) => {
    validTargetIdsRef.current = tikIds || []
  }

  const clearHighlights = () => {
    validTargetIdsRef.current = []
    hoveredTikiRef.current = null
    tikiGroupsRef.current.forEach(group => {
      const bodyMesh = group.userData.bodyMesh
      if (bodyMesh && bodyMesh.material) {
        bodyMesh.material.emissive.set(0x000000)
      }
    })
  }

  const onTikiClicked = (callback) => {
    tikiClickCbRef.current = callback
  }

  // Expose API via ref
  useImperativeHandle(ref, () => ({
    initBoard,
    initPawns,
    updatePawnScores,
    updateBoard,
    toastTiki,
    highlightValidTargets,
    clearHighlights,
    onTikiClicked,
  }))

  // ── Initialize tikis when component mounts or board prop changes ──────────
  useEffect(() => {
    if (board && board.length > 0 && sceneRef.current) {
      // Convert board to tikis format for initialization
      const tikisData = board.map((tiki, index) => ({
        id: tiki.id,
        name: tiki.name || tiki.id,
        color: TIKI_DATA[tiki.id]?.color || '#8a8a8a',
        position: index + 1,
      }))
      initBoard(tikisData)
    }
  }, [board])

  // ── Initialize pawns when players change ──────────────────────────────────
  useEffect(() => {
    if (players && players.length > 0 && sceneRef.current) {
      initPawns(players)
    }
  }, [players.length]) // Only reinit when player count changes

  // ── Update pawn positions when player scores change ───────────────────────
  useEffect(() => {
    if (players && players.length > 0 && playerPawnsRef.current.length > 0) {
      updatePawnScores(players)
    }
  }, [players.map(p => `${p.id}:${p.score}`).join(',')]) // Update when any score changes

  // ── Update board when boardState changes ──────────────────────────────────
  useEffect(() => {
    if (boardState && tikiGroupsRef.current.length > 0) {
      updateBoard(boardState)
    }
  }, [boardState])

  // ── Handle tiki click callback ─────────────────────────────────────────────
  useEffect(() => {
    if (onTikiClick) {
      onTikiClicked(onTikiClick)
    }
  }, [onTikiClick])

  // ── Update valid targets ───────────────────────────────────────────────────
  useEffect(() => {
    if (isInteractive && (validTikiIds || validTargets)) {
      const targets = validTikiIds || validTargets || []
      highlightValidTargets(targets)
    } else {
      clearHighlights()
    }
  }, [validTikiIds, validTargets, isInteractive])

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
      }}
    />
  )
})

TikiBoard.displayName = 'TikiBoard'

export default TikiBoard
