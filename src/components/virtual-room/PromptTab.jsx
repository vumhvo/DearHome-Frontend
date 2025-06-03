import React, { useState } from 'react';
import { Input, Button, Card, Space, Alert } from 'antd';

const { TextArea } = Input;

const PromptTab = ({ isMobile, onSubmitPrompt }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onSubmitPrompt(prompt);
      setPrompt(''); // Clear prompt after successful submission
    } catch (err) {
      setError(err.message || 'Failed to process prompt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="Generate Room Design"
      size={isMobile ? 'small' : 'default'}
      bodyStyle={{ padding: isMobile ? '12px' : '24px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {error && (
          <Alert 
            message={error} 
            type="error" 
            showIcon 
            closable 
            onClose={() => setError(null)} 
          />
        )}
        
        <TextArea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your desired room design in detail..."
          autoSize={{ minRows: 4, maxRows: 8 }}
        />
        
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          block
          size={isMobile ? 'large' : 'middle'}
        >
          Generate Design
        </Button>
      </Space>
    </Card>
  );
};

export default PromptTab;
