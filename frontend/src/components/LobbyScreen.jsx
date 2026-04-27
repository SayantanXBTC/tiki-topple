import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as THREE from 'three'
import useGameStore from '../store/gameStore'
import { useSocketContext } from '../context/SocketContext'
import { AVATAR_MAP } from '../data/avatars'

// ── Player Slot Positions (around the campfire) ───────────────────────────────
const PLAYER_SLOTS = [
  { position: new THREE.Vector3(-1.8, 1.55, 3.2),  rotation: Math.PI * 0.85 },
  { position: new THREE.Vector3( 1.8, 1.55, 3.2),  rotation: Math.PI * 1.15 },
  { position: new THREE.Vector3(-2.8, 1.55, 0.8),  rotation: Math.PI * 0.6  },
  { position: new THREE.Vector3( 2.8, 1.55, 0.8),  rotation: Math.PI * 1.4  },
]

const SKIN_COLORS = { 1: 0xc87040, 2: 0x8B4a28, 3: 0xd4905a, 4: 0x5a2c10, 5: 0xe8b870 }

const seededRng = (seed) => {
  let s = seed
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff }
}

// ══════════════════════════════════════════════════════════════════════════════
// 3D SCENE BUILDERS
// ══════════════════════════════════════════════════════════════════════════════

// ── Stone Ritual Platform ─────────────────────────────────────────────────────
function createStonePlatform(scene) {
  // Main platform body — stone/earth texture
  const platGeo = new THREE.CylinderGeometry(9.5, 7.5, 2.2, 10, 3, false)
  const pos = platGeo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i)
    if (y > 0.5) {
      pos.setX(i, pos.getX(i) + (Math.random() - 0.5) * 1.4)
      pos.setZ(i, pos.getZ(i) + (Math.random() - 0.5) * 1.4)
      pos.setY(i, y + Math.random() * 0.6)
    }
  }
  platGeo.computeVertexNormals()
  const platMat = new THREE.MeshLambertMaterial({ color: 0x8a6a40, flatShading: true })
  const plat = new THREE.Mesh(platGeo, platMat)
  plat.receiveShadow = true
  scene.add(plat)

  // Sandy inner surface
  const surfGeo = new THREE.CylinderGeometry(9.0, 9.0, 0.18, 10)
  const surfMat = new THREE.MeshLambertMaterial({ color: 0xa07848, flatShading: true })
  const surf = new THREE.Mesh(surfGeo, surfMat)
  surf.position.y = 1.18
  surf.receiveShadow = true
  scene.add(surf)

  // Rock underbase (darker)
  const baseGeo = new THREE.CylinderGeometry(7.5, 9, 1.5, 10)
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x5a4030, flatShading: true })
  const base = new THREE.Mesh(baseGeo, baseMat)
  base.position.y = -1.8
  scene.add(base)

  // Arranged border stones around edge
  for (let i = 0; i < 22; i++) {
    const angle = (i / 22) * Math.PI * 2
    const r = 8.2 + (Math.random() - 0.5) * 0.8
    const sGeo = new THREE.SphereGeometry(0.45 + Math.random() * 0.35, 5, 4)
    const sMat = new THREE.MeshLambertMaterial({
      color: [0x7a6450, 0x8a7460, 0x6a5840, 0x9a8468][i % 4],
      flatShading: true,
    })
    const s = new THREE.Mesh(sGeo, sMat)
    s.position.set(Math.cos(angle) * r, 1.35 + Math.random() * 0.25, Math.sin(angle) * r)
    s.scale.set(1 + Math.random() * 0.4, 0.65 + Math.random() * 0.3, 1 + Math.random() * 0.4)
    s.castShadow = true
    s.receiveShadow = true
    scene.add(s)
  }

  // Inner stone ring around fire
  for (let i = 0; i < 14; i++) {
    const angle = (i / 14) * Math.PI * 2
    const sGeo = new THREE.SphereGeometry(0.28 + Math.random() * 0.1, 5, 4)
    const sMat = new THREE.MeshLambertMaterial({ color: 0x6a5840, flatShading: true })
    const s = new THREE.Mesh(sGeo, sMat)
    s.position.set(Math.cos(angle) * 1.35, 1.6, Math.sin(angle) * 1.35)
    s.scale.y = 0.55
    scene.add(s)
  }

  // Scattered ground pebbles
  const rng = seededRng(42)
  for (let i = 0; i < 40; i++) {
    const angle = rng() * Math.PI * 2
    const r = 1.8 + rng() * 6.5
    const pGeo = new THREE.SphereGeometry(0.06 + rng() * 0.12, 4, 3)
    const pMat = new THREE.MeshLambertMaterial({ color: 0x806050, flatShading: true })
    const p = new THREE.Mesh(pGeo, pMat)
    p.position.set(Math.cos(angle) * r, 1.28, Math.sin(angle) * r)
    p.scale.y = 0.5
    scene.add(p)
  }

  return plat
}

// ── Dramatic Campfire ─────────────────────────────────────────────────────────
function createCampfire(scene) {
  const group = new THREE.Group()
  group.position.set(0, 1.5, 0)

  // Fire bowl base — carved stone
  const bowlGeo = new THREE.CylinderGeometry(0.85, 0.65, 0.55, 12)
  const bowlMat = new THREE.MeshLambertMaterial({ color: 0x5a4028, flatShading: true })
  const bowl = new THREE.Mesh(bowlGeo, bowlMat)
  bowl.position.y = -0.42
  bowl.castShadow = true
  bowl.receiveShadow = true
  group.add(bowl)

  // Bowl rim
  const rimGeo = new THREE.TorusGeometry(0.88, 0.09, 6, 14)
  const rimMat = new THREE.MeshLambertMaterial({ color: 0x7a6040, flatShading: true })
  const rim = new THREE.Mesh(rimGeo, rimMat)
  rim.rotation.x = Math.PI / 2
  rim.position.y = -0.16
  group.add(rim)

  // Crossed logs
  for (let i = 0; i < 4; i++) {
    const logGeo = new THREE.CylinderGeometry(0.09, 0.13, 1.9, 6)
    const logMat = new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0x2a1005 : 0x3d1e08 })
    const log = new THREE.Mesh(logGeo, logMat)
    log.rotation.z = Math.PI / 2
    log.rotation.y = (i * Math.PI) / 2
    log.position.set(Math.cos((i * Math.PI) / 2) * 0.18, -0.22, Math.sin((i * Math.PI) / 2) * 0.18)
    group.add(log)
  }

  // Ember glow base
  const emberGeo = new THREE.CylinderGeometry(0.55, 0.65, 0.12, 10)
  const emberMat = new THREE.MeshBasicMaterial({ color: 0xff2200 })
  const embers = new THREE.Mesh(emberGeo, emberMat)
  embers.position.y = -0.08
  group.add(embers)

  // LARGE dramatic multi-layer flames
  const flames = []
  const flameConfigs = [
    { r: 0.65, h: 1.6,  y: 0.1,  color: 0xcc1800 },
    { r: 0.52, h: 2.1,  y: 0.3,  color: 0xff3300 },
    { r: 0.40, h: 2.7,  y: 0.5,  color: 0xff6600 },
    { r: 0.28, h: 3.2,  y: 0.7,  color: 0xff9900 },
    { r: 0.18, h: 3.7,  y: 0.9,  color: 0xffcc00 },
    { r: 0.10, h: 4.2,  y: 1.1,  color: 0xffee80 },
    { r: 0.055,h: 4.6,  y: 1.2,  color: 0xffffff },
  ]
  flameConfigs.forEach((cfg, i) => {
    const fGeo = new THREE.ConeGeometry(cfg.r, cfg.h, 7 - Math.min(i, 3))
    const fMat = new THREE.MeshBasicMaterial({
      color: cfg.color,
      transparent: i >= 5,
      opacity: i === 6 ? 0.55 : i === 5 ? 0.78 : 1,
    })
    const flame = new THREE.Mesh(fGeo, fMat)
    flame.position.y = cfg.y + cfg.h / 2
    flame.userData.isCampflame = true
    flame.userData.idx = i
    flames.push(flame)
    group.add(flame)
  })

  group.userData.flames = flames
  scene.add(group)
  return group
}

