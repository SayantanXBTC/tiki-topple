import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { TIKI_COLORS } from '../data/tikaColors'

const ARCHETYPES = ['fury', 'elder', 'wild', 'mystic', 'guardian']
const R = 0.72   // body radius
const H = 1.0    // body height

// ── Fury: warrior — angry V-brows, slit eyes, snarling grimace, triple horns ──
function FuryFace({ e, d }) {
  return (
    <group position={[0, 0, R]}>
      {/* Heavy unified brow ridge */}
      <mesh position={[0, 0.27, 0.09]}>
        <boxGeometry args={[0.80, 0.15, 0.22]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* V-cuts into brow (angry inner angle) */}
      <mesh position={[-0.18, 0.32, 0.16]} rotation={[0, 0, -0.72]}>
        <boxGeometry args={[0.26, 0.13, 0.16]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.18, 0.32, 0.16]} rotation={[0, 0, 0.72]}>
        <boxGeometry args={[0.26, 0.13, 0.16]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Angled slit eyes — inner corners angled down */}
      <mesh position={[-0.27, 0.13, 0.04]} rotation={[0, 0, 0.30]}>
        <boxGeometry args={[0.30, 0.13, 0.11]} />
        <primitive object={e} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.13, 0.04]} rotation={[0, 0, -0.30]}>
        <boxGeometry args={[0.30, 0.13, 0.11]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Broad flat nose */}
      <mesh position={[0, -0.02, 0.16]}>
        <boxGeometry args={[0.26, 0.23, 0.20]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Upper jaw grimace bar */}
      <mesh position={[0, -0.20, 0.05]}>
        <boxGeometry args={[0.64, 0.11, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* 4 aggressive teeth */}
      {[-0.23, -0.07, 0.07, 0.23].map((tx, i) => (
        <mesh key={i} position={[tx, -0.27, 0.10]}>
          <boxGeometry args={[0.11, 0.14, 0.09]} />
          <meshStandardMaterial color="#ccdaaa" roughness={0.5} />
        </mesh>
      ))}
      {/* Triple horns */}
      {[-0.30, 0, 0.30].map((tx, i) => (
        <mesh key={i} position={[tx, H / 2 + 0.23 + i * 0.03, -R + 0.09]} rotation={[0.12, 0, 0]}>
          <coneGeometry args={[0.085 - i * 0.01, 0.44 - i * 0.06, 4, 1]} />
          <primitive object={d} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

// ── Elder: ancient — massive shelf brows, droopy eyes, frown, jowls, stacked rings ──
function ElderFace({ e, d }) {
  return (
    <group position={[0, 0, R]}>
      {/* One-piece massive shelf brow — heavy overhang */}
      <mesh position={[0, 0.25, 0.12]}>
        <boxGeometry args={[0.82, 0.19, 0.26]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Droopy narrow eyes under shelf */}
      <mesh position={[-0.27, 0.09, 0.02]}>
        <boxGeometry args={[0.29, 0.11, 0.10]} />
        <primitive object={e} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.09, 0.02]}>
        <boxGeometry args={[0.29, 0.11, 0.10]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Wide flat elder nose */}
      <mesh position={[0, -0.04, 0.17]}>
        <boxGeometry args={[0.30, 0.22, 0.22]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Frown — two downturned corner segments */}
      <mesh position={[-0.23, -0.23, 0.03]} rotation={[0, 0, 0.36]}>
        <boxGeometry args={[0.24, 0.09, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.23, -0.23, 0.03]} rotation={[0, 0, -0.36]}>
        <boxGeometry args={[0.24, 0.09, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Lower teeth peeking out under frown */}
      {[-0.20, -0.07, 0.07, 0.20].map((tx, i) => (
        <mesh key={i} position={[tx, -0.31, 0.07]}>
          <boxGeometry args={[0.10, 0.12, 0.08]} />
          <meshStandardMaterial color="#ccdaaa" roughness={0.5} />
        </mesh>
      ))}
      {/* Jowl cheek folds */}
      <mesh position={[-0.42, -0.07, -0.06]} rotation={[0, 0.50, 0.15]}>
        <boxGeometry args={[0.07, 0.34, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.42, -0.07, -0.06]} rotation={[0, -0.50, -0.15]}>
        <boxGeometry args={[0.07, 0.34, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Stacked ring crown — 3 diminishing tiers */}
      {[0.11, 0.25, 0.38].map((dy, i) => (
        <mesh key={i} position={[0, H / 2 + dy, -R + 0.02]}>
          <cylinderGeometry args={[R * (1.02 - i * 0.14), R * (1.08 - i * 0.14), 0.12, 14]} />
          <primitive object={d} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

// ── Wild: manic — raised brows, bulging sphere eyes, screaming mouth, ear discs, chaotic spikes ──
function WildFace({ e, d }) {
  return (
    <group position={[0, 0, R]}>
      {/* Raised arched surprised brows */}
      <mesh position={[-0.27, 0.31, 0.08]} rotation={[0, 0, 0.28]}>
        <boxGeometry args={[0.33, 0.11, 0.14]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.31, 0.08]} rotation={[0, 0, -0.28]}>
        <boxGeometry args={[0.33, 0.11, 0.14]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Big bulging sphere eyes */}
      <mesh position={[-0.27, 0.14, 0.08]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <primitive object={e} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.14, 0.08]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Dark pupils */}
      <mesh position={[-0.27, 0.14, 0.22]}>
        <sphereGeometry args={[0.058, 8, 8]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.14, 0.22]}>
        <sphereGeometry args={[0.058, 8, 8]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Round nose */}
      <mesh position={[0, -0.01, 0.14]}>
        <sphereGeometry args={[0.12, 10, 10]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Screaming O-mouth — emissive ring + dark hole */}
      <mesh position={[0, -0.23, 0.09]}>
        <cylinderGeometry args={[0.18, 0.18, 0.09, 18]} />
        <primitive object={e} attach="material" />
      </mesh>
      <mesh position={[0, -0.23, 0.11]}>
        <cylinderGeometry args={[0.13, 0.13, 0.13, 18]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Ear discs */}
      <mesh position={[-(R + 0.07), 0.06, -R * 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 18]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[(R + 0.07), 0.06, -R * 0.5]} rotation={[0, Math.PI / 2, 0]}>
        <cylinderGeometry args={[0.22, 0.22, 0.08, 18]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Chaotic spike crown — 5 irregular heights */}
      {[[-0.30, 0.44], [-0.14, 0.52], [0, 0.47], [0.14, 0.54], [0.30, 0.40]].map(([tx, ht], i) => (
        <mesh key={i} position={[tx, H / 2 + ht / 2, -R + 0.09]}
          rotation={[0.12, 0, 0.10 * (i % 2 ? 1 : -1)]}>
          <coneGeometry args={[0.088, ht, 3, 1]} />
          <primitive object={d} attach="material" />
        </mesh>
      ))}
    </group>
  )
}

// ── Mystic: shaman — arched brows, half-lid eyes, smile, forehead gem, headband ──
function MysticFace({ e, d }) {
  return (
    <group position={[0, 0, R]}>
      {/* Thin arched brows */}
      <mesh position={[-0.25, 0.29, 0.06]} rotation={[0, 0, 0.21]}>
        <boxGeometry args={[0.29, 0.07, 0.11]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.25, 0.29, 0.06]} rotation={[0, 0, -0.21]}>
        <boxGeometry args={[0.29, 0.07, 0.11]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Half-closed glowing eyes */}
      <mesh position={[-0.27, 0.13, 0.03]}>
        <boxGeometry args={[0.31, 0.13, 0.10]} />
        <primitive object={e} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.13, 0.03]}>
        <boxGeometry args={[0.31, 0.13, 0.10]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Upper lid dark overlay — half-closed look */}
      <mesh position={[-0.27, 0.17, 0.08]}>
        <boxGeometry args={[0.33, 0.07, 0.11]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.17, 0.08]}>
        <boxGeometry args={[0.33, 0.07, 0.11]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Narrow elegant nose */}
      <mesh position={[0, -0.02, 0.12]}>
        <boxGeometry args={[0.12, 0.18, 0.14]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Subtle smile corners */}
      <mesh position={[-0.22, -0.22, 0.03]} rotation={[0, 0, 0.42]}>
        <boxGeometry args={[0.23, 0.08, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.22, -0.22, 0.03]} rotation={[0, 0, -0.42]}>
        <boxGeometry args={[0.23, 0.08, 0.09]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* 3 small central teeth */}
      {[-0.13, 0, 0.13].map((tx, i) => (
        <mesh key={i} position={[tx, -0.28, 0.08]}>
          <boxGeometry args={[0.09, 0.11, 0.08]} />
          <meshStandardMaterial color="#ccdaaa" roughness={0.5} />
        </mesh>
      ))}
      {/* Forehead gem */}
      <mesh position={[0, 0.38, 0.10]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Headband ring */}
      <mesh position={[0, H / 2 - 0.02, -R]}>
        <cylinderGeometry args={[R * 1.11, R * 1.11, 0.18, 18]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Headband front jewel diamond */}
      <mesh position={[0, H / 2 + 0.04, 0.04]}>
        <boxGeometry args={[0.18, 0.22, 0.12]} />
        <primitive object={e} attach="material" />
      </mesh>
    </group>
  )
}

// ── Guardian: stoic — straight heavy brows, square eyes, strong nose, full teeth, flat headdress ──
function GuardianFace({ e, d }) {
  return (
    <group position={[0, 0, R]}>
      {/* Very heavy straight horizontal brows */}
      <mesh position={[-0.27, 0.28, 0.08]}>
        <boxGeometry args={[0.37, 0.14, 0.19]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.28, 0.08]}>
        <boxGeometry args={[0.37, 0.14, 0.19]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Large square glowing eyes */}
      <mesh position={[-0.27, 0.11, 0.03]}>
        <boxGeometry args={[0.31, 0.17, 0.12]} />
        <primitive object={e} attach="material" />
      </mesh>
      <mesh position={[0.27, 0.11, 0.03]}>
        <boxGeometry args={[0.31, 0.17, 0.12]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Very prominent nose block */}
      <mesh position={[0, -0.02, 0.19]}>
        <boxGeometry args={[0.24, 0.28, 0.26]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Stern flat mouth bar */}
      <mesh position={[0, -0.22, 0.03]}>
        <boxGeometry args={[0.60, 0.12, 0.10]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Glowing slit between lips */}
      <mesh position={[0, -0.17, 0.07]}>
        <boxGeometry args={[0.52, 0.04, 0.07]} />
        <primitive object={e} attach="material" />
      </mesh>
      {/* Full row of 5 teeth */}
      {[-0.29, -0.14, 0, 0.14, 0.29].map((tx, i) => (
        <mesh key={i} position={[tx, -0.29, 0.09]}>
          <boxGeometry args={[0.11, 0.13, 0.09]} />
          <meshStandardMaterial color="#ccdaaa" roughness={0.5} />
        </mesh>
      ))}
      {/* Cheek ridges */}
      <mesh position={[-0.46, 0.02, -0.09]} rotation={[0, 0.44, 0.10]}>
        <boxGeometry args={[0.08, 0.37, 0.10]} />
        <primitive object={d} attach="material" />
      </mesh>
      <mesh position={[0.46, 0.02, -0.09]} rotation={[0, -0.44, -0.10]}>
        <boxGeometry args={[0.08, 0.37, 0.10]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Wide flat ceremonial headdress */}
      <mesh position={[0, H / 2 + 0.15, -R + 0.26]}>
        <boxGeometry args={[1.24, 0.27, 0.70]} />
        <primitive object={d} attach="material" />
      </mesh>
      {/* Headdress emissive accent stripe */}
      <mesh position={[0, H / 2 + 0.14, -R + 0.62]}>
        <boxGeometry args={[1.12, 0.12, 0.05]} />
        <primitive object={e} attach="material" />
      </mesh>
    </group>
  )
}

// ── Main tiki totem ───────────────────────────────────────────────────────────
export default function TikiTotem3D({ tiki, position, isSelected, isHovered, isValidTarget, onClick, onPointerOver, onPointerOut }) {
  const group = useRef()
  const data      = TIKI_COLORS[tiki.id] || TIKI_COLORS.mana
  const baseColor = tiki.color || data.color

  const seed = useMemo(() => {
    let s = 0; for (let i = 0; i < tiki.id.length; i++) s += tiki.id.charCodeAt(i)
    return s
  }, [tiki.id])

  const archetype = ARCHETYPES[seed % 5]

  // Solid vibrant painted body — classic tiki aesthetic
  const baseMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(baseColor),
    emissive: new THREE.Color(baseColor),
    emissiveIntensity: 0.35,
    roughness: 0.28,
    metalness: 0.08,
  }), [baseColor])

  const darkMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#0d0705'),
    roughness: 0.90,
    metalness: 0.12,
  }), [])

  const emissiveMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(data.emissive),
    emissive: new THREE.Color(data.emissive),
    emissiveIntensity: 2,
    toneMapped: false,
  }), [data.emissive])

  // Arc-fly animation state
  const targetRef = useRef({ x: position[0], y: position[1], z: position[2] })
  const flyT      = useRef(1)
  const flyFrom   = useRef(new THREE.Vector3(...position))
  const flyTo     = useRef(new THREE.Vector3(...position))
  const flyArcH   = useRef(0)
  const targetPos = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (!group.current) return
    const [px, py, pz] = position

    if (Math.abs(targetRef.current.x - px) > 0.05 || Math.abs(targetRef.current.y - py) > 0.05) {
      flyFrom.current.copy(group.current.position)
      flyTo.current.set(px, py, pz)
      const dist = flyFrom.current.distanceTo(flyTo.current)
      flyArcH.current = Math.max(dist * 1.1, 2.0)
      flyT.current = 0
      targetRef.current = { x: px, y: py, z: pz }
    }

    if (flyT.current < 1) {
      flyT.current = Math.min(flyT.current + delta * 2.8, 1)
      const t    = flyT.current
      const ease = 1 - Math.pow(1 - t, 3)
      const arcY = Math.sin(Math.PI * t) * flyArcH.current
      const swoop = Math.sin(Math.PI * t) * 2.2
      group.current.position.set(
        flyFrom.current.x + (flyTo.current.x - flyFrom.current.x) * ease,
        flyFrom.current.y + (flyTo.current.y - flyFrom.current.y) * ease + arcY,
        flyFrom.current.z + (flyTo.current.z - flyFrom.current.z) * ease + swoop
      )
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, t < 0.5 ? -0.55 : 0, delta * 10)
      group.current.rotation.y = 0
    } else {
      targetPos.current.set(px, py, pz)
      if (isSelected) {
        targetPos.current.z += 0.6
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, Math.sin(state.clock.elapsedTime * 4) * 0.1, delta * 5)
      } else {
        group.current.rotation.y = THREE.MathUtils.lerp(group.current.rotation.y, 0, delta * 5)
      }
      if (isHovered && !isSelected) targetPos.current.y += Math.sin(state.clock.elapsedTime * 12) * 0.08
      group.current.position.lerp(targetPos.current, delta * 9)
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, 0, delta * 8)
    }

    // Emissive pulse
    const base  = isHovered || isSelected ? 4.5 : 1.8
    const pulse = Math.sin(state.clock.elapsedTime * 3 + seed) * 0.5
    emissiveMat.emissiveIntensity = base + pulse
  })

  return (
    <group
      ref={group}
      position={position}
      onClick={e  => { e.stopPropagation(); onClick?.() }}
      onPointerOver={e => { e.stopPropagation(); onPointerOver?.() }}
      onPointerOut={e  => { onPointerOut?.() }}
    >
      {/* Main solid body — vibrant painted tiki can */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[R, R * 0.94, H, 32]} />
        <primitive object={baseMat} attach="material" />
      </mesh>

      {/* Carved horizontal bands — tiki can grooves */}
      {[-0.28, 0.0, 0.28].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <cylinderGeometry args={[R * 1.032, R * 1.032, 0.055, 24]} />
          <primitive object={darkMat} attach="material" />
        </mesh>
      ))}

      {/* Heavy dark top cap */}
      <mesh position={[0, H / 2, 0]}>
        <cylinderGeometry args={[R * 1.07, R * 1.07, 0.10, 32]} />
        <primitive object={darkMat} attach="material" />
      </mesh>
      {/* Heavy dark bottom base */}
      <mesh position={[0, -H / 2, 0]}>
        <cylinderGeometry args={[R * 1.09, R * 1.09, 0.11, 32]} />
        <primitive object={darkMat} attach="material" />
      </mesh>

      {/* Gold accent rings at top and bottom rims */}
      <mesh position={[0, H / 2 - 0.03, 0]}>
        <torusGeometry args={[R * 1.08, 0.026, 14, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.82} roughness={0.18} emissive="#d4af37" emissiveIntensity={0.45} />
      </mesh>
      <mesh position={[0, -H / 2 + 0.04, 0]}>
        <torusGeometry args={[R * 1.08, 0.026, 14, 32]} />
        <meshStandardMaterial color="#d4af37" metalness={0.82} roughness={0.18} emissive="#d4af37" emissiveIntensity={0.45} />
      </mesh>

      {/* Internal glow */}
      <pointLight position={[0, 0, 0]} distance={2.5} intensity={1.8} color={baseColor} decay={2} />

      {/* Archetype face + crown */}
      {archetype === 'fury'     && <FuryFace     e={emissiveMat} d={darkMat} />}
      {archetype === 'elder'    && <ElderFace    e={emissiveMat} d={darkMat} />}
      {archetype === 'wild'     && <WildFace     e={emissiveMat} d={darkMat} />}
      {archetype === 'mystic'   && <MysticFace   e={emissiveMat} d={darkMat} />}
      {archetype === 'guardian' && <GuardianFace e={emissiveMat} d={darkMat} />}

      {/* Valid-target pulse ring */}
      {isValidTarget && !isSelected && (
        <mesh>
          <cylinderGeometry args={[R * 1.24, R * 1.24, H * 1.18, 32]} />
          <meshBasicMaterial color="#fbbf24" wireframe transparent opacity={0.32} />
        </mesh>
      )}
      {isValidTarget && !isSelected && (
        <pointLight position={[0, 0, 1.2]} intensity={1.4} color="#fbbf24" distance={3.5} decay={2} />
      )}

      {/* Selection ring */}
      {isSelected && (
        <mesh>
          <cylinderGeometry args={[R * 1.18, R * 1.18, H * 1.12, 32]} />
          <meshBasicMaterial color={baseColor} wireframe transparent opacity={0.35} />
        </mesh>
      )}
    </group>
  )
}
