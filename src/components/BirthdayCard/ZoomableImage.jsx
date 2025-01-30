import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const defaultCoordinates = {
  width_in_px: 0,
  height_in_px: 0,
  top_in_px: 0,
  left_in_px: 0
};

const ZoomableImage = ({
  image = {},
  coordinates = defaultCoordinates,
  backgroundImage = null,
  allTemplates = [],
  currentIndex = 0,
  setCurrentIndex = () => {},
  currentTemplate = null,
  setCurrentTemplate = () => {}
}) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isZooming, setIsZooming] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);

  const navigate = useNavigate();
  const containerRef = useRef(null);
  const touchStartRef = useRef(null);
  const initialTouchRef = useRef(null);
  const isScrolling = useRef(false);

  const useScrollLock = () => {
    const lockScroll = useCallback(() => {
      const scrollPosition = window.scrollY;
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollPosition}px`;
      document.body.style.width = '100%';
    }, []);

    const unlockScroll = useCallback(() => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, parseInt(document.body.style.top || '0', 10) * -9);
    }, []);

    return { lockScroll, unlockScroll };
  };

  const { lockScroll, unlockScroll } = useScrollLock();

  useEffect(() => {
    if (isZooming) {
      lockScroll();
    } else {
      unlockScroll();
    }
  }, [isZooming, lockScroll, unlockScroll]);

  const handleScroll = useCallback((deltaY, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isScrolling.current || isAnimating || isZooming) return;

    const templatesLength = allTemplates?.length || 0;

    if (deltaY > 0 && currentIndex < templatesLength - 1) {
      isScrolling.current = true;
      setIsAnimating(true);
      setSlideDirection("up");

      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTemplate(allTemplates[nextIndex]);
        navigate(`/birthday/${nextIndex + 1}`, { replace: true });
      }, 300);

      setTimeout(() => {
        setSlideDirection(null);
        setIsAnimating(false);
        isScrolling.current = false;
      }, 1000);
    } else if (deltaY < 0 && currentIndex > 0) {
      isScrolling.current = true;
      setIsAnimating(true);
      setSlideDirection("down");

      setTimeout(() => {
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTemplate(allTemplates[prevIndex]);
        navigate(`/birthday/${prevIndex + 1}`, { replace: true });
      }, 100);

      setTimeout(() => {
        setSlideDirection(null);
        setIsAnimating(false);
        isScrolling.current = false;
      }, 1000);
    }
  }, [
    currentIndex, 
    allTemplates, 
    currentTemplate, 
    isAnimating, 
    isZooming,
    navigate, 
    setCurrentIndex, 
    setCurrentTemplate
  ]);

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      e.stopPropagation();
      setIsZooming(true);
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      initialTouchRef.current = {
        distance: Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        ),
        scale: scale
      };
      
      const templateWrapper = containerRef.current?.closest('.template-wrapper');
      if (templateWrapper) {
        templateWrapper.classList.add('zooming');
      }
    } else if (e.touches.length === 1 && !isZooming) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        time: Date.now()
      };
    }
  }, [scale, isZooming]);

  const handleTouchMove = useCallback((e) => {
    // Two-finger zoom
    if (e.touches.length === 2 && initialTouchRef.current) {
      e.preventDefault();
      e.stopPropagation();
      
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const currentDistance = Math.hypot(
        touch1.clientX - touch2.clientX,
        touch1.clientY - touch2.clientY
      );
      
      const scaleDiff = currentDistance / initialTouchRef.current.distance;
      const newScale = Math.min(Math.max(
        initialTouchRef.current.scale * scaleDiff,
        1
      ), 3);
      
      setScale(newScale);
    } 
    // Single finger handling
    else if (e.touches.length === 1 && !isZooming) {
      // Prevent default to stop scrolling
      e.preventDefault();
      e.stopPropagation();
      
      if (!touchStartRef.current) return;
      
      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      
      // If the vertical movement is more significant, handle page scroll
      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        handleScroll(-deltaY, e);
      }
      
      // Reset touch start to prevent continuous triggering
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      };
    }
  }, [handleScroll, isZooming]);

  const handleTouchEnd = useCallback((e) => {
    if (isZooming) {
      setIsZooming(false);
      initialTouchRef.current = null;
      
      const templateWrapper = containerRef.current?.closest('.template-wrapper');
      if (templateWrapper) {
        templateWrapper.classList.remove('zooming');
      }
      
      setTimeout(() => {
        unlockScroll();
      }, 100);
    }
    
    // Reset touch references
    touchStartRef.current = null;
  }, [isZooming, unlockScroll]);

  const backgroundImageUrl = backgroundImage || image.sample_image || '';

  return (
    <div
      ref={containerRef}
      className={`zoomable-container ${slideDirection ? `slide-${slideDirection}` : ''}`}
      style={{
        width: `${coordinates?.width_in_px || 0}px`,
        height: `${coordinates?.height_in_px || 0}px`,
        top: `${coordinates?.top_in_px || 0}px`,
        left: `${coordinates?.left_in_px || 0}px`,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      aria-label="Zoomable Image"
    >
      <motion.div
        className={`zoomable-image ${scale > 1 ? 'zoomed' : ''}`}
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: backgroundImageUrl ? `url(${backgroundImageUrl})` : 'none',
          backgroundSize: "cover",
          backgroundPosition: "center",
          willChange: "transform"
        }}
        animate={{ 
          scale, 
          x: position.x, 
          y: position.y 
        }}
        transition={{
          type: "spring", 
          stiffness: 300,
          damping: 30,
          mass: 0.5
        }}
        drag={scale > 1}
        dragConstraints={{
          left: -(coordinates?.width_in_px || 0) * (scale - 1) / 2,
          right: (coordinates?.width_in_px || 0) * (scale - 1) / 2,
          top: -(coordinates?.height_in_px || 0) * (scale - 1) / 2,
          bottom: (coordinates?.height_in_px || 0) * (scale - 1) / 2
        }}
        dragElastic={0.1}
        onDragStart={() => setIsZooming(true)}
        onDragEnd={() => setIsZooming(false)}
        dragMomentum={false}
        role="img"
      />
    </div>
  );
};

export default ZoomableImage;