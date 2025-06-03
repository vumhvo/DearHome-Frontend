import React from 'react';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

const Floor = ({ 
    width = 20, 
    height = 20, 
    color = '#f3f3f3', 
    metalness = 0.1, 
    roughness = 0.8,
    position = [0, 0, 0],
    rotation = [-Math.PI / 2, 0, 0], // Flat horizontal floor
    receiveShadow = true,
    textureUrl = null
}) => {
    // If a texture URL is provided, load it
    const texture = textureUrl ? useTexture(textureUrl) : null;
    
    if (texture) {
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(5, 5); // Adjust repetition as needed
    }

    return (
        <mesh 
            position={position} 
            rotation={rotation} 
            receiveShadow={receiveShadow}
        >
            <planeGeometry args={[width, height]} />
            <meshStandardMaterial 
                color={color}
                metalness={metalness}
                roughness={roughness}
                map={texture}
            />
        </mesh>
    );
};

export default Floor;