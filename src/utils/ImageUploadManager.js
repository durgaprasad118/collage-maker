// Utility for handling image uploads across different card types
import { useState, useCallback, useEffect } from 'react';

// Create an in-memory storage for images
export const memoryStorage = {
  images: {},
  metadata: {},
  textData: {}
};

// Image Storage Service
export const ImageStorageService = {
  saveImage: async (key, imageData) => {
    try {
      memoryStorage.images[key] = imageData;
      return true;
    } catch (error) {
      console.error("Error saving image:", error);
      return false;
    }
  },

  getImage: async (key) => {
    try {
      return memoryStorage.images[key] || null;
    } catch (error) {
      console.error("Error getting image:", error);
      return null;
    }
  },

  removeImage: async (key) => {
    try {
      if (memoryStorage.images[key]) {
        delete memoryStorage.images[key];
      }
      return true;
    } catch (error) {
      console.error("Error removing image:", error);
      return false;
    }
  },
};

// Image compression utility
export const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Advanced scaling with preservation of details
        const maxDimension = 2560; // Higher max dimension for more clarity
        const scaleFactor = Math.min(
          maxDimension / img.width, 
          maxDimension / img.height, 
          1
        );

        const width = Math.round(img.width * scaleFactor);
        const height = Math.round(img.height * scaleFactor);

        // High-quality rendering settings
        canvas.width = width;
        canvas.height = height;
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Use higher bit depth for color preservation
        ctx.globalCompositeOperation = 'source-over';

        // Draw image with high-quality scaling
        ctx.drawImage(img, 0, 0, width, height);

        // Advanced compression with multiple quality attempts
        const qualities = [1, 0.95, 0.92, 0.90, 0.85];
        
        for (let quality of qualities) {
          const compressedImage = canvas.toDataURL("image/webp", quality);
          const size = new Blob([compressedImage]).size;

          if (size <= 5 * 1024 * 1024) {
            resolve(compressedImage);
            return;
          }
        }

        // Fallback to last compression attempt
        resolve(canvas.toDataURL("image/webp", 0.85));
      };

      img.onerror = () => reject(new Error("Image load failed"));
      img.src = event.target.result;
    };

    reader.readAsDataURL(file);
  });
};

