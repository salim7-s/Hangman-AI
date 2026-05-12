import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { Edges, RoundedBox } from '@react-three/drei'

/* ─── Body part definitions ─────────────────────────────────────
   Better proportions, rounder shapes, distinct hand/foot pieces.
   Material = meshStandardMaterial so lighting actually works.
────────────────────────────────────────────────────────────────── */
const PARTS = {
  head: {
    type: 'sphere',
    args: [0.35, 32, 32],
    position: [0, 2.4, 0],
    rotation: [0, 0, 0],
  },
  torso: {
    type: 'rounded-box',
    args: [0.5, 1.0, 0.25, 4, 0.08],
    position: [0, 1.4, 0],
    rotation: [0, 0, 0],
  },
  leftArm: {
    type: 'cylinder',
    args: [0.08, 0.06, 0.8, 10],
    position: [-0.4, 1.5, 0],
    rotation: [0, 0, Math.PI / 6],
  },
  rightArm: {
    type: 'cylinder',
    args: [0.08, 0.06, 0.8, 10],
    position: [0.4, 1.5, 0],
    rotation: [0, 0, -Math.PI / 6],
  },
  leftLeg: {
    type: 'cylinder',
    args: [0.09, 0.07, 0.9, 10],
    position: [-0.15, 0.4, 0],
    rotation: [0, 0, 0],
  },
  rightLeg: {
    type: 'cylinder',
    args: [0.09, 0.07, 0.9, 10],
    position: [0.15, 0.4, 0],
    rotation: [0, 0, 0],
  },
}

const PARTS_ORDER = ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg']

const DEATH_OFFSETS = {
  head:     { pos: [0, -0.2],  rot: [0.4, 0.3, 0.8] },
  torso:    { pos: [-0.1, 0], rot: [0.2, 0, 0.15] },
  leftArm:  { pos: [-0.2, 0], rot: [0, 0, Math.PI / 2 + 0.4] },
  rightArm: { pos: [0.2, 0],  rot: [0, 0, -(Math.PI / 2 + 0.4)] },
  leftLeg:  { pos: [-0.15, 0.1], rot: [0.5, 0.2, 0.4] },
  rightLeg: { pos: [0.15, 0.1],  rot: [0.5, -0.2, -0.4] },
}

const INK   = '#1e1a17'
const PAPER = '#ddd0b8'

function PartMesh({ part, partKey, isDead }) {
  const meshRef     = useRef()
  const scaleRef    = useRef(0)
  const appearedRef = useRef(false)

  const { type, args, position, rotation } = part

  useFrame((_, delta) => {
    if (!meshRef.current) return

    // Bounce pop-in
    if (!appearedRef.current) {
      appearedRef.current = true
      meshRef.current.scale.setScalar(0.001)
    }
    if (scaleRef.current < 1) {
      scaleRef.current = Math.min(1, scaleRef.current + delta * 10)
      const s = scaleRef.current < 0.9
        ? scaleRef.current
        : 1 + Math.sin(scaleRef.current * Math.PI) * 0.08
      meshRef.current.scale.setScalar(s)
    }

    // Death fly-apart
    if (isDead) {
      const offsets = DEATH_OFFSETS[partKey]
      if (offsets) {
        meshRef.current.rotation.x = MathUtils.lerp(meshRef.current.rotation.x, rotation[0] + offsets.rot[0], delta * 3)
        meshRef.current.rotation.y = MathUtils.lerp(meshRef.current.rotation.y, rotation[1] + offsets.rot[1], delta * 3)
        meshRef.current.rotation.z = MathUtils.lerp(meshRef.current.rotation.z, rotation[2] + offsets.rot[2], delta * 3)
        meshRef.current.position.x = MathUtils.lerp(meshRef.current.position.x, position[0] + offsets.pos[0], delta * 2.5)
        meshRef.current.position.y = MathUtils.lerp(meshRef.current.position.y, position[1] - 1.2, delta * 2)
      }
    }
  })

  let geo
  if (type === 'sphere') {
    geo = <sphereGeometry args={args} />
  } else if (type === 'cylinder') {
    geo = <cylinderGeometry args={args} />
  } else if (type === 'rounded-box') {
    return (
      <RoundedBox
        ref={meshRef}
        position={position}
        rotation={rotation}
        args={[args[0], args[1], args[2]]}
        radius={args[4]}
        smoothness={4}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={PAPER} roughness={0.9} metalness={0} />
        <Edges linewidth={2.5} threshold={20} color={INK} />
      </RoundedBox>
    )
  }

  return (
    <mesh ref={meshRef} position={position} rotation={rotation} castShadow receiveShadow>
      {geo}
      <meshStandardMaterial color={PAPER} roughness={0.9} metalness={0} />
      <Edges linewidth={2.5} threshold={20} color={INK} />
    </mesh>
  )
}

