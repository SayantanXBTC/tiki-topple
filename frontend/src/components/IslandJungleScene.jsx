import { useRef, useMemo, Suspense, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Stars, Sparkles, Billboard, Environment } from '@react-three/drei'
import { EffectComposer, Bloom, Vignette, SMAA } from '@react-three/postprocessing'
import * as THREE from 'three'

// ══════════════════════════════════════════════════════════════════════════════
// OCEAN — shader-driven waves with moonlight shimmer
// ══════════════════════════════════════════════════════════════════════════════
function Ocean() {
  const matRef = useRef()
  const uniforms = useMemo(() => ({
    uTime:    { value: 0 },
    uDeep:    { value: new THREE.Color('#020814') },
    uShallow: { value: new THREE.Color('#0a5878') },
    uMoon:    { value: new THREE.Color('#eaf0ff') },
    uWarm:    { value: new THREE.Color('#ff7a20') },
  }), [])
  useFrame((_, dt) => { if (matRef.current) matRef.current.uniforms.uTime.value += dt })

  const vert = /* glsl */`
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    void main() {
      vUv = uv;
      vec3 p = position;
      float w = sin(p.x * 0.28 + uTime * 0.9) * 0.42
              + sin(p.y * 0.5  + uTime * 1.3) * 0.28
              + sin((p.x + p.y) * 0.14 + uTime * 0.55) * 0.55
              + sin(p.x * 1.1 + uTime * 2.2) * 0.06;
      p.z += w;
      vWave = w;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
    }
  `
  const frag = /* glsl */`
    uniform vec3 uDeep;
    uniform vec3 uShallow;
    uniform vec3 uMoon;
    uniform vec3 uWarm;
    uniform float uTime;
    varying vec2 vUv;
    varying float vWave;
    void main() {
      float depth = smoothstep(0.0, 1.0, vUv.y);
      vec3 col = mix(uShallow, uDeep, depth);
      // Fine glitter: two overlapping high-freq sines
      float g1 = pow(max(0.0, sin(vUv.x * 90.0 + uTime * 1.7) * sin(vUv.y * 60.0 - uTime * 1.3)), 8.0);
      float g2 = pow(max(0.0, sin(vUv.x * 45.0 - uTime * 2.1) * sin(vUv.y * 30.0 + uTime * 0.9)), 6.0);
      col += uMoon * (g1 * 0.45 + g2 * 0.22);
      // Wave-crest whitecaps
      col += uMoon * smoothstep(0.55, 1.2, vWave) * 0.55;
      // Warm torch reflection near shore (bottom of plane in world = high vUv.y)
      col += uWarm * pow(max(0.0, sin(vUv.x * 10.0 + uTime * 0.4) * 0.5 + 0.5), 3.0)
              * smoothstep(0.7, 1.0, 1.0 - vUv.y) * 0.28;
      gl_FragColor = vec4(col, 1.0);
    }
  `

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.05, -25]}>
      <planeGeometry args={[260, 140, 90, 50]} />
      <shaderMaterial ref={matRef} uniforms={uniforms} vertexShader={vert} fragmentShader={frag} />
    </mesh>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// TERRAIN — sand + wet shoreline
// ══════════════════════════════════════════════════════════════════════════════
function Terrain() {
  const { geom, colors } = useMemo(() => {
    const g = new THREE.PlaneGeometry(220, 80, 100, 30)
    const pos = g.attributes.position
    const cs = new Float32Array(pos.count * 3)
    const sand = new THREE.Color('#8a6832')
    const dune = new THREE.Color('#a58548')
    const wet  = new THREE.Color('#3a2812')
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const y = pos.getY(i)
      const d = Math.sin(x * 0.14) * 0.4 + Math.cos(y * 0.22 + x * 0.05) * 0.55
                + Math.sin(x * 0.4 + y * 0.15) * 0.18
      pos.setZ(i, d)
      // Wet shoreline near far edge (y < -18)
      const wetMix = THREE.MathUtils.smoothstep(-18, -12, y)
      const c = new THREE.Color().lerpColors(wet, sand, wetMix)
                .lerp(dune, Math.random() * 0.3)
      cs[i*3] = c.r; cs[i*3+1] = c.g; cs[i*3+2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(cs, 3))
    g.computeVertexNormals()
    return { geom: g, colors: cs }
  }, [])
  return (
    <mesh geometry={geom} rotation={[-Math.PI / 2, 0, 0]} position={[0, -2.9, 8]}>
      <meshStandardMaterial vertexColors roughness={0.98} metalness={0.02} />
    </mesh>
  )
}

