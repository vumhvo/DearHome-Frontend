import React, { Suspense, useEffect, useState, useMemo, useRef } from 'react';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Create a model cache to prevent reloading models with the same URL
const modelCache = new Map();

const LoadingBox = () => (
  <Box args={[1, 1, 1]}>
    <meshStandardMaterial color="gray" wireframe />
  </Box>
);

const Model = ({ url, onLoad, onError, position, rotation, material }) => {
  const [modelScene, setModelScene] = useState(null);
  const [isProcessed, setIsProcessed] = useState(false);
  const modelRef = useRef(null);
  
  // Load the model only once when the component mounts or URL changes
  useEffect(() => {
    let isActive = true;
    
    // Validate URL
    if (!url) {
      if (onError) onError(new Error('Invalid model URL'));
      return;
    }
    
    // Check if the model is already in the cache
    if (modelCache.has(url)) {
      const cachedModel = modelCache.get(url);
      setModelScene(cachedModel.clone());
      setIsProcessed(true);
      if (onLoad) onLoad({ scene: cachedModel.clone() });
      return;
    }
    
    const scene = new THREE.Scene();
    const loader = new GLTFLoader();

    const handleError = (error) => {
      if (!isActive) return;
      console.error('Error loading model:', error);
      if (onError) onError(error);
    };

    try {
      loader.load(
        url, 
        (gltf) => {
          if (!isActive) return;
          
          scene.add(gltf.scene);
          setModelScene(scene);
          
          // Cache the processed model
          modelCache.set(url, scene.clone());
          setIsProcessed(true);
          if (onLoad) onLoad({ scene });
        }, 
        undefined, 
        handleError
      );
    } catch (error) {
      handleError(error);
    }

    return () => {
      isActive = false;
    };
  }, [url, onLoad, onError]);
    
  useEffect(() => {
    if (modelScene && !isProcessed) {
      try {
        // Create a clone of the scene to avoid modifying the cached original
        const clonedScene = modelScene.clone();
        modelRef.current = clonedScene;
        
        // Center and scale the model
        const box = new THREE.Box3().setFromObject(clonedScene);
        const center = box.getCenter(new THREE.Vector3());
        clonedScene.position.sub(center);
        
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        if (maxDim > 0) { // Prevent division by zero
          const scale = 1 / maxDim;
          clonedScene.scale.setScalar(scale);
        }

        // Setup materials and optimize
        clonedScene.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            
            // Apply custom material if provided
            if (material) {
              if (material.color) {
                if (!child.userData.originalMaterial) {
                  // Store the original material
                  child.userData.originalMaterial = child.material.clone();
                }
                
                // Create a new material with the specified color
                const newMaterial = new THREE.MeshStandardMaterial({
                  color: new THREE.Color(material.color),
                  roughness: material.roughness !== undefined ? material.roughness : 0.5,
                  metalness: material.metalness !== undefined ? material.metalness : 0.2,
                });
                
                // Copy textures from original material if available
                if (child.userData.originalMaterial.map) {
                  newMaterial.map = child.userData.originalMaterial.map;
                }
                
                child.material = newMaterial;
              }
            }
            
            // Optimize materials
            if (child.material) {
              if (Array.isArray(child.material)) {
                child.material.forEach(mat => {
                  mat.needsUpdate = true;
                });
              } else {
                child.material.needsUpdate = true;
              }
            }
          }
        });

        // Mark as processed to prevent reprocessing
        setIsProcessed(true);
        
        if (onLoad) onLoad({ scene: clonedScene });
        
      } catch (error) {
        console.error('Error processing model:', error);
        if (onError) onError(error);
      }
    }
  }, [modelScene, isProcessed, onLoad, onError, material]);

  // Memoize the primitive to prevent unnecessary re-renders
  const memoizedPrimitive = useMemo(() => {
    if (modelScene && isProcessed) {
      return (
        <primitive 
          object={modelScene} 
          rotation={rotation || [0, 0, 0]}
          position={position || [0, 0, 0]}
          ref={modelRef}
        />
      );
    }
    return <LoadingBox />;
  }, [modelScene, rotation, isProcessed]);

  return memoizedPrimitive;
};

const ModelLoader = ({ url, onLoad, onError, rotation, material, position }) => {
  return (
    <Suspense fallback={<LoadingBox />}>
      <Model 
        url={url} 
        onLoad={onLoad} 
        onError={onError} 
        rotation={rotation} 
        material={material} 
        position={position} 
      />
    </Suspense>
  );
};

// Cleanup function to dispose of cached models when no longer needed
ModelLoader.clearCache = () => {
  modelCache.forEach((scene) => {
    scene.traverse((object) => {
      if (object.geometry) object.geometry.dispose();
      if (object.material) {
        if (Array.isArray(object.material)) {
          object.material.forEach(material => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
  });
  modelCache.clear();
};

export default ModelLoader;