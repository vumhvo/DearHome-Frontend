import React, { Suspense, useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const LoadingBox = () => (
  <Box args={[1, 1, 1]}>
    <meshStandardMaterial color="gray" wireframe />
  </Box>
);

const Model = ({ url, material, onLoad, onError }) => {
  try {
    // Early check for valid URL
    if (!url) {
      console.error('Invalid model URL: URL is undefined or empty');
      if (onError) onError(new Error('Invalid model URL: URL is undefined or empty'));
      return <LoadingBox />;
    }

    const scene = new THREE.Scene();
    const loader = new GLTFLoader();

    // Ensure URL is a string and process it if needed
    const processedUrl = typeof url === 'string' ? url : String(url);
    
    console.log('Loading model from URL:', processedUrl);
    
    loader.load(processedUrl, (gltf) => {
      console.log('Model loaded successfully:', gltf);
      scene.add(gltf.scene);
    }, 
    // Progress callback
    (xhr) => {
      console.log((xhr.loaded / xhr.total * 100) + '% loaded');
    }, 
    // Error callback
    (error) => {
      console.error('Error loading model:', error);
      if (onError) onError(error);
    });
    
    useEffect(() => {
      if (scene) {
        try {
          // Create a clone of the scene to avoid modifying the cached original
          const clonedScene = scene.clone();
          
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
              
              // Apply material properties if provided
              if (material) {
                try {
                  // Check if material contains a color property
                  const hasColor = material.color !== undefined;
                  let modelColor = null;
                  
                  if (hasColor) {
                    modelColor = new THREE.Color(material.color);
                    console.log('Material includes color:', modelColor);
                  }
                  
                  if (Array.isArray(child.material)) {
                    child.material.forEach((mat, index) => {
                      if (mat) {
                        // Apply color if provided and material supports it
                        if (hasColor && mat.color) {
                          mat.color.set(modelColor);
                        } else if (hasColor) {
                          // Create a new material with color support if the current one doesn't support it
                          const newMat = new THREE.MeshStandardMaterial({
                            color: modelColor,
                            roughness: material.roughness || 0.5,
                            metalness: material.metalness || 0.0,
                          });
                          
                          // Copy maps from old material
                          if (mat.map) newMat.map = mat.map;
                          if (mat.normalMap) newMat.normalMap = mat.normalMap;
                          if (mat.emissiveMap) newMat.emissiveMap = mat.emissiveMap;
                          
                          // Apply other material properties
                          Object.entries(material).forEach(([prop, value]) => {
                            if (prop !== 'color' && newMat[prop] !== undefined) {
                              newMat[prop] = value;
                            }
                          });
                          
                          child.material[index] = newMat;
                        } else {
                          // Just apply other material properties
                          Object.entries(material).forEach(([prop, value]) => {
                            if (mat[prop] !== undefined) {
                              mat[prop] = value;
                            }
                          });
                        }
                        child.material[index].needsUpdate = true;
                      }
                    });
                    console.log('Applied material properties to multiple materials');
                  } else if (child.material) {
                    // Apply color if provided and material supports it
                    if (hasColor && child.material.color) {
                      child.material.color.set(modelColor);
                    } else if (hasColor) {
                      // Handle materials without color property
                      console.log('Material type without color property, creating new material');
                      const oldMaterial = child.material;
                      
                      // Create a new standard material with the color
                      const newMaterial = new THREE.MeshStandardMaterial({
                        color: modelColor,
                        roughness: material.roughness || 0.5,
                        metalness: material.metalness || 0.0,
                      });
                      
                      // Copy maps from old material
                      if (oldMaterial.map) newMaterial.map = oldMaterial.map;
                      if (oldMaterial.normalMap) newMaterial.normalMap = oldMaterial.normalMap;
                      if (oldMaterial.emissiveMap) newMaterial.emissiveMap = oldMaterial.emissiveMap;
                      if (oldMaterial.alphaMap) newMaterial.alphaMap = oldMaterial.alphaMap;
                      
                      // Copy transparency settings
                      if (oldMaterial.transparent) newMaterial.transparent = true;
                      if (oldMaterial.opacity) newMaterial.opacity = oldMaterial.opacity;
                      
                      child.material = newMaterial;
                    }
                    
                    // Apply other material properties
                    Object.entries(material).forEach(([prop, value]) => {
                      if (prop !== 'color' && child.material[prop] !== undefined) {
                        child.material[prop] = value;
                      }
                    });
                    
                    child.material.needsUpdate = true;
                    console.log('Applied material properties to single material');
                  }
                } catch (error) {
                  console.error('Error applying material:', error);
                }
              } else {
                // Default optimization if no custom material is provided
                if (Array.isArray(child.material)) {
                  child.material.forEach(mat => {
                    mat.needsUpdate = true;
                  });
                } else if (child.material) {
                  child.material.needsUpdate = true;
                }
              }
            }
          });

          if (onLoad) onLoad({ scene: clonedScene });
          
          return () => {
            // Dispose of the cloned scene when component unmounts
            clonedScene.traverse((object) => {
              if (object.geometry) object.geometry.dispose();
              if (object.material) {
                if (Array.isArray(object.material)) {
                  object.material.forEach(material => material.dispose());
                } else {
                  object.material.dispose();
                }
              }
            });
          };
        } catch (error) {
          console.error('Error processing model:', error);
          if (onError) onError(error);
        }
      }
    }, [scene, material, onLoad, onError]);

    return scene ? <primitive object={scene} /> : <LoadingBox />;
  } catch (error) {
    console.error('Error loading model:', error);
    if (onError) onError(error);
    return <LoadingBox />;
  }
};

const ModelLoader = ({ url, color, material, onLoad, onError }) => {
  console.log('ModelLoader received URL:', url);
  console.log('ModelLoader received color:', color);
  console.log('ModelLoader received material properties:', material);
  
  // Create a new material object that includes color
  const combinedMaterial = material ? { ...material } : {};
  
  // Add color to material if provided
  if (color) {
    combinedMaterial.color = color;
    console.log('Combined material with color:', combinedMaterial);
  }
  
  // Use a unique key based on the material and color to force re-creation 
  // of the component when these props change
  const materialKey = JSON.stringify(combinedMaterial);
  
  return (
    <Suspense fallback={<LoadingBox />}>
      <Model 
        url={url} 
        material={combinedMaterial}
        onLoad={onLoad}
        onError={onError}
        key={`model-${materialKey}`} 
      />
    </Suspense>
  );
};

export default ModelLoader;