import React, { useState, useCallback, useRef, useEffect } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropModal.css';
import { X, RotateCw, ZoomIn, ZoomOut, RefreshCw, Maximize, Check } from 'lucide-react';

// Helper function to center and make aspect crop
function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const CropModal = ({ image, onCropComplete, onClose }) => {
  // Initialize crop to cover the entire image (all four corners)
  const [crop, setCrop] = useState({
    unit: 'px',
    width: 0,
    height: 0,
    x: 0,
    y: 0
  });
  const [completedCrop, setCompletedCrop] = useState(null);
  const [aspect, setAspect] = useState(undefined);
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const [imageRef, setImageRef] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const previewCanvasRef = useRef(null);

  // Set full image crop when image loads or rotation/scale changes
  useEffect(() => {
    if (imageRef) {
      // Create a crop that exactly matches the image dimensions
      const fullCrop = {
        unit: 'px',
        width: imageRef.width,
        height: imageRef.height,
        x: 0,
        y: 0
      };
      
      setCrop(fullCrop);
      setCompletedCrop(fullCrop);
    }
  }, [imageRef, rotation, scale]);

  const onImageLoad = useCallback((img) => {
    setImageRef(img);
    setImageDimensions({ width: img.width, height: img.height });
    
    // Set exact pixel-based crop to match image dimensions
    const fullCrop = {
      unit: 'px',
      width: img.width,
      height: img.height,
      x: 0,
      y: 0
    };
    
    setCrop(fullCrop);
    setCompletedCrop(fullCrop);
  }, []);

  const getCroppedImage = useCallback(() => {
    if (!completedCrop || !imageRef) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    const ctx = canvas.getContext('2d');

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Apply rotation and scaling
    const TO_RADIANS = Math.PI / 180;
    
    // Save the current state
    ctx.save();
    
    // Move to the center of the canvas
    ctx.translate(canvas.width / 2, canvas.height / 2);
    
    // Rotate the canvas
    if (rotation !== 0) {
      ctx.rotate(rotation * TO_RADIANS);
    }
    
    // Scale the canvas
    if (scale !== 1) {
      ctx.scale(scale, scale);
    }
    
    // Draw the image centered on the canvas
    ctx.drawImage(
      imageRef,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      -canvas.width / 2,
      -canvas.height / 2,
      canvas.width,
      canvas.height
    );
    
    // Restore the saved state
    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onloadend = () => {
            resolve(reader.result);
          };
        },
        'image/jpeg',
        1
      );
    });
  }, [completedCrop, imageRef, rotation, scale]);

  const handleSave = async () => {
    const croppedImage = await getCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onClose();
    }
  };
  
  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90) % 360);
  };
  
  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };
  
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.1, 0.5));
  };
  
  const handleReset = () => {
    // Reset to full image with exact dimensions
    if (imageRef) {
      const fullCrop = {
        unit: 'px',
        width: imageRef.width,
        height: imageRef.height,
        x: 0,
        y: 0
      };
      
      setCrop(fullCrop);
      setCompletedCrop(fullCrop);
    }
    
    setRotation(0);
    setScale(1);
    setAspect(undefined);
  };
  
  const toggleAspectRatio = () => {
    if (aspect) {
      setAspect(undefined);
      // When returning to free form, reset to full image
      if (imageRef) {
        setCrop({
          unit: 'px',
          width: imageRef.width,
          height: imageRef.height,
          x: 0,
          y: 0
        });
      }
    } else {
      setAspect(1);
      if (imageRef) {
        const { width, height } = imageRef;
        setCrop(centerAspectCrop(width, height, 1));
      }
    }
  };

  return (
    <div className="crop-modal-overlay">
      <div className="crop-modal-content">
        <div className="modal-header">
          <h3>Crop Image</h3>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="crop-controls">
          <button className="crop-control-button" onClick={handleRotateLeft} title="Rotate Left">
            <RefreshCw size={20} className="rotate-counterclockwise" />
          </button>
          <button className="crop-control-button" onClick={handleRotateRight} title="Rotate Right">
            <RotateCw size={20} />
          </button>
          <button className="crop-control-button" onClick={handleZoomIn} title="Zoom In">
            <ZoomIn size={20} />
          </button>
          <button className="crop-control-button" onClick={handleZoomOut} title="Zoom Out">
            <ZoomOut size={20} />
          </button>
          <button className="crop-control-button" onClick={toggleAspectRatio} title="Square/Free Ratio">
            <Maximize size={20} />
          </button>
          <button className="crop-control-button" onClick={handleReset} title="Reset">
            <RefreshCw size={20} />
          </button>
        </div>
        
        <div className="crop-modal-body">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            className="crop-container"
            style={{
              maxHeight: '65vh',
              width: 'auto',
              height: '450px',
              maxWidth: '100%',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transition: 'transform 0.3s ease'
            }}
            minWidth={10}
            minHeight={10}
            keepSelection={true}
            ruleOfThirds={true}
          >
            <img
              src={image}
              onLoad={(e) => onImageLoad(e.target)}
              alt="Crop"
              style={{
                maxHeight: '65vh',
                width: 'auto',
                height: '450px',
                maxWidth: '100%',
                transform: `scale(${scale}) rotate(${rotation}deg)`,
                transition: 'transform 0.3s ease'
              }}
            />
          </ReactCrop>
        </div>
        
        <div className="modal-footer">
          <button className="save-button" onClick={handleSave}>
            <Check size={16} /> Apply
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;