import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows, AccumulativeShadows, RandomizedLight } from '@react-three/drei'
import CharacterModel from './CharacterModel'

function CanvasFallback() {
  return (
    <div
      style={{ height: 'clamp(260px, 45vw, 470px)' }}
      className="flex items-center justify-center border-4 border-[#2c2825] bg-[#d4c5b0]"
    >
      <p className="font-bold tracking-widest uppercase animate-pulse">DRAWING SKETCH...</p>
    </div>
  )
}

export default function HangmanScene({
  wrongGuessCount = 0,
  skinName = 'default',
  isDead = false,
}) {
  return (
    <div
      className="relative"
      style={{
        height: 'clamp(260px, 45vw, 470px)',
        background: 'transparent',
      }}
    >
      <Suspense fallback={<CanvasFallback />}>
        <Canvas
          shadows
          camera={{ position: [0, 1.4, 6.5], fov: 42 }}
          gl={{ antialias: true }}
        >
          {/* Key light — warm side light like a desk lamp */}
          <directionalLight
            position={[3, 5, 3]}
            intensity={2.2}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-camera-near={0.5}
            shadow-camera-far={20}
            shadow-camera-left={-4}
            shadow-camera-right={4}
            shadow-camera-top={5}
            shadow-camera-bottom={-2}
            color="#fff5e0"
          />

          {/* Fill light — cool blue from opposite side */}
          <directionalLight
            position={[-4, 2, -2]}
            intensity={0.6}
            color="#c8d8f0"
          />

          {/* Ambient — keeps shadows from going pitch black */}
          <ambientLight intensity={0.9} color="#ffe8c0" />

          {/* Rim light from above/behind for depth */}
          <pointLight position={[0, 5, -3]} intensity={0.4} color="#ffd080" />

          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3.5}
            maxPolarAngle={Math.PI / 2 + 0.05}
            target={[0, 1.1, 0]}
            autoRotate={!isDead}
            autoRotateSpeed={0.4}
          />

          <CharacterModel
            wrongGuessCount={wrongGuessCount}
            skinName={skinName}
            isDead={isDead}
          />

          {/* Soft contact shadow on the ground */}
          <ContactShadows
            position={[0, -0.72, 0]}
            opacity={0.55}
            scale={7}
            blur={1.2}
            far={3}
            color="#2c2825"
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
