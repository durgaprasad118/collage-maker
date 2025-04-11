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
        <div className="modal-header bg-white">
          <h3 className="text-lg font-medium text-gray-800">Adjust Photo</h3>
          <button className="close-button text-gray-500 hover:text-gray-700" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
        
        <div className="crop-controls bg-white border-b border-gray-200 p-3 flex justify-center gap-2">
          <button 
            className="crop-control-button bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors" 
            onClick={handleRotateLeft} 
            title="Rotate Left">
            <RefreshCw size={20} className="rotate-counterclockwise text-gray-700" />
          </button>
          <button 
            className="crop-control-button bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors" 
            onClick={handleRotateRight} 
            title="Rotate Right">
            <RotateCw size={20} className="text-gray-700" />
          </button>
          <button 
            className="crop-control-button bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors" 
            onClick={handleZoomIn} 
            title="Zoom In">
            <ZoomIn size={20} className="text-gray-700" />
          </button>
          <button 
            className="crop-control-button bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors" 
            onClick={handleZoomOut} 
            title="Zoom Out">
            <ZoomOut size={20} className="text-gray-700" />
          </button>
          <button 
            className="crop-control-button bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors" 
            onClick={toggleAspectRatio} 
            title="Square/Free Ratio">
            <Maximize size={20} className="text-gray-700" />
          </button>
          <button 
            className="crop-control-button bg-gray-100 hover:bg-gray-200 rounded-md p-2 transition-colors" 
            onClick={handleReset} 
            title="Reset">
            <RefreshCw size={20} className="text-gray-700" />
          </button>
        </div>
        
        <div className="crop-modal-body bg-gray-100 p-4 flex justify-center">
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            className="crop-container max-h-[65vh]"
            style={{
              maxHeight: '65vh',
              width: 'auto',
              height: '450px',
              maxWidth: '100%',
              transform: `scale(${scale}) rotate(${rotation}deg)`,
              transformOrigin: 'center'
            }}
          >
            <img
              alt="Crop"
              src={image}
              onLoad={(e) => onImageLoad(e.currentTarget)}
              style={{ 
                maxHeight: '100%', 
                maxWidth: '100%',
                objectFit: 'contain',
                transform: 'none'
              }}
            />
          </ReactCrop>
        </div>
        
        <div className="modal-footer bg-white p-4 flex justify-end gap-3">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 font-medium"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 font-medium flex items-center gap-2"
            onClick={handleSave}
          >
            <Check size={18} />
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default CropModal;