import React, { useEffect } from 'react';
import axios from 'axios';

/**
 * Component to display a 3D model from Firebase Storage
 * Uses a direct approach to bypass CORS issues
 */
const DirectModelViewer = ({ modelUrl }) => {
  useEffect(() => {
    if (!modelUrl) return;

    const loadModel = async () => {
      try {
        console.log('DirectModelViewer: Loading model from', modelUrl);
        
        // Set up a direct request with the right headers
        const response = await axios.get(modelUrl, {
          responseType: 'arraybuffer',
          headers: {
            'Origin': window.location.origin,
            'Access-Control-Request-Method': 'GET',
            'Access-Control-Request-Headers': 'origin, content-type, accept',
            'Cache-Control': 'no-cache',
            'Accept': '*/*'
          },
          timeout: 30000
        });
        
        // Convert to blob and create a local URL
        const blob = new Blob([response.data], { type: 'model/gltf-binary' });
        const blobUrl = URL.createObjectURL(blob);
        
        console.log('DirectModelViewer: Created blob URL', blobUrl);
        
        // Now we can either:
        // 1. Update some state to render the model
        // 2. Pass the blob URL to a callback
        // 3. Emit an event with the blob URL
        
        // Clean up the blob URL when done
        return () => {
          URL.revokeObjectURL(blobUrl);
        };
      } catch (error) {
        console.error('DirectModelViewer: Failed to load model', error);
      }
    };
    
    loadModel();
  }, [modelUrl]);
  
  return (
    <div>
      {/* Placeholder for the model viewer */}
      <p>Loading model...</p>
    </div>
  );
};

export default DirectModelViewer;
