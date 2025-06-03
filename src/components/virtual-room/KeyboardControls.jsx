import React, { useEffect } from 'react';
import * as THREE from 'three';

/**
 * Component to handle keyboard controls for 3D model manipulation
 * 
 * @param {Object} props Component props
 * @param {Object} props.model The model data
 * @param {function} props.onPositionChange Function to call when position changes
 * @param {function} props.onRotationChange Function to call when rotation changes
 * @param {boolean} props.isSelected Whether the model is selected
 * @param {boolean} props.gridSnappingEnabled Whether grid snapping is enabled
 * @param {number} props.gridSize The size of the grid for snapping
 */
const KeyboardControls = ({
  model,
  onPositionChange,
  onRotationChange,
  isSelected = false,
  gridSnappingEnabled = false,
  gridSize = 0.5
}) => {
  // Handle keyboard controls when the model is selected
  useEffect(() => {
    if (!isSelected || !model) return;
    
    const handleKeyDown = (e) => {
      // Skip if there's an input field in focus
      if (document.activeElement.tagName === 'INPUT' || 
          document.activeElement.tagName === 'TEXTAREA') {
        return;
      }
      
      let moveX = 0;
      let moveZ = 0;
      let rotateY = 0;
      const moveAmount = gridSnappingEnabled ? gridSize : 0.1;
      const rotateAmount = Math.PI / 16; // 22.5 degrees
      
      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey) {
            // Rotation when shift is held
            rotateY = -rotateAmount;
          } else {
            moveX = -moveAmount;
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey) {
            // Rotation when shift is held
            rotateY = rotateAmount;
          } else {
            moveX = moveAmount;
          }
          break;
        case 'ArrowUp':
          moveZ = -moveAmount;
          break;
        case 'ArrowDown':
          moveZ = moveAmount;
          break;
        default:
          return; // Exit if not a handled key
      }
      
      if (moveX !== 0 || moveZ !== 0) {
        e.preventDefault(); // Prevent scrolling
        
        // Get current position
        const currentPosition = [...model.position];
        
        // Update position
        const newPosition = [
          currentPosition[0] + moveX,
          currentPosition[1],
          currentPosition[2] + moveZ
        ];
        
        // Apply grid snapping if enabled
        if (gridSnappingEnabled) {
          newPosition[0] = Math.round(newPosition[0] / gridSize) * gridSize;
          newPosition[2] = Math.round(newPosition[2] / gridSize) * gridSize;
        }
        
        if (onPositionChange) {
          onPositionChange(newPosition, true); // true to indicate a final position change
        }
      }
      
      if (rotateY !== 0) {
        e.preventDefault();
        
        // Get current rotation
        const currentRotation = [...model.rotation];
        
        // Update rotation (Y axis)
        const newRotation = currentRotation[1] + rotateY;
        
        if (onRotationChange) {
          onRotationChange('y', newRotation);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSelected, model, onPositionChange, onRotationChange, gridSnappingEnabled, gridSize]);
  
  // This component doesn't render anything
  return null;
};

export default KeyboardControls;
