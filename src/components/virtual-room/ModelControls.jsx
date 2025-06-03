import React, { useState } from 'react';
import { TransformControls } from '@react-three/drei';
import { Typography, Slider, InputNumber, Button, Space, Tooltip, Switch, Row, Col, Divider } from 'antd';
import {
  ArrowsAltOutlined,
  RotateRightOutlined,
  FullscreenOutlined,
  DeleteOutlined,
  CopyOutlined,
  BorderOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Text } = Typography;

// 3D transform controls component to use in the scene
export const TransformControl = ({ modelRef, mode = 'translate', enabled = false }) => {
  if (!enabled || !modelRef) return null;
  
  return (
    <TransformControls
      object={modelRef}
      mode={mode}
      showX
      showY
      showZ
    />
  );
};

// UI controls component
const ModelControls = ({
  model,
  onRotationChange,
  onScaleChange,
  onDelete,
  onDuplicate,
  onPositionReset,
  onPositionChange,
  onGridSnapToggle,
  gridSnappingEnabled = false,
  gridSize = 0.5
}) => {
  const [positionInputs, setPositionInputs] = useState({
    x: model?.position[0] || 0,
    z: model?.position[2] || 0
  });

  const handlePositionInputChange = (axis, value) => {
    // Update local state
    setPositionInputs(prev => ({
      ...prev,
      [axis]: value
    }));
  };

  const commitPositionChange = () => {
    if (!model) return;
    
    // Create a new position array with updated values
    const newPosition = [...model.position];
    newPosition[0] = positionInputs.x;
    newPosition[2] = positionInputs.z;
    
    // Call the parent component's handler
    if (onPositionChange) {
      onPositionChange(newPosition, true); // true to indicate this is the final position
    }
  };

  // Small movement adjustments
  const handleNudge = (direction, amount = 0.1) => {
    if (!model) return;
    
    const newPosition = [...model.position];
    
    // Apply grid snapping if enabled
    const step = gridSnappingEnabled ? gridSize : amount;
    
    switch (direction) {
      case 'left':
        newPosition[0] -= step;
        break;
      case 'right':
        newPosition[0] += step;
        break;
      case 'forward':
        newPosition[2] -= step;
        break;
      case 'backward':
        newPosition[2] += step;
        break;
      default:
        return;
    }
    
    // Update position inputs
    setPositionInputs({
      x: newPosition[0],
      z: newPosition[2]
    });
    
    // Call the parent component's handler
    if (onPositionChange) {
      onPositionChange(newPosition, true); // true to indicate a final position change
    }
  };

  if (!model) {
    return (
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <Text type="secondary">Select a model to edit</Text>
      </div>
    );
  }

  // Update position inputs when model changes
  if (model.position[0] !== positionInputs.x || model.position[2] !== positionInputs.z) {
    setPositionInputs({
      x: model.position[0],
      z: model.position[2]
    });
  }

  return (
    <div>
      <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong>{model.name}</Text>
        <Space>
          <Tooltip title="Delete">
            <Button 
              danger 
              icon={<DeleteOutlined />} 
              size="small"
              onClick={onDelete}
            />
          </Tooltip>
          <Tooltip title="Duplicate">
            <Button 
              icon={<CopyOutlined />} 
              size="small"
              onClick={onDuplicate}
            />
          </Tooltip>
          <Tooltip title="Reset Position">
            <Button 
              icon={<ArrowsAltOutlined />} 
              size="small"
              onClick={onPositionReset}
            />
          </Tooltip>
        </Space>
      </div>

      {/* Position Controls */}
      <div style={{ marginBottom: '16px' }}>
        <Text>Position</Text>
        <Row gutter={8} style={{ marginTop: '8px' }}>
          <Col span={12}>
            <Text>X</Text>
            <InputNumber
              min={-10}
              max={10}
              step={gridSnappingEnabled ? gridSize : 0.1}
              value={positionInputs.x}
              onChange={(value) => handlePositionInputChange('x', value)}
              onPressEnter={commitPositionChange}
              onBlur={commitPositionChange}
              style={{ width: '100%' }}
            />
          </Col>
          <Col span={12}>
            <Text>Z</Text>
            <InputNumber
              min={-10}
              max={10}
              step={gridSnappingEnabled ? gridSize : 0.1}
              value={positionInputs.z}
              onChange={(value) => handlePositionInputChange('z', value)}
              onPressEnter={commitPositionChange}
              onBlur={commitPositionChange}
              style={{ width: '100%' }}
            />
          </Col>
        </Row>
        
        {/* Arrow buttons for nudging */}
        <div style={{ marginTop: '8px', textAlign: 'center' }}>
          <div>
            <Button 
              icon={<ArrowUpOutlined />} 
              size="small"
              onClick={() => handleNudge('forward')}
            />
          </div>
          <div style={{ margin: '4px 0' }}>
            <Button 
              icon={<ArrowLeftOutlined />} 
              size="small"
              onClick={() => handleNudge('left')}
              style={{ marginRight: '8px' }}
            />
            <Button 
              icon={<ArrowRightOutlined />} 
              size="small"
              onClick={() => handleNudge('right')}
            />
          </div>
          <div>
            <Button 
              icon={<ArrowDownOutlined />} 
              size="small"
              onClick={() => handleNudge('backward')}
            />
          </div>
        </div>
      </div>

      {/* Grid Snapping Option */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <BorderOutlined style={{ color: gridSnappingEnabled ? '#1890ff' : '#ccc' }} />
            <Text>Grid Snapping</Text>
          </Space>
          <Switch 
            checked={gridSnappingEnabled} 
            onChange={(checked) => {
              if (onGridSnapToggle) {
                onGridSnapToggle(checked, gridSize);
              }
            }} 
          />
        </div>
        {gridSnappingEnabled && (
          <div style={{ marginTop: '8px' }}>
            <Text>Grid Size</Text>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Slider
                min={0.1}
                max={1}
                step={0.1}
                value={gridSize}
                onChange={(value) => {
                  if (onGridSnapToggle && typeof value === 'number') {
                    onGridSnapToggle(true, value);
                  }
                }}
                style={{ flex: 1, marginRight: '8px' }}
              />
              <InputNumber
                min={0.1}
                max={1}
                step={0.1}
                value={gridSize}
                onChange={(value) => {
                  if (onGridSnapToggle && typeof value === 'number') {
                    onGridSnapToggle(true, value);
                  }
                }}
                style={{ width: '60px' }}
              />
            </div>
          </div>
        )}
      </div>

      <Divider style={{ margin: '8px 0' }} />

      <div style={{ marginBottom: '16px' }}>
        <Text>Rotation</Text>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <RotateRightOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <Slider
            min={0}
            max={Math.PI * 2}
            step={0.1}
            value={model.rotation[1]}
            onChange={(value) => onRotationChange('y', value)}
            style={{ flex: 1 }}
          />
          <Button 
            size="small" 
            style={{ marginLeft: '8px' }}
            onClick={() => onRotationChange('y', 0)}
          >
            Reset
          </Button>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <Text>Scale</Text>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <FullscreenOutlined style={{ marginRight: '8px', color: '#1890ff' }} />
          <Slider
            min={0.1}
            max={3}
            step={0.1}
            value={model.scale[0]}
            onChange={onScaleChange}
            style={{ flex: 1, marginRight: '8px' }}
          />
          <InputNumber
            min={0.1}
            max={3}
            step={0.1}
            value={model.scale[0]}
            onChange={onScaleChange}
            style={{ width: '60px' }}
          />
        </div>
      </div>

      <div style={{ marginTop: '16px', fontSize: '12px', color: '#888' }}>
        <Text type="secondary">Drag the model to reposition it in the room</Text>
        <br />
        <Text type="secondary">Use arrow keys for precise movement</Text>
      </div>
    </div>
  );
};

export default ModelControls;