// ── Premium Bamboo Lattice Torch ──────────────────────────────────────────────
function createTikiTorch(scene, x, z) {
  const group = new THREE.Group()
  const bambooA = new THREE.MeshLambertMaterial({ color: 0x8a6a18, flatShading: true })
  const bambooB = new THREE.MeshLambertMaterial({ color: 0x6a4e10, flatShading: true })
  const darkMat = new THREE.MeshLambertMaterial({ color: 0x2a1508, flatShading: true })

  // Main central pole (segmented bamboo)
  const POLE_H = 6.8
  for (let i = 0; i < 5; i++) {
    const segH = 1.4
    const segGeo = new THREE.CylinderGeometry(0.08 - i * 0.005, 0.1 - i * 0.005, segH, 7)
    const seg = new THREE.Mesh(segGeo, i % 2 === 0 ? bambooA : bambooB)
    seg.position.y = 0.7 + i * segH
    group.add(seg)
    // Node ring
    const nodeGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.08, 7)
    const node = new THREE.Mesh(nodeGeo, bambooB)
    node.position.y = i * segH + 1.35
    group.add(node)
  }

  // Lattice frame at top — 4 diagonal struts + horizontal ring
  const FRAME_Y = POLE_H - 0.4
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2 + Math.PI / 4
    const dx = Math.cos(angle)
    const dz = Math.sin(angle)
    // Diagonal strut
    const diagGeo = new THREE.CylinderGeometry(0.045, 0.06, 1.8, 5)
    const diag = new THREE.Mesh(diagGeo, bambooA)
    diag.position.set(dx * 0.45, FRAME_Y, dz * 0.45)
    diag.rotation.y = -angle
    diag.rotation.z = 0.55
    group.add(diag)
  }
  // Horizontal crossbeams connecting strut tops
  for (let i = 0; i < 4; i++) {
    const a1 = (i / 4) * Math.PI * 2 + Math.PI / 4
    const a2 = ((i + 1) / 4) * Math.PI * 2 + Math.PI / 4
    const x1 = Math.cos(a1) * 0.88, z1 = Math.sin(a1) * 0.88
    const x2 = Math.cos(a2) * 0.88, z2 = Math.sin(a2) * 0.88
    const len = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2)
    const cGeo = new THREE.CylinderGeometry(0.04, 0.04, len, 5)
    const c = new THREE.Mesh(cGeo, bambooA)
    c.position.set((x1 + x2) / 2, FRAME_Y + 0.55, (z1 + z2) / 2)
    c.rotation.y = -Math.atan2(z2 - z1, x2 - x1)
    c.rotation.z = Math.PI / 2
    group.add(c)
  }

  // Fire basket
  const basketGeo = new THREE.CylinderGeometry(0.32, 0.22, 0.40, 9)
  const basket = new THREE.Mesh(basketGeo, darkMat)
  basket.position.y = FRAME_Y + 0.55
  group.add(basket)
  // Basket rim
  const bRimGeo = new THREE.TorusGeometry(0.34, 0.04, 5, 10)
  const bRim = new THREE.Mesh(bRimGeo, bambooB)
  bRim.rotation.x = Math.PI / 2
  bRim.position.y = FRAME_Y + 0.73
  group.add(bRim)

  // Torch flames
  const outerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.24, 0.72, 7),
    new THREE.MeshBasicMaterial({ color: 0xff5500 })
  )
  outerFlame.position.y = FRAME_Y + 1.12
  outerFlame.userData.isTorchFlame = true
  outerFlame.userData.outerFlame = true
  group.add(outerFlame)

  const midFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.14, 0.58, 6),
    new THREE.MeshBasicMaterial({ color: 0xff9900 })
  )
  midFlame.position.y = FRAME_Y + 1.1
  midFlame.userData.isTorchFlame = true
  group.add(midFlame)

  const innerFlame = new THREE.Mesh(
    new THREE.ConeGeometry(0.07, 0.42, 5),
    new THREE.MeshBasicMaterial({ color: 0xffee00 })
  )
  innerFlame.position.y = FRAME_Y + 1.08
  innerFlame.userData.isTorchFlame = true
  group.add(innerFlame)

  group.position.set(x, 0.5, z)
  group.userData.torchFlames = [outerFlame, midFlame, innerFlame]
  scene.add(group)
  return group
}

// ── Treasure Chest ────────────────────────────────────────────────────────────
function createTreasureChest(scene, x, z) {
  const group = new THREE.Group()
  const woodMat  = new THREE.MeshLambertMaterial({ color: 0x5c3210, flatShading: true })
  const darkMat  = new THREE.MeshLambertMaterial({ color: 0x3a1e08, flatShading: true })
  const goldMat  = new THREE.MeshLambertMaterial({ color: 0xd4a400, emissive: new THREE.Color(0x6b5200), emissiveIntensity: 0.7 })
  const metalMat = new THREE.MeshLambertMaterial({ color: 0xa07820, flatShading: true })

  // Body
  const bodyGeo = new THREE.BoxGeometry(1.5, 0.85, 0.98)
  const body = new THREE.Mesh(bodyGeo, woodMat)
  body.position.y = 0.42
  body.castShadow = true
  group.add(body)

  // Metal banding on body
  for (let i = 0; i < 3; i++) {
    const bandGeo = new THREE.BoxGeometry(1.52, 0.07, 1.0)
    const band = new THREE.Mesh(bandGeo, metalMat)
    band.position.y = 0.1 + i * 0.36
    group.add(band)
  }

  // Lid (slightly open)
  const lidGeo = new THREE.BoxGeometry(1.5, 0.48, 0.98)
  const lid = new THREE.Mesh(lidGeo, darkMat)
  lid.position.set(0, 1.06, -0.32)
  lid.rotation.x = -0.38
  lid.castShadow = true
  group.add(lid)

  // Lid banding
  const lidBandGeo = new THREE.BoxGeometry(1.52, 0.07, 1.0)
  const lidBand = new THREE.Mesh(lidBandGeo, metalMat)
  lidBand.position.set(0, 1.06, -0.32)
  lidBand.rotation.x = -0.38
  group.add(lidBand)

  // Gold inside (emissive glow)
  const goldGeo = new THREE.BoxGeometry(1.15, 0.38, 0.68)
  const gold = new THREE.Mesh(goldGeo, goldMat)
  gold.position.set(0, 0.62, 0.05)
  group.add(gold)

  // Lock
  const lockGeo = new THREE.BoxGeometry(0.18, 0.18, 0.12)
  const lock = new THREE.Mesh(lockGeo, metalMat)
  lock.position.set(0, 0.84, 0.5)
  group.add(lock)

  group.position.set(x, 1.3, z)
  group.rotation.y = 0.3
  group.scale.setScalar(0.88)
  scene.add(group)
  return group
}

// ── Scattered Game Cards ──────────────────────────────────────────────────────
function createScatteredCards(scene, cx, cz) {
  const rng = seededRng(99)
  for (let i = 0; i < 5; i++) {
    const cGeo = new THREE.BoxGeometry(0.72, 0.025, 0.96)
    const cMat = new THREE.MeshLambertMaterial({
      color: [0x1a1a4e, 0x1e0a3a, 0x0a1e3e, 0x2a0030, 0x18183e][i],
      flatShading: true,
    })
    const card = new THREE.Mesh(cGeo, cMat)
    card.position.set(cx + (rng() - 0.5) * 1.2, 1.33 + i * 0.02, cz + (rng() - 0.5) * 1.0)
    card.rotation.y = rng() * Math.PI * 2
    card.rotation.x = -(rng() * 0.08)
    scene.add(card)

    // Card border highlight
    const bGeo = new THREE.BoxGeometry(0.75, 0.026, 0.99)
    const bMat = new THREE.MeshLambertMaterial({ color: 0xd4af37, emissive: new THREE.Color(0x6b5200), emissiveIntensity: 0.4 })
    const border = new THREE.Mesh(bGeo, bMat)
    border.position.copy(card.position)
    border.position.y -= 0.005
    border.rotation.copy(card.rotation)
    scene.add(border)
  }
}

