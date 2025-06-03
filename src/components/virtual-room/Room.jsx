import React from 'react';
import { useThree } from '@react-three/fiber';
import { Box } from '@react-three/drei';
import Wall from '../models/Wall';
import Floor from '../models/Floor';

const defaultWallConfig = {
  hasDoor: false,
  doorPosition: 0,
  doorWidth: 1,
  doorHeight: 2.1,
  windows: []
};

const Room = ({ 
  roomDimensions, 
  material,
  frontWall = defaultWallConfig,
  backWall = defaultWallConfig,
  leftWall = defaultWallConfig,
  rightWall = defaultWallConfig
}) => {
  return (
    <group>
      {/* Floor */}
      <Floor
        position={[0, -0.2, 0]}
        width={roomDimensions.width}
        height={roomDimensions.length}
        color={material.floorMaterial}
        transparent={false}
      />

      {/*Front Wall*/}
      <Wall
        position={[0, roomDimensions.height / 2 - 0.2, roomDimensions.length / 2]}
        rotation={[0, Math.PI, 0]}
        width={roomDimensions.width}
        height={roomDimensions.height}
        length={0.1}
        color={material.wallMaterial}
        transparent={false}
        opacity={1}
        {...frontWall}
      />

      {/* Back Wall */}
      <Wall
        position={[0, roomDimensions.height / 2 - 0.2, -roomDimensions.length / 2]}
        rotation={[0, 0, 0]}
        width={roomDimensions.width}
        height={roomDimensions.height}
        length={0.1}
        color={material.wallMaterial}
        transparent={false}
        opacity={1}
        {...backWall}
      />

      {/* Left Wall */}
      <Wall
        position={[-roomDimensions.width / 2, roomDimensions.height / 2 - 0.2, 0]}
        rotation={[0, -Math.PI / 2, 0]}
        width={roomDimensions.length}
        height={roomDimensions.height}
        length={0.1}
        color={material.wallMaterial}
        transparent={false}
        opacity={1}
        {...leftWall}
      />

      {/* Right Wall */}
      <Wall
        position={[roomDimensions.width / 2, roomDimensions.height / 2 - 0.2, 0]}
        rotation={[0, Math.PI / 2, 0]}
        width={roomDimensions.length}
        height={roomDimensions.height}
        length={0.1}
        color={material.wallMaterial}
        transparent={false}
        opacity={1}
        {...rightWall}
      />
    </group>
  );
};

export default Room;
