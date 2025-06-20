import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useXRHitTest } from '@react-three/xr';
import * as THREE from 'three';
import ARHitTestLoading from './ARHitTestLoading';

export default function CenterHitTestPoint({
  onHitTestResult,
  onClick
}) {
  // Refs và state
  const ref = useRef(null);
  const [hitTestVisible, setHitTestVisible] = useState(false);
  const hitPosition = useRef(new THREE.Vector3());
  const matrixHelper = new THREE.Matrix4();
  
  // Sử dụng useXRHitTest để thực hiện hit test từ center của camera
  useXRHitTest((results, getWorldMatrix) => {
    if (results.length === 0) {
      setHitTestVisible(false);
      return;
    }
    
    // Lấy ma trận biến đổi từ kết quả hit test đầu tiên
    getWorldMatrix(matrixHelper, results[0]);
    
    // Trích xuất vị trí từ ma trận
    hitPosition.current.setFromMatrixPosition(matrixHelper);

    // Callback hit test result
    if (onHitTestResult) {
      onHitTestResult(hitPosition.current);
    }
    
    // Đánh dấu hit test là visible
    setHitTestVisible(true);
  }, 'viewer', 'plane'); // Phát hiện mặt phẳng từ góc nhìn camera
  
  // Cập nhật vị trí của reticle trong mỗi frame
  useFrame(() => {
    if (ref.current && hitTestVisible) {
      ref.current.position.copy(hitPosition.current);
    }
  });
  
  // Tính toán thời gian để tạo hiệu ứng nhấp nháy
  const [time, setTime] = useState(0);
  useFrame((state) => {
    setTime(state.clock.elapsedTime);
  });
  
  // Hiệu ứng nhấp nháy cho reticle
  const pulseScale = 1 + 0.1 * Math.sin(time * 5);

  const handleClick = (e) => {
    // Ngăn chặn sự kiện lan truyền để tránh xung đột
    e.stopPropagation();
    
    // Gọi callback onClick nếu được cung cấp
    if (onClick) {
      onClick();
    }
  };
  
  return (
    <group ref={ref} visible={hitTestVisible}>
      {/* Vòng tròn reticle */}
      <mesh rotation-x={-Math.PI / 2} scale={pulseScale} onClick={handleClick}>
        <ringGeometry args={[0.1, 0.15, 32]} />
        <meshBasicMaterial color="lime" opacity={0.8} transparent />
      </mesh>
      
      {/* Vòng tròn hiển thị mặt phẳng */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}  onClick={handleClick}>
        <circleGeometry args={[0.2, 32]} />
        <meshBasicMaterial color="cyan" opacity={0.2} transparent />
      </mesh>
      
      {/* Điểm trung tâm */}
      <mesh scale={0.03} onClick={handleClick}>
        <sphereGeometry />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}