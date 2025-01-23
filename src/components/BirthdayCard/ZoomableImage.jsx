import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const ZoomableImage = ({ image, coordinates, backgroundImage }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [touchStart, setTouchStart] = useState(null);
  const imageRef = useRef(null);
  const [isZooming, setIsZooming] = useState(false);
  const [isScaling, setIsScaling] = useState(false);
  const [doubleTapTimer, setDoubleTapTimer] = useState(null);
  const lastTapRef = useRef(0);

  const handleDoubleTap = (e) => {
    const currentTime = Date.now();
    const tapLength = currentTime - lastTapRef.current;
    if (tapLength < 300 && tapLength > 0) {
      const newScale = scale === 1 ? 2 : 1;
      setScale(newScale);
      setIsZooming(newScale > 1);
      if (newScale === 1) setPosition({ x: 0, y: 0 });
    }
    lastTapRef.current = currentTime;
  };

  const handlePinchZoom = useCallback((e) => {
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const centerX = (touch1.clientX + touch2.clientX) / 2;
      const centerY = (touch1.clientY + touch2.clientY) / 2;
      
      const rect = imageRef.current.getBoundingClientRect();
      const offsetX = centerX - rect.left;
      const offsetY = centerY - rect.top;
      
      setPosition({
        x: (offsetX - rect.width / 2) * (1 - scale),
        y: (offsetY - rect.height / 2) * (1 - scale)
      });
    }
  }, [scale]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(scale + delta, 0.5), 3);
    setScale(newScale);
    setIsZooming(newScale > 1);

    if (newScale === 1) setPosition({ x: 0, y: 0 });
  }, [scale]);

  const handleTouchStart = useCallback((e) => {
    handleDoubleTap(e);
    
    if (e.touches.length === 2) {
      e.preventDefault();
      setIsScaling(true);
      const distance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStart({ distance, scale });
      handlePinchZoom(e);
    }
  }, [scale, handlePinchZoom]);

  const handleTouchMove = useCallback((e) => {
    if (isScaling && e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      const newDistance = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = (newDistance - touchStart.distance) / 100;
      const newScale = Math.min(Math.max(touchStart.scale + delta, 0.5), 3);
      setScale(newScale);
      setIsZooming(newScale > 1);
      handlePinchZoom(e);
    }
  }, [touchStart, isScaling, handlePinchZoom]);

  const handleTouchEnd = () => {
    setIsScaling(false);
    setTouchStart(null);
    if (scale === 1) {
      setIsZooming(false);
      setPosition({ x: 0, y: 0 });
    }
  };

  const preventScroll = useCallback((e) => {
    if (scale > 1) {
      e.preventDefault(); 
      e.stopPropagation();
    }
  }, [scale]);

  useEffect(() => {
    const element = imageRef.current;
    if (element) {
      element.addEventListener('touchmove', preventScroll, { passive: false });
      return () => element.removeEventListener('touchmove', preventScroll);
    }
  }, [preventScroll]);

  return (
    <div
      ref={imageRef}
      style={{
        position: "absolute",
        width: `${coordinates.width_in_px}px`,
        height: `${coordinates.height_in_px}px`,
        top: `${coordinates.top_in_px}px`,
        left: `${coordinates.left_in_px}px`,
        overflow: "hidden",
        touchAction: scale > 1 ? "none" : "auto"
      }}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${backgroundImage || image.sample_image})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        animate={{
          scale: scale,
          x: position.x,
          y: position.y
        }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 30
        }}
        drag={scale > 1}
        dragConstraints={{
          left: -coordinates.width_in_px * (scale - 1) / 2,
          right: coordinates.width_in_px * (scale - 1) / 2,
          top: -coordinates.height_in_px * (scale - 1) / 2,
          bottom: coordinates.height_in_px * (scale - 1) / 2
        }}
        dragElastic={0.1}
        dragMomentum={false}
        onDrag={(e, info) => {
          if (scale > 1) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      />
    </div>
  );
};

export default ZoomableImage;