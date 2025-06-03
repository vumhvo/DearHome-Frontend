import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const Wall = ({ 
    position = [0, 0, 0], 
    rotation = [0, 0, 0], 
    width = 10, 
    height = 5, 
    length = 0.3,
    color = '#f3f3f3',
    textureUrl = null,
    transparent = false,
    opacity = 1,
    // Door properties
    hasDoor = false,
    doorPosition = 0, // Position along the wall (-1 to 1)
    doorWidth = 1,
    doorHeight = 2.1,
    // Window properties
    windows = [] // Array of { position, width, height }
}) => {
    const mesh = useRef();
    
    // Create texture if provided
    const texture = textureUrl ? new THREE.TextureLoader().load(textureUrl) : null;

    // Create wall geometry with holes for doors and windows
    const wallGeometry = useMemo(() => {
        // Create base wall shape
        const shape = new THREE.Shape();
        shape.moveTo((-width / 2), (-height / 2));
        shape.lineTo((width / 2), (-height / 2));
        shape.lineTo((width / 2), (height / 2));
        shape.lineTo((-width / 2), (height / 2));
        shape.lineTo((-width / 2), (-height / 2));

        const holes = [];

        // Add door hole if needed
        if (hasDoor) {
            const doorX = ((doorPosition * width) / 2) - (doorWidth / 2);
            const doorShape = new THREE.Path();
            doorShape.moveTo(doorX, (-height / 2));
            doorShape.lineTo(doorX + doorWidth, (-height / 2));
            doorShape.lineTo(doorX + doorWidth, (-height / 2) + doorHeight);
            doorShape.lineTo(doorX, (-height / 2) + doorHeight);
            holes.push(doorShape);
        }

        // Add window holes
        windows.forEach(window => {
            const windowX = ((window.position * width) / 2) - (window.width / 2);
            const windowY = ((window.verticalPosition || 0) * height) / 2;
            const windowShape = new THREE.Path();
            windowShape.moveTo(windowX, windowY - (window.height / 2));
            windowShape.lineTo(windowX + window.width, windowY - (window.height / 2));
            windowShape.lineTo(windowX + window.width, windowY + (window.height / 2));
            windowShape.lineTo(windowX, windowY + (window.height / 2));
            holes.push(windowShape);
        });

        shape.holes = holes;

        // Create extruded geometry
        const extrudeSettings = {
            steps: 1,
            depth: length,
            bevelEnabled: false
        };

        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }, [width, height, length, hasDoor, doorPosition, doorWidth, doorHeight, windows]);

    return (
        <mesh
            position={position}
            rotation={rotation}
            ref={mesh}
            castShadow
            receiveShadow
            geometry={wallGeometry}
        >
            <meshStandardMaterial 
                color={color} 
                map={texture}
                transparent={transparent}
                opacity={opacity}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
};

export default Wall;