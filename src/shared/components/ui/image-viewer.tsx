'use client'

import { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog'
import { X, ZoomIn, ZoomOut, RotateCw, Download } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import Image from 'next/image'

interface ImageViewerProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
}

export function ImageViewer({ src, alt = 'Image', className = '', children }: ImageViewerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [scale, setScale] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [isHovering, setIsHovering] = useState(false)
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; distance: number } | null>(null)
  
  const imageRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setRotation(0)
      setPosition({ x: 0, y: 0 })
    }
  }, [isOpen])

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setScale(prev => Math.max(0.5, Math.min(5, prev + delta)))
  }

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && scale > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle touch gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      setTouchStart({
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
        distance
      })
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart) {
      e.preventDefault()
      const touch1 = e.touches[0]
      const touch2 = e.touches[1]
      const distance = Math.sqrt(
        Math.pow(touch2.clientX - touch1.clientX, 2) + 
        Math.pow(touch2.clientY - touch1.clientY, 2)
      )
      
      const scaleChange = distance / touchStart.distance
      setScale(prev => Math.max(0.5, Math.min(5, prev * scaleChange)))
      setTouchStart(prev => prev ? { ...prev, distance } : null)
    }
  }

  const handleTouchEnd = () => {
    setTouchStart(null)
  }

  // Haptic feedback for mobile
  const triggerHaptic = (pattern: number | number[] = 50) => {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }

  const handleImageClick = () => {
    triggerHaptic([30, 10, 30]) // Double tap haptic
    setIsOpen(true)
  }

  // Long press for mobile
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null)

  const handleTouchStartTrigger = () => {
    const timer = setTimeout(() => {
      triggerHaptic([50, 20, 50, 20, 100]) // Long press haptic pattern
      setIsOpen(true)
    }, 500) // 500ms long press
    setLongPressTimer(timer)
  }

  const handleTouchEndTrigger = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleZoomIn = () => {
    setScale(prev => Math.min(5, prev + 0.25))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(0.5, prev - 0.25))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleDownload = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'image'
    link.click()
  }

  const handleReset = () => {
    setScale(1)
    setRotation(0)
    setPosition({ x: 0, y: 0 })
  }

  return (
    <>
      {/* Trigger Element */}
      <div
        className={`relative cursor-pointer select-none ${className}`}
        onClick={handleImageClick}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onTouchStart={handleTouchStartTrigger}
        onTouchEnd={handleTouchEndTrigger}
        onTouchCancel={handleTouchEndTrigger}
        onContextMenu={(e) => e.preventDefault()}
      >
        {children || (
          <Image
            src={src}
            alt={alt}
            className={`transition-all duration-500 ease-out ${
              isHovering ? 'scale-125 shadow-2xl brightness-110' : 'scale-100'
            }`}
            width={400}
            height={256}
            draggable={false}
            unselectable="on"
          />
        )}

        {/* Hover overlay with smooth animation */}
        <div className={`absolute inset-0 flex items-center justify-center transition-all duration-300 pointer-events-none ${
          isHovering ? 'bg-black/20 opacity-100' : 'bg-transparent opacity-0'
        }`}>
          <div className={`bg-white/90 backdrop-blur-sm rounded-full p-3 transition-all duration-300 ${
            isHovering ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
          }`}>
            <ZoomIn className="h-6 w-6 text-gray-700" />
          </div>
        </div>

        {/* Mobile long press indicator */}
        <div className={`md:hidden absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded transition-opacity duration-300 pointer-events-none ${
          isHovering ? 'opacity-100' : 'opacity-0'
        }`}>
          Giữ để phóng to
        </div>
      </div>

      {/* Full Screen Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="w-full h-full flex flex-col md:max-w-[90vw] md:max-h-[90vh] md:p-6 md:bg-white/98 md:border md:rounded-lg md:shadow-2xl max-w-[100vw] max-h-[100vh] p-0 bg-black border-0 rounded-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Xem ảnh: {alt}</DialogTitle>
          </DialogHeader>

          {/* Desktop Controls - Hidden on Mobile */}
          <div className="hidden md:flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleZoomOut} className="h-9 w-9 p-0">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleZoomIn} className="h-9 w-9 p-0">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleRotate} className="h-9 w-9 p-0">
                <RotateCw className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={handleReset} className="px-3 h-9">
                Reset
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleDownload} className="h-9 w-9 p-0">
                <Download className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsOpen(false)} className="h-9 w-9 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Header - Hidden on Desktop */}
          <div className="md:hidden flex items-center justify-between p-4 bg-black/80 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300 p-2 -m-2"
              >
                <X className="h-6 w-6" />
              </button>
              <span className="text-white text-lg font-medium">Xem ảnh</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleDownload}
                className="text-white hover:text-gray-300 p-2 -m-2"
              >
                <Download className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Image Container */}
          <div
            ref={containerRef}
            className="flex items-center justify-center w-full flex-1 md:bg-gray-50 md:rounded-lg md:border bg-black"
            style={{ cursor: isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'default' }}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <Image
              ref={imageRef}
              src={src}
              alt={alt}
              className="select-none max-w-full max-h-full object-contain"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                transition: isDragging ? 'none' : 'transform 0.2s ease-out'
              }}
              width={800}
              height={600}
              draggable={false}
            />

            {/* Mobile Zoom Indicator */}
            {scale !== 1 && (
              <div className="md:hidden absolute top-4 left-4 bg-black/60 text-white px-3 py-1 rounded-full text-sm">
                {Math.round(scale * 100)}%
              </div>
            )}
          </div>

          {/* Desktop Instructions - Hidden on Mobile */}
          <div className="hidden md:block mt-4 text-center text-sm text-gray-600">
            Scroll để zoom • Kéo để di chuyển • ESC để đóng
          </div>

          {/* Mobile Bottom Controls - Hidden on Desktop */}
          <div className="md:hidden bg-black/80 backdrop-blur-sm p-4">
            <div className="flex items-center justify-center gap-6">
              <button
                onClick={handleZoomOut}
                className="flex flex-col items-center gap-1 text-white hover:text-gray-300 p-2"
              >
                <ZoomOut className="h-6 w-6" />
                <span className="text-xs">Thu nhỏ</span>
              </button>

              <button
                onClick={handleZoomIn}
                className="flex flex-col items-center gap-1 text-white hover:text-gray-300 p-2"
              >
                <ZoomIn className="h-6 w-6" />
                <span className="text-xs">Phóng to</span>
              </button>

              <button
                onClick={handleRotate}
                className="flex flex-col items-center gap-1 text-white hover:text-gray-300 p-2"
              >
                <RotateCw className="h-6 w-6" />
                <span className="text-xs">Xoay</span>
              </button>

              <button
                onClick={handleReset}
                className="flex flex-col items-center gap-1 text-white hover:text-gray-300 p-2"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="text-xs">Đặt lại</span>
              </button>
            </div>

            {/* Mobile Instructions */}
            <div className="text-center text-gray-400 text-sm mt-3">
              Pinch để zoom • Kéo để di chuyển • Tap để ẩn/hiện controls
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
