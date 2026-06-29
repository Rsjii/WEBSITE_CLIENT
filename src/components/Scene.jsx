import { useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import HeroScene from './HeroScene'
import { scrollState } from '../utils/scroll'

const _look = new THREE.Vector3(0, 0, 0)

export default function Scene({ mouseRef }) {
  const { camera, gl } = useThree()

  useEffect(() => {
    gl.toneMapping         = THREE.ACESFilmicToneMapping
    gl.toneMappingExposure = 1.05
  }, [gl])

  useFrame(({ clock }) => {
    const t      = clock.elapsedTime
    const mx     = mouseRef?.current?.x ?? 0.5
    const my     = mouseRef?.current?.y ?? 0.5
    const scroll = scrollState.progress

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, (mx - 0.5) * 0.7,  0.018)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, -(my - 0.5) * 0.45, 0.018)
    const targetZ     = 8 + Math.min(scroll * 10, 1) * 2.5 + Math.sin(t * 0.22) * 0.08
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.025)
    camera.lookAt(_look)
  })

  return (
    <>
      <color attach="background" args={['#050402']} />
      <HeroScene />
    </>
  )
}
