import React, { useState, useEffect } from 'react';

const LogViewer = () => {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        const originalInfo = console.info;

        const appendLog = (type, message) => {
            setLogs((prevLogs) => [...prevLogs, { type, message, timestamp: new Date().toLocaleTimeString() }]);
        };

        console.log = (...args) => {
            appendLog('log', args.join(' '));
            originalLog(...args);
        };
        console.warn = (...args) => {
            appendLog('warn', args.join(' '));
            originalWarn(...args);
        };
        console.error = (...args) => {
            appendLog('error', args.join(' '));
            originalError(...args);
        };
        console.info = (...args) => {
            appendLog('info', args.join(' '));
            originalInfo(...args);
        };

        return () => {
            console.log = originalLog;
            console.warn = originalWarn;
            console.error = originalError;
            console.info = originalInfo;
        };
    }, []);

    return (
        <div style={{
            position: 'absolute',
            bottom: '10px',
            left: '10px',
            width: 'calc(100% - 20px)',
            height: '150px',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: 'white',
            fontSize: '10px',
            overflowY: 'scroll',
            padding: '5px',
            fontFamily: 'monospace',
            zIndex: 10000 // Ensure it's on top
        }}>
            {logs.map((log, index) => (
                <div key={index} style={{
                    color: log.type === 'error' ? 'red' : log.type === 'warn' ? 'yellow' : 'white'
                }}>
                    [{log.timestamp}] [{log.type.toUpperCase()}]: {log.message}
                </div>
            ))}
        </div>
    );
};

export default LogViewer; 