// ── Tiki Idol ─────────────────────────────────────────────────────────────────
function createTikiIdol(scene, x, z) {
  const group = new THREE.Group()
  const stoneMat = new THREE.MeshLambertMaterial({ color: 0x2e4228, flatShading: true })
  const faceMat  = new THREE.MeshLambertMaterial({ color: 0x3a5430, flatShading: true })
  const goldMat  = new THREE.MeshLambertMaterial({ color: 0xd4af37, emissive: new THREE.Color(0x6b5200), emissiveIntensity: 0.7 })

  // Base platform
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.35, 2.0), stoneMat)
  base.position.y = 0
  group.add(base)

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.68, 2.4, 8), stoneMat)
  body.position.y = 1.35
  group.add(body)

  // Carved bands
  for (let b = 0; b < 3; b++) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.045, 5, 11), new THREE.MeshLambertMaterial({ color: 0x1e2e18, flatShading: true }))
    band.rotation.x = Math.PI / 2
    band.position.y = 0.5 + b * 0.7
    group.add(band)
  }

  // Face plate
  const face = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.2), faceMat)
  face.position.set(0, 1.55, 0.52)
  group.add(face)

  // Eyes (jade emissive)
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0x00e060 })
  ;[-0.24, 0.24].forEach(ex => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 8), eyeMat)
    eye.position.set(ex, 1.68, 0.66)
    eye.userData.isIdolEye = true
    group.add(eye)
    // Gold eye ring
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 6, 12), goldMat)
    ring.position.set(ex, 1.68, 0.64)
    ring.rotation.y = 0.1
    group.add(ring)
  })

  // Nose
  const nose = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.16), faceMat)
  nose.position.set(0, 1.44, 0.66)
  group.add(nose)

  // Mouth
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.13, 0.14), new THREE.MeshLambertMaterial({ color: 0x0a1408 }))
  mouth.position.set(0, 1.18, 0.64)
  group.add(mouth)
  // Teeth
  for (let t = 0; t < 4; t++) {
    const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.09, 0.08), new THREE.MeshLambertMaterial({ color: 0xf0e8d0 }))
    tooth.position.set(-0.18 + t * 0.12, 1.18, 0.67)
    group.add(tooth)
  }

  // Brow
  const brow = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.11, 0.16), new THREE.MeshLambertMaterial({ color: faceMat.color.clone().multiplyScalar(0.7) }))
  brow.position.set(0, 1.82, 0.60)
  group.add(brow)

  // Crown
  const crownBase = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 0.13, 18), goldMat)
  crownBase.position.y = 2.65
  group.add(crownBase)
  for (let s = 0; s < 5; s++) {
    const angle = (s / 5) * Math.PI * 2
    const spike = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.45, 6), goldMat)
    spike.position.set(Math.cos(angle) * 0.40, 2.90, Math.sin(angle) * 0.40)
    spike.rotation.z = Math.cos(angle) * 0.3
    spike.rotation.x = Math.sin(angle) * 0.3
    group.add(spike)
  }

  group.userData.eyes = group.children.filter(c => c.userData.isIdolEye)
  group.position.set(x, 1.3, z)
  group.rotation.y = 0.4
  scene.add(group)
  return group
}

// ── Palm Tree ─────────────────────────────────────────────────────────────────
function createPalmTree(scene, x, z, lean = 0.12) {
  const group = new THREE.Group()
  let curX = 0, curY = 0
  for (let i = 0; i < 5; i++) {
    const t = i / 5
    const segGeo = new THREE.CylinderGeometry(0.16 - t * 0.05, 0.20 - t * 0.04, 1.3, 7)
    const seg = new THREE.Mesh(segGeo, new THREE.MeshLambertMaterial({ color: i % 2 === 0 ? 0x5a3a12 : 0x4a3010, flatShading: true }))
    const angle = lean * i
    seg.position.set(curX + Math.sin(angle) * 0.3, curY + 0.65, 0)
    seg.rotation.z = -angle
    curX += Math.sin(angle) * 0.3
    curY += 1.3
    group.add(seg)
  }
  // Fronds
  const frondMat = new THREE.MeshLambertMaterial({ color: 0x2a6018, flatShading: true, side: THREE.DoubleSide })
  for (let f = 0; f < 7; f++) {
    const angle = (f / 7) * Math.PI * 2
    const frondGeo = new THREE.PlaneGeometry(0.28, 2.2)
    const frond = new THREE.Mesh(frondGeo, frondMat)
    frond.position.set(curX + Math.cos(angle) * 1.1, curY + 0.1, Math.sin(angle) * 1.1)
    frond.rotation.y = -angle
    frond.rotation.z = Math.PI / 3.5
    group.add(frond)
  }
  group.position.set(x, 0.5, z)
  scene.add(group)
  return group
}

// ── Jungle Background (mountains + trees) ─────────────────────────────────────
function createJungleBackground(scene) {
  // Dark jungle mountains behind
  const rng = seededRng(55)
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2
    const r = 22 + rng() * 8
    const h = 10 + rng() * 16
    const mGeo = new THREE.ConeGeometry(4 + rng() * 4, h, 5 + Math.floor(rng() * 3))
    const mMat = new THREE.MeshLambertMaterial({
      color: [0x0a2a14, 0x0d3318, 0x0e2c16, 0x082010][i % 4],
      flatShading: true,
    })
    const m = new THREE.Mesh(mGeo, mMat)
    m.position.set(Math.cos(angle) * r, h / 2 - 4, Math.sin(angle) * r)
    scene.add(m)
  }

  // Waterfall (back-left)
  const cliffMat = new THREE.MeshLambertMaterial({ color: 0x1a2818, flatShading: true })
  const cliff = new THREE.Mesh(new THREE.BoxGeometry(6, 14, 2), cliffMat)
  cliff.position.set(-14, 5, -18)
  scene.add(cliff)

  // Water stream (white/blue)
  const streamMat = new THREE.MeshBasicMaterial({ color: 0x80c0d8, transparent: true, opacity: 0.8 })
  const stream = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 10), streamMat)
  stream.position.set(-14, 2, -17.2)
  stream.userData.isWaterfall = true
  scene.add(stream)

  // Mist at waterfall base
  const mistGeo = new THREE.SphereGeometry(2.8, 7, 5)
  const mistMat = new THREE.MeshBasicMaterial({ color: 0xc0dde8, transparent: true, opacity: 0.22 })
  const mist = new THREE.Mesh(mistGeo, mistMat)
  mist.position.set(-14, -2.5, -16)
  mist.scale.y = 0.4
  scene.add(mist)

  // Dense jungle tree clusters around perimeter
  const treeMat = new THREE.MeshLambertMaterial({ color: 0x1a4018, flatShading: true })
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2
    const r = 14 + rng() * 4
    const h = 5 + rng() * 7
    const tGeo = new THREE.ConeGeometry(2.5 + rng() * 2, h, 5)
    const tree = new THREE.Mesh(tGeo, treeMat)
    tree.position.set(Math.cos(angle) * r, h / 2 - 1, Math.sin(angle) * r)
    scene.add(tree)
    // Trunk
    const trunkGeo = new THREE.CylinderGeometry(0.25, 0.35, 3, 6)
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x3a2208, flatShading: true })
    const trunk = new THREE.Mesh(trunkGeo, trunkMat)
    trunk.position.set(Math.cos(angle) * r, 0.5, Math.sin(angle) * r)
    scene.add(trunk)
  }

  // Undergrowth ferns around platform edge
  const fernMat = new THREE.MeshLambertMaterial({ color: 0x254a18, flatShading: true, side: THREE.DoubleSide })
  for (let i = 0; i < 28; i++) {
    const angle = rng() * Math.PI * 2
    const r = 9.5 + rng() * 3.5
    for (let f = 0; f < 4; f++) {
      const fGeo = new THREE.PlaneGeometry(0.4 + rng() * 0.5, 0.9 + rng() * 0.7)
      const fern = new THREE.Mesh(fGeo, fernMat)
      fern.position.set(
        Math.cos(angle) * r + (rng() - 0.5) * 0.8,
        1.45 + rng() * 0.3,
        Math.sin(angle) * r + (rng() - 0.5) * 0.8
      )
      fern.rotation.y = rng() * Math.PI * 2
      fern.rotation.x = -(0.15 + rng() * 0.25)
      scene.add(fern)
    }
  }
}

