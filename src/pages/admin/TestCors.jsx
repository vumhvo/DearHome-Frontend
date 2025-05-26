import React, { useState, useEffect } from 'react';
import { Button, Input, Alert, Card, Typography, Space } from 'antd';
import ModelPreview from '../../components/ModelPreview';
import ErrorBoundary from '../../components/ErrorBoundary';

const { Title, Text } = Typography;

// The problematic Firebase Storage URL
const PROBLEM_MODEL_URL = 'https://firebasestorage.googleapis.com/v0/b/makemyhome-27df4.appspot.com/o/3DModels%2Fwhite_mesh%20(1).glb?alt=media&token=67ea418f-2d86-446c-a531-579f6d604f55';

const TestCors = () => {
    const [modelUrl, setModelUrl] = useState(PROBLEM_MODEL_URL);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [testResult, setTestResult] = useState(null);

    const testCorsConfig = async () => {
        if (!modelUrl) {
            setError('Please enter a Firebase Storage URL to test');
            return;
        }

        setLoading(true);
        setError(null);
        setTestResult(null);

        try {
            console.log('Testing CORS for URL:', modelUrl);
            
            // Test CORS with a HEAD request
            const response = await fetch(modelUrl, { 
                method: 'HEAD',
                mode: 'cors'
            });
            
            if (response.ok) {
                console.log('CORS test successful', response);
                setTestResult({
                    success: true,
                    message: 'CORS is properly configured! The model should load correctly.'
                });
            } else {
                console.error('CORS test failed with status:', response.status);
                setTestResult({
                    success: false,
                    message: `Request failed with status ${response.status}: ${response.statusText}`
                });
            }
        } catch (error) {
            console.error('Error testing CORS:', error);
            setError(error.message);
            setTestResult({
                success: false,
                message: `CORS test failed: ${error.message}`
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
            <Title level={2}>Firebase Storage CORS Test</Title>
            <Text>This tool helps you test if CORS is correctly configured for Firebase Storage URLs.</Text>
            
            <Card style={{ marginTop: '20px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Input 
                        placeholder="Enter Firebase Storage URL to test" 
                        value={modelUrl}
                        onChange={(e) => setModelUrl(e.target.value)}
                        style={{ marginBottom: '10px' }}
                    />
                    
                    <Button 
                        type="primary" 
                        onClick={testCorsConfig}
                        loading={loading}
                        disabled={!modelUrl}
                    >
                        Test CORS Configuration
                    </Button>
                    
                    {error && (
                        <Alert
                            message="Error"
                            description={error}
                            type="error"
                            showIcon
                        />
                    )}
                    
                    {testResult && (
                        <Alert
                            message={testResult.success ? "Success" : "Failed"}
                            description={testResult.message}
                            type={testResult.success ? "success" : "warning"}
                            showIcon
                        />
                    )}
                </Space>
            </Card>
            
            {modelUrl && (
                <Card title="Model Preview" style={{ marginTop: '20px', height: '400px' }}>
                    <ErrorBoundary>
                        <ModelPreview modelUrl={modelUrl} />
                    </ErrorBoundary>
                </Card>
            )}
            
            <Card title="CORS Configuration Information" style={{ marginTop: '20px' }}>
                <Text>
                    Your Firebase Storage is configured with the following CORS settings:
                </Text>
                <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
{`[
  {
    "origin": ["*"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    "responseHeader": [
      "Content-Type", 
      "Authorization", 
      "Content-Length", 
      "User-Agent", 
      "X-Requested-With", 
      "Accept", 
      "Origin", 
      "Access-Control-Allow-Origin", 
      "Access-Control-Allow-Methods", 
      "Access-Control-Allow-Headers", 
      "Access-Control-Expose-Headers", 
      "Access-Control-Max-Age"
    ],
    "maxAgeSeconds": 10000
  }
]`}
                </pre>
            </Card>
        </div>
    );
};

export default TestCors;
