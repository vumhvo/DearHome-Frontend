import React from 'react';
import { Box } from '@react-three/drei';


function AnchoredBox({ position, rotation }) {
  return (
    <Box position={position} rotation={rotation} args={[0.2, 0.2, 0.2]}>
      <meshStandardMaterial color="blue" />
    </Box>
  );
}

export default AnchoredBox;