import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './ZoomableImage.css';

// Storage service for image transformations
const TransformStorageService = {
  saveTransform: (key, transform, cardType = 'generic') => {
    try {
      localStorage.setItem(`${cardType}_transform_${key}`, JSON.stringify(transform));
      return true;
    } catch (error) {
      console.error("Error saving transform:", error);
      return false;
    }
  },

  getTransform: (key, cardType = 'generic') => {
    try {
      const data = localStorage.getItem(`${cardType}_transform_${key}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error("Error getting transform:", error);
      return null;
    }
  }
};

const defaultCoordinates = {
  width_in_px: 0,
  height_in_px: 0,
  top_in_px: 0,
  left_in_px: 0
};

const ZoomableImage = ({
  index,
  image = {},
  coordinates = defaultCoordinates,
  backgroundImage = null,
  templateId,
  cardType = 'generic',
  currentIndex = 0,
  allTemplates = [],
  setCurrentIndex = () => {},
  currentTemplate = null,
  setCurrentTemplate = () => {},
  onAddImageClick = () => {}
}) => {
  // Generate a unique key for this image based on image coordinates and template index
  const imageKey = `${currentIndex || index}_${coordinates?.top_in_px}_${coordinates?.left_in_px}`;
  
  // Get saved transform data on initial load
  const savedTransform = TransformStorageService.getTransform(imageKey, cardType);
  
  const [isSelected, setIsSelected] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isSaved, setIsSaved] = useState(!!savedTransform);

  // Debug logs for image data
  useEffect(() => {
    console.log("ZoomableImage props:", {
      backgroundImage: backgroundImage ? "Present" : "Missing",
      sampleImage: image?.sample_image ? "Present" : "Missing",
      imageShape: image?.shape || "Default",
      coordinates
    });
  }, [backgroundImage, image, coordinates]);

  // Initialize with saved transform values if available
  const initialScale = savedTransform?.scale || 1.3;
  const initialPositionX = savedTransform?.position?.x || 0;
  const initialPositionY = savedTransform?.position?.y || 0;

  // Reference to the transform wrapper instance
  const transformRef = React.useRef(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add CSS for high-quality image rendering during export
  useEffect(() => {
    // Create style element for high-res images during export
    const style = document.createElement('style');
    style.innerHTML = `
      @media print, (min-resolution: 300dpi) {
        .zoomable-container img {
          image-rendering: crisp-edges;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
      }
      
      .zoomable-container img {
        object-fit: cover !important;
        min-width: 100% !important;
        min-height: 100% !important;
        transform-origin: center center !important;
        max-width: unset !important;
        max-height: unset !important;
      }
      
      /* Prevent image leaking outside container */
      .zoomable-container {
        isolation: isolate;
      }
      
      .zoomable-container .react-transform-wrapper {
        overflow: hidden !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Ensure image stays within bounds after scale changes
  useEffect(() => {
    if (transformRef.current && isSelected) {
      const { state, instance } = transformRef.current;
      if (state && instance) {
        // Small delay to ensure the transform state is updated
        setTimeout(() => {
          constrainPosition(state, instance);
        }, 50);
      }
    }
  }, [isSelected]);

  // Save transformation state
  const saveTransform = (state) => {
    if (!state) return;
    
    const { scale, positionX, positionY } = state;
    
    if (scale !== 1 || positionX !== 0 || positionY !== 0) {
      TransformStorageService.saveTransform(imageKey, {
        scale,
        position: { x: positionX, y: positionY }
      }, cardType);
      setIsSaved(true);
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'image-save-toast';
      toast.textContent = 'Image position saved!';
      document.body.appendChild(toast);
      setTimeout(() => {
        toast.classList.add('image-save-toast-hidden');
        setTimeout(() => document.body.removeChild(toast), 300);
      }, 2000);
    }
  };

  // Toggle selection state for panning only, without visual selection indicators
  const toggleSelect = (e) => {
    e.stopPropagation();
    
    // On mobile, always keep selected state true for easier manipulation
    if (isMobile) {
      setIsSelected(true);
      return;
    }
    
    // Desktop behavior
    setIsSelected(!isSelected);
    
    if (!isSelected) {
      const handleOutsideClick = (event) => {
        const container = e.currentTarget;
        if (container && !container.contains(event.target)) {
          setIsSelected(false);
          document.removeEventListener('click', handleOutsideClick);
        }
      };
      
      setTimeout(() => {
        document.addEventListener('click', handleOutsideClick);
      }, 0);
    }
  };

  // Show/hide save button based on transform state
  const handleTransformChange = ({ state, instance }) => {
    if (!state) return;
    
    const hasTransformation = state.scale !== 1 || state.positionX !== 0 || state.positionY !== 0;
    
    setShowSaveButton(hasTransformation);
    if (hasTransformation) {
      setIsSaved(false);
    }
  };

  // Calculate the bounds for panning based on the scale
  const calculateBounds = (state) => {
    if (!state) return { minPositionX: 0, maxPositionX: 0, minPositionY: 0, maxPositionY: 0 };
    
    const { scale } = state;
    // Calculate how much extra space the scaled image takes
    const extraWidth = (scale - 1) * coordinates.width_in_px;
    const extraHeight = (scale - 1) * coordinates.height_in_px;
    
    // Tighter constraints to prevent image edges from showing
    // This accounts for the min-width: 100% on the image
    return {
      minPositionX: Math.min(-extraWidth / 2, 0),
      maxPositionX: Math.max(extraWidth / 2, 0),
      minPositionY: Math.min(-extraHeight / 2, 0),
      maxPositionY: Math.max(extraHeight / 2, 0)
    };
  };

  // Constrain the position within the calculated bounds
  const constrainPosition = (state, instance) => {
    if (!state || !instance) return;
    
    const bounds = calculateBounds(state);
    const { positionX, positionY, scale } = state;
    
    let newX = positionX;
    let newY = positionY;
    
    // Constrain X position
    if (positionX < bounds.minPositionX) {
      newX = bounds.minPositionX;
    } else if (positionX > bounds.maxPositionX) {
      newX = bounds.maxPositionX;
    }
    
    // Constrain Y position
    if (positionY < bounds.minPositionY) {
      newY = bounds.minPositionY;
    } else if (positionY > bounds.maxPositionY) {
      newY = bounds.maxPositionY;
    }
    
    // Apply the constrained position
    if (newX !== positionX || newY !== positionY) {
      instance.setTransform(newX, newY, scale, 100); // Add smoothness with 100ms transition
    }
  };

  // Custom reset handler to ensure image is properly centered
  const handleReset = (resetTransform) => {
    resetTransform();
    // Save the reset state
    if (transformRef.current) {
      const { state } = transformRef.current;
      if (state) {
        saveTransform({
          scale: 1,
          positionX: 0,
          positionY: 0
        });
      }
    }
  };

  return (
    <div 
      className="zoomable-container"
      style={{
        position: 'absolute',
        width: `${coordinates?.width_in_px || 0}px`,
        height: `${coordinates?.height_in_px || 0}px`,
        top: `${coordinates?.top_in_px || 0}px`,
        left: `${coordinates?.left_in_px || 0}px`,
        overflow: 'hidden',
        borderRadius: image?.shape === 'circle' ? '50%' : 'inherit',
        boxSizing: 'border-box'
      }}
      onClick={toggleSelect}
      aria-label="Zoomable Image"
    >
      <TransformWrapper
        ref={transformRef}
        initialScale={initialScale}
        initialPositionX={initialPositionX}
        initialPositionY={initialPositionY}
        minScale={1}
        maxScale={3}
        limitToBounds={true}
        boundsTolerance={0.1} // Adds slight tolerance to bounds
        centerOnInit={true}
        centerZoomedOut={true}
        doubleClick={{
          disabled: false,
          mode: "reset",
          onDoubleClick: () => {
            if (transformRef.current) {
              const { resetTransform } = transformRef.current;
              handleReset(resetTransform);
            }
          }
        }}
        panning={{
          disabled: !isSelected && !isMobile, // Enable panning on mobile regardless of selection
          velocityDisabled: false, // Enable velocity for smoother mobile experience
          lockAxisY: false,
          lockAxisX: false,
          activationKeys: ['Alt'], // Use Alt key on desktop
          excluded: ['button', 'a'], // Don't trigger panning on buttons
          padPinch: false,
          bounds: "parent",
          touchPadding: 50 // Larger touch area for better mobile experience
        }}
        velocityAnimation={{
          disabled: false, // Enable for smoother mobile experience
          sensitivity: 1,
          animationTime: 300,
          equalToMove: true
        }}
        wheel={{
          step: 0.1,
          touchPadding: isMobile ? 100 : 50 // More sensitive on mobile
        }}
        pinch={{
          step: isMobile ? 10 : 5, // More sensitive pinch zoom on mobile
          disabled: false
        }}
        scalePadding={{
          disabled: false,
          animationTime: 300,
          animationType: "easeOut"
        }}
        alignmentAnimation={{
          sizeX: coordinates?.width_in_px || 0,
          sizeY: coordinates?.height_in_px || 0,
          velocityAlignmentTime: 300
        }}
        onTransformed={handleTransformChange}
        onTransforming={({ state, instance }) => constrainPosition(state, instance)}
        onZoomChange={({ state, instance }) => constrainPosition(state, instance)}
        onInit={({ instance }) => {
          // Initial constraint after mounting
          if (savedTransform) {
            // Need a small delay to let the component fully initialize
            setTimeout(() => {
              constrainPosition(instance.state, instance);
            }, 100);
          }
        }}
      >
        {({ state, zoomIn, zoomOut, resetTransform }) => (
          <TransformComponent
            wrapperStyle={{
              width: '100%',
              height: '100%',
              overflow: 'hidden'
            }}
            contentStyle={{
              width: '100%',
              height: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}
            wrapperProps={{
              'data-high-res': 'true'
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: backgroundImage ? 'transparent' : '#f0f0f0',
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                borderRadius: image?.shape === 'circle' ? '50%' : 'inherit',
                position: "relative"
              }}
            >
              {isSelected && !isMobile && (
                <div 
                  className="image-controls"
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    display: 'flex',
                    gap: '6px',
                    zIndex: 5
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleReset(resetTransform);
                    }}
                    style={{
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '10px',
                      cursor: 'pointer'
                    }}
                  >
                    Reset
                  </button>
                  {showSaveButton && !isSaved && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveTransform(state);
                      }}
                      style={{
                        backgroundColor: 'rgba(0, 123, 255, 0.8)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        fontSize: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                  )}
                </div>
              )}
              {backgroundImage ? (
                <img
                  src={backgroundImage}
                  alt=""
                  style={{
                    minWidth: "100%",
                    minHeight: "100%",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    imageRendering: "high-quality",
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit',
                    touchAction: "none" // Prevents browser handling of gestures
                  }}
                  crossOrigin="anonymous"
                  loading="eager"
                  decoding="sync"
                  data-high-quality="true"
                  draggable="false"
                />
              ) : image?.sample_image ? (
                <img 
                  src={image.sample_image}
                  alt="Sample"
                  style={{
                    minWidth: "100%",
                    minHeight: "100%",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    objectPosition: "center",
                    imageRendering: "high-quality",
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit',
                    touchAction: "none" // Prevents browser handling of gestures
                  }}
                  crossOrigin="anonymous"
                  loading="eager"
                  decoding="sync"
                  data-high-quality="true"
                  draggable="false"
                />
              ) : (
                <div 
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(93, 95, 239, 0.05)',
                    borderRadius: image?.shape === 'circle' ? '50%' : '8px',
                    border: '1px dashed #5D5FEF',
                    cursor: 'pointer'
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddImageClick(index);
                  }}
                >
                  <div style={{
                    borderRadius: '50%',
                    width: '32px',
                    height: '32px',
                    backgroundColor: 'rgba(93, 95, 239, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '6px'
                  }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5D5FEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <span style={{ color: '#aaa', fontSize: '11px', fontWeight: '500' }}>Add image</span>
                </div>
              )}
            </div>
          </TransformComponent>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ZoomableImage; 