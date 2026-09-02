import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Stars } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useRef, useMemo } from 'react'
import * as THREE from 'three'

// ── Flame shaders (module-level — never recreated) ────────────────────────
const FLAME_VERT = /* glsl */`
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const FLAME_FRAG = /* glsl */`
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }
  float noise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    // Two noise layers moving upward at different speeds → turbulence
    float n  = fbm(vec2(uv.x * 2.2, uv.y * 2.2 - uTime * 1.35));
    float n2 = fbm(vec2(uv.x * 3.9 + 1.7, uv.y * 3.0 - uTime * 2.05));
    // Distort the UV so edges ripple
    vec2 distUv = uv + vec2((n - 0.5) * 0.13, (n2 - 0.5) * 0.09);
    float cx = distUv.x - 0.5;
    float y  = clamp(distUv.y, 0.0, 1.0);
    // Teardrop width: wide at base (y=0), zero at tip (y=1)
    float width = 0.44 * (1.0 - y) * sqrt(max(0.0, 1.0 - y * 0.52));
    float inside = 1.0 - smoothstep(width * 0.62, width, abs(cx));
    inside *= smoothstep(0.0, 0.07, y);
    inside *= 1.0 - smoothstep(0.70, 1.0, y);
    // Hot white-yellow core at base center
    float core = (1.0 - smoothstep(0.0, 0.13, abs(cx))) * (1.0 - smoothstep(0.0, 0.36, y));
    float alpha = clamp(inside * (0.80 + n * 0.20), 0.0, 1.0);
    // Color: white-yellow base → orange mid → dark red tip
    vec3 tipCol  = vec3(0.82, 0.10, 0.0);
    vec3 midCol  = vec3(1.00, 0.40, 0.0);
    vec3 baseCol = vec3(1.00, 0.88, 0.18);
    vec3 hotCol  = vec3(1.00, 1.00, 0.85);
    vec3 col = mix(baseCol, midCol, smoothstep(0.0, 0.42, y));
    col = mix(col, tipCol, smoothstep(0.42, 1.0, y));
    col = mix(col, hotCol, core * 0.78);
    col *= 2.2; // HDR — bloom picks this up
    gl_FragColor = vec4(col, alpha);
  }
