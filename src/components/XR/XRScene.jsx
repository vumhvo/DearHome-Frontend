import React, { Suspense, useState, useRef, useEffect } from 'react'
import { XR, useXR, Interactive } from '@react-three/xr'
import { Text, Environment, OrbitControls, useGLTF } from '@react-three/drei'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import * as THREE from 'three'

function Box({ color, size, scale, ...rest }) {
  return (
    <mesh scale={scale} {...rest}>
      <boxGeometry args={size} />
      <meshBasicMaterial color={color} />
      {rest.children}
    </mesh>
  )
}

function Button(props) {
  const [hover, setHover] = useState(false)
  const [color, setColor] = useState('blue')   

  const onSelect = () => {
    setColor((Math.random() * 0xffffff) | 0)
  }

  return (
    <Interactive onHover={() => setHover(true)} onBlur={() => setHover(false)} onSelect={onSelect}>
      <Box color={color} scale={hover ? [0.6, 0.6, 0.6] : [0.5, 0.5, 0.5]} size={[0.4, 0.1, 0.1]} {...props}>
        <Suspense fallback={null}>
          <Text position={[0, 0, 0.06]} fontSize={0.05} color="#000" anchorX="center" anchorY="middle">
            Hello react-xr!
          </Text>
        </Suspense>
      </Box>
    </Interactive>
  )
}

function SceneSetup() {
  const { gl, camera } = useThree();
  
  useEffect(() => {
    if (gl) {
      // Configure the renderer for AR
      gl.setClearColor(new THREE.Color(0, 0, 0, 0));
      gl.outputColorSpace = THREE.SRGBColorSpace;
      
      // Important: Set the pixel ratio to avoid scaling issues
      gl.setPixelRatio(window.devicePixelRatio);
    }
    
    // Set camera properties suitable for AR
    if (camera) {
      camera.near = 0.01;
      camera.far = 1000;
      camera.updateProjectionMatrix();
    }
  }, [gl, camera]);
  
  return null;
}

