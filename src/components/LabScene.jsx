/**
 * LabScene — Futuristic reactor chamber
 * Enters on scroll > 0.65. Saturated cinematic lights, rotating orbit rings,
 * pulsating energy waves, central glowing core.
 */
import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE   from 'three'

const STRUCTURAL_Y  = [-4, -2, 0, 2, 4]
const WAVE_COUNT    = 4

// Scratch — no allocations inside useFrame
const _scale = new THREE.Vector3()

export default function LabScene({ scrollRef }) {
  const groupRef  = useRef()
  const ring1Ref  = useRef()   // Y orbit
  const ring2Ref  = useRef()   // tilted orbit
  const ring3Ref  = useRef()   // equatorial ring
  const coreRef   = useRef()
  const innerRef  = useRef()
  const waveRefs  = useRef([])

  useFrame(({ clock }) => {
    const t      = clock.elapsedTime
    const scroll = scrollRef?.current?.progress ?? 0

    const labT   = THREE.MathUtils.clamp((scroll - 0.65) / 0.35, 0, 1)
    const eased  = labT * labT * (3 - 2 * labT)

    if (groupRef.current) {
      // Fly in from deep background
      groupRef.current.position.z = THREE.MathUtils.lerp(-22, 0, eased)
      groupRef.current.visible    = scroll > 0.62
    }

    if (ring1Ref.current) ring1Ref.current.rotation.y = t * 0.55
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = t * 0.40
      ring2Ref.current.rotation.z = t * 0.25
    }
    if (ring3Ref.current) ring3Ref.current.rotation.z = -t * 0.35

    if (coreRef.current) {
      // Pulsating glow
      coreRef.current.material.emissiveIntensity = 0.7 + Math.sin(t * 2.2) * 0.35
    }
    if (innerRef.current) {
      innerRef.current.rotation.y = -t * 1.2
    }

    // Expanding energy wave rings
    waveRefs.current.forEach((wave, i) => {
      if (!wave) return
      const phase = ((t * 0.45 + i / WAVE_COUNT) % 1.0)
      const s     = 0.2 + phase * 3.5
      wave.scale.set(s, s, s)
      wave.material.opacity = THREE.MathUtils.clamp((1 - phase) * 0.55, 0, 0.55)
    })
  })

  return (
    <group ref={groupRef} position={[0, 0, -22]}>

      {/* Outer chamber cylinder (back face = interior wall) */}
      <mesh>
        <cylinderGeometry args={[7, 7, 12, 40, 1, true]} />
        <meshBasicMaterial
          color="#060c1e"
          side={THREE.BackSide}
          transparent
          opacity={0.92}
        />
      </mesh>

      {/* Structural horizontal rings on chamber wall */}
      {STRUCTURAL_Y.map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <torusGeometry args={[7, 0.035, 8, 80]} />
          <meshBasicMaterial color="#112244" />
        </mesh>
      ))}

      {/* Vertical struts on chamber */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[Math.cos(angle) * 7, 0, Math.sin(angle) * 7]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry args={[0.04, 12, 0.04]} />
            <meshBasicMaterial color="#0a1a3a" />
          </mesh>
        )
      })}

      {/* ── Orbit rings (emissive, bloom-ready) ──────── */}
      <mesh ref={ring1Ref}>
        <torusGeometry args={[2.8, 0.055, 16, 120]} />
        <meshBasicMaterial color="#0066ff" toneMapped={false} />
      </mesh>

      <mesh ref={ring2Ref} rotation={[1.1, 0.4, 0]}>
        <torusGeometry args={[2.2, 0.045, 16, 120]} />
        <meshBasicMaterial color="#ff2200" toneMapped={false} />
      </mesh>

      <mesh ref={ring3Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.038, 16, 120]} />
        <meshBasicMaterial color="#00ffcc" toneMapped={false} />
      </mesh>

      {/* ── Reactor core sphere ───────────────────────── */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshStandardMaterial
          color="#001133"
          emissive="#0055ff"
          emissiveIntensity={0.7}
          metalness={0.6}
          roughness={0.15}
        />
      </mesh>

      {/* Inner energy orb */}
      <mesh ref={innerRef}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshBasicMaterial color="#55aaff" toneMapped={false} />
      </mesh>

      {/* Energy wave rings — expand outward from core */}
      {Array.from({ length: WAVE_COUNT }, (_, i) => (
        <mesh
          key={i}
          ref={el => (waveRefs.current[i] = el)}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[1, 0.025, 8, 80]} />
          <meshBasicMaterial
            color="#33aaff"
            transparent
            opacity={0}
            toneMapped={false}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* ── Cinematic Lights ──────────────────────────── */}
      <pointLight position={[ 0,  4,  0]} intensity={20} color="#ff2200" distance={14} />
      <pointLight position={[ 4, -2,  2]} intensity={16} color="#0044ff" distance={12} />
      <pointLight position={[-4,  1, -2]} intensity={14} color="#00ffcc" distance={12} />
      <spotLight
        position={[0, 8, 0]}
        target-position={[0, 0, 0]}
        angle={0.4}
        penumbra={0.6}
        intensity={40}
        color="#ffffff"
        castShadow={false}
      />

      {/* Floor reflection grid */}
      <gridHelper
        args={[14, 20, '#0a1a3a', '#06102a']}
        position={[0, -5.5, 0]}
      />

    </group>
  )
}
