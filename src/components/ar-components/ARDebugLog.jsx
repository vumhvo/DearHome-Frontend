import React, { useState, useEffect } from 'react';

const ARDebugLog = () => {
  const [logs, setLogs] = useState([]);
  
  // Override console methods to capture logs
  useEffect(() => {
    const originalConsole = {
      log: console.log,
      warn: console.warn,
      error: console.error
    };

    console.log = (...args) => {
      setLogs(prev => [...prev, { type: 'log', content: args.join(' '), time: new Date() }]);
      originalConsole.log(...args);
    };

    console.warn = (...args) => {
      setLogs(prev => [...prev, { type: 'warn', content: args.join(' '), time: new Date() }]);
      originalConsole.warn(...args);
    };

    console.error = (...args) => {
      setLogs(prev => [...prev, { type: 'error', content: args.join(' '), time: new Date() }]);
      originalConsole.error(...args);
    };

    // Cleanup
    return () => {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
    };
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      left: '10px',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      fontFamily: 'monospace',
      fontSize: '12px',
      zIndex: 9999,
      maxHeight: '30vh',
      maxWidth: '80vw',
      overflowY: 'auto',
      borderRadius: '4px'
    }}>
      {logs.slice(-50).map((log, index) => (
        <div 
          key={index}
          style={{
            color: log.type === 'error' ? '#ff4444' : 
                   log.type === 'warn' ? '#ffbb33' : '#ffffff',
            marginBottom: '4px'
          }}
        >
          [{log.time.toLocaleTimeString()}] {log.content}
        </div>
      ))}
    </div>
  );
};

export default ARDebugLog;