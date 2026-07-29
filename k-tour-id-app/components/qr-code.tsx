"use client"

import { useEffect, useRef } from 'react'

interface QRCodeProps {
  value: string
  size?: number
  className?: string
}

export function QRCode({ value, size = 200, className = '' }: QRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!canvasRef.current || !value) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Simple QR code pattern generator (for demo purposes)
    // In a real app, you'd use a proper QR code library
    const generateQRPattern = (text: string, size: number) => {
      const gridSize = 21 // Standard QR code grid
      const cellSize = size / gridSize
      
      // Clear canvas
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, size, size)
      
      // Generate a pseudo-random pattern based on the text
      const hash = text.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
      
      ctx.fillStyle = '#000000'
      
      // Create a deterministic pattern
      for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
          const seed = (row * gridSize + col + hash) * 1234567
          const shouldFill = Math.sin(seed) > 0.3
          
          // Add corner markers (typical QR code feature)
          const isCornerMarker = 
            (row < 7 && col < 7) || 
            (row < 7 && col >= gridSize - 7) || 
            (row >= gridSize - 7 && col < 7)
          
          if (shouldFill || isCornerMarker) {
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
          }
        }
      }
      
      // Add corner position markers
      const drawCornerMarker = (x: number, y: number) => {
        ctx.fillStyle = '#000000'
        ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize)
        ctx.fillStyle = '#ffffff'
        ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize)
        ctx.fillStyle = '#000000'
        ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize)
      }
      
      drawCornerMarker(0, 0)
      drawCornerMarker(0, gridSize - 7)
      drawCornerMarker(gridSize - 7, 0)
    }

    generateQRPattern(value, size)
  }, [value, size])

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={`border-2 border-primary rounded-lg ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  )
}
