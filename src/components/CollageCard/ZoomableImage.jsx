import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut } from 'lucide-react';

const ZoomableImage = ({ 
  src, 
  coordinates,
  className = ''
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);
  const imageRef = useRef(null);

  const minScale = 1;
  const maxScale = 3;
  const scaleStep = 0.1;

  const constrainPosition = (pos, scale) => {
    if (!imageRef.current || !containerRef.current) return pos;

    const containerWidth = coordinates.width_in_px;
    const containerHeight = coordinates.height_in_px;
    const scaledWidth = containerWidth * scale;
    const scaledHeight = containerHeight * scale;

    return {
      x: Math.min(0, Math.max(pos.x, containerWidth - scaledWidth)),
      y: Math.min(0, Math.max(pos.y, containerHeight - scaledHeight))
    };
  };

  const handleZoom = (direction) => {
    setScale(prevScale => {
      const newScale = direction === 'in' 
        ? Math.min(prevScale + scaleStep, maxScale)
        : Math.max(prevScale - scaleStep, minScale);
      
      // Adjust position when zooming to maintain center
      const newPosition = constrainPosition(position, newScale);
      setPosition(newPosition);
      
      return newScale;
    });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setStartPos({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      });
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;

    e.preventDefault();
    const newPosition = {
      x: e.touches[0].clientX - startPos.x,
      y: e.touches[0].clientY - startPos.y
    };

    setPosition(constrainPosition(newPosition, scale));
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative" style={{
      width: coordinates.width_in_px,
      height: coordinates.height_in_px,
      overflow: 'hidden'
    }}>
      <div 
        ref={containerRef}
        className={`absolute inset-0 ${className}`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imageRef}
          src={src}
          alt=""
          className="w-full h-full object-cover"
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
            transformOrigin: '0 0',
            touchAction: 'none'
          }}
        />
      </div>
      
      <div className="absolute bottom-2 right-2 flex gap-2">
        <button
          onClick={() => handleZoom('in')}
          className="p-1 bg-gray-800/50 rounded-full"
          disabled={scale >= maxScale}
        >
          <ZoomIn size={20} className="text-white" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-1 bg-gray-800/50 rounded-full"
          disabled={scale <= minScale}
        >
          <ZoomOut size={20} className="text-white" />
        </button>
      </div>
    </div>
  );
};

export default ZoomableImage;