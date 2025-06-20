import React from 'react';

const ARHitTestLoading = ({ isLoading }) => {
  if (!isLoading) return null;

  return (
    <div style={{
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: '60px',
      height: '60px',
      pointerEvents: 'none'
    }}>
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%'
      }}>
        {/* Ripple effect */}
        <div style={{
          position: 'absolute',
          border: '2px solid rgba(255, 255, 255, 0.8)',
          borderRadius: '50%',
          animation: 'hitTestRipple 1.5s cubic-bezier(0, 0.2, 0.8, 1) infinite',
          width: '100%',
          height: '100%'
        }} />
        {/* Center dot */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: '8px',
          height: '8px',
          backgroundColor: 'white',
          borderRadius: '50%'
        }} />
      </div>
      <style>{`
        @keyframes hitTestRipple {
          0% {
            opacity: 1;
            transform: scale(0.3);
          }
          100% {
            opacity: 0;
            transform: scale(2);
          }
        }
      `}</style>
    </div>
  );
};

export default ARHitTestLoading;