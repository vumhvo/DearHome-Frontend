import React, { useState, useRef} from 'react';
import {XRHandModel, XRHitTest, useXRHandState } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import { XR, ARButton } from '@react-three/xr';
import * as THREE from 'three';
import AnchoredBox from './AnchoredBox'; // Giả sử bạn đã tạo một component
import { createXRStore } from '@react-three/xr';
import CenterHitTestPoint from './CenterHitTestPoint';


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

    return (
        <>
            <button onClick={() => store.enterAR()}>Enter AR</button>
            <Canvas>
                <XR store={store}>
                    <ambientLight />
                    <CenterHitTestPoint />
                    {/* <Reticle onSelect={(matrix) => store.addAnchor(matrix)} />
          <HitTestWithAnchors />
          {store.anchors.map((anchor, index) => (
            <AnchoredBox key={index} position={anchor.position} rotation={anchor.rotation} />
          ))} */}
                </XR>
            </Canvas>
        </>
    );
}

export default ARScene;