// ── Water (surrounding lake) ──────────────────────────────────────────────────
function createWater(scene) {
  const wGeo = new THREE.CylinderGeometry(42, 42, 0.4, 32)
  const wMat = new THREE.MeshLambertMaterial({ color: 0x0a2d38, transparent: true, opacity: 0.88 })
  const water = new THREE.Mesh(wGeo, wMat)
  water.position.y = -3.8
  water.userData.isWater = true
  scene.add(water)
}

// ── Starfield ─────────────────────────────────────────────────────────────────
function createStarfield(scene) {
  const geo = new THREE.BufferGeometry()
  const count = 800
  const positions = new Float32Array(count * 3)
  const rng = seededRng(999)
  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (rng() - 0.5) * 300
    positions[i * 3 + 1] = 30 + rng() * 80
    positions[i * 3 + 2] = (rng() - 0.5) * 300
  }
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({ color: 0xffeedd, size: 0.18, sizeAttenuation: true })
  scene.add(new THREE.Points(geo, mat))
}

// ── Character Builder ─────────────────────────────────────────────────────────
function buildLobbyCharacter(avatarId, playerColor) {
  const group = new THREE.Group()
  const color = new THREE.Color(playerColor)
  const skinColor = SKIN_COLORS[avatarId] || 0xc87040

  // Sitting body (wider, squatter)
  const bodyGeo = new THREE.BoxGeometry(0.72, 0.78, 0.48)
  const bodyMat = new THREE.MeshLambertMaterial({ color, flatShading: true })
  const body = new THREE.Mesh(bodyGeo, bodyMat)
  body.position.y = 0.55
  body.castShadow = true
  group.add(body)

  // Cross-legged lower half (flat oval)
  const legGeo = new THREE.CylinderGeometry(0.52, 0.50, 0.22, 8)
  const legMat = new THREE.MeshLambertMaterial({ color: color.clone().multiplyScalar(0.75), flatShading: true })
  const legs = new THREE.Mesh(legGeo, legMat)
  legs.position.y = 0.11
  legs.castShadow = true
  group.add(legs)

  // Arms stretched forward (toward fire)
  const armGeo = new THREE.CylinderGeometry(0.08, 0.10, 0.55, 6)
  const armMat = new THREE.MeshLambertMaterial({ color: skinColor, flatShading: true })
  const leftArm = new THREE.Mesh(armGeo, armMat)
  leftArm.position.set(-0.38, 0.62, 0.28)
  leftArm.rotation.x = 0.55
  leftArm.rotation.z = 0.25
  group.add(leftArm)
  group.userData.leftArm = leftArm

  const rightArm = new THREE.Mesh(armGeo, armMat)
  rightArm.position.set(0.38, 0.62, 0.28)
  rightArm.rotation.x = 0.55
  rightArm.rotation.z = -0.25
  group.add(rightArm)
  group.userData.rightArm = rightArm

  // Hands
  const handGeo = new THREE.SphereGeometry(0.12, 5, 4)
  const handMat = new THREE.MeshLambertMaterial({ color: skinColor, flatShading: true })
  const lHand = new THREE.Mesh(handGeo, handMat)
  lHand.position.set(-0.52, 0.38, 0.5)
  group.add(lHand)
  const rHand = new THREE.Mesh(handGeo, handMat)
  rHand.position.set(0.52, 0.38, 0.5)
  group.add(rHand)

  // Neck
  const neck = new THREE.Mesh(
    new THREE.CylinderGeometry(0.15, 0.17, 0.18, 6),
    new THREE.MeshLambertMaterial({ color: skinColor })
  )
  neck.position.set(0, 1.02, 0)
  group.add(neck)

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.30, 8, 7),
    new THREE.MeshLambertMaterial({ color: skinColor, flatShading: true })
  )
  head.scale.set(0.95, 1.05, 1)
  head.position.y = 1.38
  head.castShadow = true
  group.add(head)
  group.userData.head = head

  // Tiki mask face (colorful, slightly in front of head)
  const maskMat = new THREE.MeshLambertMaterial({ color: 0x2a6a20, flatShading: true })
  const mask = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.40, 0.16), maskMat)
  mask.position.set(0, 1.40, 0.28)
  group.add(mask)

  // Mask eyes (yellow)
  const mEyeMat = new THREE.MeshBasicMaterial({ color: 0xffe000 })
  ;[-0.13, 0.13].forEach(ex => {
    const mEye = new THREE.Mesh(new THREE.SphereGeometry(0.07, 5, 4), mEyeMat)
    mEye.position.set(ex, 1.44, 0.36)
    group.add(mEye)
  })

  // Mask mouth
  const mMouth = new THREE.Mesh(
    new THREE.BoxGeometry(0.24, 0.07, 0.1),
    new THREE.MeshLambertMaterial({ color: 0xcc2200 })
  )
  mMouth.position.set(0, 1.28, 0.35)
  group.add(mMouth)

  // Avatar-based accessory
  if (avatarId === 1) {
    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.44), new THREE.MeshLambertMaterial({ color: 0xffd700, flatShading: true }))
    cap.position.set(0, 1.72, 0)
    group.add(cap)
  } else if (avatarId === 2) {
    const feather = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.32, 0.07), new THREE.MeshLambertMaterial({ color: 0xe74c3c, flatShading: true }))
    feather.position.set(0, 1.86, -0.18)
    feather.rotation.x = -0.35
    group.add(feather)
  } else if (avatarId === 3) {
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.20, 0.46, 5), new THREE.MeshLambertMaterial({ color: 0x2a1806, flatShading: true }))
    hat.position.set(0, 1.82, 0)
    group.add(hat)
  }

  return group
}

