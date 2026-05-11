import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { Edges } from '@react-three/drei'

const SKETCH_MODEL = {
  head:     { geometry: 'sphere',   args: [0.4, 32, 32],      position: [0, 2.2, 0],     rotation: [0, 0, 0] },
  torso:    { geometry: 'cylinder', args: [0.3, 0.3, 1, 16],  position: [0, 1.2, 0],     rotation: [0, 0, 0] },
  leftArm:  { geometry: 'cylinder', args: [0.1, 0.1, 0.8, 8], position: [-0.6, 1.3, 0],  rotation: [0, 0, Math.PI / 4] },
  rightArm: { geometry: 'cylinder', args: [0.1, 0.1, 0.8, 8], position: [0.6, 1.3, 0],   rotation: [0, 0, -Math.PI / 4] },
  leftLeg:  { geometry: 'cylinder', args: [0.1, 0.1, 0.9, 8], position: [-0.25, 0.2, 0], rotation: [0, 0, Math.PI / 12] },
  rightLeg: { geometry: 'cylinder', args: [0.1, 0.1, 0.9, 8], position: [0.25, 0.2, 0],  rotation: [0, 0, -Math.PI / 12] },
}

const PARTS_ORDER = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']

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
  const scaleRef  = useRef(0)
  const appearedRef = useRef(false)

  const { geometry, args, position, rotation } = part

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Pop-in animation (Pencil stroke pop)
    if (!appearedRef.current) {
      appearedRef.current = true
      meshRef.current.scale.setScalar(0.001)
    }
    if (scaleRef.current < 1) {
      scaleRef.current = Math.min(1, scaleRef.current + delta * 12)
      meshRef.current.scale.setScalar(scaleRef.current)
    }

    // Death animation
    if (isDead) {
      const [drx, dry, drz] = DEATH_OFFSETS[partKey] || [0, 0, 0]
      meshRef.current.rotation.x = MathUtils.lerp(meshRef.current.rotation.x, rotation[0] + drx, delta * 3)
      meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, rotation[1] + dry, delta * 3)
      meshRef.current.rotation.z = MathUtils.lerp(meshRef.current.rotation.z, rotation[2] + drz, delta * 3)
      meshRef.current.position.y = MathUtils.lerp(meshRef.current.position.y, position[1] - 0.8, delta * 2)
    }
  })

  // Determine geometry
  let geoComponent
  if (geometry === 'sphere') {
    geoComponent = <icosahedronGeometry args={[args[0], 2]} />
  } else if (geometry === 'cylinder') {
    geoComponent = <cylinderGeometry args={args} />
  } else if (geometry === 'box') {
    // For pencil sketch, a standard box geometry is better and safer for Edges
    geoComponent = <boxGeometry args={args} />
  }

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} castShadow receiveShadow>
      {geoComponent}
      {/* Paper color to blend in with background */}
      <meshBasicMaterial color="#e3d5c1" transparent opacity={0.9} />
      
      {/* The Pencil Sketch Outlines */}
      <Edges
        linewidth={3}
        threshold={15}
        color="#2c2825"
      />
    </mesh>
  )
}

export default function CharacterModel({ wrongGuessCount = 0, isDead = false }) {
  const groupRef   = useRef()
  const timeRef    = useRef(0)
  const shakeRef   = useRef(0)
  const prevCount  = useRef(wrongGuessCount)

  useFrame((state, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta

    // Wrong guess damage shake (like violently scribbling)
    if (wrongGuessCount !== prevCount.current) {
      prevCount.current = wrongGuessCount
      shakeRef.current  = 0.5
    }
    if (shakeRef.current > 0) {
      shakeRef.current -= delta * 3
      groupRef.current.position.x = Math.sin(timeRef.current * 60) * shakeRef.current * 0.2
    } else {
      groupRef.current.position.x = 0
    }

    // Death collapse
    if (isDead) {
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0.4, delta * 1.5)
      groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, -0.6, delta * 1.5)
    }
  })

  return (
    <group ref={groupRef}>
      {PARTS_ORDER.map((partKey, index) => {
        if (index >= wrongGuessCount) return null
        return (
          <PartMesh
            key={partKey}
            part={SKETCH_MODEL[partKey]}
            partKey={partKey}
            isDead={isDead}
          />
        )
      })}
    </group>
  )
}
