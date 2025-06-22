import React, { useState, useRef, useEffect } from 'react';
import { XRHandModel, XRHitTest, useXRHandState, useXREvent } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import { XR, ARButton } from '@react-three/xr';
import * as THREE from 'three';
import AnchoredBox from './AnchoredBox'; // Giả sử bạn đã tạo một component
import { createXRStore } from '@react-three/xr';
import CenterHitTestPoint from './CenterHitTestPoint';
import ModelLoader from '../virtual-room/ModelLoader'; // Giả sử bạn đã tạo một component để tải mô hình
import { storage } from '../../firebase/config';
import { ref, getDownloadURL } from 'firebase/storage';
import { rand } from 'three/tsl';

const matrixHelper = new THREE.Matrix4();
const hitTestPosition = new THREE.Vector3();

const store = createXRStore()

function ARScene() {
    const [modelPosition, setModelPosition] = useState(null);
    const lastHitPosition = useRef(null);
    const [modelPath, setModelPath] = useState('Shapes/20250621_084921_DEMO.glb'); // Đường dẫn đến mô hình trong Firebase Storage
    const [modelStorageUrl, setModelStorageUrl] = useState(null);

    const handleGetHitTestResult = (position) => {
        // Store the latest hit position
        lastHitPosition.current = position.clone();
    };


    // Handle user click/tap
    const handleHitTestPointClick = () => {
        if (lastHitPosition.current) {
            setModelPosition(lastHitPosition.current.clone());
        }
    };

    useEffect(() => {
       if (!modelPath) {
                setError(new Error("Model path is required"));
                return;
            }
    
            // Get download URL from Firebase Storage
            const modelRef = ref(storage, modelPath);
            getDownloadURL(modelRef)
                .then((url) => {
                    setModelStorageUrl(url);
                })
                .catch((error) => {
                    console.error('Error getting download URL:', error);
                    setError(error);
                });
    }, [modelPath]);
    

    return (
        <>
            <button onClick={() => store.enterAR()}>Enter AR V1.0.13</button>
            <Canvas>
                <XR store={store}>
                    <ambientLight />
                    <CenterHitTestPoint onHitTestResult={handleGetHitTestResult} onClick={handleHitTestPointClick} />
                    {modelPosition && (
                        // <mesh position={modelPosition}>
                        //     {/* Replace with your model */}
                        //     <boxGeometry args={[0.2, 0.2, 0.2]} />
                        //     <meshStandardMaterial color="orange" />
                        // </mesh>
                        <ModelLoader
                            url={modelStorageUrl}
                            position={modelPosition}
                            onError={(error) => {
                                console.error('ModelLoader error:', error);
                                setError(error);
                            }}
                            key={`model`} // Force re-render when color/material changes
                        />
                    )}
                </XR>
            </Canvas>
        </>
    );
}

export default ARScene;