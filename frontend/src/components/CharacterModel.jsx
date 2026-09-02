import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MathUtils } from 'three'
import { Edges, RoundedBox } from '@react-three/drei'

/* ─── Body part definitions ─────────────────────────────────────
   Proportions, rounder shapes, distinct hand/foot pieces.
   Material = meshStandardMaterial so lighting works.
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
const PAPER = '#efe5d4'

function PartMesh({ partKey, isDead }) {
  const meshRef = useRef()
  const def = PARTS[partKey]
  const death = DEATH_OFFSETS[partKey]

  useFrame((state, delta) => {
    if (!meshRef.current) return

    if (isDead) {
      meshRef.current.position.x = MathUtils.damp(
        meshRef.current.position.x,
        def.position[0] + death.pos[0],
        4,
        delta
      )
      meshRef.current.position.y = MathUtils.damp(
        meshRef.current.position.y,
        def.position[1] + death.pos[1],
        4,
        delta
      )
      meshRef.current.rotation.x = MathUtils.damp(
        meshRef.current.rotation.x,
        def.rotation[0] + death.rot[0],
        4,
        delta
      )
      meshRef.current.rotation.z = MathUtils.damp(
        meshRef.current.rotation.z,
        def.rotation[2] + death.rot[2],
        4,
        delta
      )
    } else {
      const t = state.clock.getElapsedTime()
      const sway = Math.sin(t * 1.8 + (def.position[1] * 0.5)) * 0.015
      meshRef.current.position.x = def.position[0] + sway
    }
  })

  const commonProps = {
    castShadow: true,
    receiveShadow: true,
  }

  return (
    <group
      ref={meshRef}
      position={def.position}
      rotation={def.rotation}
    >
      {def.type === 'sphere' && (
        <mesh {...commonProps}>
          <sphereGeometry args={def.args} />
          <meshStandardMaterial
            color={PAPER}
            roughness={0.85}
            metalness={0.05}
          />
          <Edges threshold={15} color={INK} lineWidth={2.5} />
          {/* Fedora hat */}
          <group position={[0, 0.32, 0]} rotation={[-0.1, 0, 0.05]}>
            <mesh position={[0, 0.08, 0]} castShadow>
              <cylinderGeometry args={[0.22, 0.25, 0.22, 16]} />
              <meshStandardMaterial color="#1a1512" roughness={0.9} />
            </mesh>
            <mesh position={[0, 0.01, 0]} rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.42, 0.42, 0.03, 20]} />
              <meshStandardMaterial color="#1a1512" roughness={0.9} />
            </mesh>
            {/* Crimson ribbon */}
            <mesh position={[0, 0.06, 0]}>
              <cylinderGeometry args={[0.252, 0.252, 0.05, 16]} />
              <meshStandardMaterial color="#8b0000" roughness={0.7} />
            </mesh>
          </group>
          {/* Eyes */}
          <mesh position={[-0.1, 0.05, 0.32]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color={INK} />
          </mesh>
          <mesh position={[0.1, 0.05, 0.32]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshBasicMaterial color={INK} />
          </mesh>
        </mesh>
      )}

      {def.type === 'rounded-box' && (
        <RoundedBox
          args={[def.args[0], def.args[1], def.args[2]]}
          radius={def.args[4]}
          smoothness={def.args[3]}
          {...commonProps}
        >
          <meshStandardMaterial
            color={PAPER}
            roughness={0.8}
            metalness={0.05}
          />
          <Edges threshold={20} color={INK} lineWidth={2.5} />
          {/* Trench coat lapels / tie */}
          <group position={[0, 0.2, 0.13]}>
            <mesh rotation={[0, 0, 0]}>
              <planeGeometry args={[0.07, 0.35]} />
              <meshBasicMaterial color="#8b0000" />
            </mesh>
            <mesh position={[-0.12, 0.1, 0.005]} rotation={[0, 0, 0.3]}>
              <planeGeometry args={[0.06, 0.28]} />
              <meshBasicMaterial color="#2c2825" />
            </mesh>
            <mesh position={[0.12, 0.1, 0.005]} rotation={[0, 0, -0.3]}>
              <planeGeometry args={[0.06, 0.28]} />
              <meshBasicMaterial color="#2c2825" />
            </mesh>
          </group>
        </RoundedBox>
      )}

      {def.type === 'cylinder' && (
        <mesh {...commonProps}>
          <cylinderGeometry args={def.args} />
          <meshStandardMaterial
            color={PAPER}
            roughness={0.85}
            metalness={0.05}
          />
          <Edges threshold={25} color={INK} lineWidth={2} />
        </mesh>
      )}
    </group>
  )
}

export default function CharacterModel({ wrongGuessCount = 0, isDead = false }) {
  const groupRef = useRef()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const t = state.clock.getElapsedTime()

    if (isDead) {
      groupRef.current.position.y = MathUtils.damp(
        groupRef.current.position.y,
        -0.3,
        3,
        delta
      )
      groupRef.current.rotation.z = MathUtils.damp(
        groupRef.current.rotation.z,
        0.08,
        3,
        delta
      )
    } else {
      const breathe = Math.sin(t * 2) * 0.02
      groupRef.current.position.y = breathe
      groupRef.current.rotation.y = Math.sin(t * 0.8) * 0.04
    }
  })

  return (
    <group ref={groupRef}>
      {PARTS_ORDER.slice(0, wrongGuessCount).map((partKey, index) => (
        <PartMesh
          key={partKey}
          partKey={partKey}
          isDead={isDead}
          isAppearing={index === wrongGuessCount - 1}
        />
      ))}
    </group>
  )
}
