import React, { Suspense, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { Box } from '@react-three/drei';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const LoadingBox = () => (
  <Box args={[1, 1, 1]}>
    <meshStandardMaterial color="gray" wireframe />
  </Box>
);

const Model = ({ url, onLoad, onError }) => {
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
              
              // Optimize materials if needed
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
    }, [scene, onLoad, onError]);

    return scene ? <primitive object={scene} /> : <LoadingBox />;
  } catch (error) {
    console.error('Error loading model:', error);
    if (onError) onError(error);
    return <LoadingBox />;
  }
};

const ModelLoader = ({ url, onLoad, onError }) => {
  console.log('ModelLoader received URL:', url);
  
  return (
    <Suspense fallback={<LoadingBox />}>
      <Model url={url} onLoad={onLoad} onError={onError} />
    </Suspense>
  );
};

export default ModelLoader;