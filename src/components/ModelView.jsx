import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';
import ModelLoader from './ar-components/ModelLoader';

const ModelView = ({ modelPath, material, color }) => {
    const [error, setError] = useState(null);
    const [modelUrl, setModelUrl] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        console.log('ModelView useEffect - modelPath:', modelPath, 'color:', color);
        if (!modelPath) {
            setError(new Error("Model path is required"));
            setLoading(false);
            return;
        }

        // Get download URL from Firebase Storage
        const modelRef = ref(storage, modelPath);
        getDownloadURL(modelRef)
            .then((url) => {
                setModelUrl(url);
                setLoading(false);
            })
            .catch((error) => {
                console.error('Error getting download URL:', error);
                setError(error);
                setLoading(false);
            });
    }, [modelPath]);

    console.log(modelUrl)

    if (loading) {
        return (
            <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
                <p>Loading model...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f8f9fa' }}>
                <p style={{ color: 'red' }}>Error: {error.message}</p>
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
                        material={material}
                        color={color}
                        onError={(error) => {
                            console.error('ModelLoader error:', error);
                            setError(error);
                        }}
                        key={`model-${color}-${JSON.stringify(material)}`} // Force re-render when color/material changes
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

export default ModelView;