// ── Name Label ────────────────────────────────────────────────────────────────
function createNameLabel(name, isHost) {
  const canvas = document.createElement('canvas')
  canvas.width = 280; canvas.height = 78
  const ctx = canvas.getContext('2d')

  // Dark wood background
  ctx.fillStyle = 'rgba(18,8,2,0.94)'
  ctx.fillRect(0, 0, 280, 78)

  // Gold border
  ctx.strokeStyle = isHost ? '#d4af37' : 'rgba(212,175,55,0.7)'
  ctx.lineWidth = 2.5
  ctx.strokeRect(2, 2, 276, 74)

  // Name
  ctx.fillStyle = isHost ? '#d4af37' : '#f5e8c0'
  ctx.font = `900 26px "Cinzel Decorative", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(name, 140, isHost ? 26 : 39)

  if (isHost) {
    ctx.fillStyle = 'rgba(212,175,55,0.85)'
    ctx.font = '700 14px "Cinzel Decorative", serif'
    ctx.fillText('★ HOST', 140, 57)
  }

  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas) }))
  sprite.scale.set(2.4, 0.62, 1)
  sprite.position.y = 2.65
  return sprite
}

// ── Sky Drop Animation ────────────────────────────────────────────────────────
function animateCharacterDrop(character, targetPos, onComplete) {
  const startY = 40
  const startTime = Date.now()
  const fallDur = 750, bounceDur = 400

  character.position.set(targetPos.x, startY, targetPos.z)
  character.visible = true

  const animate = () => {
    const elapsed = Date.now() - startTime
    if (elapsed < fallDur) {
      const t = elapsed / fallDur
      const eased = 1 - Math.pow(1 - t, 2.5)
      character.position.y = startY - (startY - targetPos.y - 1.5) * eased
      character.rotation.y += 0.08
      requestAnimationFrame(animate)
    } else if (elapsed < fallDur + bounceDur) {
      const t = (elapsed - fallDur) / bounceDur
      const heights = [2.2, 0.8, 1.3, 0.25, 0]
      const idx = Math.min(Math.floor(t * 4), 3)
      const local = (t * 4) % 1
      character.position.y = targetPos.y + heights[idx] + (heights[idx + 1] - heights[idx]) * local
      const sq = 1 - Math.sin(t * Math.PI) * 0.4
      character.scale.set(1 + (1 - sq) * 0.4, sq, 1 + (1 - sq) * 0.4)
      requestAnimationFrame(animate)
    } else {
      character.position.y = targetPos.y
      character.scale.set(1, 1, 1)
      if (onComplete) onComplete()
    }
  }
  animate()
}

// ══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════

function WoodPanel({ children, style }) {
  return (
    <div style={{
      background: 'linear-gradient(160deg, #2d1608 0%, #1e0e04 55%, #140a02 100%)',
      border: '1.5px solid rgba(212,175,55,0.42)',
      borderRadius: 16,
      boxShadow: '0 16px 48px rgba(0,0,0,0.75), inset 0 1px 0 rgba(212,175,55,0.12), 0 0 0 1px rgba(212,175,55,0.06)',
      position: 'relative', overflow: 'hidden',
      ...style,
    }}>
      {/* Top gold shimmer */}
      <div style={{
        position: 'absolute', top: 0, left: '8%', right: '8%', height: 1,
        background: 'linear-gradient(90deg, transparent, rgba(212,175,55,0.65), transparent)',
      }} />
      {/* Subtle wood grain lines */}
      {[20, 45, 68, 88].map((pct, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${pct}%`, left: 0, right: 0, height: 1,
          background: 'rgba(0,0,0,0.18)', opacity: 0.5,
        }} />
      ))}
      {children}
    </div>
  )
}

function AvatarCircle({ player, size = 44 }) {
  const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      border: `2px solid ${player.color}`,
      boxShadow: `0 0 10px ${player.color}66`,
      background: `radial-gradient(circle at 40% 30%, ${player.color}55, rgba(10,4,0,0.9))`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    }}>
      {avatar
        ? <div dangerouslySetInnerHTML={{ __html: avatar.svg }} style={{ width: '82%', height: '82%' }} />
        : <span style={{ color: 'white', fontSize: size * 0.38, fontFamily: '"Cinzel Decorative",cursive', fontWeight: 700 }}>
            {player.name[0]?.toUpperCase()}
          </span>
      }
    </div>
  )
}

function PlayerSlot({ player, isMe, isEmpty }) {
  if (isEmpty) {
    return (
      <motion.div
        animate={{ opacity: [0.25, 0.5, 0.25] }}
        transition={{ duration: 2.6, repeat: Infinity }}
        style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '11px 18px', borderBottom: '1px solid rgba(212,175,55,0.07)',
        }}
      >
        <div style={{
          width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
          border: '1.5px dashed rgba(212,175,55,0.22)',
          background: 'rgba(0,0,0,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18, color: 'rgba(212,175,55,0.25)',
        }}>?</div>
        <span style={{ fontSize: 13, color: 'rgba(212,175,55,0.3)', fontStyle: 'italic', fontFamily: '"Crimson Text",serif' }}>
          Waiting for player…
        </span>
      </motion.div>
    )
  }
  return (
    <motion.div
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 22 }}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 18px', borderBottom: '1px solid rgba(212,175,55,0.08)',
        background: isMe ? 'rgba(212,175,55,0.06)' : 'transparent',
        borderLeft: isMe ? '3px solid rgba(212,175,55,0.5)' : '3px solid transparent',
      }}
    >
      <AvatarCircle player={player} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 15, fontFamily: '"Cinzel Decorative",cursive',
          color: isMe ? '#f5ead0' : 'rgba(245,234,208,0.80)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          fontWeight: isMe ? 700 : 500,
        }}>{player.name}</div>
        {isMe && (
          <div style={{ fontSize: 9, color: 'rgba(212,175,55,0.65)', fontFamily: '"Cinzel Decorative",cursive', letterSpacing: '2px', marginTop: 2 }}>
            YOU
          </div>
        )}
      </div>
      <div style={{
        background: isMe
          ? 'linear-gradient(135deg, rgba(212,175,55,0.85), rgba(168,134,42,0.9))'
          : 'rgba(212,175,55,0.12)',
        border: `1px solid ${isMe ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.25)'}`,
        color: isMe ? '#1a0800' : 'rgba(212,175,55,0.7)',
        borderRadius: 5, padding: '3px 9px',
        fontSize: 9, fontFamily: '"Cinzel Decorative",cursive',
        fontWeight: 700, letterSpacing: '1px', flexShrink: 0,
      }}>
        {isMe ? 'YOU' : (player.isHost ? 'HOST' : player.name.slice(0, 3).toUpperCase())}
      </div>
      <motion.div
        animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.3, 1] }}
        transition={{ duration: 1.6, repeat: Infinity }}
        style={{ width: 8, height: 8, borderRadius: '50%', background: '#30e050', boxShadow: '0 0 8px #30e050', flexShrink: 0 }}
      />
    </motion.div>
  )
}

// ── Warm Fireflies ────────────────────────────────────────────────────────────
function WarmFireflies() {
  const rng = seededRng(88)
  const flies = Array.from({ length: 22 }, (_, i) => ({
    id: i, x: rng() * 100, y: 15 + rng() * 75,
    driftX: (rng() - 0.5) * 50, driftY: -(30 + rng() * 50),
    dur: 6 + rng() * 8, delay: rng() * 10,
    size: 2 + rng() * 2.5,
    color: rng() > 0.5 ? 'rgba(255,160,20,0.9)' : 'rgba(255,220,60,0.85)',
    glow: rng() > 0.5 ? 'rgba(255,140,10,0.7)' : 'rgba(255,200,40,0.6)',
  }))
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, overflow: 'hidden' }}>
      {flies.map(f => (
        <motion.div
          key={f.id}
          animate={{ y: [0, f.driftY], x: [0, f.driftX], opacity: [0, 0.9, 0.7, 0] }}
          transition={{ duration: f.dur, delay: f.delay, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute', left: `${f.x}%`, top: `${f.y}%`,
            width: f.size, height: f.size, borderRadius: '50%',
            background: f.color, boxShadow: `0 0 ${f.size * 2.5}px ${f.glow}`,
            willChange: 'transform, opacity',
          }}
        />
      ))}
    </div>
  )
}

