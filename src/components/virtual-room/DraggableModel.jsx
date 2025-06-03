import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import ModelLoader from './ModelLoader';
import useMouseDrag from './useMouseDrag';

const DraggableModel = ({ 
  url, 
  initialPosition = [0, 0, 0], 
  initialScale = [1, 1, 1],
  initialRotation = [0, 0, 0],
  material,
  onPositionChange,
  onSelect,
  onDragStart: parentOnDragStart,
  onDragEnd: parentOnDragEnd,
  isSelected = false,
  gridSnappingEnabled = false,
  gridSize = 0.5
}) => {
  const groupRef = useRef();
  const modelRef = useRef();
  // Store the loaded model scene to prevent reloading
  const [loadedModel, setLoadedModel] = useState(null);
  const [position, setPosition] = useState(new THREE.Vector3(...initialPosition));
  const [rotation, setRotation] = useState(initialRotation);
  const { camera } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Update position and rotation when props change
  useEffect(() => {
    setPosition(new THREE.Vector3(...initialPosition));
  }, [initialPosition]);
  
  useEffect(() => {
    if (initialRotation) {
      setRotation(initialRotation);
    }
  }, [initialRotation]);
  
  // Handle model selection
  const handleSelect = useCallback((e) => {
    e.stopPropagation();
    if (onSelect) onSelect();
  }, [onSelect]);

  // Handle hover state
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setIsHovered(true);
    document.body.style.cursor = 'pointer';
  }, []);

  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    setIsHovered(false);
    if (!isDragging) {
      document.body.style.cursor = 'default';
    }
  }, [isDragging]);

  // Apply grid snapping to a position
  const applyGridSnapping = useCallback((pos) => {
    if (!gridSnappingEnabled) return pos;
    
    const snappedPos = new THREE.Vector3();
    snappedPos.x = Math.round(pos.x / gridSize) * gridSize;
    snappedPos.y = pos.y; // Keep y position as is
    snappedPos.z = Math.round(pos.z / gridSize) * gridSize;
    
    return snappedPos;
  }, [gridSnappingEnabled, gridSize]);

  // Handle drag start
  const handleDragStart = useCallback(() => {
    console.log('DraggableModel: Drag started');
    setIsDragging(true);
    document.body.style.cursor = 'grabbing';
    if (parentOnDragStart) {
      parentOnDragStart();
    }
  }, [parentOnDragStart]);

  // Handle drag with position update
  const handleDrag = useCallback((newPosition) => {
    // Make sure Y position stays consistent
    newPosition.y = position.y;
    
    console.log('DraggableModel: Dragging to', newPosition);
    
    // Only update if the position has changed significantly
    if (newPosition.distanceTo(position) > 0.01) {
      setPosition(newPosition);
      
      if (onPositionChange) {
        onPositionChange(newPosition.toArray());
      }
    }
  }, [position, onPositionChange]);

  // Handle drag end
  const handleDragEnd = useCallback(() => {
    console.log('DraggableModel: Drag ended');
    setIsDragging(false);
    document.body.style.cursor = 'default';
    
    // Final position update to ensure we have the most recent position
    if (groupRef.current && onPositionChange) {
      const finalPosition = groupRef.current.position.clone();
      // This will trigger the handlePositionChange in the parent component
      onPositionChange(finalPosition.toArray(), true); // Pass true to indicate drag end
    }
    
    if (parentOnDragEnd) {
      parentOnDragEnd();
    }
  }, [onPositionChange, parentOnDragEnd]);
  
  // Use our custom mouse drag hook
  useMouseDrag({
    objectRef: groupRef,
    onDragStart: handleDragStart,
    onDrag: handleDrag,
    onDragEnd: handleDragEnd,
    enabled: isSelected, // Only enable dragging when the model is selected
    gridSnappingEnabled,
    gridSize,
    axisLock: 'y' // Lock Y axis for horizontal movement
  });
  
  const handleModelLoad = useCallback((modelData) => {
    if (groupRef.current && modelData.scene) {
      // Store the loaded model
      setLoadedModel(modelData.scene);
      modelRef.current = modelData.scene;
    }
  }, []);

  // Memoize the model loader to prevent rerendering during drag
  const memoizedModelLoader = useMemo(() => {
    // Only render the ModelLoader if we haven't loaded the model yet
    if (!loadedModel) {
      return (
        <ModelLoader 
          url={url}
          onLoad={handleModelLoad}
          material={material}
          rotation={rotation}
        />
      );
    }
    return null;
  }, [url, handleModelLoad, material, rotation, loadedModel]);

  // Memoize the loaded model to prevent rerendering during drag
  const memoizedLoadedModel = useMemo(() => {
    if (loadedModel) {
      return (
        <primitive 
          object={loadedModel} 
          rotation={rotation}
        />
      );
    }
    return null;
  }, [loadedModel, rotation]);

  return (
    <group 
      ref={groupRef}
      position={[position.x, position.y, position.z]}
      onClick={handleSelect}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      onPointerDown={(e) => {
        // Make sure to stop propagation to prevent camera controls
        e.stopPropagation();
        e.preventDefault();
        
        console.log('DraggableModel: Pointer down, isSelected:', isSelected);
        
        // If not already selected, select it first
        if (!isSelected) {
          handleSelect(e);
        } else {
          // If already selected, just make sure the pointer event is captured for dragging
          document.body.style.cursor = 'grab';
        }
      }}
      scale={initialScale}
    >
      {/* Visual indicator for selected state */}
      {isSelected && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.25, 32]} />
          <meshStandardMaterial color="#2196f3" transparent opacity={0.8} />
        </mesh>
      )}
      
      {/* Visual indicator for hover state */}
      {isHovered && !isSelected && !isDragging && (
        <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.23, 32]} />
          <meshStandardMaterial color="#9e9e9e" transparent opacity={0.5} />
        </mesh>
      )}
      
      {/* Visual indicator for dragging state */}
      {isDragging && (
        <group>
          {/* Pink ring indicator */}
          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[1.3, 1.4, 32]} />
            <meshStandardMaterial color="#ff4081" transparent opacity={0.8} />
          </mesh>
          
          {/* Center dot */}
          <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <meshStandardMaterial color="#ff4081" />
          </mesh>
          
          {/* Directional arrows */}
          <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <coneGeometry args={[0.15, 0.4, 16]} />
            <meshStandardMaterial color="#ff4081" />
          </mesh>
          <mesh position={[-1.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.15, 0.4, 16]} />
            <meshStandardMaterial color="#ff4081" />
          </mesh>
          <mesh position={[0, 0, 1.5]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.4, 16]} />
            <meshStandardMaterial color="#ff4081" />
          </mesh>
          <mesh position={[0, 0, -1.5]} rotation={[-Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.15, 0.4, 16]} />
            <meshStandardMaterial color="#ff4081" />
          </mesh>
        </group>
      )}
      
      {/* Render either the memoized loaded model or the model loader */}
      {memoizedLoadedModel || memoizedModelLoader}
    </group>
  );
};

export default DraggableModel;

