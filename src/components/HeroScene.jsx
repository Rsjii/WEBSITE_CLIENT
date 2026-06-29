import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/* Ambient gold dust — lightweight, no postprocessing needed */

const GOLD_COLORS = ['#FFD86B', '#C9A84C', '#A07818', '#E9C969', '#6a4208']

const PARTICLES = Array.from({ length: 90 }, (_, i) => ({
  x:      (Math.random() - 0.5) * 18,
  startY: (Math.random() - 0.5) * 14,
  z:      -0.8 - Math.random() * 7,
  speed:  0.08 + Math.random() * 0.28,
  size:   0.005 + Math.random() * 0.022,
  phase:  Math.random() * Math.PI * 2,
  sway:   (Math.random() - 0.5) * 0.38,
  color:  GOLD_COLORS[i % GOLD_COLORS.length],
}))

const MATS = GOLD_COLORS.map(
  (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false })
)
const GEO_SM = new THREE.SphereGeometry(1, 4, 4)

export default function HeroScene() {
  const refs = useRef([])

  useFrame(({ clock }) => {
    const t     = clock.elapsedTime
    const range = 16
    PARTICLES.forEach((p, i) => {
      const m = refs.current[i]
      if (!m) return
      const y = ((p.startY + t * p.speed + range / 2) % range) - range / 2
      m.position.set(p.x + Math.sin(t * 0.16 + p.phase) * p.sway, y, p.z)
    })
  })

  return (
    <>
      <ambientLight intensity={0.08} />
      <pointLight position={[4,  6, 5]} intensity={2.5} color="#C9A84C" />
      <pointLight position={[-3, 2, 3]} intensity={1.2} color="#7A4E00" />
      {PARTICLES.map((p, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el }}
          geometry={GEO_SM}
          material={MATS[i % MATS.length]}
          scale={p.size}
        />
      ))}
    </>
  )
}
