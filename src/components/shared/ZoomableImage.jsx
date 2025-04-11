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
        min-width: 105% !important;
        min-height: 105% !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Initialize with saved transform values if available
  const initialScale = savedTransform?.scale || 1.3;
  const initialPositionX = savedTransform?.position?.x || 0;
  const initialPositionY = savedTransform?.position?.y || 0;

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
    // Enable panning functionality only, without visual styling changes
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
        initialScale={initialScale}
        initialPositionX={initialPositionX}
        initialPositionY={initialPositionY}
        minScale={1}
        maxScale={3}
        limitToBounds={false}
        centerOnInit={true}
        centerZoomedOut={true}
        doubleClick={{
          disabled: false,
          mode: "reset"
        }}
        panning={{
          disabled: !isSelected,
          velocityDisabled: true,
          lockAxisY: false,
          lockAxisX: false,
          padPinch: false,
        }}
        velocityAnimation={{
          disabled: true
        }}
        wheel={{
          step: 0.1
        }}
        pinch={{
          step: 5
        }}
        scalePadding={{
          disabled: true
        }}
        alignmentAnimation={{
          sizeX: 0,
          sizeY: 0,
          velocityAlignmentTime: 0
        }}
        onTransformed={handleTransformChange}
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
                borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
              }}
            >
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
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
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
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
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