// Scattered beach detail — larger rocks + pebble clusters + wet-sand patches
function BeachRocks() {
  const rocks = useMemo(() => {
    const arr = []
    // Big rocks — trimmed for perf
    for (let i = 0; i < 16; i++) {
      const side = i % 2 === 0 ? -1 : 1
      arr.push({
        p: [side * (7 + Math.random() * 16), -2.78 + Math.random() * 0.25,
            3 - i * 0.85 - Math.random() * 1.8],
        s: 0.40 + Math.random() * 0.55,
        r: Math.random() * Math.PI,
        c: Math.random() > 0.5 ? '#2a2218' : '#3a2f20',
      })
    }
    // Small pebble scatter — trimmed
    for (let i = 0; i < 22; i++) {
      arr.push({
        p: [(Math.random() - 0.5) * 40, -2.83 + Math.random() * 0.1,
            (Math.random() - 0.5) * 20],
        s: 0.10 + Math.random() * 0.15,
        r: Math.random() * Math.PI,
        c: '#1a1408',
      })
    }
    return arr
  }, [])
  const wetPatches = useMemo(() => {
    const arr = []
    for (let i = 0; i < 8; i++) {
      arr.push({
        p: [(Math.random() - 0.5) * 30, -2.82,
            (Math.random() - 0.5) * 14],
        s: 0.8 + Math.random() * 1.2,
      })
    }
    return arr
  }, [])
  return (
    <>
      {rocks.map((r, i) => (
        <mesh key={`r-${i}`} position={r.p} rotation={[0, r.r, 0]}
              scale={[r.s, r.s * 0.6, r.s]}>
          <dodecahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color={r.c} roughness={1} flatShading />
        </mesh>
      ))}
      {/* Wet-sand puddle decals — flat discs w/ dark reflective material */}
      {wetPatches.map((w, i) => (
        <mesh key={`w-${i}`} position={w.p} rotation={[-Math.PI / 2, 0, Math.random() * Math.PI]}
              scale={[w.s, w.s * 0.55, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshStandardMaterial color="#0a1420" roughness={0.35} metalness={0.15}
            transparent opacity={0.65} />
        </mesh>
      ))}
    </>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PALM TREE — curved trunk + realistic arcing plane-strip fronds
// ══════════════════════════════════════════════════════════════════════════════
// Palm frond geometry — real coconut-palm shape: wide leafy blade that stays
// broad most of its length then rounds off at the tip (not conical/pointy).
// Zig-zag width simulates pinnate leaflets.
function buildFrondGeometry(len = 5.5, w = 1.4, segments = 24) {
  const positions = []
  const indices = []
  const uvs = []
  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    // Arcing spine — mostly straight for the first 60%, then droops sharply
    const arc = -Math.pow(t, 2.2) * len * 0.7
    // Width stays broad, only tapers near the very tip (not conical)
    const taper = t < 0.85
      ? 0.7 + 0.3 * Math.sin(t * Math.PI)   // stays wide through the body
      : Math.pow((1 - t) / 0.15, 0.8)        // rounds off in the last 15%
    // Zig-zag leaflet width — every other segment narrower for compound-leaf silhouette
    const zig = (i % 2 === 0) ? 1.0 : 0.78
    const halfW = w * taper * zig * 0.5
    const x = t * len
    const y = arc
    positions.push(x, y, -halfW,  x, y, halfW)
    uvs.push(t, 0, t, 1)
    if (i < segments) {
      const a = i * 2
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('uv',       new THREE.Float32BufferAttribute(uvs, 2))
  g.setIndex(indices)
  g.computeVertexNormals()
  return g
}

const FROND_GEOM       = buildFrondGeometry(5.5, 1.4, 24)
const FROND_GEOM_SHORT = buildFrondGeometry(3.5, 0.95, 18)

function PalmTree({ position, scale = 1, rotation = 0, seed = 0 }) {
  const ref = useRef()
  useFrame((s) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(s.clock.elapsedTime * 0.7 + seed) * 0.03
    }
  })
  const trunkGeom = useMemo(() => {
    const rng = ((seed * 9301 + 49297) % 233280) / 233280
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.15 + rng * 0.3, 1.6, 0.1),
      new THREE.Vector3(-0.1 - rng * 0.2, 3.2, -0.05),
      new THREE.Vector3(0.25 + rng * 0.3, 4.9, 0.05),
      new THREE.Vector3(0.05 + rng * 0.15, 6.4, 0),
    ])
    const g = new THREE.TubeGeometry(curve, 30, 0.24, 10, false)
    // Taper trunk by scaling top ring smaller: manipulate positions
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i)
      const t = Math.max(0, Math.min(1, y / 6.4))
      const shrink = 1 - t * 0.4
      const cx = 0, cz = 0
      const px = pos.getX(i), pz = pos.getZ(i)
      pos.setX(i, cx + (px - cx) * shrink)
      pos.setZ(i, cz + (pz - cz) * shrink)
    }
    g.computeVertexNormals()
    return g
  }, [seed])
  // Real coconut-palm crown: outer fronds radiate ~horizontally from the crown
  // then droop down. Inner shorter fronds sit upright as the palm heart.
  const outerFronds = useMemo(() => {
    const arr = []
    const n = 10
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2
      // droop ~ -0.05 to -0.15 means frond starts near horizontal and its
      // own geometry arcs down — real palm-branch silhouette
      const droop = -0.02 - Math.random() * 0.12
      arr.push({ a, droop, tone: i % 2 ? '#2a6a2a' : '#3d8a3d' })
    }
    return arr
  }, [])
  const innerFronds = useMemo(() => {
    const arr = []
    const n = 6
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + 0.4
      // Slight upward tilt for the young center fronds
      const droop = 0.25 + Math.random() * 0.2
      arr.push({ a, droop, tone: i % 2 ? '#4a9a4a' : '#5aba5a' })
    }
    return arr
  }, [])
  return (
    <group ref={ref} position={position} scale={scale} rotation={[0, rotation, 0]}>
      {/* Trunk */}
      <mesh geometry={trunkGeom} castShadow>
        <meshStandardMaterial color="#3a2210" roughness={0.95} />
      </mesh>
      {/* Ring segments on trunk (tape marks) */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[0, 0.8 + i * 0.75, 0]}>
          <torusGeometry args={[0.24 * (1 - i * 0.045), 0.035, 4, 12]} />
          <meshStandardMaterial color="#1a0e04" roughness={1} />
        </mesh>
      ))}
      {/* Outer drooping fronds — big, main silhouette */}
      <group position={[0.15, 6.3, 0]}>
        {outerFronds.map((f, i) => (
          <mesh
            key={`o-${i}`}
            geometry={FROND_GEOM}
            rotation={[f.droop, f.a, Math.sin(f.a) * 0.35]}
          >
            <meshStandardMaterial
              color={f.tone}
              roughness={0.7}
              side={THREE.DoubleSide}
              transparent
              opacity={0.96}
              flatShading
            />
          </mesh>
        ))}
      </group>
      {/* Inner upright fronds — brighter, fills the crown */}
      <group position={[0.15, 6.4, 0]}>
        {innerFronds.map((f, i) => (
          <mesh
            key={`i-${i}`}
            geometry={FROND_GEOM_SHORT}
            rotation={[f.droop, f.a, Math.sin(f.a) * 0.2]}
          >
            <meshStandardMaterial
              color={f.tone}
              roughness={0.65}
              side={THREE.DoubleSide}
              transparent
              opacity={0.92}
              flatShading
            />
          </mesh>
        ))}
      </group>
      {/* Coconut cluster */}
      <group position={[0.15, 6.15, 0]}>
        {[[0.18,0,0.05],[-0.12,-0.08,0.14],[0.05,-0.12,-0.15]].map((p,i) => (
          <mesh key={i} position={p}>
            <sphereGeometry args={[0.15, 10, 8]} />
            <meshStandardMaterial color="#2a1608" roughness={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function PalmGrove() {
  // Trimmed from 22 → 12 palms for perf. Bigger palms per side to keep visual density.
  const positions = useMemo(() => {
    const pts = []
    const rand = (s) => { const x = Math.sin(s) * 43758.5; return x - Math.floor(x) }
    for (let i = 0; i < 5; i++) {
      pts.push({
        p: [-16 - rand(i) * 6, -2.4, 3 - i * 4 - rand(i + 40) * 2],
        s: 1.05 + rand(i + 10) * 0.5, r: rand(i + 20) * Math.PI, seed: i * 3,
      })
    }
    for (let i = 0; i < 5; i++) {
      pts.push({
        p: [16 + rand(i + 100) * 6, -2.4, 3 - i * 4 - rand(i + 140) * 2],
        s: 1.05 + rand(i + 110) * 0.5, r: rand(i + 120) * Math.PI + Math.PI, seed: i * 3 + 1,
      })
    }
    // Just 2 background palms
    for (let i = 0; i < 2; i++) {
      pts.push({
        p: [-15 + i * 30, -2.4, -24],
        s: 0.9 + rand(i + 220) * 0.3, r: rand(i + 230) * Math.PI, seed: i * 5 + 2,
      })
    }
    return pts
  }, [])
  return positions.map((pt, i) => (
    <PalmTree key={i} position={pt.p} scale={pt.s} rotation={pt.r} seed={pt.seed} />
  ))
}

// ══════════════════════════════════════════════════════════════════════════════
// UNDERGROWTH — ferns / bushes
// ══════════════════════════════════════════════════════════════════════════════
function Undergrowth() {
  const bushes = useMemo(() => {
    const arr = []
    for (let i = 0; i < 30; i++) {
      const side = i % 2 === 0 ? -1 : 1
      arr.push({
        p: [side * (10 + Math.random() * 12), -2.65,
            4 - i * 1.1 - Math.random() * 2],
        s: [0.6 + Math.random() * 0.7, 0.5 + Math.random() * 0.4, 0.6 + Math.random() * 0.7],
        c: Math.random() > 0.5 ? '#183a18' : '#274e28',
      })
    }
    return arr
  }, [])
  return bushes.map((b, i) => (
    <mesh key={i} position={b.p} scale={b.s}>
      <icosahedronGeometry args={[0.9, 1]} />
      <meshStandardMaterial color={b.c} roughness={1} flatShading />
    </mesh>
  ))
}

// ══════════════════════════════════════════════════════════════════════════════
// TORCH FLAME — layered noise-driven continuous fire w/ radial glow
// ══════════════════════════════════════════════════════════════════════════════
function Flame({ scale = 1 }) {
  const matRef = useRef()
  const glowRef = useRef()
  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uCore: { value: new THREE.Color('#fff8dc') },
    uMid:  { value: new THREE.Color('#ffa028') },
    uEdge: { value: new THREE.Color('#ff2a08') },
  }), [])
  useFrame((_, dt) => {
    if (matRef.current) matRef.current.uniforms.uTime.value += dt
    if (glowRef.current) {
      const t = matRef.current?.uniforms.uTime.value ?? 0
      glowRef.current.material.opacity = 0.42 + Math.sin(t * 10) * 0.08
    }
  })

  const vert = /* glsl */`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `
  // Continuous flame: elliptical vertical mask + rising fbm noise displaces
  // the mask edge. No triangle stacking — one seamless plume.
  const frag = /* glsl */`
    uniform float uTime;
    uniform vec3 uCore;
    uniform vec3 uMid;
    uniform vec3 uEdge;
    varying vec2 vUv;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0,0.0));
      float c = hash(i + vec2(0.0,1.0));
      float d = hash(i + vec2(1.0,1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(a,b,u.x), mix(c,d,u.x), u.y);
    }
    float fbm(vec2 p){
      float v = 0.0, a = 0.55;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
      return v;
    }

    void main() {
      // Center-origin coords: x in [-0.5, 0.5], y in [0 (bottom), 1 (top)]
      vec2 p = vec2(vUv.x - 0.5, vUv.y);

      // Rising noise for organic flicker
      float n1 = fbm(vec2(p.x * 2.5, p.y * 3.5 - uTime * 1.6));
      float n2 = fbm(vec2(p.x * 6.0 + 4.0, p.y * 8.0 - uTime * 3.2)) * 0.55;
      float n  = n1 + n2 - 0.2;

      // Elliptical envelope: wide at bottom, gentler taper up top
      float widthScale = mix(0.50, 0.18, pow(p.y, 1.1));
      float radial = abs(p.x) / max(0.01, widthScale);

      // Displace envelope by noise for tongue-of-flame shape
      float displaced = radial - (n - 0.5) * 0.35;
      float body = 1.0 - smoothstep(0.55, 1.0, displaced);

      // Base + top fade
      body *= smoothstep(0.0, 0.12, p.y);
      body *= smoothstep(1.05, 0.55, p.y);

      // Intensity for color ramp (hotter in core)
      float intensity = body * mix(0.8, 1.6, 1.0 - p.y);

      vec3 col = mix(uEdge, uMid, smoothstep(0.20, 0.60, intensity));
      col      = mix(col,   uCore, smoothstep(0.60, 1.05, intensity));

      float alpha = body * 0.95;
      if (alpha < 0.01) discard;
      gl_FragColor = vec4(col, alpha);
    }
  `

  return (
    <Billboard>
      {/* Radial soft glow behind flame — sells the volumetric warmth */}
      <mesh ref={glowRef} scale={scale * 3.4} position={[0, scale * 0.75, -0.02]}>
        <planeGeometry args={[1, 1]} />
        <shaderMaterial
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{ uColor: { value: new THREE.Color('#ff7a20') } }}
          vertexShader={`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`}
          fragmentShader={`
            uniform vec3 uColor;
            varying vec2 vUv;
            void main(){
              float d = distance(vUv, vec2(0.5, 0.55));
              float a = smoothstep(0.5, 0.05, d);
              gl_FragColor = vec4(uColor, a * 0.6);
            }
          `}
        />
      </mesh>

      {/* Main flame body — shorter + wider plume */}
      <mesh scale={[scale * 1.15, scale * 1.35, 1]} position={[0, scale * 0.6, 0]}>
        <planeGeometry args={[1, 1, 1, 1]} />
        <shaderMaterial
          ref={matRef}
          uniforms={uniforms}
          vertexShader={vert}
          fragmentShader={frag}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </Billboard>
  )
}

