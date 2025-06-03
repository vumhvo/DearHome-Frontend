import React from 'react';
import { Card, Tabs, Select, InputNumber, Button, Space, Collapse, Switch, Grid, Image, Divider } from 'antd';
import { PlusOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';

const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Option } = Select;
const { useBreakpoint } = Grid;

const DesignTools = ({
  handleUndo,
  handleRedo,
  handleDeleteModel,
  handleWallMaterialChange,
  handleFloorMaterialChange,
  handleDoorChange,
  handleWindowChange,
  handleAddWindow,
  handleRemoveWindow,
  handleRoomDimensionChange,
  historyIndex,
  modelHistory,
  selectedModelIndex,
  roomMaterials,
  wallMaterials,
  floorMaterials,
  wallConfig,
  roomDimensions,
  products = [],
  selectedProducts = [],
  handleAddProduct,
  handleVariantChange,
  preferredLayoutDescription,
  handlePreferredLayoutChange,
  handleSubmit
}) => {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const getCardStyle = () => ({
    marginBottom: '24px',
    width: isMobile ? '100%' : '300px',
    ...(isMobile ? {
      borderRadius: 0,
      border: 'none',
      boxShadow: 'none',
    } : {
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    })
  });

  const renderWallControls = (wallName, config) => (
    <Panel 
      header={`${wallName} Wall`} 
      key={wallName}
      style={{ width: '100%' }}
    >
      <Space 
        direction="vertical" 
        style={{ width: '100%' }}
        size={isMobile ? 'middle' : 'small'}
      >
        {/* Door Controls */}
        <div style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          alignItems: isMobile ? 'flex-start' : 'center',
          gap: isMobile ? '8px' : '16px'
        }}>
          <Switch
            checked={config.hasDoor}
            onChange={(checked) => handleDoorChange(wallName.toLowerCase() + 'Wall', { hasDoor: checked })}
          />
          <span>Has Door</span>
        </div>
        
        {config.hasDoor && (
          <div style={{ 
            marginLeft: isMobile ? '0' : '20px',
            display: 'grid',
            gap: '12px',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(200px, 1fr))'
          }}>
            <div>
              <span>Door Position:</span>
              <InputNumber
                min={-1}
                max={1}
                step={0.1}
                value={config.doorPosition}
                onChange={(value) => handleDoorChange(wallName.toLowerCase() + 'Wall', { doorPosition: value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <span>Door Width:</span>
              <InputNumber
                min={0.5}
                max={2}
                step={0.1}
                value={config.doorWidth}
                onChange={(value) => handleDoorChange(wallName.toLowerCase() + 'Wall', { doorWidth: value })}
                style={{ width: '100%' }}
              />
            </div>
            <div>
              <span>Door Height:</span>
              <InputNumber
                min={1.8}
                max={2.4}
                step={0.1}
                value={config.doorHeight}
                onChange={(value) => handleDoorChange(wallName.toLowerCase() + 'Wall', { doorHeight: value })}
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}

        {/* Windows Controls */}
        <div style={{ width: '100%' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            marginBottom: '10px',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span style={{ fontSize: isMobile ? '16px' : '14px' }}>Windows</span>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleAddWindow(wallName.toLowerCase() + 'Wall')}
              size={isMobile ? 'large' : 'middle'}
            >
              Add Window
            </Button>
          </div>

          <div style={{ 
            display: 'grid',
            gap: '16px',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(250px, 1fr))'
          }}>
            {config.windows.map((window, index) => (
              <div 
                key={index} 
                style={{ 
                  border: '1px solid #f0f0f0',
                  padding: isMobile ? '16px' : '12px',
                  borderRadius: '8px'
                }}
              >
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginBottom: '12px',
                  alignItems: 'center'
                }}>
                  <span style={{ fontSize: isMobile ? '16px' : '14px' }}>Window {index + 1}</span>
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => handleRemoveWindow(wallName.toLowerCase() + 'Wall', index)}
                    size={isMobile ? 'large' : 'middle'}
                  />
                </div>
                
                <Space 
                  direction="vertical" 
                  style={{ width: '100%' }}
                  size={isMobile ? 'middle' : 'small'}
                >
                  <div>
                    <span>Position:</span>
                    <InputNumber
                      min={-1}
                      max={1}
                      step={0.1}
                      value={window.position}
                      onChange={(value) => handleWindowChange(wallName.toLowerCase() + 'Wall', index, { position: value })}
                      style={{ width: '100%' }}
                      size={isMobile ? 'large' : 'middle'}
                    />
                  </div>
                  <div>
                    <span>Vertical Position:</span>
                    <InputNumber
                      min={0}
                      max={0.6}
                      step={0.1}
                      value={window.verticalPosition}
                      onChange={(value) => handleWindowChange(wallName.toLowerCase() + 'Wall', index, { verticalPosition: value })}
                      style={{ width: '100%' }}
                      size={isMobile ? 'large' : 'middle'}
                    />
                  </div>
                  <div>
                    <span>Width:</span>
                    <InputNumber
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={window.width}
                      onChange={(value) => handleWindowChange(wallName.toLowerCase() + 'Wall', index, { width: value })}
                      style={{ width: '100%' }}
                      size={isMobile ? 'large' : 'middle'}
                    />
                  </div>
                  <div>
                    <span>Height:</span>
                    <InputNumber
                      min={0.5}
                      max={2}
                      step={0.1}
                      value={window.height}
                      onChange={(value) => handleWindowChange(wallName.toLowerCase() + 'Wall', index, { height: value })}
                      style={{ width: '100%' }}
                      size={isMobile ? 'large' : 'middle'}
                    />
                  </div>
                </Space>
              </div>
            ))}
          </div>
        </div>
      </Space>
    </Panel>
  );

  const renderDimensionControl = (label, dimension, value, min, max) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ marginBottom: '4px' }}>
        <span>{label} (meters):</span>
      </div>
      <InputNumber
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(val) => handleRoomDimensionChange(dimension, val)}
        style={{ width: '100%' }}
        size={isMobile ? 'large' : 'middle'}
      />
    </div>
  );

  console.log('DesignTools component rendered with products:', selectedProducts);

  return (
    <Card 
      title="Design Tools" 
      style={getCardStyle()}
    >
      <Tabs 
        defaultActiveKey="1"
        size={isMobile ? 'large' : 'middle'}
        style={{ width: '100%' }}
      >
        <TabPane tab="Products" key="1">
          <Space 
            style={{ 
              width: '100%',
              justifyContent: isMobile ? 'space-between' : 'flex-start',
              marginBottom: '16px'
            }}
            wrap
          >
           { products.map((product) => (
            <Card
              key={product.id}
              title={product.name}
              size={isMobile ? 'small' : 'default'}
              style={{ width: isMobile ? '100%' : 'calc(100% - 32px)' }}
              bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
            >
              <div style={{ marginBottom: '8px' }}>
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                />
                <Select
                  mode="multiple"
                  value={selectedProducts.find(p => p.id === product.id)?.selectedVariants?.map(v => v.id) || []}
                  onChange={(variantIds) => handleVariantChange(product.id, variantIds)}
                  style={{ width: '100%', marginTop: '8px' }}
                  placeholder={product.variants.$values.length ? "Select variants" : "No variants available"}
                  disabled={!product.variants.$values.length}
                  loading={false}
                  showArrow={true}
                  maxTagCount={2}
                  maxTagTextLength={10}
                >
                  {product.variants.$values.map((variant) => (
                    <Option key={variant.id} value={variant.id}>
                      {variant.name}
                    </Option>
                  ))}
                </Select>       
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', gap: '8px' }}>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    const currentVariants = selectedProducts.find(p => p.id === product.id)?.selectedVariants?.map(v => v.id) || [];
                    handleAddProduct(product.id, currentVariants);
                  }}
                  disabled={!product.variants.$values.length}
                  size={isMobile ? 'large' : 'middle'}
                  style={{ flex: 1 }}
                >
                  Add to Room
                </Button>
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteModel(product.id)}
                  size={isMobile ? 'large' : 'middle'}
                >
                  Remove
                </Button>
              </div>
            </Card>
           ))}
          </Space>
        </TabPane>
        
        <TabPane tab="Room" key="2">
          <Card 
            title="Room Dimensions"
            size={isMobile ? 'small' : 'default'}
            bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
          >
            {renderDimensionControl('Width', 'width', roomDimensions.width, 4, 20)}
            {renderDimensionControl('Length', 'length', roomDimensions.length, 4, 20)}
            {renderDimensionControl('Height', 'height', roomDimensions.height, 2, 5)}
          </Card>

          <Card 
            title="Materials"
            size={isMobile ? 'small' : 'default'}
            bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
          >
            <div style={{ marginBottom: '16px' }}>
              <div>Wall Color:</div>
              <Select
                value={roomMaterials.wallMaterial}
                onChange={handleWallMaterialChange}
                style={{ width: '100%' }}
              >
                {Object.entries(wallMaterials).map(([key, { label, value }]) => (
                  <Option key={key} value={value}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: value,
                          marginRight: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                      {label}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>

            <div>
              <div>Floor Material:</div>
              <Select
                value={roomMaterials.floorMaterial}
                onChange={handleFloorMaterialChange}
                style={{ width: '100%' }}
              >
                {Object.entries(floorMaterials).map(([key, { label, value }]) => (
                  <Option key={key} value={value}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          backgroundColor: value,
                          marginRight: '8px',
                          border: '1px solid #d9d9d9'
                        }}
                      />
                      {label}
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
          </Card>

          <Card 
            title="Wall Configuration" 
            style={{ marginTop: '16px' }}
            size={isMobile ? 'small' : 'default'}
            bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
          >
            <Collapse
              style={{ width: '100%' }}
            >
              {renderWallControls('Front', wallConfig.frontWall)}
              {renderWallControls('Back', wallConfig.backWall)}
              {renderWallControls('Left', wallConfig.leftWall)}
              {renderWallControls('Right', wallConfig.rightWall)}
            </Collapse>
          </Card>
        </TabPane>
        <TabPane tab="Generate Layout" key="3">

        <span style={{ display: 'block', marginBottom: '8px' }}>
          Selected products:
        </span>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {selectedProducts.map((product, index) => (
                <Card
                    key={product.id}
                    title={product.name}
                    size={isMobile ? 'small' : 'default'}
                    style={{ width: isMobile ? '100%' : 'calc(100% - 32px)' }}
                    bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
                >
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                    <Select
                        mode="multiple"
                        value={product.selectedVariants?.map(v => v.id) || []}
                        onChange={(variantIds) => handleVariantChange(product.id, variantIds)}
                        style={{ width: '100%' }}
                      >
                        {product.variants.$values.map((variant) => (
                          <Option key={variant.id} value={variant.id}>
                            {variant.name}
                          </Option>
                        ))}
                    </Select>
                </Card>
            ))}
            </Space>
        </div>

        <Divider style={{ margin: '16px 0' }} />

            <span style={{ display: 'block', marginBottom: '8px' }}>
              Describe your preferred layout:
            </span>
            <div style={{ textAlign: 'center' }}>
                <TextArea
                    rows={4}
                    placeholder="Describe your preferred layout..."
                    value={preferredLayoutDescription}
                    onChange={(e) => {
                        handlePreferredLayoutChange(e.target.value);
                    }}
                />
            </div>
            
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={handleSubmit}
                type="primary"
                size={isMobile ? 'large' : 'middle'}
              >
                Generate Layout
              </Button>
            </div>
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default DesignTools;
