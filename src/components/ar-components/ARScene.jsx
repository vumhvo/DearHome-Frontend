import React, { useState, useRef } from 'react';
import { XRHandModel, XRHitTest, useXRHandState, useXREvent } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import { XR, ARButton } from '@react-three/xr';
import * as THREE from 'three';
import AnchoredBox from './AnchoredBox'; // Giả sử bạn đã tạo một component
import { createXRStore } from '@react-three/xr';
import CenterHitTestPoint from './CenterHitTestPoint';
import PlaceableCube from './PlacableCube';
import ARDebugLog from '../../components/ar-components/ARDebugLog'; 



const matrixHelper = new THREE.Matrix4();
const hitTestPosition = new THREE.Vector3();

const store = createXRStore({
    hand: {
        right: () => {
            const state = useXRHandState()
            return (
                <>
                    <XRHandModel />
                    <XRHitTest
                        space={state.inputSource.targetRaySpace}
                        onResults={(results, getWorldMatrix) => {
                            if (results.length === 0) {
                                return
                            }
                            getWorldMatrix(matrixHelper, results[0])
                            hitTestPosition.setFromMatrixPosition(matrixHelper)
                        }}
                    />
                </>
            )
        },
    },
})

function ARScene() {
    const [modelPosition, setModelPosition] = useState(null);
    const lastHitPosition = useRef(null);

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

    return (
        <>
            <button onClick={() => store.enterAR()}>Enter AR V1.0.7</button>
            <Canvas>
                <XR store={store}>
                    <ambientLight />
                    <CenterHitTestPoint onHitTestResult={handleGetHitTestResult} onClick={handleHitTestPointClick} />
                    {modelPosition && (
                        <mesh position={modelPosition}>
                            {/* Replace with your model */}
                            <boxGeometry args={[0.2, 0.2, 0.2]} />
                            <meshStandardMaterial color="orange" />
                        </mesh>
                    )}
                </XR>
            </Canvas>
        </>
    );
}

export default ARScene;