`

// ── Billboard flame sprite ────────────────────────────────────────────────
function FlameSprite({ position, scale = [0.34, 0.72, 1] }) {
  const meshRef = useRef()
  const matRef  = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 } }), [])

  useFrame(({ clock, camera }) => {
    if (matRef.current)  matRef.current.uniforms.uTime.value = clock.getElapsedTime()
    if (meshRef.current) meshRef.current.quaternion.copy(camera.quaternion)
  })

  return (
    <mesh ref={meshRef} position={position} scale={scale}>
      <planeGeometry args={[1, 1, 1, 10]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={FLAME_VERT}
        fragmentShader={FLAME_FRAG}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  )
}

// ── Torch assembly ────────────────────────────────────────────────────────
function Torch3D({ position }) {
  const lightRef = useRef()

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime()
    const flicker =
      2.8 +
      Math.sin(t * 7.3)  * 1.1 +
      Math.sin(t * 13.1) * 0.7 +
      Math.sin(t * 23.7) * 0.4 +
      Math.sin(t * 41.9) * 0.2
    if (lightRef.current) lightRef.current.intensity = Math.max(0.6, flicker)
  })

  return (
    <group position={position}>
      {/* Stick */}
      <mesh castShadow position={[0, -0.55, 0]}>
        <cylinderGeometry args={[0.045, 0.065, 1.1, 6]} />
        <meshStandardMaterial color="#3a2010" roughness={0.92} />
      </mesh>
      {/* Bowl — emissive from heat */}
      <mesh castShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[0.11, 0.075, 0.17, 8]} />
        <meshStandardMaterial
          color="#5a4020" roughness={0.72} metalness={0.28}
          emissive="#3a1800" emissiveIntensity={0.6}
        />
      </mesh>
      {/* Primary flame billboard */}
      <FlameSprite position={[0, 0.52, 0]} scale={[0.36, 0.76, 1]} />
      {/* Secondary smaller flame, slightly offset — adds depth */}
      <FlameSprite position={[0.05, 0.48, 0.02]} scale={[0.22, 0.54, 1]} />
      {/* Tiny white-hot ember core at flame base */}
      <mesh position={[0, 0.14, 0]}>
        <sphereGeometry args={[0.045, 6, 6]} />
        <meshBasicMaterial color="#fff8d0" toneMapped={false} />
      </mesh>
      {/* Flickering point light + soft shadow */}
      <pointLight
        ref={lightRef}
        color="#ff5a10"
        intensity={5.0}
        distance={18}
        decay={2}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-camera-near={0.1}
        shadow-camera-far={20}
      />
    </group>
  )
}

// ── Tiki idol ─────────────────────────────────────────────────────────────
function TikiIdol({ position }) {
  const wood  = { color: '#5a3418', roughness: 0.88, metalness: 0.06 }
  const dark  = { color: '#2c1608', roughness: 0.94, metalness: 0.02 }
  const stone = { color: '#3a2a14', roughness: 0.92, metalness: 0.05 }
  const tooth = { color: '#e8d8b0', roughness: 0.62, metalness: 0.0  }

  return (
    <group position={position}>
      {/* Base plinth */}
      <mesh castShadow receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[1.05, 1.25, 0.38, 8]} />
        <meshStandardMaterial {...stone} />
      </mesh>
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 1.45, 0]}>
        <cylinderGeometry args={[0.63, 0.84, 2.5, 8]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {/* Carved bands */}
      {[0.55, 1.1, 1.65].map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[0.67, 0.045, 6, 16]} />
          <meshStandardMaterial {...dark} />
        </mesh>
      ))}
      {/* Neck */}
      <mesh castShadow position={[0, 2.75, 0]}>
        <cylinderGeometry args={[0.48, 0.61, 0.3, 8]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 3.42, 0]}>
        <boxGeometry args={[1.28, 1.18, 1.02]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {/* Brow ridge */}
      <mesh castShadow position={[0, 3.84, 0.45]}>
        <boxGeometry args={[1.18, 0.24, 0.2]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* Eye sockets */}
      <mesh position={[-0.36, 3.44, 0.465]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      <mesh position={[0.36, 3.44, 0.465]}>
        <circleGeometry args={[0.2, 12]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* Glowing eyes — bloom target */}
      <mesh position={[-0.36, 3.44, 0.485]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial color="#ff2200" toneMapped={false} />
      </mesh>
      <mesh position={[0.36, 3.44, 0.485]}>
        <circleGeometry args={[0.12, 12]} />
        <meshBasicMaterial color="#ff2200" toneMapped={false} />
      </mesh>
      {/* Eye glow casts red light on face */}
      <pointLight position={[0, 3.44, 0.6]} color="#ff1800" intensity={0.8} distance={2.5} decay={2} />
      {/* Nose */}
      <mesh castShadow position={[0, 3.32, 0.5]}>
        <boxGeometry args={[0.3, 0.24, 0.24]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {/* Grimace */}
      <mesh position={[0, 3.08, 0.47]}>
        <boxGeometry args={[0.86, 0.17, 0.17]} />
        <meshStandardMaterial {...dark} />
      </mesh>
      {/* Teeth */}
      {[-0.3, 0, 0.3].map((x, i) => (
        <mesh key={i} position={[x, 2.98, 0.48]}>
          <boxGeometry args={[0.19, 0.15, 0.13]} />
          <meshStandardMaterial {...tooth} />
        </mesh>
      ))}
      {/* Headdress base ring */}
      <mesh castShadow position={[0, 4.08, 0]}>
        <cylinderGeometry args={[0.72, 0.66, 0.22, 8]} />
        <meshStandardMaterial {...wood} />
      </mesh>
      {/* Headdress prongs */}
      {[-0.52, -0.26, 0, 0.26, 0.52].map((x, i) => {
        const h = 0.38 + (1 - Math.abs(i - 2) * 0.38) * 0.48
        return (
          <mesh key={i} castShadow position={[x, 4.18 + h / 2, 0]}>
            <boxGeometry args={[0.11, h, 0.11]} />
            <meshStandardMaterial {...wood} />
          </mesh>
        )
      })}
    </group>
  )
}

// ── Stepped temple pyramid ────────────────────────────────────────────────
function TemplePyramid({ position }) {
  const steps = [
    { w: 7.0, d: 4.9 }, { w: 5.6, d: 3.9 }, { w: 4.3, d: 3.0 },
    { w: 3.2, d: 2.2 }, { w: 2.2, d: 1.5 }, { w: 1.4, d: 0.95 },
  ]
  const mat = { color: '#3c2c18', roughness: 0.94, metalness: 0.04 }

  return (
    <group position={position}>
      {steps.map(({ w, d }, i) => (
        <mesh key={i} castShadow receiveShadow position={[0, i * 0.46, 0]}>
          <boxGeometry args={[w, 0.46, d]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
      {/* Gold capstone — Bloom target */}
      <mesh position={[0, steps.length * 0.46 + 0.22, 0]}>
        <boxGeometry args={[0.62, 0.44, 0.42]} />
        <meshBasicMaterial color="#d4af37" toneMapped={false} />
      </mesh>
      <pointLight
        position={[0, steps.length * 0.46 + 0.55, 0]}
        color="#d4af37" intensity={1.0} distance={7} decay={2}
      />
    </group>
  )
}

// ── Ground ────────────────────────────────────────────────────────────────
function Ground() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial color="#0e1a06" roughness={1} metalness={0} />
    </mesh>
  )
}

// ── Mouse parallax camera ─────────────────────────────────────────────────
function ParallaxCamera() {
  const { camera } = useThree()

  useFrame(({ mouse }) => {
    camera.position.x += (mouse.x * 0.55 - camera.position.x) * 0.035
    camera.position.y += (3 + mouse.y * 0.28 - camera.position.y) * 0.035
    camera.lookAt(0, 2.2, 0)
  })

  return null
}

// ── Scene root ────────────────────────────────────────────────────────────
export default function TikiTemple3D() {
  return (
    <Canvas
      shadows
      camera={{ position: [0, 3, 14], fov: 42 }}
      gl={{ alpha: true, antialias: true }}
      dpr={[1, 1.5]}
      style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none' }}
    >
      <fog attach="fog" args={['#020a02', 24, 50]} />
      <ambientLight intensity={0.32} color="#1a2a0a" />
      {/* Moonlight with shadow */}
      <directionalLight
        position={[4, 22, 10]} intensity={0.65} color="#b0d0ff"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      {/* Warm camera-direction fill */}
      <directionalLight position={[0, 6, 16]} intensity={0.45} color="#ffaa60" />

      <Stars radius={95} depth={58} count={3800} factor={3.2} saturation={0.1} fade speed={0.5} />

      <Ground />
      <TemplePyramid position={[0, 0, -3.5]} />
      <TikiIdol position={[0, 0.38, 0.8]} />

      <Torch3D position={[-4.0, 1.05, 2.6]} />
      <Torch3D position={[ 4.0, 1.05, 2.6]} />

      <ParallaxCamera />

      <EffectComposer>
        <Bloom
          intensity={1.1}
          luminanceThreshold={0.25}
          luminanceSmoothing={0.78}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
