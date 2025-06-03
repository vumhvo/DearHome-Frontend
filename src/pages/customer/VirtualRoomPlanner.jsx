import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Typography, Card, Row, Col, Button, Layout, Grid } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import ThreeDScene from '../../components/ThreeDScene';
import Controls from '../../components/Controls';
import Room from '../../components/virtual-room/Room';
import ModelLoader from '../../components/virtual-room/ModelLoader';
import { ref, getDownloadURL } from 'firebase/storage';
import { storage } from '../../firebase/config';
import DesignTools from '../../components/virtual-room/DesignTool';
import { productApiRequest, virtualRoomApiRequest } from '../../api/ApiRequests';

const { Title } = Typography;
const { useBreakpoint } = Grid;

// Predefined materials
const wallMaterials = {
  white: { label: "White", value: "#e0e0e0" },
  beige: { label: "Beige", value: "#f5f5dc" },
  lightBlue: { label: "Light Blue", value: "#87ceeb" },
  lightGreen: { label: "Light Green", value: "#98fb98" },
  gray: { label: "Gray", value: "#a9a9a9" },
  peach: { label: "Peach", value: "#ffcc99" }
};

const floorMaterials = {
  darkWood: { label: "Dark Wood", value: "#8B4513" },
  lightWood: { label: "Light Wood", value: "#D2B48C" },
  stone: { label: "Stone", value: "#A9A9A9" },
  carpet: { label: "Carpet", value: "#F5F5F5" },
  marble: { label: "Marble", value: "#F0EAD6" },
  tile: { label: "Tile", value: "#ADD8E6" }
};

const initialWallConfig = {
  frontWall: {
    hasDoor: true,
    doorPosition: 0,
    doorWidth: 1,
    doorHeight: 2.1,
    windows: [
      { position: 0.7, verticalPosition: 0.2, width: 1, height: 1 }
    ]
  },
  leftWall: {
    windows: [

    ]
  },
  rightWall: {
    windows: [
    ]
  },
  backWall: {
    windows: []
  }
};

const initialRoomDimensions = {
  width: 8,
  length: 8,
  height: 3
};