// Main hook for image upload management
export const useImageUpload = (currentTemplate) => {
  const [photos, setPhotos] = useState({});
  const [photoMetadata, setPhotoMetadata] = useState({});
  const [uploadError, setUploadError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  // Initialize photos state based on template
  useEffect(() => {
    if (currentTemplate?.images?.length > 0) {
      const initialPhotos = {};
      const initialMetadata = {};
      
      currentTemplate.images.forEach((image, index) => {
        const photoKey = `photo_${index}`;
        initialPhotos[photoKey] = null;
        initialMetadata[photoKey] = false;
      });
      
      setPhotos(prev => ({
        ...prev,
        ...initialPhotos
      }));
      setPhotoMetadata(prev => ({
        ...prev,
        ...initialMetadata
      }));
    }
  }, [currentTemplate]);

  // Load saved data
  const loadSavedData = useCallback(async () => {
    try {
      // Use memory storage for metadata
      if (memoryStorage.metadata && Object.keys(memoryStorage.metadata).length > 0) {
        setPhotoMetadata(memoryStorage.metadata);

        // Load all saved photos based on metadata
        const photoPromises = Object.entries(memoryStorage.metadata)
          .filter(([key, exists]) => exists && key.startsWith('photo_'))
          .map(async ([key]) => {
            const photo = await ImageStorageService.getImage(key);
            if (photo) {
              return { key, photo };
            }
            return null;
          });

        const loadedPhotos = await Promise.all(photoPromises);
        const photoData = loadedPhotos.reduce((acc, item) => {
          if (item) {
            acc[item.key] = item.photo;
          }
          return acc;
        }, {});

        if (Object.keys(photoData).length) {
          setPhotos(prev => ({
            ...prev,
            ...photoData
          }));
        }
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Validate image before processing
  const validateImage = (file) => {
    // Reset any previous errors
    setUploadError(null);
    
    // Check if file exists
    if (!file) {
      setUploadError("No file selected");
      return false;
    }
    
    // Check if file is an image
    if (!file.type.match('image.*')) {
      setUploadError("Please select an image file (JPEG, PNG, etc.)");
      return false;
    }
    
    // Check file size (5MB limit)
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > 5) {
      setUploadError("Image is too large (max 5MB)");
      // We'll still return true and let the compressImage function handle it
    }
    
    return true;
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
      // Find the file-drop-inner element and add dragActive class
      const dropArea = e.currentTarget;
      if (dropArea) dropArea.classList.add('dragActive');
    } else if (e.type === "dragleave") {
      setDragActive(false);
      // Find the file-drop-inner element and remove dragActive class
      const dropArea = e.currentTarget;
      if (dropArea) dropArea.classList.remove('dragActive');
    }
  };

  // Handle drop event
  const handleDrop = (e, photoKey) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Remove dragActive class
    const dropArea = e.currentTarget;
    if (dropArea) dropArea.classList.remove('dragActive');
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (validateImage(file)) {
        handlePhotoChange(photoKey, file);
      }
    }
  };

  // Handle multiple image drop
  const handleMultipleImageDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Remove dragActive class
    const dropArea = e.currentTarget;
    if (dropArea) dropArea.classList.remove('dragActive');
    
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    
    setUploadError(null);
    
    // Limit to the number of images in the template
    const imageCount = currentTemplate?.images?.length || 0;
    const filesToProcess = files.slice(0, imageCount);
    
    // Process each file and save to the appropriate photo slot
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const photoKey = `photo_${i}`;
      
      if (validateImage(file)) {
        await handlePhotoChange(photoKey, file);
      }
    }
  };

  // Handle multiple image selection
  const handleMultipleImageSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setUploadError(null);
    
    // Limit to the number of images in the template
    const imageCount = currentTemplate?.images?.length || 0;
    const filesToProcess = files.slice(0, imageCount);
    
    // Process each file and save to the appropriate photo slot
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      const photoKey = `photo_${i}`;
      
      if (validateImage(file)) {
        await handlePhotoChange(photoKey, file);
      }
    }
  };

  // Photo handling
  const handlePhotoChange = useCallback(async (name, file) => {
    if (!file) return;
  
    try {
      setUploadError(null);
      
      // Validate the file
      if (!validateImage(file)) {
        return;
      }
      
      // Compress image if it exceeds 5MB
      let imageData = null;
      
      if (file.size > 5 * 1024 * 1024) {
        imageData = await compressImage(file);
      } else {
        // Convert file to base64
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }

      // Save the image directly
      const saveResult = await ImageStorageService.saveImage(name, imageData);

      if (!saveResult) {
        throw new Error("Failed to save image to storage");
      }

      setPhotos((prev) => ({
        ...prev,
        [name]: imageData,
      }));

      const newMetadata = {
        ...photoMetadata,
        [name]: true,
      };
      setPhotoMetadata(newMetadata);
      memoryStorage.metadata = newMetadata;
      
    } catch (error) {
      console.error("Error handling photo:", error);
      setUploadError("Error processing photo. Please try again with a different image.");
    }
  }, [photoMetadata]);

  // Remove photo
  const handlePhotoRemove = useCallback(async (photoKey) => {
    try {
      // Remove image from memory storage
      await ImageStorageService.removeImage(photoKey);

      // Update photos state
      setPhotos((prev) => {
        const newPhotos = { ...prev };
        delete newPhotos[photoKey];
        return newPhotos;
      });

      // Update metadata in memory
      const newMetadata = {
        ...photoMetadata,
        [photoKey]: false,
      };
      setPhotoMetadata(newMetadata);
      memoryStorage.metadata = newMetadata; // Store in memory
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Error removing photo. Please try again.");
    }
  }, [photoMetadata]);

  // Return the necessary functions and state
  return {
    photos,
    photoMetadata,
    uploadError,
    dragActive,
    handleDrag,
    handleDrop,
    handlePhotoChange,
    handlePhotoRemove,
    handleMultipleImageDrop,
    handleMultipleImageSelect,
    validateImage,
  };
};