const ARModel = ({ modelUrl, color = '#ffffff' }) => {
  const { scene } = useGLTF(modelUrl || '/models/fallback_model.glb', true);
  const modelRef = useRef();
  const { isPresenting } = useXR();
  
  const model = React.useMemo(() => {
    if (!scene) return null;
    
    const clonedScene = scene.clone();
    
    clonedScene.traverse((node) => {
      if (node.isMesh && node.material) {
        // Use a basic material to avoid lighting issues in AR
        node.material = new THREE.MeshBasicMaterial({
          color: new THREE.Color(color),
        });
      }
    });
    
    return clonedScene;
  }, [scene, color]);

  // Add animation frame updates for model
  useFrame(() => {
    if (modelRef.current && !isPresenting) {
      modelRef.current.rotation.y += 0.005;
    }
  });

  if (!model) {
    return (
      <mesh position={[0, 0, -0.5]} scale={0.2}>
        <boxGeometry />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }

  return (
    <primitive 
      ref={modelRef}
      object={model} 
      position={isPresenting ? [0, -0.5, -1] : [0, 0, 0]}
      scale={isPresenting ? 0.5 : 0.8}
    />
  );
};

const ARButton = ({ onClick }) => {
  const [supported, setSupported] = useState(false);
  
  useEffect(() => {
    // Check if AR is supported
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar')
        .then(supported => {
          setSupported(supported);
        })
        .catch(error => {
          console.error('Error checking AR support:', error);
          setSupported(false);
        });
    }
  }, []);
  
  if (!supported) {
    return (
      <button 
        style={{
          backgroundColor: '#dddddd',
          color: '#777777',
          padding: '8px 16px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'not-allowed'
        }}
        disabled
      >
        AR Not Supported
      </button>
    );
  }
  
  return (
    <button
      onClick={onClick}
      style={{
        backgroundColor: '#1890ff',
        color: 'white',
        padding: '8px 16px',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span style={{ fontSize: '18px' }}>📱</span>
      View in AR
    </button>
  );
};

function XRScene({ modelUrl, color = '#ffffff' }) {
  const [isARSupported, setIsARSupported] = useState(false);
  const [isCheckingAR, setIsCheckingAR] = useState(true);
  const canvasRef = useRef();
  const [xrSession, setXRSession] = useState(null);
  
  // Check AR support on component mount
  useEffect(() => {
    if ('xr' in navigator) {
      navigator.xr.isSessionSupported('immersive-ar')
        .then(supported => {
          setIsARSupported(supported);
          setIsCheckingAR(false);
        })
        .catch(error => {
          console.error('Error checking AR support:', error);
          setIsARSupported(false);
          setIsCheckingAR(false);
        });
    } else {
      setIsARSupported(false);
      setIsCheckingAR(false);
    }
  }, []);
  
  // Custom handler for entering AR manually
  const enterAR = async () => {
    if (!isARSupported) return;
    
    try {
      // We'll let the XR component handle session creation
      const sessionOptions = {
        optionalFeatures: ['dom-overlay', 'hit-test'],
        domOverlay: { root: document.body }
      };
      
      // The ARButton will handle this through the XR component
      console.log('Attempting to enter AR with options:', sessionOptions);
    } catch (error) {
      console.error('Failed to enter AR:', error);
    }
  };

  return (
    <div style={{ width: '100%', height: '400px', position: 'relative' }}>
      {/* Position the AR button at the bottom center */}
      <div style={{ 
        position: 'absolute', 
        bottom: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)',
        zIndex: 10
      }}>
        {isCheckingAR ? (
          <button 
            style={{
              backgroundColor: '#f0f0f0',
              color: '#666666',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'wait'
            }}
            disabled
          >
            Checking AR Support...
          </button>
        ) : (
          <ARButton onClick={enterAR} />
        )}
      </div>
      
      {/* The Canvas that will render our 3D scene */}
      <Canvas
        ref={canvasRef}
        gl={{ 
          powerPreference: "high-performance",
          antialias: true,
          stencil: false,
          depth: true,
          alpha: true,
          preserveDrawingBuffer: true // Important for AR
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          background: 'transparent' 
        }}
        onCreated={({ gl, scene, camera }) => {
          // Additional setup for the WebGL renderer
          gl.setPixelRatio(window.devicePixelRatio);
          gl.setClearColor(0x000000, 0);
          
          // Log to verify the context was created
          console.log('Canvas created with WebGL context:', gl);
        }}
      >
        {/* Wrap 3D content in Suspense for async loading */}
        <Suspense fallback={null}>
          {/* Make sure XR has a proper referenceSpace */}
          <XR referenceSpace="local">
            <SceneSetup />
            <ambientLight intensity={0.8} />
            <pointLight position={[5, 5, 5]} intensity={1} />
            <Button position={[0, 0.1, -0.2]} />
            {modelUrl && <ARModel modelUrl={modelUrl} color={color} />}
            <OrbitControls enableZoom={true} enablePan={true} />
          </XR>
        </Suspense>
      </Canvas>
      
      {/* Enhanced message if AR is not supported */}
      {!isARSupported && !isCheckingAR && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          maxWidth: '80%',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 20
        }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>📱</div>
          <h3 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>AR Not Available</h3>
          <p style={{ margin: '0 0 15px 0', fontSize: '14px' }}>
            Your device doesn't support WebXR Augmented Reality.
          </p>
          <p style={{ margin: '0', fontSize: '13px', opacity: 0.8 }}>
            Try using a modern Android device with Chrome or an iOS device with the latest Safari.
          </p>
          <button 
            onClick={() => document.getElementById('fallback-viewer-container').scrollIntoView({ behavior: 'smooth' })}
            style={{
              marginTop: '15px',
              backgroundColor: '#1890ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 15px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            View 3D Model Instead
          </button>
        </div>
      )}
    </div>
  );
}



export default XRScene;
