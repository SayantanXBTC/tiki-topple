import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'
import * as THREE from 'three'

// ══════════════════════════════════════════════════════════════════════════════
// TIKI TOPPLE 3D BOARD — Vertical shaft design
// Central wooden shaft, flame torch tikis, numbered stone score track
// ══════════════════════════════════════════════════════════════════════════════

// ── Constants ─────────────────────────────────────────────────────────────────
const TIKI_REST_Y   = 0.32
const TIKI_HOVER_Y  = 0.72
const TIKI_RISE_Y   = 4.8
const Z_FAR         = -7        // top slot (board position 1)
const SLOT_SPACING  = 1.75
const NUM_SLOTS     = 9

// ── Tiki flame colors — each tiki gets a unique color ────────────────────────
const TIKI_DATA = {
  hookipa: { name: 'Hookipa', color: '#60a8e0' },
  lani:    { name: 'Lani',    color: '#9d4edd' },
  kai:     { name: 'Kai',     color: '#e74c3c' },
  malu:    { name: 'Malu',    color: '#ff2d95' },
  nalu:    { name: 'Nalu',    color: '#ffb627' },
  pele:    { name: 'Pele',    color: '#ff6a1a' },
  honu:    { name: 'Honu',    color: '#2ecc71' },
  mana:    { name: 'Mana',    color: '#3498db' },
  koa:     { name: 'Koa',     color: '#d4a27a' },
}

// ── Easing Functions ──────────────────────────────────────────────────────────
const easeOutCubic    = (t) => 1 - Math.pow(1 - t, 3)
const easeInCubic     = (t) => Math.pow(t, 3)
const easeInOutCubic  = (t) => t < 0.5 ? 4 * Math.pow(t, 3) : 1 - Math.pow(-2 * t + 2, 3) / 2

function easeOutBounce(t) {
  const n1 = 7.5625, d1 = 2.75
  if (t < 1 / d1)        return n1 * t * t
  else if (t < 2 / d1)   return n1 * (t -= 1.5 / d1) * t + 0.75
  else if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375
  else                    return n1 * (t -= 2.625 / d1) * t + 0.984375
}

// ── Slot Z Position ───────────────────────────────────────────────────────────
const slotZ = (index) => Z_FAR + index * SLOT_SPACING

