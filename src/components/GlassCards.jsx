/**
 * GlassCards — Glassmorphism cards that fly in on scroll [0.25 → 0.5]
 * and disperse on deep scroll [0.65 → 0.85].
 *
 * MeshPhysicalMaterial with transmission for true glass refraction.
 * Drei <Html> pins DOM text to each card in 3D space.
 */
import { useRef, useMemo } from 'react'
import { useFrame }        from '@react-three/fiber'
import { Html }            from '@react-three/drei'
import * as THREE          from 'three'

const CARD_DATA = [
  { pos: [-2.8,  0.5, -0.8], rot: [0,  0.28, 0.02], w: 2.3, h: 3.2, label: 'CREATIVE\nDIGITAL',  sub: 'EXPERIENCES' },
  { pos: [ 0.0,  0.1,  0.4], rot: [0,  0.00, 0.00], w: 2.8, h: 3.8, label: 'DISCOVER\nYOUR',     sub: 'PATRONUS'    },
  { pos: [ 2.9, -0.4, -0.6], rot: [0, -0.25, 0.01], w: 2.2, h: 3.1, label: 'AWWWARDS\nLEVEL',    sub: 'EXPERIENCE'  },
]

// Reusable scratch — never allocated in useFrame
const _dispVec = new THREE.Vector3()

export default function GlassCards({ scrollRef }) {
  const groupRef  = useRef()
  const cardRefs  = useRef([])
  const matRefs   = useRef([])

  useFrame(({ clock }) => {
    const t      = clock.elapsedTime
    const scroll = scrollRef?.current?.progress ?? 0

    // Cards enter when scroll passes 0.25, fully in by 0.5
    const enterT  = THREE.MathUtils.clamp((scroll - 0.25) / 0.25, 0, 1)
    const eased   = enterT * enterT * (3 - 2 * enterT)   // smoothstep

    // Disperse when scroll passes 0.65
    const disperseT = THREE.MathUtils.clamp((scroll - 0.65) / 0.22, 0, 1)

    cardRefs.current.forEach((card, i) => {
      if (!card) return
      const base = CARD_DATA[i]

      // Fly in from far back
      const startZ = -35
      card.position.z = THREE.MathUtils.lerp(startZ, base.pos[2], eased)
      card.position.x = THREE.MathUtils.lerp(base.pos[0] * 0.1, base.pos[0], eased)
      card.position.y = base.pos[1] + Math.sin(t * 0.38 + i * 1.4) * 0.07

      // Gentle hover rotation
      card.rotation.y = base.rot[1] + Math.sin(t * 0.22 + i * 0.9) * 0.03

      // Disperse: fan outward and backward
      if (disperseT > 0) {
        const dir = (i - 1)   // -1, 0, +1
        card.position.x += dir * disperseT * 5.5
        card.position.y += (i % 2 === 0 ? 1 : -1) * disperseT * 3.5
        card.position.z -= disperseT * 18
      }

      // Material opacity
      if (matRefs.current[i]) {
        matRefs.current[i].opacity = THREE.MathUtils.clamp(
          eased * 0.75 * (1 - disperseT * 1.4),
          0, 0.75
        )
      }
    })
  })

  return (
    <group ref={groupRef}>
      {CARD_DATA.map((card, i) => (
        <mesh
          key={i}
          ref={el => (cardRefs.current[i] = el)}
          position={[card.pos[0], card.pos[1], -35]}
          rotation={card.rot}
        >
          <planeGeometry args={[card.w, card.h]} />
          <meshPhysicalMaterial
            ref={el => (matRefs.current[i] = el)}
            color="#88aaff"
            transmission={0.88}
            roughness={0.08}
            metalness={0}
            ior={1.5}
            thickness={0.5}
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />

          {/* Edge glow frame */}
          <mesh position={[0, 0, -0.005]}>
            <planeGeometry args={[card.w + 0.04, card.h + 0.04]} />
            <meshBasicMaterial
              color="#aaccff"
              transparent
              opacity={0.06}
              depthWrite={false}
            />
          </mesh>

          <Html
            center
            distanceFactor={2}
            style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'pre-line' }}
            zIndexRange={[0, 0]}
          >
            <div style={{
              textAlign: 'center',
              color: '#fff',
              textShadow: '0 0 24px rgba(180,210,255,0.6)',
            }}>
              <div style={{
                fontFamily: "'Bebas Neue', sans-serif",
                fontSize: '30px',
                letterSpacing: '0.14em',
                lineHeight: 1.08,
                opacity: 0.92,
                whiteSpace: 'pre-line',
              }}>
                {card.label}
              </div>
              <div style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '9px',
                letterSpacing: '0.35em',
                opacity: 0.45,
                marginTop: '10px',
                textTransform: 'uppercase',
              }}>
                {card.sub}
              </div>
              <div style={{
                width: '30px',
                height: '1px',
                background: 'rgba(180,210,255,0.35)',
                margin: '8px auto 0',
              }} />
            </div>
          </Html>
        </mesh>
      ))}
    </group>
  )
}