function Torch({ position }) {
  const lightRef = useRef()
  useFrame((s) => {
    const f = 1 + Math.sin(s.clock.elapsedTime * 11 + position[0]) * 0.18
      + Math.sin(s.clock.elapsedTime * 27 + position[2]) * 0.08
    if (lightRef.current) lightRef.current.intensity = 4.2 * f
  })
  return (
    <group position={position}>
      {/* Stone base — ring of small rocks anchoring the torch to the ground */}
      {Array.from({ length: 7 }).map((_, i) => {
        const a = (i / 7) * Math.PI * 2
        const rr = 0.35 + (i % 2) * 0.08
        return (
          <mesh
            key={`base-${i}`}
            position={[Math.cos(a) * rr, 0.08 + (i % 2) * 0.05, Math.sin(a) * rr]}
            rotation={[0, a + i * 0.6, 0]}
            scale={[0.22 + (i % 2) * 0.05, 0.14, 0.22 + (i % 2) * 0.05]}
          >
            <dodecahedronGeometry args={[1, 0]} />
            <meshStandardMaterial color="#2a2418" roughness={1} flatShading />
          </mesh>
        )
      })}
      {/* Central mound */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.32, 0.42, 0.15, 12]} />
        <meshStandardMaterial color="#3a2c14" roughness={1} />
      </mesh>
      {/* Post w/ ring wraps */}
      <mesh position={[0, 1.25, 0]} castShadow>
        <cylinderGeometry args={[0.09, 0.11, 2.3, 8]} />
        <meshStandardMaterial color="#2a1508" roughness={1} />
      </mesh>
      {[0.4, 1.2, 1.9].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.12, 0.02, 4, 12]} />
          <meshStandardMaterial color="#7a5010" roughness={0.4} metalness={0.85} />
        </mesh>
      ))}
      {/* Bowl */}
      <mesh position={[0, 2.4, 0]} castShadow>
        <cylinderGeometry args={[0.28, 0.22, 0.3, 10]} />
        <meshStandardMaterial color="#3a2010" roughness={0.85} metalness={0.3} />
      </mesh>
      {/* Shader flame w/ integrated radial glow */}
      <group position={[0, 2.55, 0]}>
        <Flame scale={1.35} />
      </group>
      {/* Warm point light */}
      <pointLight
        ref={lightRef}
        color="#ff8a2b"
        intensity={4.2}
        distance={16}
        decay={2}
        position={[0, 2.85, 0]}
      />
    </group>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// DISTANT ISLANDS + MOON
