import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import ModelLoader from './ar-components/ModelLoader';

function Loader() {
    return (
        <div style={{ 
            width: '100%', 
            height: '100%', 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center' 
        }}>
            <p>Loading model...</p>
        </div>
    );
}

const ModelPreview = ({ modelPath, color, material }) => {
    const [error, setError] = useState(null);
    const [modelUrl, setModelUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingProgress, setLoadingProgress] = useState(0);

    useEffect(() => {
        if (!modelPath) {
            setError(new Error("Model path is required"));
            setLoading(false);
            return;
        }

        console.log('ModelPreview: Loading model from path:', modelPath);
        console.log('ModelPreview: Using color:', color);
        console.log('ModelPreview: Using material:', material);

        // Get download URL from Firebase Storage
        const modelRef = ref(storage, modelPath);
        getDownloadURL(modelRef)
            .then((url) => {
                console.log('ModelPreview: Successfully got download URL:', url);
                setModelUrl(url);
                setLoading(false);
            })
            .catch((error) => {
                console.error('ModelPreview: Error getting download URL:', error);
                setError(error);
                setLoading(false);
            });
    }, [modelPath, color, material]);

    if (loading) {
        return (
            <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
                <p>Loading model...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ width: '100%', height: '400px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
                <p style={{ color: 'red', fontWeight: 'bold' }}>Error Loading Model</p>
                <p style={{ color: 'red', maxWidth: '80%', textAlign: 'center', overflowWrap: 'break-word' }}>
                    {error.message || 'Unknown error'}
                </p>
                {modelPath && (
                    <p style={{ fontSize: '0.9em', color: '#666', maxWidth: '80%', textAlign: 'center' }}>
                        Model path: {modelPath}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: '400px', position: 'relative' }}>
            <Canvas shadows camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <directionalLight
                    position={[10, 10, 5]}
                    intensity={1}
                    castShadow
                    shadow-mapSize-width={1024}
                    shadow-mapSize-height={1024}
                />
                
                {modelUrl && (
                    <ModelLoader
                        url={modelUrl}
                        color={color}
                        material={material}
                        onLoad={(data) => {
                            console.log('ModelPreview: Model loaded successfully', data);
                        }}
                        onError={(error) => {
                            console.error('ModelPreview: ModelLoader error:', error);
                            setError(error);
                        }}
                    />
                )}
                <Environment preset="sunset" />
                
                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    minDistance={2}
                    maxDistance={10}
                />
            </Canvas>
        </div>
    );
};

export default ModelPreview;
