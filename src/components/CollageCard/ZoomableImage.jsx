import React, { useEffect } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';

const defaultCoordinates = {
  width_in_px: 0,
  height_in_px: 0,
  top_in_px: 0,
  left_in_px: 0
};

const ZoomableImage = ({
  index,
  coordinates = defaultCoordinates,
  backgroundImage = null,
  templateId
}) => {
  // Default zoom level for all images
  const initialScale = 1.3;
  
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

  return (
    <div
      className="zoomable-container"
      style={{
        width: `${coordinates?.width_in_px || 0}px`,
        height: `${coordinates?.height_in_px || 0}px`,
        top: `${coordinates?.top_in_px || 0}px`,
        left: `${coordinates?.left_in_px || 0}px`,
        position: 'absolute',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}
      aria-label="Zoomable Image"
    >
      <TransformWrapper
        initialScale={initialScale}
        initialPositionX={0}
        initialPositionY={0}
        minScale={1}
        maxScale={3}
        limitToBounds={false}
        centerOnInit={true}
        centerZoomedOut={true}
        panning={{
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
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
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
                overflow: "hidden"
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
                    imageRendering: "high-quality"
                  }}
                  crossOrigin="anonymous"
                  loading="eager"
                  decoding="sync"
                  data-high-quality="true"
                  draggable="false"
                />
              ) : (
                <span style={{ color: '#777', fontSize: '12px' }}>No image</span>
              )}
            </div>
          </TransformComponent>
        )}
      </TransformWrapper>
    </div>
  );
};

export default ZoomableImage; 