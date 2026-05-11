
export const DefaultSkin = {
  head:     { geometry: 'sphere',   args: [0.4, 32, 32],          color: '#e8c99a', position: [0, 2.2, 0],     rotation: [0, 0, 0] },
  torso:    { geometry: 'cylinder', args: [0.3, 0.3, 1, 16],      color: '#3b82f6', position: [0, 1.2, 0],     rotation: [0, 0, 0] },
  leftArm:  { geometry: 'cylinder', args: [0.1, 0.1, 0.8, 8],     color: '#3b82f6', position: [-0.6, 1.3, 0],  rotation: [0, 0, Math.PI / 4] },
  rightArm: { geometry: 'cylinder', args: [0.1, 0.1, 0.8, 8],     color: '#3b82f6', position: [0.6, 1.3, 0],   rotation: [0, 0, -Math.PI / 4] },
  leftLeg:  { geometry: 'cylinder', args: [0.1, 0.1, 0.9, 8],     color: '#1e293b', position: [-0.25, 0.2, 0], rotation: [0, 0, Math.PI / 12] },
  rightLeg: { geometry: 'cylinder', args: [0.1, 0.1, 0.9, 8],     color: '#1e293b', position: [0.25, 0.2, 0],  rotation: [0, 0, -Math.PI / 12] },
}
