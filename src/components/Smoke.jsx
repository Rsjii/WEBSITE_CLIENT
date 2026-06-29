import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { state } from '../store'

const SECTION_COLORS = [
  { a: new THREE.Color(0.48, 0.18, 0.74), b: new THREE.Color(0.1, 0.22, 0.95) },  // purple/blue
  { a: new THREE.Color(0.1, 0.37, 0.95), b: new THREE.Color(0.04, 0.72, 0.84) },   // blue/cyan
  { a: new THREE.Color(0.86, 0.15, 0.15), b: new THREE.Color(0.98, 0.56, 0.04) },  // red/orange
  { a: new THREE.Color(0.04, 0.6, 0.47), b: new THREE.Color(0.1, 0.37, 0.95) },    // green/blue
  { a: new THREE.Color(0.48, 0.18, 0.74), b: new THREE.Color(0.86, 0.15, 0.15) },  // purple/red
]

const vertexShader = /* glsl */`
  uniform float uTime;

  attribute float aSize;
  attribute float aOffset;
  attribute float aSpeed;
  attribute float aMix;
  attribute vec2 aSpread;

  varying float vAlpha;
  varying float vMix;

  void main() {
    vMix = aMix;

    float life = fract(uTime * aSpeed * 0.055 + aOffset);

    float y = mix(-6.0, 7.0, life);

    float driftX = sin(uTime * 0.22 + aOffset * 19.7) * 1.4;
    float driftZ = cos(uTime * 0.17 + aOffset * 13.3) * 0.7;

    vec3 pos = vec3(
      aSpread.x + driftX,
      y,
      aSpread.y + driftZ
    );

    vAlpha = smoothstep(0.0, 0.18, life) * (1.0 - smoothstep(0.62, 1.0, life)) * 0.42;

    vec4 mvPos = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPos;
    gl_PointSize = min(aSize * (380.0 / -mvPos.z), 96.0);
  }
`

const fragmentShader = /* glsl */`
  uniform vec3 uColorA;
  uniform vec3 uColorB;

  varying float vAlpha;
  varying float vMix;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    float strength = pow(1.0 - d * 2.0, 2.2);
    vec3 col = mix(uColorA, uColorB, vMix);

    gl_FragColor = vec4(col, strength * vAlpha);
  }
`

export default function Smoke({ count = 14000 }) {
  const ref = useRef()

  const attrs = useMemo(() => {
    const aSize    = new Float32Array(count)
    const aOffset  = new Float32Array(count)
    const aSpeed   = new Float32Array(count)
    const aMix     = new Float32Array(count)
    const aSpread  = new Float32Array(count * 2)

    for (let i = 0; i < count; i++) {
      const r     = Math.sqrt(Math.random()) * 5.5
      const theta = Math.random() * Math.PI * 2

      aSpread[i * 2]     = Math.cos(theta) * r
      aSpread[i * 2 + 1] = Math.sin(theta) * r * 0.45

      aSize[i]   = Math.random() * 2.8 + 0.6
      aOffset[i] = Math.random()
      aSpeed[i]  = Math.random() * 0.6 + 0.7
      aMix[i]    = Math.random()
    }

    return { aSize, aOffset, aSpeed, aMix, aSpread }
  }, [count])

  const uniforms = useMemo(() => ({
    uTime:   { value: 0 },
    uColorA: { value: SECTION_COLORS[0].a.clone() },
    uColorB: { value: SECTION_COLORS[0].b.clone() },
  }), [])

  useFrame(({ clock }) => {
    uniforms.uTime.value = clock.elapsedTime

    const target = SECTION_COLORS[state.section]
    uniforms.uColorA.value.lerp(target.a, 0.025)
    uniforms.uColorB.value.lerp(target.b, 0.025)
  })

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position"  args={[new Float32Array(count * 3), 3]} />
        <bufferAttribute attach="attributes-aSize"     args={[attrs.aSize,   1]} />
        <bufferAttribute attach="attributes-aOffset"   args={[attrs.aOffset, 1]} />
        <bufferAttribute attach="attributes-aSpeed"    args={[attrs.aSpeed,  1]} />
        <bufferAttribute attach="attributes-aMix"      args={[attrs.aMix,    1]} />
        <bufferAttribute attach="attributes-aSpread"   args={[attrs.aSpread, 2]} />
      </bufferGeometry>
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  )
}
