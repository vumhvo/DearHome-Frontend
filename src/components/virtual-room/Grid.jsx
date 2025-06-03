import React from 'react';
import * as THREE from 'three';
import { Line } from '@react-three/drei';

const Grid = ({ 
  size = 10, 
  divisions = 20, 
  color = '#8f8f8f', 
  fadeDistance = 5,
  fadeStrength = 1.5,
  visible = true 
}) => {
  if (!visible) return null;
  
  // Calculate the actual size of the grid
  const halfSize = size / 2;
  
  // Create the grid lines
  const lines = [];
  const step = size / divisions;
  
  // Function to calculate opacity based on distance from center
  const getOpacity = (position) => {
    const distance = Math.abs(position);
    // Linear fade from center to edge
    return Math.max(0, 1 - (distance / fadeDistance) ** fadeStrength);
  };
  
  // Create grid lines along X axis
  for (let i = -halfSize; i <= halfSize; i += step) {
    const opacity = getOpacity(i);
    const lineColor = new THREE.Color(color).multiplyScalar(opacity);
    
    lines.push(
      <Line
        key={`x-${i}`}
        points={[[-halfSize, 0, i], [halfSize, 0, i]]}
        color={lineColor}
        lineWidth={i === 0 ? 2 : 1} // Make the center line thicker
        transparent
        opacity={opacity}
      />
    );
  }
  
  // Create grid lines along Z axis
  for (let i = -halfSize; i <= halfSize; i += step) {
    const opacity = getOpacity(i);
    const lineColor = new THREE.Color(color).multiplyScalar(opacity);
    
    lines.push(
      <Line
        key={`z-${i}`}
        points={[[i, 0, -halfSize], [i, 0, halfSize]]}
        color={lineColor}
        lineWidth={i === 0 ? 2 : 1} // Make the center line thicker
        transparent
        opacity={opacity}
      />
    );
  }
  
  return (
    <group position={[0, 0.01, 0]}>
      {lines}
    </group>
  );
};

export default Grid;
