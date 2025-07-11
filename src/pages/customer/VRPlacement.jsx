import ARScene from '../../components/ar-components/ARScene';
import { useLocation } from 'react-router-dom';

const VRPlacement = () => {
  const location = useLocation();
  const { modelUrl, productName, variantId } = location.state || {};
  
  return (
    <>
      <ARScene 
        modelUrl={modelUrl || 'Shapes/20250621_160331_shape.glb'} // Default model if none provided
        productName={productName || 'Default Product'}
        variantId={variantId || 'default-variant'}
        enterAR={true}
      />
    </>
  )
};

export default VRPlacement;