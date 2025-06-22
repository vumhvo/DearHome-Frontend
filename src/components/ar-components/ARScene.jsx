import React, { useState, useRef, useEffect } from 'react';
import { XRHandModel, XRHitTest, useXRHandState, useXREvent } from '@react-three/xr';
import { Canvas } from '@react-three/fiber';
import { XR, ARButton } from '@react-three/xr';
import * as THREE from 'three';
import { CameraOutlined, EnvironmentOutlined, AimOutlined, SelectOutlined } from '@ant-design/icons';
import CenterHitTestPoint from './CenterHitTestPoint';
import ModelLoader from '../virtual-room/ModelLoader';
import { storage } from '../../firebase/config';
import { ref, getDownloadURL } from 'firebase/storage';
import { createXRStore } from '@react-three/xr';
import { Button } from 'antd';

// const matrixHelper = new THREE.Matrix4();
// const hitTestPosition = new THREE.Vector3();

const store = createXRStore();

const TutorialOverlay = ({ show, children }) => (
    <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: show ? 'flex' : 'none',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: '20px',
        zIndex: 1000,
    }}>
        <div style={{
            width: '100%',
            maxWidth: '500px',
            margin: '0 auto',
            '@media (maxWidth: 768px)': {
                padding: '15px',
                maxWidth: '100%'
            },
            '@media (maxWidth: 480px)': {
                padding: '10px'
            }
        }}>
            {children}
        </div>
    </div>
);

const TutorialStep = ({ icon, text }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        padding: 'clamp(8px, 2vw, 12px)',
        borderRadius: '8px',
        fontSize: 'clamp(14px, 3vw, 16px)',
    }}>
        <div style={{
            marginRight: 'clamp(8px, 2vw, 12px)',
            width: 'clamp(28px, 6vw, 32px)',
            height: 'clamp(28px, 6vw, 32px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '50%'
        }}>
            {React.cloneElement(icon, {
                style: {
                    ...icon.props.style,
                    fontSize: 'clamp(16px, 4vw, 20px)'
                }
            })}
        </div>
        <span style={{
            flex: 1,
            color: '#fff',
            lineHeight: '1.4'
        }}>{text}</span>
    </div>
);