// ── Number Sprite (stone tablet style) ───────────────────────────────────────
function createNumberSprite(number) {
  const canvas = document.createElement('canvas')
  canvas.width  = 256
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  const cx = 128, cy = 128, r = 112

  // Stone texture background
  const stoneGrad = ctx.createRadialGradient(cx - 20, cy - 20, 10, cx, cy, r)
  stoneGrad.addColorStop(0, '#a0a098')
  stoneGrad.addColorStop(0.4, '#787870')
  stoneGrad.addColorStop(0.8, '#585850')
  stoneGrad.addColorStop(1, '#383830')
  ctx.fillStyle = stoneGrad
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.fill()

  // Highlight arc
  ctx.strokeStyle = 'rgba(255,255,255,0.22)'
  ctx.lineWidth = 6
  ctx.beginPath()
  ctx.arc(cx, cy - 4, r * 0.82, Math.PI * 1.15, Math.PI * 1.85)
  ctx.stroke()

  // Dark border
  ctx.strokeStyle = '#1a1a14'
  ctx.lineWidth = 10
  ctx.beginPath()
  ctx.arc(cx, cy, r, 0, Math.PI * 2)
  ctx.stroke()

  // Number text
  ctx.shadowColor = 'rgba(0,0,0,0.8)'
  ctx.shadowBlur = 10
  ctx.shadowOffsetY = 4
  const fontSize = number > 9 ? 108 : 128
  ctx.font = `900 ${fontSize}px "Cinzel Decorative", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // White fill with slight cream tint
  ctx.fillStyle = '#f5f0e0'
  ctx.fillText(number.toString(), cx, cy + 5)
  ctx.shadowColor = 'transparent'
  ctx.strokeStyle = '#2a2010'
  ctx.lineWidth = 5
  ctx.strokeText(number.toString(), cx, cy + 5)

  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)
  sprite.scale.set(1.1, 1.1, 1)
  return sprite
}

// ── Create Score Stone (numbered boulder) ─────────────────────────────────────
function createScoreStone(number) {
  const group = new THREE.Group()

  // Boulder body — irregular ellipsoid
  const geo = new THREE.SphereGeometry(0.62, 9, 7)
  // Randomise vertices slightly for organic feel
  const posArr = geo.attributes.position.array
  for (let i = 0; i < posArr.length; i++) {
    posArr[i] += (Math.random() - 0.5) * 0.12
  }
  geo.attributes.position.needsUpdate = true
  geo.computeVertexNormals()

  const mat = new THREE.MeshStandardMaterial({
    color: 0x6a6a60,
    roughness: 0.88,
    metalness: 0.06,
  })
  const stone = new THREE.Mesh(geo, mat)
  stone.scale.set(1, 0.62, 0.88)
  stone.castShadow  = true
  stone.receiveShadow = true
  group.add(stone)

  // Number sprite floats just above stone
  const sprite = createNumberSprite(number)
  sprite.position.set(0, 0.45, 0)
  sprite.scale.set(0.82, 0.82, 1)
  group.add(sprite)

  return group
}

// ── Create Flame Torch Group (tiki piece) ─────────────────────────────────────
function createFlameGroup(tikId, color) {
  const group = new THREE.Group()
  group.userData.tikId = tikId

  const flameCol = new THREE.Color(color)

  // ─ 1. Stone altar base ─
  const baseGeo = new THREE.CylinderGeometry(0.50, 0.64, 0.36, 10)
  const baseMat = new THREE.MeshStandardMaterial({
    color: 0x7a7a6a,
    roughness: 0.88,
    metalness: 0.08,
  })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = -0.52
  base.castShadow = true
  base.receiveShadow = true
  group.add(base)
  // Carved ring on altar
  const ringGeo = new THREE.TorusGeometry(0.52, 0.035, 7, 16)
  const ringMat = new THREE.MeshStandardMaterial({ color: 0x4a4a40, roughness: 0.92 })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = -0.44
  group.add(ring)

  // ─ 2. Bronze cup / bowl ─
  const cupGeo = new THREE.CylinderGeometry(0.38, 0.24, 0.46, 10)
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xb86e0a,
    emissive: new THREE.Color(0x3d1a00),
    emissiveIntensity: 0.35,
    roughness: 0.42,
    metalness: 0.72,
  })
  const cup = new THREE.Mesh(cupGeo, cupMat)
  cup.position.y = -0.11
  cup.castShadow = true
  group.add(cup)

  // Cup rim highlight
  const rimGeo = new THREE.TorusGeometry(0.39, 0.04, 8, 14)
  const rimMat = new THREE.MeshStandardMaterial({
    color: 0xd4a030,
    emissive: new THREE.Color(0x8b5500),
    emissiveIntensity: 0.5,
    roughness: 0.3,
    metalness: 0.85,
  })
  const rim = new THREE.Mesh(rimGeo, rimMat)
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.12
  group.add(rim)

  // ─ 3. Outer flame ─
  const flameGeo = new THREE.ConeGeometry(0.36, 1.05, 8)
  const flameMat = new THREE.MeshStandardMaterial({
    color: flameCol.clone(),
    emissive: flameCol.clone(),
    emissiveIntensity: 1.5,
    transparent: true,
    opacity: 0.88,
    roughness: 0.25,
    side: THREE.DoubleSide,
  })
  const flame = new THREE.Mesh(flameGeo, flameMat)
  flame.position.y = 0.67
  flame.userData.isFlame = true
  group.add(flame)
  group.userData.flameMesh = flame
  group.userData.bodyMesh  = flame   // animation API compatibility

  // ─ 4. Inner flame core ─
  const coreGeo = new THREE.ConeGeometry(0.20, 0.68, 8)
  const coreMat = new THREE.MeshStandardMaterial({
    color:  0xffee44,
    emissive: new THREE.Color(0xffcc00),
    emissiveIntensity: 2.2,
    transparent: true,
    opacity: 0.94,
    roughness: 0.2,
  })
  const core = new THREE.Mesh(coreGeo, coreMat)
  core.position.y = 0.70
  core.userData.isFlameCore = true
  group.add(core)
  group.userData.coreMesh = core
  group.userData.gem = core           // animation API compatibility

  // ─ 5. Ground glow disc ─
  const glowGeo = new THREE.CylinderGeometry(0.58, 0.66, 0.05, 14)
  const glowMat = new THREE.MeshStandardMaterial({
    color: flameCol.clone(),
    emissive: flameCol.clone(),
    emissiveIntensity: 0.9,
    transparent: true,
    opacity: 0.50,
    roughness: 0.3,
  })
  const glow = new THREE.Mesh(glowGeo, glowMat)
  glow.position.y = -0.72
  group.add(glow)
  group.userData.glowDisc = glow

  // ─ 6. Dynamic point light ─
  const ptLight = new THREE.PointLight(flameCol.clone(), 1.8, 3.5)
  ptLight.position.y = 0.8
  group.add(ptLight)
  group.userData.flameLight = ptLight

  return group
}

// ── Create Tiki Totem Gate (top of shaft) ────────────────────────────────────
function createTotemGate() {
  const group = new THREE.Group()
  const wood = new THREE.Color(0x4a2208)

  // Main head block
  const headGeo = new THREE.BoxGeometry(3.4, 2.6, 1.1)
  const headMat = new THREE.MeshStandardMaterial({
    color: wood,
    roughness: 0.72,
    metalness: 0.08,
  })
  const head = new THREE.Mesh(headGeo, headMat)
  head.castShadow = true
  group.add(head)

  // Carved face panel (lighter wood)
  const faceGeo = new THREE.BoxGeometry(3.1, 2.3, 0.15)
  const faceMat = new THREE.MeshStandardMaterial({
    color: 0x7a4418,
    roughness: 0.65,
    metalness: 0.05,
  })
  const face = new THREE.Mesh(faceGeo, faceMat)
  face.position.set(0, 0, 0.63)
  group.add(face)

  // Eyes (glowing orange)
  ;[[-0.82, 0.42], [0.82, 0.42]].forEach(([ex, ey]) => {
    const eyeGeo = new THREE.SphereGeometry(0.28, 12, 10)
    const eyeMat = new THREE.MeshStandardMaterial({
      color: 0xff8800,
      emissive: new THREE.Color(0xff4400),
      emissiveIntensity: 2.2,
      roughness: 0.18,
      metalness: 0.1,
    })
    const eye = new THREE.Mesh(eyeGeo, eyeMat)
    eye.position.set(ex, ey, 0.72)
    group.add(eye)

    // Eye ring
    const erGeo = new THREE.TorusGeometry(0.30, 0.06, 8, 16)
    const erMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      emissive: new THREE.Color(0x8b6914),
      emissiveIntensity: 0.8,
      roughness: 0.28,
      metalness: 0.88,
    })
    const er = new THREE.Mesh(erGeo, erMat)
    er.position.set(ex, ey, 0.68)
    group.add(er)
  })

  // Nose
  const noseGeo = new THREE.BoxGeometry(0.5, 0.38, 0.28)
  const noseMat = new THREE.MeshStandardMaterial({ color: 0x7a4418, roughness: 0.7 })
  const nose = new THREE.Mesh(noseGeo, noseMat)
  nose.position.set(0, 0.02, 0.76)
  group.add(nose)

  // Mouth opening (dark slot)
  const mouthGeo = new THREE.BoxGeometry(2.1, 0.52, 0.35)
  const mouthMat = new THREE.MeshStandardMaterial({ color: 0x050100, roughness: 0.96 })
  const mouth = new THREE.Mesh(mouthGeo, mouthMat)
  mouth.position.set(0, -0.68, 0.68)
  group.add(mouth)

  // Brow ridge
  const browGeo = new THREE.BoxGeometry(2.8, 0.24, 0.28)
  const browMat = new THREE.MeshStandardMaterial({ color: 0x3a1a06, roughness: 0.78 })
  const brow = new THREE.Mesh(browGeo, browMat)
  brow.position.set(0, 0.78, 0.66)
  brow.rotation.x = -0.15
  group.add(brow)

  // Crown spikes (5)
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    emissive: new THREE.Color(0x6a4800),
    emissiveIntensity: 0.6,
    roughness: 0.22,
    metalness: 0.92,
  })
  for (let i = 0; i < 5; i++) {
    const sGeo = new THREE.ConeGeometry(0.22, 0.78, 7)
    const s = new THREE.Mesh(sGeo, goldMat)
    s.position.set(-1.6 + i * 0.8, 1.68, 0)
    s.castShadow = true
    group.add(s)
  }

  // Base plinth
  const plinthGeo = new THREE.BoxGeometry(3.8, 0.38, 1.3)
  const plinthMat = new THREE.MeshStandardMaterial({ color: 0x2e1004, roughness: 0.82 })
  const plinth = new THREE.Mesh(plinthGeo, plinthMat)
  plinth.position.y = -1.5
  group.add(plinth)

  // Ambient glow from totem eyes
  const eyeGlow = new THREE.PointLight(0xff5500, 2.2, 6)
  eyeGlow.position.set(0, 0.42, 0.8)
  group.add(eyeGlow)

  return group
}

// ── Create Decorative Torch Post ──────────────────────────────────────────────
function createDecorativeTorch() {
  const group = new THREE.Group()

  // Post
  const postGeo = new THREE.CylinderGeometry(0.10, 0.14, 3.2, 8)
  const postMat = new THREE.MeshStandardMaterial({ color: 0x2a1005, roughness: 0.82, metalness: 0.08 })
  const post = new THREE.Mesh(postGeo, postMat)
  post.position.y = 1.6
  post.castShadow = true
  group.add(post)

  // Cup
  const cupGeo = new THREE.CylinderGeometry(0.18, 0.11, 0.24, 8)
  const cupMat = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    emissive: new THREE.Color(0x8b6914),
    emissiveIntensity: 0.5,
    roughness: 0.28,
    metalness: 0.88,
  })
  const cup = new THREE.Mesh(cupGeo, cupMat)
  cup.position.y = 3.32
  group.add(cup)

  // Flame outer
  const flGeo = new THREE.ConeGeometry(0.22, 0.70, 8)
  const flMat = new THREE.MeshStandardMaterial({
    color: 0xff7700,
    emissive: new THREE.Color(0xff3300),
    emissiveIntensity: 1.6,
    transparent: true,
    opacity: 0.88,
  })
  const fl = new THREE.Mesh(flGeo, flMat)
  fl.position.y = 3.78
  fl.userData.isTorchFlame = true
  group.add(fl)

  // Flame core
  const fcGeo = new THREE.ConeGeometry(0.11, 0.44, 8)
  const fcMat = new THREE.MeshStandardMaterial({
    color: 0xffee44,
    emissive: new THREE.Color(0xffcc00),
    emissiveIntensity: 2.0,
    transparent: true,
    opacity: 0.94,
  })
  const fc = new THREE.Mesh(fcGeo, fcMat)
  fc.position.y = 3.82
  fc.userData.isTorchCore = true
  group.add(fc)

  // Point light
  const ptl = new THREE.PointLight(0xff5500, 3.0, 8)
  ptl.position.y = 3.9
  group.add(ptl)

  return group
}

// ── Create Player Pawn ────────────────────────────────────────────────────────
function createPlayerPawn(playerColor, playerId) {
  const group = new THREE.Group()
  group.userData.playerId = playerId
  group.userData.currentScore = 0

  const col = new THREE.Color(playerColor)

  const baseGeo = new THREE.CylinderGeometry(0.28, 0.34, 0.16, 14)
  const baseMat = new THREE.MeshStandardMaterial({
    color: col.clone().multiplyScalar(0.7),
    emissive: col.clone().multiplyScalar(0.15),
    emissiveIntensity: 0.4,
    roughness: 0.5,
    metalness: 0.3,
  })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = 0.08
  base.castShadow = true
  group.add(base)

  const bodyGeo = new THREE.SphereGeometry(0.30, 14, 14)
  const bodyMat = new THREE.MeshStandardMaterial({
    color: col.clone(),
    emissive: col.clone().multiplyScalar(0.25),
    emissiveIntensity: 0.6,
    roughness: 0.38,
    metalness: 0.42,
  })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.40
  body.scale.set(1, 1.38, 1)
  body.castShadow = true
  group.add(body)

  const knobGeo = new THREE.SphereGeometry(0.12, 10, 10)
  const knobMat = new THREE.MeshStandardMaterial({
    color: col.clone().multiplyScalar(1.3),
    emissive: col.clone().multiplyScalar(0.4),
    emissiveIntensity: 0.7,
    roughness: 0.3,
    metalness: 0.5,
  })
  const knob = new THREE.Mesh(knobGeo, knobMat)
  knob.position.y = 0.78
  group.add(knob)

  const ringGeo = new THREE.TorusGeometry(0.36, 0.05, 8, 18)
  const ringMat = new THREE.MeshStandardMaterial({
    color: col.clone(),
    emissive: col.clone(),
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.72,
    roughness: 0.2,
    metalness: 0.6,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
  ring.rotation.x = Math.PI / 2
  ring.position.y = 0.03
  group.add(ring)

  return group
}

// ── Animation Queue ───────────────────────────────────────────────────────────
class AnimationQueue {
  constructor() { this.animations = [] }

  add(animation) {
    this.animations.push({ start: Date.now(), ...animation })
  }

  update() {
    const now = Date.now()
    this.animations = this.animations.filter(anim => {
      const t = Math.min(1, (now - anim.start) / anim.duration)
      anim.update(t)
      if (t >= 1 && anim.onComplete) {
        anim.onComplete()
        return false
      }
      return t < 1
    })
  }

  clear() { this.animations = [] }
}

// ── Animate Tiki Move ─────────────────────────────────────────────────────────
function animateTikiMove(animQueue, tikiGroup, fromZ, toZ) {
  const duration = 2200
  const startY   = TIKI_REST_Y
  const startRot = tikiGroup.rotation.y
  const distance = Math.abs(toZ - fromZ)
  const slots    = Math.round(distance / SLOT_SPACING)
  const riseH    = TIKI_RISE_Y + slots * 0.4
  const movingFwd = toZ < fromZ

  tikiGroup.userData.isAnimating = true
  const bodyMesh = tikiGroup.userData.bodyMesh
  const origEI   = bodyMesh.material.emissiveIntensity

  animQueue.add({
    duration,
    update: (t) => {
      if (t < 0.25) {
        const t1 = t / 0.25, e = easeOutCubic(t1)
        tikiGroup.position.y = startY + (riseH - startY) * e
        tikiGroup.position.z = fromZ
        tikiGroup.rotation.y = startRot + Math.sin(t1 * Math.PI) * 0.22
        tikiGroup.rotation.x = Math.sin(t1 * Math.PI * 0.5) * 0.15
        bodyMesh.material.emissiveIntensity = origEI + t1 * 0.7
        const sc = 1 + t1 * 0.1
        tikiGroup.scale.set(sc, sc, sc)
      } else if (t < 0.7) {
        const t2 = (t - 0.25) / 0.45, e = easeInOutCubic(t2)
        tikiGroup.position.y = riseH + Math.sin(t2 * Math.PI) * 1.3
        tikiGroup.position.z = fromZ + (toZ - fromZ) * e
        tikiGroup.rotation.y = startRot + (movingFwd ? 1 : -1) * t2 * Math.PI * 0.8
        tikiGroup.rotation.x = (movingFwd ? -0.15 : 0.15) + Math.sin(t2 * Math.PI) * 0.1
        bodyMesh.material.emissiveIntensity = origEI + 0.7
        tikiGroup.scale.set(1.1, 1.1, 1.1)
      } else {
        const t3 = (t - 0.7) / 0.3, e = easeOutBounce(t3)
        tikiGroup.position.y = riseH + (TIKI_REST_Y - riseH) * e
        tikiGroup.position.z = toZ
        tikiGroup.rotation.y = tikiGroup.rotation.y * (1 - t3)
        tikiGroup.rotation.x = tikiGroup.rotation.x * (1 - t3)
        const sc = 1.1 - 0.1 * t3
        tikiGroup.scale.set(sc, sc, sc)
        bodyMesh.material.emissiveIntensity = origEI + 0.7 * (1 - t3)
      }
    },
    onComplete: () => {
      tikiGroup.position.set(0, TIKI_REST_Y, toZ)
      tikiGroup.rotation.set(0, 0, 0)
      tikiGroup.scale.set(1, 1, 1)
      bodyMesh.material.emissiveIntensity = origEI
      tikiGroup.userData.isAnimating = false
    },
  })
}

// ── Animate Topple ────────────────────────────────────────────────────────────
function animateTopple(animQueue, tikiGroup, fromZ, toZ) {
  const duration = 2000
  const startY   = TIKI_REST_Y
  const startRot = tikiGroup.rotation.y
  const riseH    = TIKI_RISE_Y + 1.0

  tikiGroup.userData.isAnimating = true
  const bodyMesh = tikiGroup.userData.bodyMesh
  const origEI   = bodyMesh.material.emissiveIntensity

  animQueue.add({
    duration,
    update: (t) => {
      if (t < 0.25) {
        const t1 = t / 0.25, e = easeOutCubic(t1)
        tikiGroup.position.y = startY + (riseH - startY) * e
        tikiGroup.position.z = fromZ
        tikiGroup.rotation.x = e * 0.4
        tikiGroup.rotation.y = startRot + Math.sin(t1 * Math.PI) * 0.25
        bodyMesh.material.emissiveIntensity = origEI + t1 * 0.6
      } else if (t < 0.7) {
        const t2 = (t - 0.25) / 0.45, e = easeInOutCubic(t2)
        tikiGroup.position.y = riseH + Math.sin(t2 * Math.PI) * 0.6
        tikiGroup.position.z = fromZ + (toZ - fromZ) * e
        tikiGroup.rotation.x = 0.4 + t2 * Math.PI * 1.8
        tikiGroup.rotation.y = startRot + t2 * Math.PI * 2.5
        tikiGroup.rotation.z = Math.sin(t2 * Math.PI * 2) * 0.3
        bodyMesh.material.emissiveIntensity = origEI + 0.6
      } else {
        const t3 = (t - 0.7) / 0.3, e = easeInCubic(t3)
        tikiGroup.position.y = riseH * 0.3 + (TIKI_REST_Y - riseH * 0.3) * e
        tikiGroup.position.z = toZ
        tikiGroup.rotation.x = (0.4 + Math.PI * 1.8) * (1 - e)
        tikiGroup.rotation.y = (startRot + Math.PI * 2.5) * (1 - e)
        tikiGroup.rotation.z = tikiGroup.rotation.z * (1 - e)
        if (t3 > 0.5) {
          tikiGroup.position.y = TIKI_REST_Y + Math.sin((t3 - 0.5) / 0.5 * Math.PI) * 0.15
        }
        bodyMesh.material.emissiveIntensity = origEI + 0.6 * (1 - t3)
      }
    },
    onComplete: () => {
      tikiGroup.position.set(0, TIKI_REST_Y, toZ)
      tikiGroup.rotation.set(0, 0, 0)
      bodyMesh.material.emissiveIntensity = origEI
      tikiGroup.userData.isAnimating = false
    },
  })
}

// ── Animate Toast ─────────────────────────────────────────────────────────────
function animateToast(animQueue, tikiGroup, scene, onDone) {
  const duration = 1400
  const startScale = tikiGroup.scale.x
  const startY  = tikiGroup.position.y

  tikiGroup.userData.isAnimating = true

  animQueue.add({
    duration,
    update: (t) => {
      if (t < 0.2) {
        const t1 = t / 0.2, e = easeInCubic(t1)
        tikiGroup.position.y = startY - 0.1 * e
        const sc = startScale * (1 - 0.1 * e)
        tikiGroup.scale.set(sc, sc, sc)
      } else if (t < 0.35) {
        const t2 = (t - 0.2) / 0.15, e = easeOutCubic(t2)
        tikiGroup.position.y = startY - 0.1 + 0.8 * e
        const sc = startScale * (0.9 + 0.6 * e)
        tikiGroup.scale.set(sc, sc, sc)
        tikiGroup.rotation.y = t2 * Math.PI * 0.5
        tikiGroup.traverse(obj => {
          if (obj.material?.emissiveIntensity !== undefined)
            obj.material.emissiveIntensity *= (1 + t2)
        })
      } else if (t < 0.5) {
        tikiGroup.position.y = startY + 0.7
        tikiGroup.scale.set(1.5, 1.5, 1.5)
      } else {
        const t4 = (t - 0.5) / 0.5, e = easeInCubic(t4)
        tikiGroup.position.y = startY + 0.7 + t4 * 5
        tikiGroup.position.x += Math.sin(t4 * Math.PI * 2) * 0.3
        tikiGroup.rotation.y += t4 * Math.PI * 3
        tikiGroup.rotation.x  = t4 * Math.PI * 1.2
        const sc = 1.5 * (1 - e)
        tikiGroup.scale.set(sc, sc, sc)
        tikiGroup.traverse(obj => {
          if (obj.material) {
            obj.material.opacity = 1 - e
            obj.material.transparent = true
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

// ── Particle Burst ────────────────────────────────────────────────────────────
function spawnParticleBurst(animQueue, scene, origin) {
  const particles = []
  const pGeo = new THREE.SphereGeometry(0.10, 6, 6)
  const colors = [0xff6b1a, 0xffd700, 0xff8c00, 0xffaa00]

  for (let i = 0; i < 20; i++) {
    const pMat = new THREE.MeshStandardMaterial({
      color: colors[i % 4],
      emissive: new THREE.Color(colors[i % 4]),
      emissiveIntensity: 1.0,
      transparent: true,
    })
    const p = new THREE.Mesh(pGeo, pMat)
    p.position.copy(origin)
    const angle = (i / 20) * Math.PI * 2
    const speed = 2.5 + Math.random() * 1.5
    p.userData.velocity = {
      x: Math.cos(angle) * speed,
      y: 3.5 + Math.random() * 2.5,
      z: Math.sin(angle) * speed,
    }
    p.castShadow = true
    scene.add(p)
    particles.push(p)
  }

  animQueue.add({
    duration: 1000,
    update: (t) => {
      particles.forEach(p => {
        const v = p.userData.velocity
        p.position.x += v.x * 0.016
        p.position.y += v.y * 0.016 - 6.0 * t * t * 0.016
        p.position.z += v.z * 0.016
        p.rotation.x += 0.1
        p.rotation.y += 0.15
        p.material.opacity = 1 - t
        const sc = 1 - t * 0.7
        p.scale.set(sc, sc, sc)
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

// ── Animate Pawn to Score ─────────────────────────────────────────────────────
function animatePawnToScore(animQueue, pawn, targetScore, spritePositions) {
  const duration = 1200
  const startPos = pawn.position.clone()

  let targetX, targetZ
  if (targetScore === 0) {
    targetX = -8
    targetZ = 10
  } else {
    const sp = spritePositions.find(s => s.position === targetScore)
    if (!sp) return
    targetX = sp.x < 0 ? sp.x + 1.4 : sp.x - 1.4
    targetZ = sp.z < -8 ? sp.z + 1.2 : sp.z
  }

  pawn.userData.isAnimating = true
  const ring = pawn.children.find(c => c.geometry?.type === 'TorusGeometry')
  const origRI = ring ? ring.material.emissiveIntensity : 1.2

  animQueue.add({
    duration,
    update: (t) => {
      const e = easeInOutCubic(t)
      pawn.position.x = startPos.x + (targetX - startPos.x) * e
      pawn.position.z = startPos.z + (targetZ - startPos.z) * e
      pawn.position.y = 0.4 + Math.sin(t * Math.PI) * 1.0
      pawn.rotation.y = e * Math.PI * 2
      if (ring) ring.material.emissiveIntensity = origRI + Math.sin(t * Math.PI * 4) * 0.4
    },
    onComplete: () => {
      pawn.position.set(targetX, 0.4, targetZ)
      pawn.rotation.y = 0
      if (ring) ring.material.emissiveIntensity = origRI
      pawn.userData.isAnimating = false
      pawn.userData.currentScore = targetScore
    },
  })
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ══════════════════════════════════════════════════════════════════════════════

const TikiBoard = forwardRef(({
  board, boardState, validTargets = [], onTikiSelect,
  isInteractive = true, isMyTurn, selectedCard,
  onTikiClick, validTikiIds, roundNumber, players = [],
}, ref) => {
  const containerRef     = useRef()
  const sceneRef         = useRef()
  const cameraRef        = useRef()
  const rendererRef      = useRef()
  const tikiGroupsRef    = useRef([])
  const playerPawnsRef   = useRef([])
  const animQueueRef     = useRef(new AnimationQueue())
  const validTargetIdsRef = useRef([])
  const hoveredTikiRef   = useRef(null)
  const tikiClickCbRef   = useRef(null)
  const mouseRef         = useRef(new THREE.Vector2())
  const raycasterRef     = useRef(new THREE.Raycaster())
  const frameIdRef       = useRef(null)
  const startTimeRef     = useRef(Date.now())

  // ── Initialize Scene ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const scene = new THREE.Scene()
    sceneRef.current = scene

    // Camera — slightly elevated top-down view, portrait orientation
    const camera = new THREE.PerspectiveCamera(
      54,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      200,
    )
    camera.position.set(0, 20, 26)
    camera.lookAt(0, 0, -1)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
    renderer.setClearColor(0x000000, 0)
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.15
    containerRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // ── Lighting ───────────────────────────────────────────────────────────
    // Warm tropical ambient
    scene.add(new THREE.AmbientLight(0xffe0a0, 0.55))

    // Overhead sun
    const sun = new THREE.DirectionalLight(0xfff0cc, 2.6)
    sun.position.set(3, 22, 8)
    sun.castShadow = true
    sun.shadow.mapSize.setScalar(2048)
    sun.shadow.camera.near = 0.5
    sun.shadow.camera.far  = 70
    sun.shadow.camera.left = sun.shadow.camera.bottom = -18
    sun.shadow.camera.right = sun.shadow.camera.top   = 18
    sun.shadow.bias = -0.0001
    scene.add(sun)

    // Sky fill from opposite side
    const fill = new THREE.DirectionalLight(0x80c0ff, 0.28)
    fill.position.set(-8, 12, -5)
    scene.add(fill)

    // ── Sandy ground floor ─────────────────────────────────────────────────
    const floorGeo = new THREE.PlaneGeometry(22, 28)
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x8a7258,
      roughness: 0.92,
      metalness: 0.0,
    })
    const floor = new THREE.Mesh(floorGeo, floorMat)
    floor.rotation.x = -Math.PI / 2
    floor.position.y = -0.28
    floor.receiveShadow = true
    scene.add(floor)

    // ── Central wooden shaft ───────────────────────────────────────────────
    // Board plank (full shaft length, portrait)
    const shaftLen = 19.5
    const plankGeo = new THREE.BoxGeometry(2.55, 0.44, shaftLen)
    const plankMat = new THREE.MeshStandardMaterial({
      color: 0x5c2e08,
      roughness: 0.72,
      metalness: 0.08,
    })
    const plank = new THREE.Mesh(plankGeo, plankMat)
    plank.position.set(0, 0, 0)
    plank.castShadow  = true
    plank.receiveShadow = true
    scene.add(plank)

    // Inner channel (recessed dark slot where torches sit)
    const channelGeo = new THREE.BoxGeometry(1.85, 0.52, 19.4)
    const channelMat = new THREE.MeshStandardMaterial({
      color: 0x1a0800,
      roughness: 0.96,
    })
    const channel = new THREE.Mesh(channelGeo, channelMat)
    channel.position.set(0, 0.26, 0)
    channel.receiveShadow = true
    scene.add(channel)

    // Side rails with gold trim
    ;[-1.28, 1.28].forEach(x => {
      const railGeo = new THREE.BoxGeometry(0.24, 0.42, 20.0)
      const railMat = new THREE.MeshStandardMaterial({ color: 0x4a2208, roughness: 0.68, metalness: 0.12 })
      const rail = new THREE.Mesh(railGeo, railMat)
      rail.position.set(x, 0.21, 0)
      rail.castShadow = true
      rail.receiveShadow = true
      scene.add(rail)

      const trimGeo = new THREE.BoxGeometry(0.09, 0.05, 20.0)
      const trimMat = new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        emissive: new THREE.Color(0x8b6914),
        emissiveIntensity: 0.6,
        roughness: 0.28,
        metalness: 0.88,
      })
      const trim = new THREE.Mesh(trimGeo, trimMat)
      trim.position.set(x, 0.44, 0)
      scene.add(trim)
    })

    // Wood grain stripes along shaft
    for (let i = 0; i < 8; i++) {
      const stripeGeo = new THREE.BoxGeometry(2.56, 0.022, 0.1)
      const stripeMat = new THREE.MeshStandardMaterial({ color: 0x1a0800, roughness: 0.94 })
      const stripe = new THREE.Mesh(stripeGeo, stripeMat)
      stripe.position.set(0, 0.23, -8.2 + i * 2.3)
      scene.add(stripe)
    }

    // ── Tiki Totem Gate at top of shaft ────────────────────────────────────
    const totem = createTotemGate()
    totem.position.set(0, 1.36, -10.0)
    scene.add(totem)

    // ── Decorative torch posts flanking shaft ──────────────────────────────
    const torchZPositions = [-6.5, -3.2, 0.1, 3.4, 6.5]
    ;[-1.85, 1.85].forEach(x => {
      torchZPositions.forEach(z => {
        const t = createDecorativeTorch()
        t.position.set(x, 0, z)
        scene.add(t)
      })
    })

    // ── START marker ───────────────────────────────────────────────────────
    const startCanvas = document.createElement('canvas')
    startCanvas.width = 320; startCanvas.height = 128
    const sctx = startCanvas.getContext('2d')
    const sg = sctx.createLinearGradient(0, 0, 320, 0)
    sg.addColorStop(0, '#4a2208'); sg.addColorStop(0.5, '#7a4420'); sg.addColorStop(1, '#4a2208')
    const rrPath = () => {
      sctx.beginPath()
      sctx.moveTo(24, 8)
      sctx.lineTo(296, 8)
      sctx.arcTo(312, 8, 312, 24, 16)
      sctx.lineTo(312, 104)
      sctx.arcTo(312, 120, 296, 120, 16)
      sctx.lineTo(24, 120)
      sctx.arcTo(8, 120, 8, 104, 16)
      sctx.lineTo(8, 24)
      sctx.arcTo(8, 8, 24, 8, 16)
      sctx.closePath()
    }
    sctx.fillStyle = sg
    rrPath(); sctx.fill()
    sctx.strokeStyle = '#d4af37'; sctx.lineWidth = 5
    rrPath(); sctx.stroke()
    sctx.fillStyle = '#d4af37'
    sctx.font = '700 56px "Cinzel Decorative", serif'
    sctx.textAlign = 'center'; sctx.textBaseline = 'middle'
    sctx.fillText('START', 160, 64)
    const startTex = new THREE.CanvasTexture(startCanvas)
    const startSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: startTex, transparent: true, depthTest: false }))
    startSprite.position.set(0, 0.9, 10.4)
    startSprite.scale.set(3.2, 1.28, 1)
    scene.add(startSprite)

    // ── Score stones (perimeter track, 35 positions) ───────────────────────
    const spritePositions = []

    // Left side: 1–14, bottom (z=+8) → top (z=-6.5)
    for (let i = 0; i < 14; i++) {
      const t  = i / 13
      const x  = -4.7 + (i % 2 === 0 ? 0 : -0.22)  // slight stagger
      const z  = 8.0 - t * 14.5
      const stone = createScoreStone(i + 1)
      stone.position.set(x, 0.18, z)
      scene.add(stone)
      spritePositions.push({ position: i + 1, x, z })
    }

    // Top arc: 15–20, left → right at z ≈ -9
    for (let i = 0; i < 6; i++) {
      const t  = i / 5
      const x  = -4.0 + t * 8.0
      const z  = -8.9 - Math.sin(t * Math.PI) * 0.55
      const stone = createScoreStone(15 + i)
      stone.position.set(x, 0.18, z)
      scene.add(stone)
      spritePositions.push({ position: 15 + i, x, z })
    }

    // Right side: 21–35, top (z=-7) → bottom (z=+8.5)
    for (let i = 0; i < 15; i++) {
      const t  = i / 14
      const x  = 4.7 + (i % 2 === 0 ? 0 : 0.22)
      const z  = -7.0 + t * 15.5
      const stone = createScoreStone(21 + i)
      stone.position.set(x, 0.18, z)
      scene.add(stone)
      spritePositions.push({ position: 21 + i, x, z })
    }

    sceneRef.current.userData.spritePositions = spritePositions

    // ── Animation loop ─────────────────────────────────────────────────────
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate)
      const elapsed = (Date.now() - startTimeRef.current) / 1000

      animQueueRef.current.update()

      // Decorative torch flicker
      scene.traverse(obj => {
        if (obj.userData.isTorchFlame) {
          const ft = elapsed * 3.5
          obj.scale.set(
            0.72 * (1 + Math.sin(ft * 1.8) * 0.10),
            1.55 * (1 + Math.sin(ft) * 0.18 + Math.sin(ft * 2.4) * 0.07),
            0.72 * (1 + Math.sin(ft * 2.2) * 0.07),
          )
          obj.material.emissiveIntensity = 1.6 * (0.78 + Math.sin(ft * 2.1) * 0.20)
        }
        if (obj.userData.isTorchCore) {
          const ft = elapsed * 3.5 + 1.8
          obj.scale.set(
            0.38 * (1 + Math.sin(ft * 1.8) * 0.09),
            1.05 * (1 + Math.sin(ft) * 0.18 + Math.sin(ft * 2.4) * 0.07),
            0.38 * (1 + Math.sin(ft * 2.2) * 0.07),
          )
          obj.material.emissiveIntensity = 2.0 * (0.78 + Math.sin(ft * 2.1) * 0.20)
        }
      })

      // Tiki flame flicker + hover + highlight pulse
      tikiGroupsRef.current.forEach((tikiGroup, idx) => {
        if (!tikiGroup.visible) return

        const isAnimating = tikiGroup.userData.isAnimating
        const isHovered   = hoveredTikiRef.current === tikiGroup.userData.tikId
        const isValid     = validTargetIdsRef.current.includes(tikiGroup.userData.tikId)
        const bodyMesh    = tikiGroup.userData.bodyMesh
        const core        = tikiGroup.userData.coreMesh
        const glowDisc    = tikiGroup.userData.glowDisc
        const ptLight     = tikiGroup.userData.flameLight

        // Position / hover effect
        if (!isAnimating) {
          if (isHovered && isValid) {
            tikiGroup.position.y = TIKI_HOVER_Y + Math.sin(elapsed * 3.5) * 0.06
            tikiGroup.rotation.z = Math.sin(elapsed * 2.8) * 0.04
          } else if (isValid) {
            tikiGroup.position.y = TIKI_REST_Y + 0.16 + Math.sin(elapsed * 2.2 + idx * 0.8) * 0.07
            tikiGroup.rotation.z = 0
          } else {
            tikiGroup.position.y = TIKI_REST_Y + Math.sin(elapsed * 1.4 + idx * 0.55) * 0.03
            tikiGroup.rotation.z = 0
          }
        }

        // Flame flicker (always active, independent of highlight state)
        const ft = elapsed * 3.2 + idx * 0.7
        if (!isAnimating && bodyMesh?.userData?.isTorchFlame !== false) {
          bodyMesh.scale.set(
            1 + Math.sin(ft * 1.6) * 0.08,
            1 + Math.sin(ft) * 0.16 + Math.sin(ft * 2.5) * 0.06,
            1 + Math.sin(ft * 2.0) * 0.07,
          )
          if (core) {
            core.scale.set(
              1 + Math.sin(ft * 1.6 + 1) * 0.07,
              1 + Math.sin(ft + 1) * 0.14,
              1 + Math.sin(ft * 2.0 + 1) * 0.06,
            )
          }
        }

        // Emissive intensity for highlight state
        if (isValid && validTargetIdsRef.current.length > 0) {
          const pulse = (Math.sin(elapsed * 4.0 + idx * 0.3) + 1) * 0.5
          const ei = isHovered ? 2.6 + pulse * 0.8 : 1.9 + pulse * 0.6
          bodyMesh.material.emissiveIntensity = ei
          if (core) core.material.emissiveIntensity = 2.8 + pulse * 1.0
          if (glowDisc) glowDisc.material.emissiveIntensity = 1.4 + pulse * 0.9
          if (ptLight) ptLight.intensity = 2.8 + pulse * 1.2
        } else {
          bodyMesh.material.emissiveIntensity = 1.5
          if (core) core.material.emissiveIntensity = 2.2
          if (glowDisc) glowDisc.material.emissiveIntensity = 0.9
          if (ptLight) ptLight.intensity = 1.8
        }
      })

      // Raycasting for hover detection
      if (isInteractive) {
        raycasterRef.current.setFromCamera(mouseRef.current, camera)
        const bodies = tikiGroupsRef.current
          .filter(g => g.visible)
          .map(g => g.userData.bodyMesh)
          .filter(Boolean)
        const hits = raycasterRef.current.intersectObjects(bodies)
        if (hits.length > 0) {
          hoveredTikiRef.current = hits[0].object.parent.userData.tikId
          renderer.domElement.style.cursor = validTargetIdsRef.current.includes(hoveredTikiRef.current)
            ? 'pointer' : 'default'
        } else {
          hoveredTikiRef.current = null
          renderer.domElement.style.cursor = 'default'
        }
      }

      renderer.render(scene, camera)
    }
    animate()

    // ── Event listeners ────────────────────────────────────────────────────
    const onMouseMove = (e) => {
      const rect = renderer.domElement.getBoundingClientRect()
      mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    }

    const onClick = () => {
      if (!isInteractive || !hoveredTikiRef.current) return
      if (validTargetIdsRef.current.includes(hoveredTikiRef.current)) {
        tikiClickCbRef.current?.(hoveredTikiRef.current)
        onTikiSelect?.(hoveredTikiRef.current)
      }
    }

    let resizeTimer
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        if (!containerRef.current) return
        camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight
        camera.updateProjectionMatrix()
        renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight)
      }, 150)
    }

    renderer.domElement.addEventListener('mousemove', onMouseMove)
    renderer.domElement.addEventListener('click', onClick)
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      renderer.domElement.removeEventListener('mousemove', onMouseMove)
      renderer.domElement.removeEventListener('click', onClick)
      window.removeEventListener('resize', onResize)
      tikiGroupsRef.current.forEach(g => {
        g.traverse(o => {
          o.geometry?.dispose()
          if (o.material) {
            Array.isArray(o.material) ? o.material.forEach(m => m.dispose()) : o.material.dispose()
          }
        })
      })
      renderer.dispose()
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement)
      }
    }
  }, [])

  // ── Board API ───────────────────────────────────────────────────────────────
  const initBoard = (tikiList) => {
    const scene = sceneRef.current
    if (!scene) return

    tikiGroupsRef.current.forEach(g => {
      scene.remove(g)
      g.traverse(o => {
        o.geometry?.dispose()
        if (o.material) {
          Array.isArray(o.material) ? o.material.forEach(m => m.dispose()) : o.material.dispose()
        }
      })
    })
    tikiGroupsRef.current = []

    const sorted = [...tikiList].sort((a, b) => a.position - b.position)
    sorted.forEach((tiki, index) => {
      const data  = TIKI_DATA[tiki.id] || { color: '#ff8533' }
      const group = createFlameGroup(tiki.id, data.color)
      group.position.set(0, TIKI_REST_Y, slotZ(index))
      scene.add(group)
      tikiGroupsRef.current.push(group)
    })
  }

  const initPawns = (playersList) => {
    const scene = sceneRef.current
    if (!scene) return

    playerPawnsRef.current.forEach(p => {
      scene.remove(p)
      p.traverse(o => {
        o.geometry?.dispose()
        if (o.material) {
          Array.isArray(o.material) ? o.material.forEach(m => m.dispose()) : o.material.dispose()
        }
      })
    })
    playerPawnsRef.current = []

    playersList.forEach((player, i) => {
      const pawn = createPlayerPawn(player.color, player.id)
      pawn.position.set(-8 - i * 0.7, 0.4, 10)
      scene.add(pawn)
      playerPawnsRef.current.push(pawn)
    })
  }

  const updatePawnScores = (playersList) => {
    const scene = sceneRef.current
    if (!scene?.userData.spritePositions) return
    const sp = scene.userData.spritePositions
    playersList.forEach(player => {
      const pawn = playerPawnsRef.current.find(p => p.userData.playerId === player.id)
      if (pawn && pawn.userData.currentScore !== player.score) {
        animatePawnToScore(animQueueRef.current, pawn, player.score, sp)
      }
    })
  }

  const updateBoard = (newBoardState) => {
    if (!newBoardState || !Array.isArray(newBoardState)) return
    newBoardState.forEach((item, newIndex) => {
      const tikId = typeof item === 'string' ? item : item.id
      const g = tikiGroupsRef.current.find(g => g.userData.tikId === tikId)
      if (!g) return
      const curZ = g.position.z
      const tarZ = slotZ(newIndex)
      if (Math.abs(curZ - tarZ) > 0.1) {
        const slots = Math.round(Math.abs(tarZ - curZ) / SLOT_SPACING)
        if (newIndex === newBoardState.length - 1 && slots > 3) {
          animateTopple(animQueueRef.current, g, curZ, tarZ)
        } else {
          animateTikiMove(animQueueRef.current, g, curZ, tarZ)
        }
      }
    })
  }

  const toastTiki = (tikId, onDone) => {
    const scene = sceneRef.current
    const g = tikiGroupsRef.current.find(g => g.userData.tikId === tikId)
    if (g && scene) {
      spawnParticleBurst(animQueueRef.current, scene, g.position.clone())
      animateToast(animQueueRef.current, g, scene, onDone)
    }
  }

  const highlightValidTargets = (tikIds) => {
    validTargetIdsRef.current = tikIds || []
  }

  const clearHighlights = () => {
    validTargetIdsRef.current = []
    hoveredTikiRef.current = null
    // Emissive state is managed by the animation loop based on validTargetIdsRef
  }

  const onTikiClicked = (cb) => { tikiClickCbRef.current = cb }

  useImperativeHandle(ref, () => ({
    initBoard, initPawns, updatePawnScores, updateBoard,
    toastTiki, highlightValidTargets, clearHighlights, onTikiClicked,
  }))

  // ── Sync effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (board?.length > 0 && sceneRef.current) {
      initBoard(board.map((t, i) => ({ id: t.id, name: t.name || t.id, position: i + 1 })))
    }
  }, [board])

  useEffect(() => {
    if (players?.length > 0 && sceneRef.current) initPawns(players)
  }, [players.length])

  useEffect(() => {
    if (players?.length > 0 && playerPawnsRef.current.length > 0) updatePawnScores(players)
  }, [players.map(p => `${p.id}:${p.score}`).join(',')])

  useEffect(() => {
    if (boardState && tikiGroupsRef.current.length > 0) updateBoard(boardState)
  }, [boardState])

  useEffect(() => {
    if (onTikiClick) onTikiClicked(onTikiClick)
  }, [onTikiClick])

  useEffect(() => {
    if (isInteractive && (validTikiIds || validTargets)) {
      highlightValidTargets(validTikiIds || validTargets || [])
    } else {
      clearHighlights()
    }
  }, [validTikiIds, validTargets, isInteractive])

  return (
    <div
      ref={containerRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  )
})

TikiBoard.displayName = 'TikiBoard'
export default TikiBoard
