import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { DefaultSkin }  from '../skins/DefaultSkin'
import { RobotSkin }    from '../skins/RobotSkin'
import { SkeletonSkin } from '../skins/SkeletonSkin'

const SKINS = { default: DefaultSkin, robot: RobotSkin, skeleton: SkeletonSkin }

const PARTS_ORDER = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']

// Death fall targets per part (added on top of base rotation)
const DEATH_OFFSETS = {
  head:     [1.2,  0.4,  0.5],
  torso:    [-0.4, 0,    0.2],
  leftArm:  [0,    0,    Math.PI / 2 + 0.3],
  rightArm: [0,    0,   -Math.PI / 2 - 0.3],
  leftLeg:  [0.6,  0.2,  0.3],
  rightLeg: [0.6, -0.2, -0.3],
}

function PartMesh({ part, partKey, isDead }) {
  const meshRef   = useRef()
  const scaleRef  = useRef(0)    // for pop-in
  const appearedRef = useRef(false)

  const { geometry, args, color, position, rotation } = part
  const isRobot = color === '#94a3b8' || color === '#64748b' || color === '#475569'

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // ── Pop-in animation ─────────────────────────
    if (!appearedRef.current) {
      appearedRef.current = true
      meshRef.current.scale.setScalar(0)
    }
    if (scaleRef.current < 1) {
      scaleRef.current = Math.min(1, scaleRef.current + delta * 10)
      meshRef.current.scale.setScalar(scaleRef.current)
    }

    // ── Death animation ───────────────────────────
    if (isDead) {
      const [drx, dry, drz] = DEATH_OFFSETS[partKey] || [0, 0, 0]
      meshRef.current.rotation.x = MathUtils.lerp(meshRef.current.rotation.x, rotation[0] + drx, delta * 4)
      meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, rotation[1] + dry, delta * 4)
      meshRef.current.rotation.z = MathUtils.lerp(meshRef.current.rotation.z, rotation[2] + drz, delta * 4)
      // Also drop down slightly
      meshRef.current.position.y = MathUtils.lerp(meshRef.current.position.y, position[1] - 0.5, delta * 3)
    }
  })

  let geo
  if (geometry === 'sphere')   geo = <sphereGeometry   args={args} />
  if (geometry === 'cylinder') geo = <cylinderGeometry args={args} />
  if (geometry === 'box')      geo = <boxGeometry      args={args} />

  return (
    <mesh ref={meshRef} position={position} rotation={rotation}>
      {geo}
      <meshStandardMaterial
        color={color}
        roughness={0.4}
        metalness={isRobot ? 0.7 : 0.05}
        emissive={color}
        emissiveIntensity={0.05}
      />
    </mesh>
  )
}

export default function CharacterModel({ wrongGuessCount = 0, skinName = 'default', isDead = false }) {
  const groupRef   = useRef()
  const timeRef    = useRef(0)
  const shakeRef   = useRef(0)
  const prevCount  = useRef(wrongGuessCount)

  const skin = SKINS[skinName] || SKINS.default

  useFrame((state, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta

    // ── Idle breathing (whole character) ─────────
    if (!isDead) {
      groupRef.current.position.y = Math.sin(timeRef.current * 1.2) * 0.04
      groupRef.current.rotation.y = Math.sin(timeRef.current * 0.4) * 0.03
    }

    // ── Wrong guess shake ─────────────────────────
    if (wrongGuessCount !== prevCount.current) {
      prevCount.current = wrongGuessCount
      shakeRef.current  = 0.3
    }
    if (shakeRef.current > 0) {
      shakeRef.current -= delta * 3
      groupRef.current.position.x = Math.sin(timeRef.current * 40) * shakeRef.current * 0.15
    } else {
      groupRef.current.position.x = 0
    }

    // ── Death collapse ────────────────────────────
    if (isDead) {
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0.3, delta * 2)
      groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, -0.4, delta * 2)
    }
  })

  return (
    <group ref={groupRef}>
      {PARTS_ORDER.map((partKey, index) => {
        if (index >= wrongGuessCount) return null
        return (
          <PartMesh
            key={partKey}
            part={skin[partKey]}
            partKey={partKey}
            isDead={isDead}
          />
        )
      })}
    </group>
  )
}
