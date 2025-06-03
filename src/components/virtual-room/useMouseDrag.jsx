import React, { useRef, useEffect, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * A custom hook to handle drag operations with mouse using raycaster
 * @param {Object} options - Configuration options
 * @param {React.RefObject} options.objectRef - Reference to the 3D object to drag
 * @param {Function} options.onDragStart - Callback when drag starts
 * @param {Function} options.onDrag - Callback during drag with new position
 * @param {Function} options.onDragEnd - Callback when drag ends
 * @param {Boolean} options.enabled - Whether dragging is enabled
 * @param {Boolean} options.gridSnappingEnabled - Whether grid snapping is enabled
 * @param {Number} options.gridSize - Size of the grid for snapping
 * @param {String} options.axisLock - Axis to lock during dragging (x, y, z or null)
 */
const useMouseDrag = ({
  objectRef,
  onDragStart,
  onDrag,
  onDragEnd,
  enabled = true,
  gridSnappingEnabled = false,
  gridSize = 0.5,
  axisLock = null
}) => {
  const { camera, gl, scene } = useThree();
  const isDraggingRef = useRef(false);
  const initialIntersectRef = useRef(null);
  const dragPlaneRef = useRef(null);
  const initialPositionRef = useRef(new THREE.Vector3());
  
  // Create a dedicated raycaster and pointer for this hook
  const raycaster = useRef(new THREE.Raycaster());
  const pointer = useRef(new THREE.Vector2());

  // Apply grid snapping to a position
  const applyGridSnapping = (position) => {
    if (!gridSnappingEnabled) return position;

    const snappedPos = position.clone();
    
    if (axisLock !== 'x') {
      snappedPos.x = Math.round(position.x / gridSize) * gridSize;
    }
    
    if (axisLock !== 'y') {
      snappedPos.y = Math.round(position.y / gridSize) * gridSize;
    }
    
    if (axisLock !== 'z') {
      snappedPos.z = Math.round(position.z / gridSize) * gridSize;
    }
    
    return snappedPos;
  };

  // Update pointer position and handle dragging in animation frame
  useFrame(() => {
    if (isDraggingRef.current && dragPlaneRef.current) {
      // Update the raycaster with the latest pointer position
      raycaster.current.setFromCamera(pointer.current, camera);
      
      // Find intersection with the drag plane
      const newIntersect = new THREE.Vector3();
      const didIntersect = raycaster.current.ray.intersectPlane(dragPlaneRef.current, newIntersect);
      
      if (didIntersect && initialIntersectRef.current) {
        // Calculate the movement delta from initial intersection
        const movementDelta = newIntersect.clone().sub(initialIntersectRef.current);
        
        // Apply movement to object position
        const newPosition = initialPositionRef.current.clone().add(movementDelta);
        
        // Apply axis locking if needed
        if (axisLock === 'y' || axisLock === null) {
          // For most furniture, we want to keep it on the floor, so lock Y
          newPosition.y = initialPositionRef.current.y;
        } else if (axisLock === 'x') {
          newPosition.x = initialPositionRef.current.x;
        } else if (axisLock === 'z') {
          newPosition.z = initialPositionRef.current.z;
        }
        
        // Apply grid snapping if enabled
        const finalPosition = applyGridSnapping(newPosition);
        
        // Call drag callback with new position
        if (onDrag) {
          onDrag(finalPosition);
        }
      }
    }
  });

  useEffect(() => {
    if (!enabled || !objectRef.current) return;

    const domElement = gl.domElement;
    
    const handlePointerDown = (event) => {
      // Skip if already dragging or right click
      if (isDraggingRef.current || event.button !== 0) return;
      
      console.log('Pointer down on draggable object');
      
      // Important: Stop propagation to prevent camera controls from interfering
      event.stopPropagation();
      event.preventDefault();
      
      // Get normalized device coordinates
      const rect = domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update pointer and raycaster
      pointer.current.set(x, y);
      raycaster.current.setFromCamera(pointer.current, camera);
      
      // Check intersection with our object
      const intersects = raycaster.current.intersectObject(objectRef.current, true);
      
      if (intersects.length > 0) {
        console.log('Intersection found, starting drag');
        // Start dragging
        isDraggingRef.current = true;
        
        // Change cursor to indicate dragging
        document.body.style.cursor = 'grabbing';
        
        // Store initial position
        initialPositionRef.current.copy(objectRef.current.position);
        
        // Create a drag plane - use a horizontal plane at the model's height
        // This is crucial for correct dragging behavior - the plane must be perpendicular to the Y-axis
        const planeNormal = new THREE.Vector3(0, 1, 0); // Normal pointing up (Y-axis)
        const planeConstant = -objectRef.current.position.y; // Negative of the model's Y position
        dragPlaneRef.current = new THREE.Plane(planeNormal, planeConstant);
        
        // Store initial intersection point
        const planeIntersect = new THREE.Vector3();
        const didIntersect = raycaster.current.ray.intersectPlane(dragPlaneRef.current, planeIntersect);
        
        if (didIntersect) {
          console.log('Initial plane intersection found');
          initialIntersectRef.current = planeIntersect.clone();
          
          // Call drag start callback
          if (onDragStart) {
            onDragStart();
          }
          
          // Add document-level event listeners for better pointer tracking
          document.addEventListener('pointermove', handlePointerMove, { capture: true });
          document.addEventListener('pointerup', handlePointerUp, { capture: true });
          document.addEventListener('pointercancel', handlePointerUp, { capture: true });
        } else {
          console.log('No initial plane intersection found');
        }
      } else {
        console.log('No intersection with object');
      }
    };

    const handlePointerMove = (event) => {
      if (!isDraggingRef.current) return;
      
      // Always stop propagation during drag to prevent camera movement
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Pointer move during drag');
      
      // Get normalized device coordinates
      const rect = domElement.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      // Update pointer for use in useFrame - this is the key part for the raycaster pattern
      pointer.current.set(x, y);
    };

    const handlePointerUp = (event) => {
      if (!isDraggingRef.current) return;
      
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }
      
      console.log('Pointer up, ending drag');
      
      // End dragging
      isDraggingRef.current = false;
      
      // Reset cursor
      document.body.style.cursor = 'default';
      
      // Call drag end callback
      if (onDragEnd) {
        onDragEnd();
      }
      
      // Remove document-level event listeners
      document.removeEventListener('pointermove', handlePointerMove, { capture: true });
      document.removeEventListener('pointerup', handlePointerUp, { capture: true });
      document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
    };

    // Add event listener to start drag
    objectRef.current.addEventListener('pointerdown', handlePointerDown);
    
    // Cleanup function
    return () => {
      if (objectRef.current) {
        objectRef.current.removeEventListener('pointerdown', handlePointerDown);
      }
      // Ensure event listeners are removed on cleanup
      document.removeEventListener('pointermove', handlePointerMove, { capture: true });
      document.removeEventListener('pointerup', handlePointerUp, { capture: true });
      document.removeEventListener('pointercancel', handlePointerUp, { capture: true });
      
      // Reset state if component unmounts during a drag
      if (isDraggingRef.current && onDragEnd) {
        onDragEnd();
      }
    };
  }, [
    enabled, 
    camera, 
    gl, 
    onDragStart, 
    onDrag, 
    onDragEnd, 
    gridSnappingEnabled, 
    gridSize, 
    axisLock
  ]);

  return null;
};

export default useMouseDrag;
