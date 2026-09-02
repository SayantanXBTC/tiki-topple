import React, { useState, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing'
import { Stars, Sparkles, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'
import TikiTotem3D from './TikiTotem3D'

// ── Flickering lava point light ───────────────────────────────────────────────
function FlickerLight({ position, baseIntensity, color }) {
  const lightRef = useRef()
  useFrame((state) => {
    if (!lightRef.current) return
    const t = state.clock.elapsedTime
    const flicker = Math.sin(t * 7.3) * 0.3 + Math.sin(t * 13.1) * 0.15 + Math.sin(t * 2.9) * 0.2
    lightRef.current.intensity = baseIntensity + flicker
  })
  return <pointLight ref={lightRef} position={position} intensity={baseIntensity} color={color} distance={28} decay={1.4} castShadow />
}

// ── Volcano eruption plume shader ────────────────────────────────────────────
const plumeVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const plumeFrag = `
  uniform float uTime;
  varying vec2 vUv;

  float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(hash21(i), hash21(i + vec2(1,0)), u.x),
      mix(hash21(i + vec2(0,1)), hash21(i + vec2(1,1)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float v = 0.0; float amp = 0.5; float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      v += amp * vnoise(p * freq);
      freq *= 2.1; amp *= 0.48;
    }
    return v;
  }

  void main() {
    float t = uTime * 0.95;
    vec2 uv = vUv;
    vec2 p = uv * vec2(2.8, 3.2);

    vec2 q = vec2(fbm(p - t), fbm(p + vec2(1.7, 9.2) - t * 1.1));
    vec2 r = vec2(
      fbm(p + 1.7 * q + vec2(1.7, 9.2) - t * 1.1),
      fbm(p + 1.7 * q + vec2(8.3, 2.8) - t * 1.15)
    );
    float f = fbm(p * 1.5 + 1.8 * r - t * 1.05);

    float edge = 1.0 - pow(abs(uv.x - 0.5) * 2.0, 1.05);
    float height = pow(max(0.0, 1.0 - uv.y), 0.52);
    float baseBurst = pow(max(0.0, 1.0 - uv.y * 2.8), 0.75);
    float fire = clamp(f * edge * (height + baseBurst * 0.45) * 2.9, 0.0, 1.0);

    vec3 col;
    float s = fire * 6.0;
    if (s < 1.0)      col = mix(vec3(0.0,  0.0,  0.0),   vec3(0.42, 0.03, 0.0),  s);
    else if (s < 2.0) col = mix(vec3(0.42, 0.03, 0.0),   vec3(0.85, 0.16, 0.0),  s - 1.0);
    else if (s < 3.0) col = mix(vec3(0.85, 0.16, 0.0),   vec3(1.0,  0.40, 0.0),  s - 2.0);
    else if (s < 4.0) col = mix(vec3(1.0,  0.40, 0.0),   vec3(1.0,  0.70, 0.06), s - 3.0);
    else if (s < 5.0) col = mix(vec3(1.0,  0.70, 0.06),  vec3(1.0,  0.92, 0.50), s - 4.0);
    else              col = mix(vec3(1.0,  0.92, 0.50),   vec3(1.0,  1.0,  0.94), s - 5.0);

    gl_FragColor = vec4(col * 1.55, fire * 0.82);
  }
`

/* Stable uniforms ref — prevents React re-renders from reinitialising the shader */
function PlumePlane({ rotY, pw, ph }) {
  const matRef = useRef()
  const uniforms = useRef({ uTime: { value: 0 } })
  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh position={[0, ph / 2, 0]} rotation={[0, (rotY * Math.PI) / 180, 0]}>
      <planeGeometry args={[pw, ph]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={plumeVert}
        fragmentShader={plumeFrag}
        uniforms={uniforms.current}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function VolcanoFirePlume({ position, r }) {
  const pw = r * 0.62
  const ph = r * 1.4
  return (
    <group position={position}>
      <PlumePlane rotY={0}   pw={pw} ph={ph} />
      <PlumePlane rotY={60}  pw={pw} ph={ph} />
      <PlumePlane rotY={120} pw={pw} ph={ph} />
      <pointLight intensity={1.2} color="#ff5500" distance={r * 1.6} decay={2.2} />
    </group>
  )
}

// ── Volcano silhouettes ───────────────────────────────────────────────────────
function VolcanoSilhouettes() {
  const volcanoes = useMemo(() => [
    { pos: [-22, -5, -38], r: 9,  h: 26, craterGlow: '#ff3300' },
    { pos: [-42, -5, -55], r: 14, h: 38, craterGlow: '#ff2200' },
    { pos: [  2, -5, -60], r: 16, h: 42, craterGlow: '#ff5500' },
    { pos: [ 34, -5, -46], r: 11, h: 30, craterGlow: '#ff3300' },
    { pos: [-10, -5, -82], r: 20, h: 54, craterGlow: '#ff4400' },
  ], [])

  return (
    <group>
      {volcanoes.map(({ pos, r, h, craterGlow }, i) => (
        <group key={i} position={pos}>
          {/* Dark cone body — subtle warm emissive on lower half */}
          <mesh castShadow>
            <coneGeometry args={[r, h, 24, 1]} />
            <meshStandardMaterial color="#100806" roughness={1} metalness={0} emissive="#1a0400" emissiveIntensity={0.35} />
          </mesh>
          {/* Lava seam ring at base — glowing crack where rock meets lava */}
          <mesh position={[0, -h / 2 + 0.8, 0]}>
            <torusGeometry args={[r * 0.92, 0.18, 6, 28]} />
            <meshStandardMaterial color="#ff3300" emissive="#ff2200" emissiveIntensity={3.5} toneMapped={false} />
          </mesh>
          {/* Eruption fire plume from crater */}
          <VolcanoFirePlume position={[0, h / 2 - 0.3, 0]} r={r} />
        </group>
      ))}
    </group>
  )
}

// ── Shader lava pool ──────────────────────────────────────────────────────────
const lavaVert = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lavaFrag = `
  uniform float uTime;
  varying vec2 vUv;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    float a = dot(hash2(i + vec2(0,0)), f - vec2(0,0));
    float b = dot(hash2(i + vec2(1,0)), f - vec2(1,0));
    float c = dot(hash2(i + vec2(0,1)), f - vec2(0,1));
    float d = dot(hash2(i + vec2(1,1)), f - vec2(1,1));
    return 0.5 + 0.5 * mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float amp = 0.5;
    float freq = 1.0;
    for (int i = 0; i < 6; i++) {
      v += amp * vnoise(p * freq);
      freq *= 2.1;
      amp *= 0.48;
    }
    return v;
  }

  void main() {
    /* slow horizontal crawl — lava moves sluggishly */
    float t = uTime * 0.12;
    vec2 uv = (vUv - 0.5) * 6.0;

    /* domain warp — two levels like the fire shader */
    vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(1.7, 9.2) + t * 0.9));
    vec2 r = vec2(
      fbm(uv + 1.8 * q + vec2(1.7, 9.2) - t * 0.8),
      fbm(uv + 1.8 * q + vec2(8.3, 2.8) - t * 0.85)
    );
    float f = fbm(uv * 1.4 + 2.2 * r - t * 0.75);

    /* bright cracks — high-f regions are hotter */
    float heat = clamp(f * 1.35, 0.0, 1.0);

    /* lava color ramp: dark basalt → deep red → orange → yellow-white hot crack */
    vec3 col;
    float s = heat * 5.0;
    if (s < 1.0) {
      col = mix(vec3(0.04, 0.01, 0.0),  vec3(0.28, 0.04, 0.0),  s);
    } else if (s < 2.0) {
      col = mix(vec3(0.28, 0.04, 0.0),  vec3(0.72, 0.12, 0.0),  s - 1.0);
    } else if (s < 3.0) {
      col = mix(vec3(0.72, 0.12, 0.0),  vec3(1.0,  0.35, 0.0),  s - 2.0);
    } else if (s < 4.0) {
      col = mix(vec3(1.0,  0.35, 0.0),  vec3(1.0,  0.72, 0.04), s - 3.0);
    } else {
      col = mix(vec3(1.0,  0.72, 0.04), vec3(1.0,  0.97, 0.72), s - 4.0);
    }

    /* emissive lava — bloom amplifies the hot cracks */
    gl_FragColor = vec4(col * 1.15, 1.0);
  }
`

// ── Volcanic rock platform shader ────────────────────────────────────────────
const rockVert = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNorm;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNorm = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`

const rockFrag = `
  varying vec3 vWorldPos;
  varying vec3 vWorldNorm;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float amp = 0.5; float freq = 1.0;
    for (int i = 0; i < 5; i++) { v += amp * noise(p * freq); freq *= 2.1; amp *= 0.48; }
    return v;
  }

  void main() {
    /* Domain-warped FBM for organic rock surface */
    vec2 q = vec2(fbm(vWorldPos.xz * 0.7), fbm(vWorldPos.xz * 0.7 + 3.2));
    float n = fbm(vWorldPos.xz * 1.1 + 1.8 * q);

    /* Fine crack network — sharp threshold in high-frequency noise */
    float crackN = fbm(vWorldPos.xz * 4.5 + vec2(q.x * 2.0, 1.7));
    float crack  = pow(max(0.0, crackN - 0.58) / 0.42, 2.8);

    /* Base volcanic basalt — warm brown, clearly distinct from cold purple sky */
    vec3 col = mix(vec3(0.05, 0.024, 0.010), vec3(0.22, 0.11, 0.042), n * n);

    /* Glowing lava in cracks — orange emissive */
    col += vec3(1.0, 0.22, 0.0) * crack * 0.55;

    /* Lava heat from below — hottest at low Y */
    float heat = clamp(1.0 - (vWorldPos.y + 4.8) / 2.8, 0.0, 1.0);
    col += vec3(0.48, 0.09, 0.0) * pow(heat, 1.5) * 0.65;

    /* Moonlight diffuse from upper-left */
    float moon = max(0.0, dot(vWorldNorm, normalize(vec3(-0.55, 1.0, 0.6))));
    col += vec3(0.05, 0.08, 0.20) * moon * 0.38;

    /* Warm lava up-light on underside faces */
    float lavUp = max(0.0, dot(vWorldNorm, vec3(0.0, -1.0, 0.15)));
    col += vec3(0.55, 0.14, 0.0) * lavUp * 0.28;

    /* Specular glint on top faces (wet volcanic sheen) */
    float spec = pow(max(0.0, dot(vWorldNorm, normalize(vec3(-0.55, 1.0, 0.6)))), 18.0);
    col += vec3(0.6, 0.35, 0.15) * spec * 0.10;

    gl_FragColor = vec4(col, 1.0);
  }
`

function LavaFloorPlane() {
  const uniforms = useRef({ uTime: { value: 0 } })
  useFrame((state) => {
    uniforms.current.uTime.value = state.clock.elapsedTime
  })
  return (
    <mesh position={[0, -5.6, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[120, 120, 1, 1]} />
      <shaderMaterial
        vertexShader={lavaVert}
        fragmentShader={lavaFrag}
        uniforms={uniforms.current}
        side={THREE.DoubleSide}
      />
    </mesh>
  )
}

function LavaPool() {
  return (
    <group>
      <LavaFloorPlane />
      <LavaBubblesInstanced />
    </group>
  )
}


// ── Lava bubbles — single InstancedMesh instead of 40 individual meshes ───────
function LavaBubblesInstanced() {
  const COUNT = 20
  const meshRef = useRef()
  const dummy   = useMemo(() => new THREE.Object3D(), [])

  const bubbles = useMemo(() => Array.from({ length: COUNT }, (_, i) => {
    // deterministic pseudo-random per index
    const s1 = (i * 1664525 + 1013904223) & 0x7fffffff
    const s2 = (s1 * 1664525 + 1013904223) & 0x7fffffff
    const s3 = (s2 * 1664525 + 1013904223) & 0x7fffffff
    const s4 = (s3 * 1664525 + 1013904223) & 0x7fffffff
    const s5 = (s4 * 1664525 + 1013904223) & 0x7fffffff
    const r  = n => (n & 0x7fffffff) / 0x7fffffff
    return {
      x:     (r(s1) - 0.5) * 34,
      z:     (r(s2) - 0.5) * 22,
      phase: r(s3) * Math.PI * 2,
      maxR:  0.07 + r(s4) * 0.28,
      speed: 0.25 + r(s5) * 0.55,
    }
  }), [])

  useFrame((state) => {
    if (!meshRef.current) return
    const t = state.clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const b    = bubbles[i]
      const ph   = (t * b.speed + b.phase) % (Math.PI * 2)
      const grow = (Math.sin(ph) + 1) * 0.5
      const s    = Math.max(b.maxR * Math.sqrt(grow), 0.001)
      dummy.position.set(b.x, -5.55 + grow * 0.42, b.z)
      dummy.scale.setScalar(s)
      dummy.updateMatrix()
      meshRef.current.setMatrixAt(i, dummy.matrix)
    }
    meshRef.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, COUNT]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshStandardMaterial
        color="#ff4400" emissive="#ff7700" emissiveIntensity={2.2}
        transparent opacity={0.75} toneMapped={false} depthWrite={false}
      />
    </instancedMesh>
  )
}

// ── Lava crust patches — dark slow-drifting blobs on surface ─────────────────
function LavaCrustPatch({ x, z, sx, sz, phase }) {
  const ref = useRef()
  useFrame((state) => {
    if (!ref.current) return
    const t = state.clock.elapsedTime
    ref.current.position.x = x + Math.sin(t * 0.11 + phase) * 0.7
    ref.current.position.z = z + Math.cos(t * 0.08 + phase) * 0.45
    ref.current.material.opacity = 0.5 + Math.sin(t * 0.22 + phase) * 0.12
  })
  return (
    <mesh ref={ref} position={[x, -5.52, z]} rotation={[-Math.PI / 2, 0, phase * 0.4]} scale={[sx, sz, 1]}>
      <circleGeometry args={[1, 10]} />
      <meshStandardMaterial color="#040100" transparent opacity={0.55} depthWrite={false} />
    </mesh>
  )
}

// ── Lava vent — glowing hot spot with pulsing point light ─────────────────────
function LavaVent({ x, z, phase }) {
  const lightRef = useRef()
  useFrame((state) => {
    if (!lightRef.current) return
    const t = state.clock.elapsedTime
    lightRef.current.intensity = 0.6 + Math.abs(Math.sin(t * 1.15 + phase)) * 2.0
  })
  return (
    <>
      <mesh position={[x, -5.51, z]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.26, 10]} />
        <meshStandardMaterial color="#ff8800" emissive="#ff5500" emissiveIntensity={5} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={lightRef} position={[x, -5.3, z]} intensity={1.2} color="#ff6600" distance={5.5} decay={2.2} />
    </>
  )
}

// ── Altar slot decorations — carved tablet + stone clusters + gold ring ───────
function AltarSlotDecorations({ count }) {
  const stoneMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#100906'), roughness: 0.96, metalness: 0.05,
    emissive: new THREE.Color('#1a0500'), emissiveIntensity: 0.18,
  }), [])
  const goldMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d4af37'), metalness: 0.82, roughness: 0.18,
    emissive: new THREE.Color('#b8940e'), emissiveIntensity: 0.38,
  }), [])
  const tabletMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1c0f09'), roughness: 0.90, metalness: 0.07,
    emissive: new THREE.Color('#2e1408'), emissiveIntensity: 0.28,
  }), [])

  const slotH  = 1.05
  const startY = -3.5

  return (
    <group>
      {Array.from({ length: count }, (_, i) => {
        const y = startY + (count - 1 - i) * slotH
        return (
          <group key={i} position={[0, y, 0.2]}>
            {/* Carved stone backing tablet */}
            <mesh position={[0, 0.06, -1.08]} rotation={[0.06, 0, 0]}>
              <boxGeometry args={[1.85, 0.92, 0.20]} />
              <primitive object={tabletMat} attach="material" />
            </mesh>
            {/* Tablet top carved notch */}
            <mesh position={[0, 0.55, -1.06]}>
              <boxGeometry args={[1.40, 0.09, 0.12]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            {/* Tablet side carved pillars */}
            <mesh position={[-0.82, 0.06, -1.06]}>
              <boxGeometry args={[0.10, 0.84, 0.12]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            <mesh position={[0.82, 0.06, -1.06]}>
              <boxGeometry args={[0.10, 0.84, 0.12]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>

            {/* Left stone cluster — 3 stones */}
            <mesh position={[-0.94, 0.10, 0.15]} rotation={[0.15, 0.4, 0.10]}>
              <dodecahedronGeometry args={[0.12, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            <mesh position={[-1.16, -0.05, -0.02]} rotation={[-0.10, -0.3, 0.20]}>
              <dodecahedronGeometry args={[0.09, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            <mesh position={[-1.01, -0.22, 0.20]} rotation={[0.30, 0.20, -0.10]}>
              <dodecahedronGeometry args={[0.08, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>

            {/* Right stone cluster — 3 stones */}
            <mesh position={[0.94, 0.10, 0.15]} rotation={[0.10, -0.5, -0.10]}>
              <dodecahedronGeometry args={[0.12, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            <mesh position={[1.16, -0.05, -0.02]} rotation={[-0.15, 0.35, -0.20]}>
              <dodecahedronGeometry args={[0.09, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            <mesh position={[1.01, -0.22, 0.20]} rotation={[0.20, -0.20, 0.15]}>
              <dodecahedronGeometry args={[0.08, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>

            {/* Front base pebbles */}
            <mesh position={[-0.50, -0.34, 0.32]} rotation={[0.10, 0.30, 0.05]}>
              <dodecahedronGeometry args={[0.07, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>
            <mesh position={[0.50, -0.34, 0.32]} rotation={[0.10, -0.30, -0.05]}>
              <dodecahedronGeometry args={[0.07, 0]} />
              <primitive object={stoneMat} attach="material" />
            </mesh>

            {/* Gold ritual ring framing each tiki slot */}
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.88, 0.028, 8, 28]} />
              <primitive object={goldMat} attach="material" />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

// ── Rocky foreground framing ──────────────────────────────────────────────────
function ForegroundRocks() {
  return (
    <group>
      {/* Left cluster */}
      <mesh position={[-8.5, -4.5, 7]} rotation={[0.4, 0.8, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[3.8, 1]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      <mesh position={[-6.2, -5.2, 8.5]} rotation={[0.2, 1.1, -0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.2, 1]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      {/* Right cluster */}
      <mesh position={[8.8, -4, 7.5]} rotation={[-0.2, -0.5, 0.1]} castShadow receiveShadow>
        <dodecahedronGeometry args={[4.2, 1]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      <mesh position={[6.5, -5, 9]} rotation={[0.3, -0.9, 0.2]} castShadow receiveShadow>
        <dodecahedronGeometry args={[2.5, 1]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      {/* Lava glow seeping through rocks */}
      <pointLight position={[-8, -4.8, 7]} intensity={1.2} color="#ff4400" distance={8} decay={2} />
      <pointLight position={[ 8, -4.5, 7.5]} intensity={1.0} color="#ff5500" distance={8} decay={2} />
    </group>
  )
}

// ── Full environment ──────────────────────────────────────────────────────────
function Environment3D() {
  return (
    <group>
      <LavaPool />
      <VolcanoSilhouettes />
      <ForegroundRocks />

      {/* Lava crust patches — dark drifting blobs */}
      {[
        { x: -8,  z: -6,  sx: 2.2, sz: 1.4, ph: 0.0 },
        { x:  7,  z: -4,  sx: 1.8, sz: 1.1, ph: 1.7 },
        { x:  0,  z: -12, sx: 3.0, sz: 1.8, ph: 3.1 },
        { x: -4,  z: 3,   sx: 1.5, sz: 1.0, ph: 1.1 },
      ].map((p, i) => <LavaCrustPatch key={i} x={p.x} z={p.z} sx={p.sx} sz={p.sz} phase={p.ph} />)}

      {/* Lava vents — hot glowing spots */}
      {[
        { x: -6,  z: -3,  ph: 0.0 },
        { x:  5,  z: -6,  ph: 2.1 },
        { x:  1,  z: 5,   ph: 3.7 },
      ].map((v, i) => <LavaVent key={i} x={v.x} z={v.z} phase={v.ph} />)}

      {/* Rising ember sparks above lava pool */}
      <Sparkles
        count={80}
        scale={[22, 18, 10]}
        size={2.0}
        speed={0.38}
        color="#ff6600"
        position={[0, -3, 0]}
        opacity={0.75}
      />
      {/* Higher drifting ash particles */}
      <Sparkles
        count={50}
        scale={[32, 26, 12]}
        size={1.1}
        speed={0.20}
        color="#ffaa44"
        position={[0, 2, -8]}
        opacity={0.38}
      />

      {/* Star field visible above volcano horizon */}
      <Stars radius={90} depth={60} count={1200} factor={4} saturation={0.1} fade speed={0.3} />
    </group>
  )
}

// ── Ritual stone platform beneath altar ──────────────────────────────────────
function StonePlatform() {
  return (
    <group>
      {/* Main raised dais */}
      <mesh receiveShadow castShadow position={[0, -4.75, 0]}>
        <cylinderGeometry args={[3.8, 4.4, 0.8, 8]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      {/* Middle step ring */}
      <mesh receiveShadow castShadow position={[0, -5.1, 0]}>
        <cylinderGeometry args={[5.0, 5.6, 0.55, 8]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      {/* Outer base ring merging into lava */}
      <mesh receiveShadow castShadow position={[0, -5.35, 0]}>
        <cylinderGeometry args={[6.5, 7.0, 0.45, 12]} />
        <shaderMaterial vertexShader={rockVert} fragmentShader={rockFrag} />
      </mesh>
      {/* 4 totemic marker pillars at dais corners */}
      {[[-2.6, -2.6], [2.6, -2.6], [-2.6, 2.6], [2.6, 2.6]].map(([x, z], i) => (
        <group key={i} position={[x, -4.35, z]}>
          <mesh receiveShadow castShadow>
            <cylinderGeometry args={[0.18, 0.24, 1.9, 6]} />
            <meshStandardMaterial color="#231008" roughness={0.9} metalness={0.06} />
          </mesh>
          {/* Flame-cap orb */}
          <mesh position={[0, 1.1, 0]}>
            <sphereGeometry args={[0.14, 10, 10]} />
            <meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={4.5} toneMapped={false} />
          </mesh>
          <pointLight position={[0, 1.3, 0]} intensity={0.7} color="#ff4400" distance={5} decay={2} />
        </group>
      ))}
    </group>
  )
}

// ── Grand Stone Altar ────────────────────────────────────────────────────────
function AltarBase() {
  return (
    <group position={[0, 0, -0.5]}>
      {/* Main Stone Pillar (Taller) */}
      <mesh receiveShadow castShadow position={[0, 1.5, 0]}>
        <boxGeometry args={[1.8, 12.5, 0.6]} />
        <meshStandardMaterial color="#2c1a12" roughness={0.9} metalness={0.1} />
      </mesh>
      
      {/* Glowing Runes on Pillar */}
      <mesh position={[0, 1.5, 0.31]}>
        <planeGeometry args={[0.2, 10]} />
        <meshStandardMaterial color="#ffffff" emissive="#ff6600" emissiveIntensity={1.5} />
      </mesh>
      
      {/* Stepped Base */}
      <mesh receiveShadow castShadow position={[0, -4.8, 0.4]}>
        <boxGeometry args={[3.2, 0.4, 1.8]} />
        <meshStandardMaterial color="#1c110b" roughness={0.8} />
      </mesh>
      <mesh receiveShadow castShadow position={[0, -5.1, 0.6]}>
        <boxGeometry args={[4.0, 0.4, 2.2]} />
        <meshStandardMaterial color="#120a06" roughness={0.9} />
      </mesh>
      
      {/* Top Cap */}
      <mesh receiveShadow castShadow position={[0, 7.8, 0.2]}>
        <boxGeometry args={[2.4, 0.4, 1.2]} />
        <meshStandardMaterial color="#3c2417" roughness={0.8} />
      </mesh>
    </group>
  )
}

// ── Score Track & Player Tokens ──────────────────────────────────────────────
function ScoreTrack3D({ players }) {
  // Generate 35 peg positions (1-14 Left up, 15-20 Top across, 21-35 Right down)
  const pegs = useMemo(() => {
    const arr = []
    const startY = -4.2
    const stepY = 0.58
    
    // Left side (1-14)
    for(let i=0; i<14; i++) arr.push({ id: i+1, pos: [-1.4, startY + i*stepY, 0.2] })
    // Top curve (15-20)
    for(let i=0; i<6; i++) {
      const t = i/5
      arr.push({ id: 15+i, pos: [-1.4 + t*2.8, 4.2 + Math.sin(t*Math.PI)*0.4, 0.2] })
    }
    // Right side (21-35)
    for(let i=0; i<15; i++) arr.push({ id: 21+i, pos: [1.4, 4.2 - i*stepY, 0.2] })
    
    return arr
  }, [])

  return (
    <group>
      {/* The Pegs */}
      {pegs.map(peg => (
        <mesh key={`peg-${peg.id}`} position={peg.pos} castShadow receiveShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.2, 16]} rotation={[Math.PI/2, 0, 0]} />
          <meshStandardMaterial color="#555" roughness={0.6} />
        </mesh>
      ))}

      {/* Player Tokens (Snapping to their score peg) */}
      {players && players.map((p, idx) => {
        // Find the peg for the player's score. Clamp to 1-35, or put off-board if 0
        const score = Math.max(0, Math.min(35, p.score || 0))
        const peg = score > 0 ? pegs.find(x => x.id === score) : { pos: [0, -4.5, 1.5] }
        
        // Slightly offset tokens if they are on the same peg
        const offsetX = (idx - (players.length-1)/2) * 0.15
        
        return (
          <mesh key={`token-${p.id}`} position={[peg.pos[0] + offsetX, peg.pos[1], peg.pos[2] + 0.15]} castShadow>
            <cylinderGeometry args={[0.12, 0.12, 0.1, 16]} rotation={[Math.PI/2, 0, 0]} />
            <meshStandardMaterial color={idx === 0 ? '#ff3333' : '#3388ff'} metalness={0.5} roughness={0.2} />
          </mesh>
        )
      })}
    </group>
  )
}


export default function TikiBoard3D({ board, players, isMyTurn, onTikiClick, validTikiIds = [] }) {
  const [hoveredId, setHoveredId] = useState(null)

  // position 1 (rank #1 / best) renders at top of altar (highest Y)
  const getSlotPosition = (index, totalCount) => {
    const slotH = 1.05
    const startY = -3.5
    const invertedIndex = totalCount - 1 - index
    return [0, startY + (invertedIndex * slotH), 0.2]
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Pushing graphical limits with higher shadow resolution and ACESFilmic tone mapping */}
      <Canvas shadows dpr={[1, 1.5]} gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15, antialias: true }} camera={{ position: [0, 4, 25], fov: 54 }}>

        {/* Scene atmosphere */}
        <color attach="background" args={['#06020c']} />
        <fog attach="fog" color="#0d0208" near={22} far={70} />

        {/* Dim volcanic ambient — warm red-orange tint */}
        <ambientLight intensity={0.22} color="#ff6633" />

        {/* Cool moonlight from upper-left */}
        <directionalLight
          position={[-8, 14, 8]}
          intensity={0.65}
          color="#8899cc"
          castShadow
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0001}
        />

        {/* Primary lava underglow — flickers */}
        <FlickerLight position={[0, -4.5, 3]}  baseIntensity={2.8} color="#ff4400" />
        {/* Side lava fills */}
        <FlickerLight position={[-5, -5, 1]}    baseIntensity={1.2} color="#ff5500" />
        <FlickerLight position={[ 5, -5, 1]}    baseIntensity={1.2} color="#ff3300" />
        {/* Warm fill from altar runes */}
        <pointLight position={[0, 2, 0.5]} intensity={1.2} color="#ff7700" distance={12} decay={2} />

        {/* Cinematic altar spotlight — warm gold cone from above */}
        <spotLight
          position={[0, 18, 5]}
          angle={0.2}
          penumbra={0.55}
          intensity={14}
          color="#fff5e8"
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        {/* Cool counter-fill from upper-rear */}
        <spotLight
          position={[4, 13, -4]}
          angle={0.3}
          penumbra={0.7}
          intensity={3.5}
          color="#8899dd"
        />

        <Environment3D />
        <StonePlatform />
        <AltarBase />
        <ScoreTrack3D players={players} />
        <AltarSlotDecorations count={board.length} />

        <group position={[0, 0, 0]}>
          {board.map((tiki, index) => {
            const isSelectable = isMyTurn && validTikiIds.includes(tiki.id)
            return (
              <TikiTotem3D
                key={tiki.id}
                tiki={tiki}
                position={getSlotPosition(index, board.length)}
                isSelected={hoveredId === tiki.id && isSelectable}
                isHovered={hoveredId === tiki.id && isSelectable}
                isValidTarget={isSelectable}
                onClick={() => isSelectable && onTikiClick(tiki.id)}
                onPointerOver={() => isSelectable && setHoveredId(tiki.id)}
                onPointerOut={() => setHoveredId(null)}
              />
            )
          })}
        </group>

        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={0.55}
            luminanceSmoothing={0.82}
            height={400}
            intensity={1.5}
            mipmapBlur
          />
          <ToneMapping mode={THREE.ACESFilmicToneMapping} />
        </EffectComposer>
      </Canvas>

      {/* Cinematic vignette — radial dark edges */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 48%, transparent 26%, rgba(4,1,8,0.42) 55%, rgba(2,0,5,0.78) 80%, rgba(1,0,3,0.94) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
      {/* Letterbox top/bottom cinematic bars */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(2,0,5,0.52) 0%, transparent 16%, transparent 80%, rgba(2,0,5,0.52) 100%)',
        pointerEvents: 'none',
        zIndex: 2,
      }} />
    </div>
  )
}
