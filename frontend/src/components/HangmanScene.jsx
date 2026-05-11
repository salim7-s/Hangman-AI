import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, ContactShadows } from '@react-three/drei'
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
        <Canvas camera={{ position: [0, 1.5, 6], fov: 45 }} gl={{ antialias: true }}>
          
          {/* Harsh, flat lighting for a 2D sketch look */}
          <ambientLight intensity={1.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          
          <OrbitControls
            enablePan={false}
            enableZoom={false}
            minPolarAngle={Math.PI / 3}
            maxPolarAngle={Math.PI / 2 + 0.1}
            target={[0, 1.2, 0]}
            autoRotate={!isDead}
            autoRotateSpeed={0.5}
          />

          {/* The Pencil Sketch Character */}
          <CharacterModel wrongGuessCount={wrongGuessCount} skinName={skinName} isDead={isDead} />
          
          {/* Ground & Hard Pencil Shadow */}
          <ContactShadows 
            position={[0, -0.6, 0]} 
            opacity={0.6} 
            scale={10} 
            blur={0.5} 
            far={4} 
            color="#2c2825" 
          />
        </Canvas>
      </Suspense>
    </div>
  )
}