function Gallows() {
  const beams = [
    { pos: [0, -0.1, 0],    w: 3.0, h: 0.1, d: 1.0, rot: [0, 0, 0] },        // base
    { pos: [-1.2, 2.0, 0],  w: 0.2, h: 4.2, d: 0.2, rot: [0, 0, 0] },        // vertical post
    { pos: [-0.2, 4.0, 0],  w: 2.2, h: 0.2, d: 0.2, rot: [0, 0, 0] },        // horizontal beam
    { pos: [-0.8, 3.4, 0],  w: 0.15, h: 1.2, d: 0.15, rot: [0, 0, -Math.PI / 4] }, // diagonal brace
  ]

  const rope = { pos: [0, 3.1, 0], w: 0.04, h: 1.8, d: 0.04 }

  return (
    <group position={[0, 0, 0]}>
      {beams.map((b, i) => (
        <mesh key={i} position={b.pos} rotation={b.rot} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
          <meshStandardMaterial color="#3a2e24" roughness={1} metalness={0} />
          <Edges linewidth={2} threshold={15} color={INK} />
        </mesh>
      ))}

      {/* Rope */}
      <mesh position={rope.pos} castShadow>
        <cylinderGeometry args={[rope.w / 2, rope.w / 2, rope.h, 8]} />
        <meshStandardMaterial color="#7a6040" roughness={1} metalness={0} />
        <Edges linewidth={1.5} threshold={15} color={INK} />
      </mesh>

      {/* Rope knot loop around the neck area */}
      <mesh position={[0, 2.0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.2, 0.03, 8, 16]} />
        <meshStandardMaterial color="#7a6040" roughness={1} metalness={0} />
        <Edges linewidth={1.5} threshold={15} color={INK} />
      </mesh>
    </group>
  )
}

/* ─── Main export ─────────────────────────────────────────────── */
export default function CharacterModel({ wrongGuessCount = 0, isDead = false }) {
  const groupRef  = useRef()
  const timeRef   = useRef(0)
  const shakeRef  = useRef(0)
  const prevCount = useRef(wrongGuessCount)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    timeRef.current += delta

    // Shake on new wrong guess
    if (wrongGuessCount !== prevCount.current) {
      prevCount.current = wrongGuessCount
      shakeRef.current  = 0.5
    }
    if (shakeRef.current > 0) {
      shakeRef.current -= delta * 3
      groupRef.current.position.x = Math.sin(timeRef.current * 55) * shakeRef.current * 0.18
    } else {
      groupRef.current.position.x = 0
    }

    // Idle gentle sway
    if (!isDead && wrongGuessCount > 0) {
      groupRef.current.rotation.z = Math.sin(timeRef.current * 1.2) * 0.025
    }

    // Death collapse
    if (isDead) {
      groupRef.current.rotation.z = MathUtils.lerp(groupRef.current.rotation.z, 0.45, delta * 1.8)
      groupRef.current.position.y = MathUtils.lerp(groupRef.current.position.y, -0.7, delta * 1.8)
    }
  })

  return (
    <>
      {/* Gallows always shown */}
      <Gallows />

      {/* Character parts revealed progressively */}
      <group ref={groupRef}>
        {PARTS_ORDER.map((partKey, index) => {
          if (index >= wrongGuessCount) return null
          return (
            <PartMesh
              key={partKey}
              part={PARTS[partKey]}
              partKey={partKey}
              isDead={isDead}
            />
          )
        })}
      </group>
    </>
  )
}