// ══════════════════════════════════════════════════════════════════════════════
function DistantIslands() {
  return (
    <group position={[0, -1, -70]}>
      {[-45, -12, 22, 55].map((x, i) => (
        <mesh key={i} position={[x, 3 + i * 0.5, -i * 3]}>
          <coneGeometry args={[11 + i * 1.5, 9 + i, 24]} />
          <meshStandardMaterial color="#0a1420" roughness={1} />
        </mesh>
      ))}
    </group>
  )
}

function Moon() {
  // Moon pushed higher up and further back so its glow halo doesn't render
  // as a pale rectangle in the upper-left of the play area. Halo shrunk
  // considerably so bloom + additive blend no longer creates a visible box.
  return (
    <group position={[-38, 38, -75]}>
      <mesh>
        <sphereGeometry args={[3.2, 32, 32]} />
        <meshBasicMaterial color="#f8f2e0" />
      </mesh>
      {/* Subtle moon glow — smaller radial fade, low intensity */}
      <Billboard>
        <mesh>
          <planeGeometry args={[8, 8]} />
          <meshBasicMaterial color="#c0d0ff" transparent opacity={0.06}
            blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </Billboard>
      <pointLight color="#c8d4ff" intensity={1.2} distance={80} decay={1.5} />
    </group>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN SCENE
// ══════════════════════════════════════════════════════════════════════════════
export default function IslandJungleScene({ variant = 'game' }) {
  // Lobby variant: warmer dusk-lit ritual clearing, pulled-back camera,
  // ring of six torches around a central ceremonial glow. Game variant:
  // cool night jungle with four corner torches (original).
  const isLobby = variant === 'lobby'

  const cameraProps = isLobby
    ? { position: [0, 7, 26], fov: 46, near: 0.1, far: 320 }
    : { position: [0, 4, 22], fov: 50, near: 0.1, far: 320 }

  const bg = isLobby
    ? 'linear-gradient(180deg, #1a0808 0%, #2a1204 32%, #3a1a06 62%, #1a0e04 100%)'
    : 'linear-gradient(180deg, #030818 0%, #081432 40%, #0e2848 72%, #143848 100%)'

  const fogArgs = isLobby ? ['#2a1204', 40, 170] : ['#0a1830', 45, 180]
  const ambientColor = isLobby ? '#d89060' : '#7898c8'
  const ambientIntensity = isLobby ? 0.75 : 0.55
  const hemiTop = isLobby ? '#ffb070' : '#a8c4e8'
  const hemiBot = isLobby ? '#3a1a04' : '#4a3418'
  const rimColor = isLobby ? '#ffb060' : '#c8d4ff'

  // Torch ring: lobby = 6 around central ritual, game = 4 at corners.
  const torches = isLobby
    ? [
        [-8, -2.5,  4],
        [ 8, -2.5,  4],
        [-10, -2.5, -3],
        [ 10, -2.5, -3],
        [-4, -2.5,  8],
        [ 4, -2.5,  8],
      ]
    : [
        [-6.5, -2.5,  4],
        [ 6.5, -2.5,  4],
        [-9.5, -2.5, -4],
        [ 9.5, -2.5, -4],
      ]

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
      <Canvas
        dpr={[1, 1.75]}
        camera={cameraProps}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
        style={{ background: bg }}
      >
        <Suspense fallback={null}>
          <fog attach="fog" args={fogArgs} />

          <ambientLight intensity={ambientIntensity} color={ambientColor} />
          <hemisphereLight args={[hemiTop, hemiBot, isLobby ? 0.65 : 0.85]} />
          <directionalLight position={[-12, 14, -18]} intensity={0.6} color={rimColor} />
          {!isLobby && <Moon />}

          <Stars radius={150} depth={70} count={isLobby ? 700 : 1200} factor={4} saturation={0} fade speed={0.4} />

          <Terrain />
          <BeachRocks />
          <Ocean />
          <DistantIslands />

          <PalmGrove />
          <Undergrowth />

          {torches.map((p, i) => <Torch key={i} position={p} />)}

          {/* Lobby: strong central ritual glow — big warm ember column.
              Game: mixed warm/cool sparkles for atmosphere. */}
          {isLobby ? (
            <>
              <Sparkles count={110} scale={[18, 14, 18]} position={[0, 3, 0]}
                        size={4.2} speed={0.5} opacity={0.9} color="#ff9040" />
              <Sparkles count={40} scale={[38, 6, 24]} position={[0, 1, 4]}
                        size={2.4} speed={0.35} opacity={0.6} color="#ffd070" />
              <pointLight position={[0, 4, 0]} intensity={2.8} distance={22} decay={1.6} color="#ff7020" />
            </>
          ) : (
            <>
              <Sparkles count={55} scale={[34, 10, 22]} position={[0, 2, 0]}
                        size={3.2} speed={0.35} opacity={0.75} color="#ffe6a0" />
              <Sparkles count={22} scale={[20, 4, 12]} position={[0, 1, 6]}
                        size={2.2} speed={0.55} opacity={0.6} color="#a0e8ff" />
            </>
          )}

          <Environment preset={isLobby ? 'sunset' : 'night'} background={false} />
        </Suspense>

        {/* Post-processing: SMAA antialiasing + tight bloom + vignette only.
            Chromatic aberration removed — was blurring/color-fringing the
            whole scene. Bloom threshold high so only real light sources bloom
            (flames, moon) instead of hazing everything. */}
        <EffectComposer multisampling={0}>
          <SMAA />
          <Bloom
            intensity={0.42}
            luminanceThreshold={0.82}
            luminanceSmoothing={0.15}
            mipmapBlur
          />
          <Vignette
            eskil={false}
            offset={0.30}
            darkness={0.65}
          />
        </EffectComposer>
      </Canvas>

      {/* Soft radial focus glow around the play area */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 50% 55%, transparent 45%, rgba(2,4,10,0.35) 90%)',
      }} />
    </div>
  )
}
