import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import CharacterModel from './CharacterModel'

function CanvasFallback() {
  return (
    <div
      style={{ height: 'clamp(260px, 45vw, 470px)' }}
      className="flex items-center justify-center rounded-[28px] border border-[var(--line)] bg-[#030712]"
    >
      <p className="text-sm text-muted animate-pulse">Loading 3D scene…</p>
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
      className="overflow-hidden rounded-[28px] border border-[var(--line)] shadow-[0_18px_40px_rgba(75,54,33,0.12)]"
      style={{
        height: 'clamp(260px, 45vw, 470px)',
        background: '#030712',
      }}
    >
      <Suspense fallback={<CanvasFallback />}>
        <Canvas camera={{ position: [0, 1.5, 5], fov: 50 }}>
          <color attach="background" args={['#030712']} />
          <ambientLight intensity={0.9} />
          <directionalLight position={[5, 5, 5]} intensity={1} castShadow />
          <pointLight position={[-3, 3, 3]} intensity={0.7} color="#d96c3d" />
          <pointLight position={[3, 2, -1]} intensity={0.35} color="#f8e7cd" />
          <OrbitControls
            enablePan={false}
            minDistance={3}
            maxDistance={8}
            target={[0, 1.2, 0]}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2}
          />
          <CharacterModel wrongGuessCount={wrongGuessCount} skinName={skinName} isDead={isDead} />
          <mesh position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.25, 32]} />
            <meshStandardMaterial color="#31424a" />
          </mesh>
        </Canvas>
      </Suspense>
    </div>
  )
}
