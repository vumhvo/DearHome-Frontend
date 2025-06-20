import React, { useState, useEffect, useRef } from 'react';
import { Card, Input, Button, List, Avatar, Typography, Badge, Empty, Grid, Spin } from 'antd';
import { SendOutlined, RobotOutlined, UserOutlined, MessageOutlined } from '@ant-design/icons';
import { chatbotWs } from '../api/ApiRequests';
import ReactMarkdown from 'react-markdown';

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [status, setStatus] = useState('disconnected');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);
    const webSocketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const screens = useBreakpoint();
    const reconnectAttempts = useRef(0);
    const MAX_RECONNECT_ATTEMPTS = 5;

    // Initialize WebSocket connection
    useEffect(() => {
        const connectWebSocket = () => {
            if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
                setErrorMessage('Failed to connect to chatbot after multiple attempts. Please try again later.');
                setStatus('error');
                return;
            }

            setStatus('connecting');
            setErrorMessage(null);
            
            const ws = chatbotWs.connectWebSocket();

            ws.onopen = () => {
                setStatus('connected');
                setErrorMessage(null);
                reconnectAttempts.current = 0;
                console.log('WebSocket connection established');
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('Received message:', data);
                if (data.type === 'message') {
                    setIsLoading(false);
                    setMessages(prevMessages => [...prevMessages, { 
                        text: data.response,
                        sender: 'bot',
                        timestamp: new Date(data.timestamp),
                        clientId: data.client_id
                    }]);
                }
                // Ignore ping messages as they're just for keeping the connection alive
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setStatus('error');
                setErrorMessage('WebSocket error. Please try again.');
            };
            
            ws.onclose = (event) => {
                console.log('WebSocket connection closed', event.code, event.reason);
                setStatus('disconnected');
                
                if (!event.wasClean && event.code !== 1000) {
                    setErrorMessage('Connection lost. Attempting to reconnect...');
                    reconnectAttempts.current++;
                    setTimeout(() => {
                        if (webSocketRef.current?.readyState === WebSocket.CLOSED) {
                            connectWebSocket();
                        }
                    }, 5000);
                } else if (event.code === 1006) {
                    setErrorMessage('Could not connect to the chatbot server. Please ensure the server is running.');
                    reconnectAttempts.current++;
                    setTimeout(() => {
                        if (webSocketRef.current?.readyState === WebSocket.CLOSED) {
                            connectWebSocket();
                        }
                    }, 5000);
                } else {
                    setErrorMessage(null);
                }
            };
            
            webSocketRef.current = ws;
        };
        
        connectWebSocket();
        
        // Clean up the WebSocket connection when the component unmounts
        return () => {
            if (webSocketRef.current) {
                webSocketRef.current.close();
            }
        };
    }, []);
    
    // Auto-scroll to the bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);
    
    // Send message to the server
    const sendMessage = (e) => {
        e.preventDefault();
        if (!inputMessage.trim() || status !== 'connected') return;
        
        const currentTime = new Date();
        setIsLoading(true);
        
        webSocketRef.current.send(inputMessage);
        
        setMessages(prevMessages => [...prevMessages, { 
            text: inputMessage,
            sender: 'user',
            timestamp: currentTime
        }]);
        
        setInputMessage('');
    };
    
    // Get status color for Badge
    const getStatusColor = () => {
        switch(status) {
            case 'connected':
                return 'success';
            case 'disconnected':
                return 'default';
            case 'error':
                return 'error';
            default:
                return 'default';
        }
    };

    return (
        <Card
            title={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Title level={4} style={{ margin: 0 }}>Chat Assistant</Title>
                    <Badge status={getStatusColor()} />
                </div>
            }
            style={{ 
                width: screens.md ? 400 : '100%',
                height: screens.md ? 600 : '100vh',
                maxWidth: '100%',
                position: screens.md ? 'relative' : 'fixed',
                top: screens.md ? 'auto' : 0,
                left: screens.md ? 'auto' : 0,
                right: screens.md ? 'auto' : 0,
                bottom: screens.md ? 'auto' : 0,
                margin: screens.md ? 0 : '0 auto',
                borderRadius: screens.md ? '8px' : 0,
            }}
            bodyStyle={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: screens.md ? 'calc(100% - 57px)' : 'calc(100vh - 57px)', 
                padding: screens.md ? '12px' : '8px',
            }}
        >
            <div style={{ 
                flex: 1, 
                overflowY: 'auto', 
                marginBottom: screens.md ? '12px' : '8px',
                padding: screens.md ? 0 : '0 4px'
            }}>
                {messages.length === 0 ? (
                    <Empty description="No messages yet. Start a conversation!" />
                ) : (
                    <>
                        <List
                            dataSource={messages}
                            split={false}
                            renderItem={(message) => (
                                <List.Item
                                    style={{
                                        padding: screens.md ? '8px 0' : '6px 0',
                                        display: 'flex',
                                        justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
                                        border: 'none',
                                        marginBottom: screens.md ? 0 : '4px'
                                    }}
                                >
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: message.sender === 'user' ? 'row-reverse' : 'row',
                                        alignItems: 'flex-start',
                                        maxWidth: screens.md ? '80%' : '90%'
                                    }}>
                                        <Avatar
                                            icon={message.sender === 'user' ? <UserOutlined /> : <RobotOutlined />}
                                            style={{
                                                backgroundColor: message.sender === 'user' ? '#1890ff' : '#52c41a',
                                                margin: message.sender === 'user' ? '0 0 0 8px' : '0 8px 0 0'
                                            }}
                                        />
                                        <div
                                            style={{
                                                backgroundColor: message.sender === 'user' ? '#1890ff' : '#f0f2f5',
                                                color: message.sender === 'user' ? 'white' : 'rgba(0, 0, 0, 0.85)',
                                                padding: screens.md ? '12px' : '8px',
                                                borderRadius: screens.md ? '12px' : '8px',
                                                fontSize: screens.md ? 'inherit' : '14px'
                                            }}
                                        >
                                            {message.sender === 'user' ? (
                                                <div style={{ whiteSpace: 'pre-wrap' }}>{message.text}</div>
                                            ) : (
                                                <ReactMarkdown>{message.text}</ReactMarkdown>
                                            )}
                                            <Text 
                                                type="secondary" 
                                                style={{ 
                                                    fontSize: '12px', 
                                                    color: message.sender === 'user' ? 'rgba(255, 255, 255, 0.65)' : undefined,
                                                    display: 'block',
                                                    textAlign: 'right',
                                                    marginTop: '4px'
                                                }}
                                            >
                                                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </div>
                                    </div>
                                </List.Item>
                            )}
                        />
                        {isLoading && (
                            <List.Item
                                style={{
                                    padding: screens.md ? '8px 0' : '6px 0',
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    border: 'none',
                                    marginBottom: screens.md ? 0 : '4px'
                                }}
                            >
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    maxWidth: screens.md ? '80%' : '90%'
                                }}>
                                    <Avatar
                                        icon={<RobotOutlined />}
                                        style={{
                                            backgroundColor: '#52c41a',
                                            marginRight: '8px'
                                        }}
                                    />
                                    <div
                                        style={{
                                            backgroundColor: '#f0f2f5',
                                            padding: screens.md ? '12px' : '8px',
                                            borderRadius: screens.md ? '12px' : '8px',
                                            fontSize: screens.md ? 'inherit' : '14px'
                                        }}
                                    >
                                        <Spin size="small" />
                                    </div>
                                </div>
                            </List.Item>
                        )}
                    </>
                )}
                <div ref={messagesEndRef} />
            </div>
            
            <div style={{ 
                padding: screens.md ? 0 : '8px',
                borderTop: screens.md ? 'none' : '1px solid #f0f0f0',
                backgroundColor: screens.md ? 'transparent' : '#fff'
            }}>
                <form onSubmit={sendMessage} style={{ display: 'flex' }}>
                    <Input
                        size={screens.md ? 'middle' : 'large'}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={status !== 'connected'}
                        style={{ marginRight: '8px' }}
                    />
                    <Button 
                        type="primary" 
                        icon={<SendOutlined />} 
                        htmlType="submit"
                        size={screens.md ? 'middle' : 'large'}
                        disabled={status !== 'connected' || !inputMessage.trim()}
                    />
                </form>
            </div>
            
            {status !== 'connected' && (
                <div style={{ textAlign: 'center', padding: '8px', marginTop: '8px', color: 'rgba(0, 0, 0, 0.45)' }}>
                    {status === 'disconnected' ? 'Connecting to server...' : 'Connection error. Retrying...'}
                </div>
            )}
        </Card>
    );
};

export default Chatbot;