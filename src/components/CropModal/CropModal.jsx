import React, { useState, useCallback } from 'react';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import './CropModal.css';
import { X } from 'lucide-react';

const CropModal = ({ image, onCropComplete, onClose }) => {
  // Initialize crop with default values but no fixed aspect ratio
  const [crop, setCrop] = useState({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  
  const [completedCrop, setCompletedCrop] = useState(null);
  const [imageRef, setImageRef] = useState(null);

  const onImageLoad = useCallback((img) => {
    setImageRef(img);
    
    // Calculate initial crop area that covers most of the image
    // but maintains the image's natural proportions
    const width = img.width;
    const height = img.height;
    
    // Use 90% of the image dimensions for initial crop
    const cropWidth = width * 0.9;
    const cropHeight = height * 0.9;
    
    // Center the crop area
    const x = (width - cropWidth) / 2;
    const y = (height - cropHeight) / 2;
    
    setCrop({
      unit: 'px',
      width: cropWidth,
      height: cropHeight,
      x: x,
      y: y,
    });
  }, []);

  const getCroppedImage = useCallback(() => {
    if (!completedCrop || !imageRef) return;

    const canvas = document.createElement('canvas');
    const scaleX = imageRef.naturalWidth / imageRef.width;
    const scaleY = imageRef.naturalHeight / imageRef.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    const ctx = canvas.getContext('2d');

    // Enable image smoothing for better quality
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      imageRef,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );

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
  }, [completedCrop, imageRef]);

  const handleSave = async () => {
    const croppedImage = await getCroppedImage();
    if (croppedImage) {
      onCropComplete(croppedImage);
      onClose();
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
        <div className="crop-modal-body">
          <ReactCrop
            crop={crop}
            onChange={(_, percentCrop) => setCrop(percentCrop)}
            onComplete={(c) => setCompletedCrop(c)}
           
            className="crop-container"
            minWidth={50} // Smaller minimum width for more flexibility
            minHeight={50} // Smaller minimum height for more flexibility
          >
            <img
              src={image}
              onLoad={(e) => onImageLoad(e.target)}
              alt="Crop"
              style={{
                maxHeight: '70vh',
                width: 'auto',
                maxWidth: '100%'
              }}
            />
          </ReactCrop>
        </div>
        <div className="modal-footer">
          <button className="save-button" onClick={handleSave}>
            Save
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