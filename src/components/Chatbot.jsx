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

    // Add CSS for hiding scrollbar in WebKit browsers and welcome animation
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .chatbot-messages-container::-webkit-scrollbar {
                display: none;
            }
            
            .chatbot-welcome {
                animation: fadeIn 0.5s ease-in-out;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .chatbot-sample-question {
                transition: all 0.2s ease;
            }
            
            .chatbot-sample-question:hover {
                transform: translateY(-2px);
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
        `;
        document.head.appendChild(style);
        
        return () => {
            document.head.removeChild(style);
        };
    }, []);

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
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <RobotOutlined style={{ marginRight: '8px', color: '#52c41a' }} />
                        <Title level={4} style={{ margin: 0 }}>Dear Home Assistant</Title>
                    </div>
                    <Badge 
                        status={getStatusColor()} 
                        text={screens.md ? (status === 'connected' ? 'Online' : status === 'connecting' ? 'Connecting' : 'Offline') : ''} 
                    />
                </div>
            }
            style={{ 
                width: screens.md ? (screens.lg ? '450px' : '400px') : '100%',
                height: screens.md ? (screens.lg ? '650px' : '600px') : '100vh',
                maxWidth: '100%',
                position: screens.md ? 'relative' : 'fixed',
                top: screens.md ? 'auto' : 0,
                left: screens.md ? 'auto' : 0,
                right: screens.md ? 'auto' : 0,
                bottom: screens.md ? 'auto' : 0,
                margin: screens.md ? 0 : '0 auto',
                borderRadius: screens.md ? '12px' : 0,
                boxShadow: screens.md ? '0 4px 12px rgba(0, 0, 0, 0.15)' : 'none',
                zIndex: 1000
            }}
            bodyStyle={{ 
                display: 'flex', 
                flexDirection: 'column', 
                height: screens.md ? 'calc(100% - 57px)' : 'calc(100vh - 57px)', 
                padding: screens.md ? '16px' : '12px',
            }}
        >
            <div 
                className="chatbot-messages-container"
                style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    marginBottom: screens.md ? '12px' : '8px',
                    padding: screens.md ? 0 : '0 4px',
                    msOverflowStyle: 'none', // Hide scrollbar for IE and Edge
                    scrollbarWidth: 'none' // Hide scrollbar for Firefox
                }}
            >
                {messages.length === 0 ? (
                    <div className="chatbot-welcome">
                        <Empty 
                            description={
                                <div>
                                    <Text strong>Welcome to Dear Home Assistant!</Text>
                                    <p>Choose a sample question or type your own:</p>
                                </div>
                            } 
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px',
                            margin: '16px 0',
                            maxWidth: screens.md ? '400px' : '100%'
                        }}>
                            {[
                                "What furniture would look good in my living room?",
                                "What's the return policy for products?",
                                "Can you suggest home decor ideas for a small space?"
                            ].map((question, index) => (
                                <Button 
                                    key={index}
                                    type="default"
                                    className="chatbot-sample-question"
                                    style={{ 
                                        borderRadius: '18px', 
                                        textAlign: 'left',
                                        backgroundColor: '#f0f2f5',
                                        border: 'none',
                                        padding: '8px 16px',
                                        height: 'auto',
                                        whiteSpace: 'normal'
                                    }}
                                    disabled={status !== 'connected'}
                                    onClick={() => {
                                        setInputMessage(question);
                                        setTimeout(() => {
                                            const event = { preventDefault: () => {} };
                                            setInputMessage(question);
                                            sendMessage(event);
                                        }, 100);
                                    }}
                                >
                                    <MessageOutlined style={{ marginRight: '8px' }} />
                                    {question}
                                </Button>
                            ))}
                        </div>
                    </div>
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
                                                padding: screens.md ? '12px 16px' : '10px 14px',
                                                borderRadius: message.sender === 'user' 
                                                    ? '18px 18px 4px 18px' 
                                                    : '18px 18px 18px 4px',
                                                fontSize: screens.md ? '15px' : '14px',
                                                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
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
                                            padding: screens.md ? '12px 16px' : '10px 14px',
                                            borderRadius: '18px 18px 18px 4px',
                                            fontSize: screens.md ? '15px' : '14px',
                                            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
                                            minWidth: '60px',
                                            minHeight: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
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
                padding: screens.md ? '8px 0 0 0' : '8px',
                borderTop: '1px solid #f0f0f0',
                backgroundColor: '#fff',
                borderRadius: '0 0 12px 12px'
            }}>
                <form onSubmit={sendMessage} style={{ display: 'flex' }}>
                    <Input
                        size={screens.md ? 'large' : 'large'}
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        placeholder="Type your message..."
                        disabled={status !== 'connected'}
                        style={{ 
                            marginRight: '8px',
                            borderRadius: '20px',
                            padding: '8px 16px'
                        }}
                        suffix={
                            status === 'connected' && inputMessage.trim() ? (
                                <SendOutlined 
                                    style={{ color: '#1890ff', cursor: 'pointer' }}
                                    onClick={sendMessage}
                                />
                            ) : null
                        }
                    />
                    <Button 
                        type="primary" 
                        icon={<SendOutlined />} 
                        htmlType="submit"
                        size="large"
                        shape="circle"
                        disabled={status !== 'connected' || !inputMessage.trim()}
                    />
                </form>
            </div>
            
            {status !== 'connected' && (
                <div style={{ 
                    textAlign: 'center', 
                    padding: '12px', 
                    marginTop: '8px', 
                    color: status === 'error' ? '#f5222d' : 'rgba(0, 0, 0, 0.45)',
                    backgroundColor: status === 'error' ? '#fff1f0' : '#f9f9f9',
                    borderRadius: '8px',
                    fontSize: '14px'
                }}>
                    {errorMessage || (status === 'disconnected' ? 'Connecting to server...' : 'Connection error. Retrying...')}
                </div>
            )}
        </Card>
    );
};

export default Chatbot;