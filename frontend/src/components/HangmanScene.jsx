import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  ContactShadows,
  Edges,
  Environment,
} from '@react-three/drei'
import CharacterModel from './CharacterModel'

const COLORS = {
  wood: '#76563d',
  woodLight: '#916f50',
  woodDark: '#4a3628',
  outline: '#2c2825',
  rope: '#ad8b66',
  platform: '#c2b29d',
  background: '#d4c5b0',
}

function CanvasFallback() {
  return (
    <div
      style={{ height: 'clamp(260px, 45vw, 470px)' }}
      className="flex items-center justify-center border-4 border-[#2c2825] bg-[#d4c5b0]"
    >
      <p className="font-bold tracking-[0.2em] uppercase animate-pulse text-[#2c2825]">
        DRAWING SKETCH...
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                               Wood Material                                */
/* -------------------------------------------------------------------------- */

function WoodMaterial({ color = COLORS.wood }) {
  return (
    <meshStandardMaterial
      color={color}
      roughness={0.88}
      metalness={0}
    />
  )
}

function WoodenBeam({
  position,
  size,
  rotation = [0, 0, 0],
  color = COLORS.wood,
}) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      castShadow
      receiveShadow
    >
      <boxGeometry args={size} />
      <WoodMaterial color={color} />
      <Edges
        threshold={15}
        color={COLORS.outline}
        lineWidth={1.5}
      />
    </mesh>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Gallows                                       */
/* -------------------------------------------------------------------------- */

function Gallows3D() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main foot */}
      <WoodenBeam
        position={[-1.15, -0.58, 0]}
        size={[0.95, 0.12, 0.42]}
        color={COLORS.woodDark}
      />

      {/* Rear stabilizer */}
      <WoodenBeam
        position={[-1.15, -0.48, -0.14]}
        size={[0.22, 0.18, 0.85]}
        rotation={[Math.PI / 2, 0, 0]}
        color={COLORS.woodDark}
      />

      {/* Main vertical post */}
      <WoodenBeam
        position={[-1.15, 1.25, 0]}
        size={[0.18, 3.65, 0.18]}
        color={COLORS.wood}
      />

      {/* Top crossbar */}
      <WoodenBeam
        position={[-0.35, 3.0, 0]}
        size={[1.8, 0.18, 0.18]}
        color={COLORS.wood}
      />

      {/* Front diagonal brace */}
      <WoodenBeam
        position={[-0.82, 2.67, 0]}
        size={[0.75, 0.11, 0.11]}
        rotation={[0, 0, Math.PI / 4]}
        color={COLORS.woodLight}
      />

      {/* Rear diagonal brace for depth */}
      <WoodenBeam
        position={[-0.88, 2.7, -0.12]}
        size={[0.72, 0.09, 0.09]}
        rotation={[0, 0, Math.PI / 4]}
        color={COLORS.woodDark}
      />
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Pedestal                                      */
/* -------------------------------------------------------------------------- */

function Pedestal() {
  return (
    <group position={[0, -0.69, 0]}>
      {/* Main top */}
      <mesh receiveShadow castShadow>
        <cylinderGeometry args={[1.42, 1.5, 0.14, 48]} />
        <meshStandardMaterial
          color={COLORS.platform}
          roughness={0.82}
          metalness={0.02}
        />
        <Edges
          threshold={20}
          color={COLORS.outline}
          lineWidth={2}
        />
      </mesh>

      {/* Dark lower trim */}
      <mesh position={[0, -0.09, 0]} receiveShadow>
        <cylinderGeometry args={[1.54, 1.62, 0.07, 48]} />
        <meshStandardMaterial
          color={COLORS.outline}
          roughness={0.92}
        />
      </mesh>

      {/* Subtle inner platform */}
      <mesh position={[0, 0.075, 0]} receiveShadow>
        <cylinderGeometry args={[1.16, 1.2, 0.025, 48]} />
        <meshStandardMaterial
          color="#d0c1ad"
          roughness={0.9}
        />
      </mesh>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                              Main Scene                                    */
/* -------------------------------------------------------------------------- */

export default function HangmanScene({
  wrongGuessCount = 0,
  skinName = 'default',
  isDead = false,
}) {
  return (
    <div
      className="relative overflow-hidden"
      style={{
        height: 'clamp(300px, 48vw, 500px)',
        background: 'transparent',
      }}
    >
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          dpr={[1, 2]}
          camera={{
            position: [0.2, 1.35, 6.7],
            fov: 40,
          }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
        >
          {/* Warm key light */}
          <directionalLight
            position={[4, 6, 4]}
            intensity={2.4}
            castShadow
            color="#fff2d5"
            shadow-mapSize={[2048, 2048]}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-5}
            shadow-camera-right={5}
            shadow-camera-top={6}
            shadow-camera-bottom={-3}
            shadow-bias={-0.0001}
          />

          {/* Cool fill */}
          <directionalLight
            position={[-4, 2.5, -3]}
            intensity={0.65}
            color="#c5d7ef"
          />

          {/* Soft ambient */}
          <ambientLight
            intensity={0.85}
            color="#ffe8c5"
          />

          {/* Rim light */}
          <pointLight
            position={[1, 5, -4]}
            intensity={0.65}
            distance={10}
            color="#ffd58a"
          />

          {/* Subtle environment reflections */}
          <Environment preset="studio" environmentIntensity={0.25} />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3.3}
            maxPolarAngle={Math.PI / 2 + 0.04}
            minAzimuthAngle={-Math.PI / 5}
            maxAzimuthAngle={Math.PI / 5}
            target={[0, 1.15, 0]}
            autoRotate={!isDead}
            autoRotateSpeed={0.35}
            enableDamping
            dampingFactor={0.08}
          />

          {/* Gallows */}
          <Gallows3D />

          {/* Character */}
          <CharacterModel
            wrongGuessCount={wrongGuessCount}
            skinName={skinName}
            isDead={isDead}
          />

          {/* Pedestal */}
          <Pedestal />

          {/* Ground shadow */}
          <ContactShadows
            position={[0, -0.79, 0]}
            opacity={0.55}
            scale={5.5}
            blur={1.7}
            far={2.8}
            resolution={1024}
            color={COLORS.outline}
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
