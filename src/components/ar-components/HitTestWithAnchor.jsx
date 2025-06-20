import React, { useState } from 'react'
import { Canvas } from '@react-three/fiber'
import Reticle from './Reticle'

export default function HitTestWithAnchors() {
  const [matrices, setMatrices] = useState([])

  const handleSelect = (matrix) => {
    setMatrices((prev) => [...prev.slice(-29), matrix]) // Max 30
  }

  return (
    <>
      <ambientLight />
      <Reticle onSelect={handleSelect} />
      {/* {matrices.map((matrix, i) => (
        <Flower key={i} matrix={matrix} />
      ))} */}
    </>
  )
}