// Fetch download URL from Firebase Storage
const getModelDownloadURL = async (modelPath) => {
  if (!modelPath) return null;
  try {
    const storageRef = ref(storage, modelPath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting model download URL:', error);
    return null;
  }
};

const convertWallCoordinates = (wallType, position, roomDimensions) => {
  const { width, length, height } = roomDimensions;
  let convertedPosition = { ...position };
  switch (wallType) {
    case 'frontWall':
      convertedPosition.x = position.x; // No change for front wall
      convertedPosition.y = position.y; // No change for front wall
      convertedPosition.z = length / 2 + position.z; // Adjust Z for front wall
      break;
    case 'backWall':
      convertedPosition.x = position.x; // No change for back wall
      convertedPosition.y = position.y; // No change for back wall
      convertedPosition.z = -length / 2 + position.z; // Adjust Z for back wall
      break;
    case 'leftWall':
      convertedPosition.x = -width / 2 + position.x; // Adjust X for left wall
      convertedPosition.y = position.y; // No change for left wall
      convertedPosition.z = position.z; // No change for left wall
      break;
    case 'rightWall':
      convertedPosition.x = width / 2 + position.x; // Adjust X for right wall
      convertedPosition.y = position.y; // No change for right wall
      convertedPosition.z = position.z; // No change for right wall
      break;
    default:
      break;
  }
  return convertedPosition;
};

const VirtualRoomPlanner = () => {
  // UI State
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // Room Configuration State
  const [roomMaterials, setRoomMaterials] = useState({
    wallMaterial: wallMaterials.white.value,
    floorMaterial: floorMaterials.darkWood.value
  });
  const [roomDimensions, setRoomDimensions] = useState(initialRoomDimensions);
  const [wallConfig, setWallConfig] = useState(initialWallConfig);
  const [preferredLayoutDescription, setPreferredLayoutDescription] = useState('');

  // Product and Model State
  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [models, setModels] = useState([]);

  // History State for Undo/Redo
  const [modelHistory, setModelHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1); 

  const fetchProducts = useCallback(async () => {
    setProductLoading(true);
    try {
      const response = await productApiRequest.getAllWithVariants();

      setProducts(response.data.$values || []);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setProductLoading(false);
    }
  }, []);

  // Add model to history stack
  const addToHistory = useCallback((newModels) => {
    const newHistory = modelHistory.slice(0, historyIndex + 1);
    newHistory.push(newModels);
    setModelHistory(newHistory);
    setHistoryIndex(historyIndex + 1);
  }, [modelHistory, historyIndex])
  // Handle wall material change
  
  const handleWallMaterialChange = useCallback((value) => {
    setRoomMaterials({
      ...roomMaterials,
      wallMaterial: value
    });
  }, [roomMaterials]);

  // Handle floor material change
  const handleFloorMaterialChange = useCallback((value) => {
    setRoomMaterials({
      ...roomMaterials,
      floorMaterial: value
    });
  }, [roomMaterials]);

  // Handle room dimension changes
  const handleRoomDimensionChange = useCallback((dimension, value) => {
    setRoomDimensions(prev => ({
      ...prev,
      [dimension]: value
    }));
  }, []);

  // Undo the last change
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setModels(modelHistory[historyIndex - 1]);
    }
  }, [historyIndex, modelHistory]);

  // Redo the last undone change
  const handleRedo = useCallback(() => {
    if (historyIndex < modelHistory.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setModels(modelHistory[historyIndex + 1]);
    }
  }, [historyIndex, modelHistory]);

  // Handle door position change
  const handleDoorChange = useCallback((wall, updates) => {
    setWallConfig(prev => ({
      ...prev,
      [wall]: {
        ...prev[wall],
        ...updates
      }
    }));
  }, []);

  // Handle window changes
  const handleWindowChange = useCallback((wall, windowIndex, updates) => {
    setWallConfig(prev => ({
      ...prev,
      [wall]: {
        ...prev[wall],
        windows: prev[wall].windows.map((window, i) =>
          i === windowIndex ? { ...window, ...updates } : window
        )
      }
    }));
  }, []);

  // Add window to wall
  const handleAddWindow = useCallback((wall) => {
    setWallConfig(prev => ({
      ...prev,
      [wall]: {
        ...prev[wall],
        windows: [
          ...prev[wall].windows,
          { position: 0, verticalPosition: 0.2, width: 1, height: 1 }
        ]
      }
    }));
  }, []);

  // Remove window from wall
  const handleRemoveWindow = useCallback((wall, windowIndex) => {
    setWallConfig(prev => ({
      ...prev,
      [wall]: {
        ...prev[wall],
        windows: prev[wall].windows.filter((_, i) => i !== windowIndex)
      }
    }));
  }, []);

  const handleAddProduct = useCallback((productId, variantIds) => {
    if (!products || products.length === 0) return;

    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Get selected variants or use defaults
    let selectedVariantObjects = variantIds
      .map(variantId => product.variants.$values.find(v => v.id === variantId))
      .filter(v => v !== undefined);

    // Use first variant as default if no variants are selected and variants exist
    if (selectedVariantObjects.length === 0 && product.variants.$values.length > 0) {
      selectedVariantObjects = [product.variants.$values[0]];
    }

    // Check for existing product
    const existingProductIndex = selectedProducts.findIndex(p => p.id === productId);
    let updatedProducts;

    if (existingProductIndex !== -1) {
      // Update existing product's variants
      updatedProducts = [...selectedProducts];
      updatedProducts[existingProductIndex] = {
        ...updatedProducts[existingProductIndex],
        selectedVariants: selectedVariantObjects
      };
    } else {
      // Add new product with variants
      const newProduct = {
        ...product,
        selectedVariants: selectedVariantObjects,
        isLocalFile: false,
        position: { x: 0, y: 0, z: 0 }, // Default position
        rotation: { x: 0, y: 0, z: 0 }  // Default rotation
      };
      updatedProducts = [...selectedProducts, newProduct];

      // Add to models for 3D rendering
      setModels(prev => [...prev, newProduct]);
    }

    // Update selectedProducts state
    setSelectedProducts(updatedProducts);

    // Update models state to match
    setModels(prev => {
      const modelIndex = prev.findIndex(m => m.id === productId);
      if (modelIndex !== -1) {
        const newModels = [...prev];
        const updatedProduct = updatedProducts.find(p => p.id === productId);
        if (updatedProduct) {
          newModels[modelIndex] = updatedProduct;
        }
        return newModels;
      }
      return prev;
    });

    // Add to history for undo/redo
    addToHistory(updatedProducts);
  }, [products, selectedProducts, addToHistory]);

  const handleVariantChange = useCallback((productId, variantIds) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    // Convert variant IDs to variant objects and ensure they exist
    const variantObjects = variantIds.map(variantId =>
      product.variants.$values.find(v => v.id === variantId)
    ).filter(v => v !== undefined);

    // Handle updates in selectedProducts
    const existingProductIndex = selectedProducts.findIndex(p => p.id === productId);
    let updatedProducts;

    if (existingProductIndex !== -1) {
      // Update existing product
      updatedProducts = selectedProducts.map(p => {
        if (p.id === productId) {
          return {
            ...p,
            selectedVariants: variantObjects
          };
        }
        return p;
      });
    } else {
      // Add new product with selected variants
      updatedProducts = [...selectedProducts, {
        ...product,
        selectedVariants: variantObjects,
        isLocalFile: false
      }];
    }

    setSelectedProducts(updatedProducts);

    // Update models if the product exists there
    setModels(prev => {
      const modelIndex = prev.findIndex(m => m.id === productId);
      if (modelIndex !== -1) {
        const newModels = [...prev];
        const updatedProduct = updatedProducts.find(p => p.id === productId);
        if (updatedProduct) {
          newModels[modelIndex] = updatedProduct;
        }
        return newModels;
      }
      return prev;
    });
  }, [products, selectedProducts]);

  const getModelDownloadURL = async (modelPath) => {
  if (!modelPath) {
    console.warn('No model path provided');
    return null;
  }

  try {
    // Clean up the model path - remove any leading slashes or spaces
   
    const storageRef = ref(storage, modelPath);
    const url = await getDownloadURL(storageRef);
    
    // Validate the URL
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL returned from Firebase');
    }
    
    return url;
  } catch (error) {
    console.error(`Error getting model download URL for ${modelPath}:`, error);
    return null;
  }
};

  // Handle placing furnitures in the room
  const handlePlaceFurnitures = async (response) => {
    if (!response || !response.data) {
      console.error('Invalid response data:', response);
      setError('Invalid response data from API');
      setGenerating(false);
      return;
    }

    const { furniture_placement } = response.data.layout || {};
    if (!Array.isArray(furniture_placement)) {
      console.error('Invalid furniture placement data:', furniture_placement);
      setError('Invalid furniture placement data from API');
      setGenerating(false);
      return;
    }

    try {
      const newModels = await Promise.all(
        furniture_placement
          .filter(item => item.modelUrl)
          .map(async (item) => {
            try {
              const modelUrl = item.modelUrl;
              if (!modelUrl) {
                console.warn('No model URL found for item:', item);
                return null;
              }

              const resolvedUrl = await getModelDownloadURL(modelUrl);
              if (!resolvedUrl) {
                console.warn('Could not resolve model URL for item:', item);
                return null;
              }

              return {
                id: item.furniture_id,
                name: item.name,
                modelUrl: resolvedUrl,
                category: item.category,
                dimensions: item.dimensions,
                color: item.color,
                position: {
                  x: item.position.x,
                  y: item.position.y,
                  z: item.position.z
                },
                rotation: {
                  x: 0,
                  y: item.rotation.y || 0,
                  z: 0
                },
                explanation: item.explanation || '',
                styleDescription: response.data.style_description || '',
                additionalRecommendations: response.data.additional_recommendations || []
              };
            } catch (error) {
              console.error('Error processing furniture item:', error);
              return null;
            }
          })
      );

      const validModels = newModels.filter(model => model !== null);
      if (validModels.length === 0) {
        throw new Error('No valid models could be loaded');
      }

      setModels(prev => [...prev, ...validModels]);
      console.log('Furniture placed successfully:', validModels);
      setGenerating(false);
      setError(null);
    } catch (error) {
      console.error('Error placing furniture:', error);
      setError('Failed to place furniture. Please try again.');
      setGenerating(false);
    }
  };

  // Handle submit
  const handleSubmit = useCallback(async () => {
    setGenerating(true);
    setError(null);

    try {   
      // Convert wall config to windows and doors array
      const windows = [];
      const doors = [];
      
      Object.entries(wallConfig).forEach(([wallType, config]) => {
        // Add windows
        config.windows.forEach(window => {
          const position = convertWallCoordinates(wallType, {
            x: window.position * (roomDimensions.width / 2),
            y: window.verticalPosition * roomDimensions.height,
            z: 0
          }, roomDimensions);

          windows.push({
            position,
            width: window.width,
            height: window.height
          });
        });

        // Add door
        if (config.hasDoor) {
          const position = convertWallCoordinates(wallType, {
            x: config.doorPosition * (roomDimensions.width / 2),
            y: 0,
            z: 0
          }, roomDimensions);

          doors.push({
            position,
            width: config.doorWidth,
            height: config.doorHeight
          });
        }
      });

      const response = await virtualRoomApiRequest.generateVirtualLayout({
        room: {
          room_type: "living_room", // You might want to make this configurable
          width: roomDimensions.width,
          length: roomDimensions.length,
          height: roomDimensions.height,
          wall_color: roomMaterials.wallMaterial,
          floor_type: roomMaterials.floorMaterial,
          windows,
          doors
        },
        furniture: selectedProducts.flatMap(product => 
          product.selectedVariants.map(variant => ({
            id: variant.id
          }))
        ),
        prompt: preferredLayoutDescription,
        options: {
          number_of_designs: 1, // You might want to make this configurable
          style_preference: "modern", // You might want to make this configurable
          priority: "functionality"
        }
      });

      console.log('API response:', response);

      await handlePlaceFurnitures(response);

    } catch (error) {
      console.error('Error submitting room plan:', error);
      setError('Failed to generate room plan. Please try again.');
      setGenerating(false);
    }
  }, [roomDimensions, wallConfig, selectedProducts]);

  useEffect(() => {
    // Fetch products on component mount
    fetchProducts();
  }, [fetchProducts]);

  return (
    <>
      <Layout>
        <Layout.Sider
          width={isMobile ? '100%' : 340}
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          style={{
            background: '#fff',
            overflow: 'auto',
            height: isMobile ? 'auto' : '100vh',
            position: isMobile ? 'relative' : 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000
          }}
          breakpoint="md"
          collapsedWidth={isMobile ? 0 : 80}
        >
          <div style={{
            padding: isMobile ? '12px' : '16px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <Title level={2} style={{
              marginBottom: isMobile ? '16px' : '24px',
              fontSize: isMobile ? '20px' : '24px'
            }}>
              Design Tools
            </Title>
            <div style={{ flex: 1, overflow: 'auto' }}>
              <DesignTools
                handleUndo={handleUndo}
                handleRedo={handleRedo}
                handleWallMaterialChange={handleWallMaterialChange}
                handleFloorMaterialChange={handleFloorMaterialChange}
                handleDoorChange={handleDoorChange}
                handleWindowChange={handleWindowChange}
                handleAddWindow={handleAddWindow}
                handleRemoveWindow={handleRemoveWindow}
                handleRoomDimensionChange={handleRoomDimensionChange}
                historyIndex={historyIndex}
                modelHistory={modelHistory}
                roomMaterials={roomMaterials}
                wallMaterials={wallMaterials}
                floorMaterials={floorMaterials}
                wallConfig={wallConfig}
                roomDimensions={roomDimensions}
                products={productLoading ? [] : products}
                selectedProducts={selectedProducts}
                handleAddProduct={handleAddProduct}
                handleVariantChange={handleVariantChange}
                handleSubmit={handleSubmit}
                generating={generating}
                preferredLayoutDescription={preferredLayoutDescription}
                handlePreferredLayoutChange={(value) => setPreferredLayoutDescription(value)}
              />
            </div>
          </div>
        </Layout.Sider>

        <Layout.Content
          style={{
            marginLeft: isMobile ? 0 : (collapsed ? '80px' : '300px'),
            padding: isMobile ? '12px' : '24px',
            minHeight: '100vh',
            transition: 'margin-left 0.2s'
          }}
        >
          {!isMobile && (
            <Button
              type="primary"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                position: 'fixed',
                left: collapsed ? '80px' : '300px',
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 100,
                transition: 'left 0.2s'
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
          )}

          {isMobile && (
            <Button
              type="primary"
              onClick={() => setCollapsed(!collapsed)}
              style={{
                position: 'fixed',
                right: '16px',
                bottom: '16px',
                zIndex: 1000,
                width: '48px',
                height: '48px',
                borderRadius: '50%'
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </Button>
          )}

          <Title level={2} style={{
            fontSize: isMobile ? '20px' : '24px',
            marginBottom: isMobile ? '16px' : '24px'
          }}>
            Interior Design Visualization
          </Title>

          <div style={{
            width: '100%',
            height: isMobile ? 'calc(100vh - 120px)' : 'calc(100vh - 100px)',
            position: 'relative'
          }}>
            <ThreeDScene>
              <Room
                material={roomMaterials}
                roomDimensions={roomDimensions}
                frontWall={wallConfig.frontWall}
                leftWall={wallConfig.leftWall}
                rightWall={wallConfig.rightWall}
                backWall={wallConfig.backWall}
              />     
              {models.map((model, index) => (
                  <ModelLoader
                    url={model.modelUrl} 
                    material={model.material}
                    onLoad={() => {
                      if (index === models.length - 1) {
                        setLoading(false);
                      }
                    }}
                    position= {[model.position.x, model.position.y + 0.2, model.position.z]}
                    rotation={[0, model.rotation.y || 0, 0]}
                    onError={(error) => {
                      console.error('Error loading model:', error);
                      setError(error);
                    }}
                  />
              ))}
              {/* <Controls /> */}
            </ThreeDScene>
          </div>
        </Layout.Content>
      </Layout>
    </>
  );
};

export default VirtualRoomPlanner;
