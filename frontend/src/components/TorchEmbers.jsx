import Particles, { initParticlesEngine } from '@tsparticles/react'
import { loadSlim } from '@tsparticles/slim'
import { useEffect, useState } from 'react'

const OPTIONS = {
  background: { color: { value: 'transparent' } },
  fpsLimit: 60,
  fullScreen: { enable: false },
  particles: {
    color: { value: ['#ff6010', '#ff8c00', '#ffd040', '#ff4500', '#ff2200', '#ffb300'] },
    move: {
      enable: true,
      speed: { min: 1.2, max: 3.8 },
      direction: 'top',
      random: true,
      straight: false,
      outModes: { default: 'destroy', top: 'destroy' },
      gravity: { enable: true, acceleration: 0.3, maxSpeed: 8 },
    },
    number: { value: 0 },
    opacity: {
      value: { min: 0.15, max: 0.95 },
      animation: { enable: true, speed: 2.2, startValue: 'max', destroy: 'min', sync: false },
    },
    shape: { type: 'circle' },
    size: { value: { min: 0.8, max: 3.2 } },
    life: {
      count: 1,
      duration: { value: { min: 0.7, max: 1.8 }, sync: false },
    },
  },
  emitters: [
    {
      direction: 'top',
      rate: { delay: 0.055, quantity: 1 },
      position: { x: 2.8, y: 4.5 },
      size: { width: 2, height: 1 },
    },
    {
      direction: 'top',
      rate: { delay: 0.055, quantity: 1 },
      position: { x: 97.2, y: 4.5 },
      size: { width: 2, height: 1 },
    },
  ],
}

let engineInitialized = false
let enginePromise = null

export default function TorchEmbers() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (engineInitialized) { setReady(true); return }
    if (!enginePromise) {
      enginePromise = initParticlesEngine(engine => loadSlim(engine))
    }
    enginePromise.then(() => { engineInitialized = true; setReady(true) })
  }, [])

  if (!ready) return null

  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 5, pointerEvents: 'none', background: 'transparent' }}>
      <Particles
        id="torch-embers"
        options={OPTIONS}
        style={{ background: 'transparent' }}
      />
    </div>
  )
}