// ── Bottom Player Badges ──────────────────────────────────────────────────────
function PlayerBadges({ players, myPlayerId }) {
  if (!players || players.length === 0) return null
  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 200, damping: 22 }}
      style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 14, alignItems: 'center', zIndex: 20,
        pointerEvents: 'none',
      }}
    >
      {players.map(player => {
        const isMe = player.id === myPlayerId
        const avatar = player.avatarId ? AVATAR_MAP[player.avatarId] : null
        return (
          <motion.div
            key={player.id}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              background: 'linear-gradient(135deg, rgba(30,12,2,0.95) 0%, rgba(18,7,1,0.97) 100%)',
              border: `1.5px solid ${isMe ? 'rgba(212,175,55,0.6)' : 'rgba(212,175,55,0.3)'}`,
              borderRadius: 999, padding: '6px 16px 6px 8px',
              boxShadow: isMe
                ? '0 0 16px rgba(212,175,55,0.2), 0 4px 14px rgba(0,0,0,0.7)'
                : '0 4px 14px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
              border: `2px solid ${player.color}`,
              boxShadow: `0 0 10px ${player.color}66`,
              background: `radial-gradient(circle at 40% 30%, ${player.color}44, rgba(8,2,0,0.9))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatar
                ? <div dangerouslySetInnerHTML={{ __html: avatar.svg }} style={{ width: '82%', height: '82%' }} />
                : <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>{player.name[0]?.toUpperCase()}</span>
              }
            </div>
            <div>
              <div style={{ fontSize: 13, fontFamily: '"Cinzel Decorative",cursive', color: isMe ? '#f5ead0' : 'rgba(245,234,208,0.75)', fontWeight: isMe ? 700 : 500 }}>
                {player.name}
              </div>
              <div style={{ fontSize: 9, color: 'rgba(212,175,55,0.65)', fontFamily: '"Cinzel Decorative",cursive', letterSpacing: '1.5px' }}>
                {isMe ? 'YOU' : player.score ?? 0}
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN LOBBY SCREEN
// ══════════════════════════════════════════════════════════════════════════════
export default function LobbyScreen() {
  const canvasRef      = useRef()
  const sceneRef       = useRef()
  const rendererRef    = useRef()
  const cameraRef      = useRef()
  const charactersRef  = useRef({})
  const fireLightRef   = useRef()
  const campfireRef    = useRef()
  const torchesRef     = useRef([])
  const idolRef        = useRef()
  const frameIdRef     = useRef()
  const startTimeRef   = useRef(performance.now())
  const cameraBaseRef  = useRef({ x: 0, y: 16, z: 22 })
  const mouseRef       = useRef({ x: 0, y: 0 })
  const previousPlayersRef = useRef([])

  const { myRoomCode, myPlayerId, isHost, lobbyPlayers } = useGameStore()
  const { startGame }  = useSocketContext()
  const [copied, setCopied]       = useState(false)
  const [showToast, setShowToast] = useState(null)

  const canStart = isHost && lobbyPlayers.length >= 2

  // ── Mouse parallax ────────────────────────────────────────────────────────
  useEffect(() => {
    const onMove = (e) => {
      mouseRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2,
      }
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  // ── Init 3D Scene ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x020509)
    scene.fog = new THREE.FogExp2(0x030810, 0.014)
    sceneRef.current = scene

    const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.current })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.05
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    rendererRef.current = renderer

    const camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 500)
    camera.position.set(0, 16, 22)
    camera.lookAt(0, 1.2, 0)
    cameraRef.current = camera

    // ── Lighting ──────────────────────────────────────────────────────────
    // Dark ambient (night jungle)
    scene.add(new THREE.AmbientLight(0x0d1a08, 0.65))

    // Cool moonlight from behind
    const moonLight = new THREE.DirectionalLight(0x4a70a0, 0.65)
    moonLight.position.set(10, 24, -12)
    moonLight.castShadow = true
    moonLight.shadow.mapSize.width = 2048
    moonLight.shadow.mapSize.height = 2048
    moonLight.shadow.camera.near = 0.5
    moonLight.shadow.camera.far = 80
    moonLight.shadow.camera.left = moonLight.shadow.camera.bottom = -24
    moonLight.shadow.camera.right = moonLight.shadow.camera.top = 24
    scene.add(moonLight)

    // Warm fill from camera direction
    const warmFill = new THREE.DirectionalLight(0x5a3010, 0.30)
    warmFill.position.set(0, 10, 18)
    scene.add(warmFill)

    // Campfire point light (main, flickering)
    const fireLight = new THREE.PointLight(0xff6010, 5.5, 18)
    fireLight.position.set(0, 3.5, 0)
    fireLight.castShadow = true
    fireLight.shadow.mapSize.width = 512
    fireLight.shadow.mapSize.height = 512
    scene.add(fireLight)
    fireLightRef.current = fireLight

    // Secondary warm fire fill
    const fireLight2 = new THREE.PointLight(0xffa030, 2.2, 11)
    fireLight2.position.set(0, 2, 0)
    scene.add(fireLight2)

    // Torch point lights
    const torchLightPositions = [
      [-5, 4, -2.5, 0xff8820, 2.2, 10],
      [ 5, 4, -2.5, 0xff8820, 2.2, 10],
      [-4, 4,  3.5, 0xffa030, 1.8,  9],
      [ 4, 4,  3.5, 0xffa030, 1.8,  9],
    ]
    torchLightPositions.forEach(([x, y, z, color, intensity, dist]) => {
      const tl = new THREE.PointLight(color, intensity, dist)
      tl.position.set(x, y, z)
      scene.add(tl)
    })

    // Green tiki eye fill
    const eyeFill = new THREE.PointLight(0x00c040, 0.8, 6)
    eyeFill.position.set(-6.5, 3, -5.5)
    scene.add(eyeFill)

    // ── Build Scene ───────────────────────────────────────────────────────
    createStonePlatform(scene)
    const campfire = createCampfire(scene)
    campfireRef.current = campfire

    torchesRef.current = [
      createTikiTorch(scene, -5.0, -2.0),
      createTikiTorch(scene,  5.0, -2.0),
      createTikiTorch(scene, -4.0,  3.8),
      createTikiTorch(scene,  4.0,  3.8),
    ]

    const idol = createTikiIdol(scene, -7.0, -5.5)
    idolRef.current = idol

    createTreasureChest(scene, -5.5, 3.0)
    createScatteredCards(scene, -4.5, 4.0)

    createPalmTree(scene, -7.5, -3.0, 0.14)
    createPalmTree(scene,  8.0, -2.5, -0.12)
    createPalmTree(scene, -6.0,  4.5, 0.10)
    createPalmTree(scene,  6.5,  5.0, -0.14)

    createJungleBackground(scene)
    createWater(scene)
    createStarfield(scene)

    // Moon
    const moonGeo = new THREE.SphereGeometry(2.5, 14, 14)
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xdde8ff })
    const moon = new THREE.Mesh(moonGeo, moonMat)
    moon.position.set(18, 28, -30)
    scene.add(moon)
    const moonHaloGeo = new THREE.SphereGeometry(3.5, 12, 12)
    const moonHaloMat = new THREE.MeshBasicMaterial({ color: 0x8090c0, transparent: true, opacity: 0.10 })
    const moonHalo = new THREE.Mesh(moonHaloGeo, moonHaloMat)
    moonHalo.position.copy(moon.position)
    scene.add(moonHalo)

    // ── Animation Loop ────────────────────────────────────────────────────
    function animate() {
      frameIdRef.current = requestAnimationFrame(animate)
      const elapsed = (performance.now() - startTimeRef.current) / 1000

      // Smooth parallax camera (mouse-driven)
      const mx = mouseRef.current.x
      const my = mouseRef.current.y
      const base = cameraBaseRef.current
      camera.position.x += (base.x + mx * 2.5 - camera.position.x) * 0.028
      camera.position.y += (base.y - my * 1.5 - camera.position.y) * 0.028
      camera.position.z += (base.z - camera.position.z) * 0.02
      camera.lookAt(0, 1.5, 0)

      // Campfire flame flicker
      if (fireLightRef.current) {
        fireLightRef.current.intensity =
          5.0 + Math.sin(elapsed * 5.8) * 0.8 + Math.sin(elapsed * 9.3) * 0.4 + Math.sin(elapsed * 13.1) * 0.2
      }

      // Campfire flame animation
      if (campfireRef.current?.userData.flames) {
        campfireRef.current.userData.flames.forEach((flame, i) => {
          const ft = elapsed * 7.5 + i * 0.9
          flame.scale.x = 1 + Math.sin(ft * 1.3) * 0.16
          flame.scale.z = 1 + Math.cos(ft * 1.7) * 0.16
          flame.scale.y = 1 + Math.sin(ft * 1.1) * 0.12 - i * 0.01
          flame.rotation.y += 0.025
          if (i > 3) flame.material.opacity = 0.5 + Math.sin(ft * 2.2) * 0.25
        })
      }

      // Torch flame flicker
      torchesRef.current.forEach((torch, ti) => {
        torch.userData.torchFlames?.forEach((flame, fi) => {
          const ft = elapsed * 9 + ti * 1.8 + fi * 0.6
          flame.scale.y = 1 + Math.sin(ft) * 0.24
          flame.scale.x = 1 + Math.cos(ft * 1.4) * 0.16
          flame.rotation.y += 0.03
        })
      })

      // Idol eye pulse
      if (idolRef.current?.userData.eyes) {
        const pulse = 0.6 + Math.sin(elapsed * 2.8) * 0.4
        idolRef.current.userData.eyes.forEach(eye => {
          eye.material.color.setRGB(0, pulse, pulse * 0.35)
        })
      }

      // Character idle breathing
      Object.values(charactersRef.current).forEach((char, index) => {
        if (!char.visible) return
        char.scale.y = 1 + Math.sin(elapsed * 2.2 + index * 0.5) * 0.012
        if (char.userData.head) {
          char.userData.head.rotation.z = Math.sin(elapsed * 2.8 + index * 0.6) * 0.038
          char.userData.head.rotation.y = Math.sin(elapsed * 1.8 + index * 0.4) * 0.05
        }
        if (char.userData.leftArm) {
          char.userData.leftArm.rotation.x = 0.55 + Math.sin(elapsed * 2.5 + index * 0.3) * 0.08
        }
        if (char.userData.rightArm) {
          char.userData.rightArm.rotation.x = 0.55 + Math.sin(elapsed * 2.5 + index * 0.3 + Math.PI) * 0.08
        }
      })

      renderer.render(scene, camera)
    }
    animate()

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      cancelAnimationFrame(frameIdRef.current)
      window.removeEventListener('resize', handleResize)
      scene.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          Array.isArray(obj.material)
            ? obj.material.forEach(m => m.dispose())
            : obj.material.dispose()
        }
      })
      renderer.dispose()
    }
  }, [])

  // ── Handle Players Joining/Leaving ────────────────────────────────────────
  useEffect(() => {
    if (!sceneRef.current) return
    const scene = sceneRef.current
    const prevIds = previousPlayersRef.current.map(p => p.id)
    const currIds = lobbyPlayers.map(p => p.id)

    lobbyPlayers.filter(p => !prevIds.includes(p.id)).forEach((player, index) => {
      const slotIndex = lobbyPlayers.findIndex(p => p.id === player.id)
      if (slotIndex < 0 || slotIndex >= PLAYER_SLOTS.length) return
      const slot = PLAYER_SLOTS[slotIndex]
      const character = buildLobbyCharacter(player.avatarId || 1, player.color)
      character.visible = false
      character.userData.playerId = player.id
      character.add(createNameLabel(player.name, player.isHost))
      scene.add(character)
      charactersRef.current[player.id] = character

      const isInitialLoad = prevIds.length === 0
      setTimeout(() => {
        animateCharacterDrop(character, slot.position, () => {
          const dir = new THREE.Vector3(0, 0, 0).sub(slot.position).normalize()
          character.rotation.y = Math.atan2(dir.x, dir.z)
        })
        if (!isInitialLoad) {
          setShowToast(`${player.name} joined the ritual! 🔥`)
          setTimeout(() => setShowToast(null), 2800)
        }
      }, index * 300)
    })

    prevIds.filter(id => !currIds.includes(id)).forEach(id => {
      const char = charactersRef.current[id]
      if (char) { sceneRef.current.remove(char); delete charactersRef.current[id] }
    })

    previousPlayersRef.current = [...lobbyPlayers]
  }, [lobbyPlayers])

  const handleStartGame = () => { if (canStart && startGame) startGame() }
  const handleCopy = () => {
    if (!myRoomCode) return
    navigator.clipboard?.writeText(myRoomCode).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div id="lobby-screen" style={{ position: 'fixed', inset: 0, overflow: 'hidden' }}>

      {/* 3D Canvas — fills full screen */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />

      {/* ── CSS Atmosphere Layers ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
        {/* Vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.18) 60%, rgba(0,0,0,0.60) 100%)',
        }} />

        {/* Warm campfire glow overlay */}
        <motion.div
          animate={{ opacity: [0.25, 0.55, 0.25], scale: [0.96, 1.04, 0.96] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            position: 'absolute', left: '50%', top: '48%',
            transform: 'translate(-50%, -50%)',
            width: 420, height: 320,
            background: 'radial-gradient(ellipse, rgba(255,100,15,0.12) 0%, rgba(255,60,0,0.05) 45%, transparent 70%)',
          }}
        />

        {/* Canopy shadow — top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 90,
          background: 'linear-gradient(180deg, rgba(1,4,1,0.90) 0%, rgba(1,4,1,0.45) 55%, transparent 100%)',
        }} />

        {/* Ground mist — bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 90,
          background: 'linear-gradient(0deg, rgba(2,6,2,0.75) 0%, transparent 100%)',
        }} />

        {/* Warm fireflies */}
        <WarmFireflies />
      </div>

      {/* ── UI Overlay ── */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 180, damping: 18, delay: 0.05 }}
          style={{ textAlign: 'center', paddingTop: 22, pointerEvents: 'none' }}
        >
          <motion.div
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 3.2, repeat: Infinity }}
            style={{
              fontSize: 10, letterSpacing: '6px', color: 'rgba(212,175,55,0.7)',
              fontFamily: '"Cinzel Decorative",cursive', marginBottom: 5,
              textShadow: '0 0 16px rgba(212,175,55,0.4)',
            }}
          >
            ✦ WAITING ROOM ✦
          </motion.div>

          <motion.h1
            animate={{
              textShadow: [
                '0 0 24px rgba(212,175,55,0.5), 0 0 48px rgba(255,100,0,0.2)',
                '0 0 48px rgba(212,175,55,0.85), 0 0 80px rgba(255,120,0,0.35)',
                '0 0 24px rgba(212,175,55,0.5), 0 0 48px rgba(255,100,0,0.2)',
              ],
            }}
            transition={{ duration: 3.0, repeat: Infinity }}
            style={{
              fontFamily: '"Cinzel Decorative",cursive',
              fontSize: 'clamp(32px, 4.5vw, 56px)',
              fontWeight: 900, color: '#d4af37',
              margin: '0 0 6px',
              letterSpacing: '0.06em',
            }}
          >
            TIKI TOPPLE
          </motion.h1>

          <div style={{
            fontSize: 'clamp(9px, 1vw, 12px)',
            letterSpacing: '4px', color: 'rgba(212,175,55,0.45)',
            fontFamily: '"Cinzel Decorative",cursive',
          }}>
            THE ISLAND AWAITS
          </div>
        </motion.div>

        {/* ── Right Panels ── */}
        <div style={{
          position: 'absolute', top: 110, right: 'clamp(16px, 2.5vw, 40px)',
          width: 'clamp(300px, 26vw, 368px)',
          display: 'flex', flexDirection: 'column', gap: 14,
          pointerEvents: 'auto',
        }}>

          {/* Room Code */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <WoodPanel style={{ padding: '18px 22px 14px' }}>
              <div style={{
                fontSize: 9, letterSpacing: '4px', color: 'rgba(212,175,55,0.5)',
                fontFamily: '"Cinzel Decorative",cursive', marginBottom: 10, textAlign: 'center',
              }}>
                ROOM CODE
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, gap: 10 }}>
                <motion.div
                  animate={{ textShadow: ['0 0 18px rgba(212,175,55,0.4)', '0 0 40px rgba(212,175,55,0.85)', '0 0 18px rgba(212,175,55,0.4)'] }}
                  transition={{ duration: 2.4, repeat: Infinity }}
                  style={{
                    fontFamily: '"Cinzel Decorative",cursive',
                    fontSize: 'clamp(36px, 4vw, 52px)',
                    fontWeight: 900, color: '#d4af37',
                    letterSpacing: '0.15em',
                    lineHeight: 1,
                  }}
                >
                  {myRoomCode || '----'}
                </motion.div>
                <motion.button
                  whileHover={{ scale: 1.06, boxShadow: '0 0 18px rgba(40,160,20,0.55)' }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleCopy}
                  style={{
                    background: copied
                      ? 'linear-gradient(135deg, #1a6030, #0e4020)'
                      : 'linear-gradient(135deg, #1a5a18, #0e3e10)',
                    border: `1.5px solid ${copied ? 'rgba(40,200,80,0.7)' : 'rgba(30,160,20,0.6)'}`,
                    borderRadius: 9, color: copied ? '#50e880' : '#60d040',
                    padding: '9px 14px', fontSize: 10,
                    fontFamily: '"Cinzel Decorative",cursive',
                    cursor: 'pointer', minWidth: 88, letterSpacing: '1px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                    transition: 'all 0.2s', flexShrink: 0,
                  }}
                >
                  {copied ? '✓ COPIED' : '⎘ COPY'}
                </motion.button>
              </div>
              <p style={{
                textAlign: 'center', fontSize: 11.5, margin: 0,
                color: 'rgba(212,175,55,0.38)', fontStyle: 'italic',
                fontFamily: '"Crimson Text",serif',
              }}>
                Share this code with friends to join
              </p>
            </WoodPanel>
          </motion.div>

          {/* Players */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.28, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <WoodPanel>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                padding: '14px 18px 11px',
                borderBottom: '1px solid rgba(212,175,55,0.12)',
              }}>
                <span style={{
                  fontSize: 9, letterSpacing: '4px', color: 'rgba(212,175,55,0.6)',
                  fontFamily: '"Cinzel Decorative",cursive',
                }}>PLAYERS</span>
                <span style={{
                  background: 'rgba(212,175,55,0.14)', border: '1px solid rgba(212,175,55,0.35)',
                  borderRadius: 20, padding: '2px 10px', fontSize: 11,
                  color: '#d4af37', fontWeight: 700, fontFamily: '"Cinzel Decorative",cursive',
                }}>
                  {lobbyPlayers.length} / 4
                </span>
              </div>
              <div>
                <AnimatePresence>
                  {lobbyPlayers.map(player => (
                    <PlayerSlot key={player.id} player={player} isMe={player.id === myPlayerId} />
                  ))}
                </AnimatePresence>
                {Array.from({ length: Math.max(0, 4 - lobbyPlayers.length) }, (_, i) => (
                  <PlayerSlot key={`empty-${i}`} isEmpty />
                ))}
              </div>
            </WoodPanel>
          </motion.div>

          {/* Start / Wait */}
          <motion.div
            initial={{ x: 80, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.40, type: 'spring', stiffness: 200, damping: 18 }}
          >
            <WoodPanel style={{ padding: '18px 20px 16px' }}>
              {isHost ? (
                <>
                  <motion.button
                    whileHover={canStart ? { scale: 1.025, boxShadow: '0 8px 30px rgba(212,175,55,0.4), inset 0 1px 0 rgba(255,255,255,0.25)' } : {}}
                    whileTap={canStart ? { scale: 0.97 } : {}}
                    onClick={handleStartGame}
                    disabled={!canStart}
                    style={{
                      width: '100%', padding: '15px 24px',
                      background: canStart
                        ? 'linear-gradient(160deg, #c8a030 0%, #a07820 25%, #6a5010 60%, #3a2c08 100%)'
                        : 'rgba(40,20,5,0.6)',
                      border: canStart
                        ? '2px solid rgba(212,175,55,0.65)'
                        : '1.5px solid rgba(212,175,55,0.18)',
                      borderRadius: 12,
                      color: canStart ? '#fff8e8' : 'rgba(212,175,55,0.3)',
                      fontSize: 15, fontFamily: '"Cinzel Decorative",cursive',
                      fontWeight: 900, letterSpacing: '0.08em',
                      cursor: canStart ? 'pointer' : 'not-allowed',
                      boxShadow: canStart
                        ? '0 4px 20px rgba(212,175,55,0.25), inset 0 1px 0 rgba(255,255,255,0.18), 0 3px 0 rgba(20,12,0,0.8)'
                        : 'none',
                      transition: 'all 0.22s',
                      textShadow: canStart ? '0 1px 4px rgba(0,0,0,0.5)' : 'none',
                    }}
                  >
                    {canStart ? '⚡ START GAME' : '⌛ WAITING FOR PLAYERS'}
                  </motion.button>
                  {!canStart && (
                    <p style={{
                      textAlign: 'center', fontSize: 11.5, margin: '10px 0 0',
                      color: 'rgba(212,175,55,0.32)', fontStyle: 'italic',
                      fontFamily: '"Crimson Text",serif',
                    }}>
                      Need at least 2 players to begin
                    </p>
                  )}
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <motion.div
                    animate={{ opacity: [0.45, 0.95, 0.45] }}
                    transition={{ duration: 2.4, repeat: Infinity }}
                    style={{
                      fontSize: 14, color: '#d4af37',
                      fontFamily: '"Cinzel Decorative",cursive',
                      marginBottom: 8, letterSpacing: '0.05em',
                      textShadow: '0 0 16px rgba(212,175,55,0.4)',
                    }}
                  >
                    ⌛ WAITING FOR PLAYERS
                  </motion.div>
                  <p style={{
                    fontSize: 12, color: 'rgba(212,175,55,0.35)', margin: 0,
                    fontStyle: 'italic', fontFamily: '"Crimson Text",serif',
                  }}>
                    The host will start the game
                  </p>
                </div>
              )}
            </WoodPanel>
          </motion.div>
        </div>

        {/* ── Bottom Player Badges ── */}
        <PlayerBadges players={lobbyPlayers} myPlayerId={myPlayerId} />
      </div>

      {/* ── Toast notification ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.88 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.88 }}
            transition={{ type: 'spring', stiffness: 340, damping: 24 }}
            style={{
              position: 'absolute', top: 96, left: '50%',
              transform: 'translateX(-50%)', zIndex: 100,
              background: 'linear-gradient(160deg, rgba(28,12,2,0.97) 0%, rgba(16,7,1,0.98) 100%)',
              border: '1.5px solid rgba(212,175,55,0.6)',
              borderRadius: 14, padding: '12px 28px',
              boxShadow: '0 12px 40px rgba(0,0,0,0.75), 0 0 24px rgba(212,175,55,0.15)',
              pointerEvents: 'none', whiteSpace: 'nowrap',
            }}
          >
            <div style={{
              fontSize: 15, color: '#e8c870',
              fontFamily: '"Crimson Text",serif',
              textAlign: 'center',
              textShadow: '0 0 16px rgba(212,175,55,0.45)',
            }}>
              {showToast}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        #lobby-screen * { box-sizing: border-box; }
        @media (max-width: 640px) {
          #lobby-screen h1 { font-size: 28px !important; }
          #lobby-screen [data-panels] { top: 80px !important; right: 10px !important; width: calc(100vw - 20px) !important; }
        }
      `}</style>
    </div>
  )
}