function ARScene({ modelUrl, productName, variantId }) {
    const [modelPosition, setModelPosition] = useState(null);
    const lastHitPosition = useRef(null);
    const [modelPath, setModelPath] = useState(modelUrl || 'Shapes/20250621_084921_DEMO.glb');
    const [modelStorageUrl, setModelStorageUrl] = useState(null);
    const [showTutorial, setShowTutorial] = useState(true);
    const [currentStep, setCurrentStep] = useState(0);

    const meshRef = useRef();
    const [isDragging, setIsDragging] = useState(false);
    const dragStartPoint = useRef(new THREE.Vector3());
    const dragStartPosition = useRef(new THREE.Vector3());

    // Thêm state và ref cho xử lý xoay
    const [isRotating, setIsRotating] = useState(false);
    const [modelRotationY, setModelRotationY] = useState(0);
    const [initialRotation, setInitialRotation] = useState(0);
    const [currentRotation, setCurrentRotation] = useState(0);

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

     const calculateAngle = (touch1, touch2) => {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.atan2(dy, dx);
    };

    // Xử lý sự kiện touchstart
    const handleTouchStart = (event) => {
        if (event.touches.length === 2 && meshRef.current) {
            event.preventDefault();
            setIsDragging(false); // Dừng kéo thả nếu đang kéo
            setIsRotating(true);
            
            const angle = calculateAngle(event.touches[0], event.touches[1]);
            setInitialRotation(angle);
            setCurrentRotation(angle);
        }
    };

    // Xử lý sự kiện touchmove
    const handleTouchMove = (event) => {
        if (isRotating && event.touches.length === 2 && meshRef.current) {
            event.preventDefault(); // Ngăn chặn hành vi mặc định như zoom
            
            const angle = calculateAngle(event.touches[0], event.touches[1]);
            const angleDifference = angle - currentRotation;
            
            // Áp dụng xoay vào model
            if (meshRef.current) {
                meshRef.current.rotation.y += angleDifference;
            }
            
            setCurrentRotation(angle);
        }
    };

    // Xử lý sự kiện touchend
    const handleTouchEnd = (event) => {
        if (event.touches.length < 2) {
            setIsRotating(false);
        }
    };

    // Xử lý sự kiện touchcancel
    const handleTouchCancel = () => {
        setIsRotating(false);
    };

    useEffect(() => {
        if (modelPosition) {
            // Chỉ thêm event listener khi model đã được đặt
            document.addEventListener('touchstart', handleTouchStart, { passive: false });
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('touchend', handleTouchEnd);
            document.addEventListener('touchcancel', handleTouchCancel);
            
            return () => {
                document.removeEventListener('touchstart', handleTouchStart);
                document.removeEventListener('touchmove', handleTouchMove);
                document.removeEventListener('touchend', handleTouchEnd);
                document.removeEventListener('touchcancel', handleTouchCancel);
            };
        }
    }, [modelPosition, isRotating]);

    useEffect(() => {
        if (meshRef.current) {
            meshRef.current.rotation.y = modelRotationY;
        }
    }, [modelRotationY]);

    useEffect(() => {
        if (!modelPath) {
            setError(new Error("Model path is required"));
            return;
        }

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

    useEffect(() => {
        if (modelPosition) {
            // When model is placed, advance to next tutorial step
            setCurrentStep(prev => Math.min(prev + 1, 3));
        }
    }, [modelPosition]);

    const handleStartAR = () => {
        store.enterAR();
        setShowTutorial(false);
    };

    return (
        <>
            {showTutorial ? (
                <TutorialOverlay show={showTutorial}>
                    <h2 style={{
                        color: 'white',
                        marginTop: 0,
                        marginBottom: 'clamp(16px, 4vw, 24px)',
                        textAlign: 'center',
                        fontSize: 'clamp(20px, 5vw, 24px)',
                        fontWeight: 500
                    }}>
                        Experience {productName || 'the product'} in AR
                    </h2>
                    <TutorialStep
                        icon={<CameraOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Allow camera access when prompted"
                    />
                    <TutorialStep
                        icon={<EnvironmentOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Point your device at a flat surface"
                    />
                    <TutorialStep
                        icon={<AimOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Wait for the surface to be detected (indicated by a dot)"
                    />
                    <TutorialStep
                        icon={<SelectOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Tap to place the model where you want it"
                    />
                    <TutorialStep
                        icon={<CameraOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Use two fingers to rotate the model"
                    />
                    <TutorialStep
                        icon={<AimOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Drag to move the model around"
                    />
                    <TutorialStep
                        icon={<AimOutlined style={{ fontSize: '20px', color: '#fff' }} />}
                        text="Tap again to place the model in the scene"
                    />

                    <Button
                        onClick={handleStartAR}
                        style={{
                            width: '100%',
                            padding: '16px',
                        }}
                    >
                        <CameraOutlined /> Start AR Experience
                    </Button>
                </TutorialOverlay>
            ) : (
                <div style={{
                    position: 'absolute',
                    top: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    color: 'white',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    zIndex: 1000,
                    minWidth: '200px',
                    textAlign: 'center',
                    transition: 'opacity 0.3s ease',
                    opacity: modelPosition ? 0 : 1,
                }}>
                    {!modelPosition && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <AimOutlined style={{ fontSize: '18px' }} />
                            <span>Tap to place the {productName || 'model'}</span>
                        </div>
                    )}
                </div>
            )}

            <Canvas>
                <XR store={store}>
                    <ambientLight />
                    <CenterHitTestPoint onHitTestResult={handleGetHitTestResult} onClick={handleHitTestPointClick} />
                    {modelPosition && modelStorageUrl && (
                        <mesh
                            ref={meshRef}
                            rotation={[0, modelRotationY, 0]}
                            onPointerDown={(e) => {
                                if (!isRotating) {
                                    e.stopPropagation();
                                    setIsDragging(true);
                                    // Lưu vị trí bắt đầu kéo
                                    dragStartPoint.current.copy(e.point);
                                    dragStartPosition.current.copy(meshRef.current.position);
                                    // Bắt giữ con trỏ để nhận các sự kiện tiếp theo
                                    e.target.setPointerCapture(e.pointerId);
                                }
                            }}
                            onPointerMove={(e) => {
                                if (isDragging && !isRotating) {
                                    // Tính toán vị trí mới dựa trên sự chênh lệch
                                    const dx = e.point.x - dragStartPoint.current.x;
                                    const dy = e.point.y - dragStartPoint.current.y;

                                    meshRef.current.position.x = dragStartPosition.current.x + dx;
                                    meshRef.current.position.y = dragStartPosition.current.y + dy;
                                }
                            }}
                            onPointerUp={(e) => {
                                setIsDragging(false);
                                // Giải phóng con trỏ
                                e.target.releasePointerCapture(e.pointerId);
                            }}
                        >
                            <ModelLoader
                                url={modelStorageUrl}
                                position={modelPosition}

                                onError={(error) => {
                                    console.error('ModelLoader error:', error);
                                    setError(error);
                                }}
                                key={`model`}
                            />
                        </mesh>
                    )}
                </XR>
            </Canvas>
        </>
    );
}

export default ARScene;
