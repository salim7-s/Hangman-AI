export const RobotSkin = {
  head:     { geometry: 'box',      args: [0.75, 0.75, 0.75],     color: '#94a3b8', position: [0, 2.2, 0],     rotation: [0, 0, 0] },
  torso:    { geometry: 'box',      args: [0.7, 1.0, 0.4],        color: '#64748b', position: [0, 1.2, 0],     rotation: [0, 0, 0] },
  leftArm:  { geometry: 'cylinder', args: [0.1, 0.1, 0.8, 8],     color: '#94a3b8', position: [-0.6, 1.3, 0],  rotation: [0, 0, Math.PI / 4] },
  rightArm: { geometry: 'cylinder', args: [0.1, 0.1, 0.8, 8],     color: '#94a3b8', position: [0.6, 1.3, 0],   rotation: [0, 0, -Math.PI / 4] },
  leftLeg:  { geometry: 'box',      args: [0.18, 0.9, 0.18],      color: '#475569', position: [-0.25, 0.2, 0], rotation: [0, 0, Math.PI / 12] },
  rightLeg: { geometry: 'box',      args: [0.18, 0.9, 0.18],      color: '#475569', position: [0.25, 0.2, 0],  rotation: [0, 0, -Math.PI / 12] },
}