// Shared upload modal component
export const renderImageUploadModal = ({
  isOpen,
  onClose,
  currentTemplate,
  photos,
  uploadError,
  handleDrag,
  handleDrop,
  handlePhotoRemove,
  handlePhotoChange,
  handleMultipleImageDrop,
  handleMultipleImageSelect,
}) => {
  if (!isOpen || !currentTemplate) return null;

  // Count images in current template
  const imageCount = currentTemplate?.images?.length || 0;
  const isCollage = imageCount > 1;
  const cardType = isCollage ? "Collage" : "Birthday";

  // Create a unique ID for the file input to prevent duplicates
  const fileInputId = isCollage ? "multiple-photo-input" : "photo-input-0";

  return {
    isCollage,
    imageCount,
    headerTitle: `Upload ${cardType} Photo${isCollage ? 's' : ''}`,
    modalStyles: {
      overlay: {
        padding: '16px'
      },
      content: {
        maxWidth: '90%',
        width: '600px',
        maxHeight: '90vh',
        margin: '0 auto',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#1E1E1E',
        border: 'none',
        boxSizing: 'border-box',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      },
      header: {
        padding: '20px',
        borderBottom: '1px solid #333',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: '#1E1E1E',
        color: 'white',
        boxSizing: 'border-box'
      },
      body: {
        padding: '24px',
        flex: '1 1 auto',
        overflowY: 'auto',
        overflowX: 'hidden',
        background: '#1E1E1E',
        color: 'white',
        boxSizing: 'border-box'
      },
      footer: {
        padding: '20px',
        borderTop: '1px solid #333',
        display: 'flex',
        justifyContent: 'flex-end',
        background: '#1E1E1E',
        boxSizing: 'border-box'
      }
    },
    renderUploadArea: () => {
      if (isCollage) {
        // Multiple image upload for collage
        return (
          <div className="collage-upload-container">
            <label htmlFor={fileInputId} className="file-drop-area" style={{
              width: '100%',
              minHeight: '200px',
              borderRadius: '12px',
              border: '2px dashed #5D5FEF',
              backgroundColor: '#1A1A1A',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxSizing: 'border-box',
              boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)',
              margin: '0 auto'
            }}>
              <div 
                className="file-drop-inner"
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={(e) => handleMultipleImageDrop(e)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  width: '100%'
                }}
              >
                <div className="file-icon">
                  <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M28 14V42" stroke="#5D5FEF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M14 28L28 14L42 28" stroke="#5D5FEF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <p className="file-main-text" style={{color: 'white', margin: '10px 0', fontSize: '16px'}}>Upload {imageCount} Photos</p>
                <p className="file-sub-text" style={{color: '#888', margin: '4px 0'}}>or</p>
                <button 
                  className="upload-button" 
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(fileInputId).click();
                  }}
                  style={{
                    background: '#5D5FEF',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '13px 36px',
                    fontSize: '15px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    margin: '8px 0 12px'
                  }}
                >
                  Browse Files
                </button>
                <p className="file-format-text" style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>JPG, PNG, WebP up to 5MB each</p>
                <p className="file-format-text" style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>Select {imageCount} images at once</p>
                {uploadError && <p className="upload-error" style={{ color: '#ff4d4d', fontSize: '13px', marginTop: '10px' }}>{uploadError}</p>}
              </div>
            </label>
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              multiple
              onChange={handleMultipleImageSelect}
              style={{ display: "none" }}
            />
          </div>
        );
      } else {
        // Single image upload
        return (
          <div className="file-upload-container" style={{ width: '100%' }}>
            {!photos.photo_0 ? (
              <label htmlFor={fileInputId} className="file-drop-area" style={{
                width: '100%',
                minHeight: '200px',
                borderRadius: '12px',
                border: '2px dashed #5D5FEF',
                backgroundColor: 'rgba(93, 95, 239, 0.05)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '20px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxSizing: 'border-box',
                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.1)',
                margin: '0 auto'
              }}>
                <div 
                  className="file-drop-inner"
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={(e) => handleDrop(e, "photo_0")}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '100%'
                  }}
                >
                  <div className="file-icon">
                    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M28 14V42" stroke="#5D5FEF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M14 28L28 14L42 28" stroke="#5D5FEF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <p className="file-main-text">Drag and drop image here</p>
                  <p className="file-sub-text">or</p>
                  <button 
                    className="upload-button" 
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(fileInputId).click();
                    }}
                    style={{
                      background: '#5D5FEF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '13px 36px',
                      fontSize: '15px',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      margin: '8px 0 12px'
                    }}
                  >
                    Browse Files
                  </button>
                  <p className="file-format-text" style={{ fontSize: '12px', color: '#888', margin: '4px 0 0' }}>JPG, PNG, WebP up to 5MB</p>
                  {uploadError && <p className="upload-error" style={{ color: '#ff4d4d', fontSize: '13px', marginTop: '10px' }}>{uploadError}</p>}
                </div>
              </label>
            ) : (
              <div className="image-preview-container" style={{
                borderRadius: '12px',
                overflow: 'hidden',
                position: 'relative',
                width: '100%',
                aspectRatio: '4/3',
                maxWidth: '500px',
                margin: '0 auto',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
              }}>
                <img
                  src={photos.photo_0}
                  alt="Card Photo"
                  className="image-preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                />
                <div className="image-actions" style={{
                  position: 'absolute',
                  bottom: '0',
                  left: '0',
                  right: '0',
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  padding: '12px',
                  backgroundColor: 'rgba(0, 0, 0, 0.7)'
                }}>
                  <button
                    className="action-button change-button"
                    onClick={() => document.getElementById(fileInputId).click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#5D5FEF',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                    Change
                  </button>
                  <button
                    className="action-button remove-button"
                    onClick={() => handlePhotoRemove("photo_0")}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: '#FF4D4D',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '8px 16px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      <line x1="10" y1="11" x2="10" y2="17"></line>
                      <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                    Remove
                  </button>
                </div>
              </div>
            )}
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) handlePhotoChange("photo_0", file);
              }}
              style={{ display: "none" }}
            />
          </div>
        );
      }
    },
    renderPreviewGrid: () => {
      if (!isCollage) return null;
      
      return (
        Object.values(photos).some(photo => photo) && (
          <div className="collage-preview-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
            gap: '16px',
            marginTop: '24px',
            maxHeight: '300px',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px 0',
            boxSizing: 'border-box',
            width: '100%'
          }}>
            {currentTemplate?.images.map((image, index) => {
              const photoKey = `photo_${index}`;
              return photos[photoKey] ? (
                <div key={index} className="collage-preview-item" style={{
                  position: 'relative',
                  aspectRatio: '1/1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                }}>
                  <div className="image-preview-container" style={{ 
                    width: '100%',
                    height: '100%',
                    position: 'relative'
                  }}>
                    <img
                      src={photos[photoKey]}
                      alt={`Image ${index + 1}`}
                      className="image-preview"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                    />
                    <div className="image-number" style={{
                      position: 'absolute',
                      top: '8px',
                      left: '8px',
                      backgroundColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'white',
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold'
                    }}>{index + 1}</div>
                    <button
                      className="collage-remove-button"
                      onClick={() => handlePhotoRemove(photoKey)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        backgroundColor: 'rgba(255, 0, 0, 0.7)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        color: 'white'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              ) : (
                <div key={index} className="collage-empty-item" style={{
                  position: 'relative',
                  aspectRatio: '1/1',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  backgroundColor: '#272731',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  border: '1px dashed #5D5FEF'
                }}
                onClick={() => {
                  document.getElementById(fileInputId).click();
                }}
                >
                  <div className="image-number" style={{
                    position: 'absolute',
                    top: '8px',
                    left: '8px',
                    backgroundColor: 'rgba(93, 95, 239, 0.8)',
                    color: 'white',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>{index + 1}</div>

                  <div style={{
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    backgroundColor: 'rgba(93, 95, 239, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '8px'
                  }}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5D5FEF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                  </div>
                  <p style={{
                    margin: '0',
                    fontSize: '12px',
                    color: '#aaa',
                    fontWeight: '500'
                  }}>Add image</p>
                </div>
              );
            })}
          </div>
        )
      );
    }
  };
}; 