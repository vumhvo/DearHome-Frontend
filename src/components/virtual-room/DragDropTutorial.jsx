import React, { useState, useEffect } from 'react';
import { Modal, Steps, Typography, Button } from 'antd';
import { DragOutlined, RotateRightOutlined, TableOutlined, ArrowsAltOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

/**
 * Tutorial component for the Virtual Room Planner
 * Shows a step-by-step guide on how to use the drag and drop functionality
 */
const DragDropTutorial = ({ visible, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Select a Model',
      icon: <DragOutlined />,
      content: (
        <div>
          <Paragraph>
            Click on any model in the scene to select it. Selected models will show a blue ring around them.
          </Paragraph>
          <Paragraph>
            The control panel on the left will show options for the selected model.
          </Paragraph>
        </div>
      ),
    },
    {
      title: 'Drag to Reposition',
      icon: <ArrowsAltOutlined />,
      content: (
        <div>
          <Paragraph>
            <strong>Once a model is selected</strong>, you can click and drag it using your mouse to reposition it within the room.
          </Paragraph>
          <Paragraph>
            <Text type="warning" strong>Important:</Text> You must first select the model, then click and drag to move it. The cursor will change to a "grabbing" style when dragging.
          </Paragraph>
          <Paragraph>
            A pink indicator will appear while dragging to help you visualize the movement.
          </Paragraph>
        </div>
      ),
    },
    {
      title: 'Use Grid Snapping',
      icon: <TableOutlined />,
      content: (
        <div>
          <Paragraph>
            Enable grid snapping in the control panel to make precise placements easier.
          </Paragraph>
          <Paragraph>
            When grid snapping is enabled, the model will snap to a grid of your chosen size.
          </Paragraph>
          <Paragraph>
            You can adjust the grid size to control how precise the snapping should be.
          </Paragraph>
        </div>
      ),
    },
    {
      title: 'Keyboard Controls',
      icon: <ArrowsAltOutlined />,
      content: (
        <div>
          <Paragraph>
            Use the arrow keys to make fine adjustments to the selected model's position:
          </Paragraph>
          <ul>
            <li>← → : Move left/right</li>
            <li>↑ ↓ : Move forward/backward</li>
            <li>Shift + ← → : Rotate</li>
          </ul>
        </div>
      ),
    },
    {
      title: 'Rotation & Scaling',
      icon: <RotateRightOutlined />,
      content: (
        <div>
          <Paragraph>
            Use the rotation slider in the control panel to rotate the model around its center.
          </Paragraph>
          <Paragraph>
            The scale slider allows you to resize the model to fit your room perfectly.
          </Paragraph>
        </div>
      ),
    },
    {
      title: 'Troubleshooting',
      icon: <QuestionCircleOutlined />,
      content: (
        <div>
          <Paragraph>
            <strong>If dragging doesn't work:</strong>
          </Paragraph>
          <ol>
            <li>Make sure you've clicked once to select the model first (blue ring appears)</li>
            <li>Try clicking and holding while moving the mouse</li>
            <li>If using a touch device, press and hold briefly before moving</li>
            <li>You can also use the arrow buttons in the control panel to move objects precisely</li>
          </ol>
        </div>
      ),
    },
  ];

  const next = () => {
    setCurrentStep(currentStep + 1);
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  return (
    <Modal
      title={<Title level={4}>How to Use Drag & Drop</Title>}
      open={visible}
      onCancel={handleClose}
      width={600}
      footer={[
        <Button key="back" onClick={prev} disabled={currentStep === 0}>
          Previous
        </Button>,
        currentStep < steps.length - 1 ? (
          <Button key="next" type="primary" onClick={next}>
            Next
          </Button>
        ) : (
          <Button key="done" type="primary" onClick={handleClose}>
            Got it!
          </Button>
        ),
      ]}
    >
      <Steps
        current={currentStep}
        items={steps.map((step) => ({
          title: step.title,
          icon: step.icon,
        }))}
      />
      <div style={{ margin: '24px 0', minHeight: '150px' }}>
        {steps[currentStep].content}
      </div>
    </Modal>
  );
};

export default DragDropTutorial;
