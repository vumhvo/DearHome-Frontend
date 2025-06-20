import React, { useRef, useEffect } from 'react'
import { Mesh } from 'three'

export default function PlaceableCube({ position, visible = false }) {
  const meshRef = useRef(null)

  // Update position when position prop changes
  useEffect(() => {
    if (meshRef.current && position) {
      meshRef.current.position.copy(position)
    }
  }, [position])

  return (
    <mesh
      ref={meshRef}
      visible={visible && !!position}
    >
      <boxGeometry />
      <meshStandardMaterial color="#1e88e5" />
    </mesh>
  )
}
