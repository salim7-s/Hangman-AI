export const SkeletonSkin = {
  head:     { geometry: 'sphere',   args: [0.38, 32, 32],         color: '#f1f5f9', position: [0, 2.2, 0],     rotation: [0, 0, 0] },
  torso:    { geometry: 'cylinder', args: [0.18, 0.18, 1, 8],     color: '#e2e8f0', position: [0, 1.2, 0],     rotation: [0, 0, 0] },
  leftArm:  { geometry: 'cylinder', args: [0.06, 0.06, 0.8, 6],   color: '#f1f5f9', position: [-0.6, 1.3, 0],  rotation: [0, 0, Math.PI / 4] },
  rightArm: { geometry: 'cylinder', args: [0.06, 0.06, 0.8, 6],   color: '#f1f5f9', position: [0.6, 1.3, 0],   rotation: [0, 0, -Math.PI / 4] },
  leftLeg:  { geometry: 'cylinder', args: [0.06, 0.06, 0.9, 6],   color: '#cbd5e1', position: [-0.25, 0.2, 0], rotation: [0, 0, Math.PI / 12] },
  rightLeg: { geometry: 'cylinder', args: [0.06, 0.06, 0.9, 6],   color: '#cbd5e1', position: [0.25, 0.2, 0],  rotation: [0, 0, -Math.PI / 12] },
}
