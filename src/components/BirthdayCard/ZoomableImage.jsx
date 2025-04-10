import React, { useState, useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import './ZoomableImage.css';

// Storage service for image transformations
const TransformStorageService = {
  saveTransform: (key, transform) => {
    try {
      localStorage.setItem(`birthday_transform_${key}`, JSON.stringify(transform));
      return true;
    } catch (error) {
      console.error("Error saving transform:", error);
      return false;
    }
  },

  getTransform: (key) => {
    try {
      const data = localStorage.getItem(`birthday_transform_${key}`);
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
  image = {},
  coordinates = defaultCoordinates,
  backgroundImage = null,
  allTemplates = [],
  currentIndex = 0,
  setCurrentIndex = () => {},
  currentTemplate = null,
  setCurrentTemplate = () => {}
}) => {
  // Generate a unique key for this image based on image coordinates and template index
  const imageKey = `${currentIndex}_${coordinates?.top_in_px}_${coordinates?.left_in_px}`;
  
  // Get saved transform data on initial load
  const savedTransform = TransformStorageService.getTransform(imageKey);
  
  const [isSelected, setIsSelected] = useState(false);
  const [showSaveButton, setShowSaveButton] = useState(false);
  const [isSaved, setIsSaved] = useState(!!savedTransform);

  // Debug logs for image data
  useEffect(() => {
    console.log("ZoomableImage props:", {
      backgroundImage: backgroundImage ? "Present" : "Missing",
      sampleImage: image.sample_image ? "Present" : "Missing",
      imageShape: image.shape || "Default",
      coordinates
    });
  }, [backgroundImage, image, coordinates]);

  // Initialize with saved transform values if available
  const initialScale = savedTransform?.scale || 1;
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
      });
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
        width: `${coordinates?.width_in_px}px`,
        height: `${coordinates?.height_in_px}px`,
        top: `${coordinates?.top_in_px}px`,
        left: `${coordinates?.left_in_px}px`,
        overflow: 'hidden',
        borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
      }}
      onClick={toggleSelect}
    >
      {/* Remove selection border */}
      
      <TransformWrapper
        initialScale={initialScale}
        initialPositionX={initialPositionX}
        initialPositionY={initialPositionY}
        minScale={1}
        maxScale={3}
        limitToBounds={true}
        doubleClick={{
          disabled: false,
          mode: "reset"
        }}
        panning={{
          disabled: !isSelected,
          velocityDisabled: true
        }}
        onTransformed={handleTransformChange}
      >
        {({ state, zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{
                width: '100%',
                height: '100%',
                overflow: 'hidden'
              }}
              contentStyle={{
                width: '100%',
                height: '100%'
              }}
            >
              {/* Direct image rendering with fallbacks */}
              {backgroundImage ? (
                <img 
                  src={backgroundImage}
                  alt="User uploaded"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
                  }}
                />
              ) : image.sample_image ? (
                <img 
                  src={image.sample_image}
                  alt="Sample"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
                  }}
                />
              ) : (
                <div 
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#f0f0f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: image?.shape === 'circle' ? '50%' : 'inherit'
                  }}
                >
                  <span style={{ color: '#777', fontSize: '12px' }}>No image</span>
                </div>
              )}
            </TransformComponent>
            
            {/* Hide save button and zoom controls entirely */}
            {/* We've removed the controls that were previously shown when selected */}
          </>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ZoomableImage;