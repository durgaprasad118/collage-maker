// Utility for handling image uploads across different card types
import { useState, useCallback, useEffect } from 'react';

// Create an in-memory storage for images
export const memoryStorage = {
  images: {},
  metadata: {},
  textData: {}
};

// Add a custom modal state for alerts
export const modalAlertState = {
  isOpen: false,
  message: '',
  onConfirm: null,
  onCancel: null
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
    
    // If more images are dropped than required, limit to the first N
    console.log(`Dropped ${files.length} images, template requires ${imageCount}`);
    if (files.length > imageCount) {
      console.log(`Limiting to first ${imageCount} images`);
      showNotificationToast(`Using only the first ${imageCount} ${imageCount === 1 ? 'image' : 'images'} from your selection.`);
    }
    
    const filesToProcess = files.slice(0, imageCount);
    
    // Get the empty slots
    const emptySlots = [];
    for (let i = 0; i < imageCount; i++) {
      const photoKey = `photo_${i}`;
      if (!photos[photoKey]) {
        emptySlots.push(i);
      }
    }
    
    // Process each file and save to the appropriate photo slot
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      // Find the first empty slot or use the next available slot in sequence
      let targetIndex;
      if (emptySlots.length > i) {
        targetIndex = emptySlots[i];
      } else {
        // If no empty slots remain, we'll overwrite existing images starting from the beginning
        targetIndex = i % imageCount;
      }
      
      const photoKey = `photo_${targetIndex}`;
      
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
    
    // If more images are selected than required, limit to the first N
    console.log(`Selected ${files.length} images, template requires ${imageCount}`);
    if (files.length > imageCount) {
      console.log(`Limiting to first ${imageCount} images`);
      showNotificationToast(`Using only the first ${imageCount} ${imageCount === 1 ? 'image' : 'images'} from your selection.`);
    }
    
    const filesToProcess = files.slice(0, imageCount);
    
    // Get the empty slots
    const emptySlots = [];
    for (let i = 0; i < imageCount; i++) {
      const photoKey = `photo_${i}`;
      if (!photos[photoKey]) {
        emptySlots.push(i);
      }
    }
    
    // Process each file and save to the appropriate photo slot
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      
      // Find the first empty slot or use the next available slot in sequence
      let targetIndex;
      if (emptySlots.length > i) {
        targetIndex = emptySlots[i];
      } else {
        // If no empty slots remain, we'll overwrite existing images starting from the beginning
        targetIndex = i % imageCount;
      }
      
      const photoKey = `photo_${targetIndex}`;
      
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

// Function to check if all required images are uploaded
export const checkRequiredImages = (photos, imageCount) => {
  if (!imageCount || imageCount <= 0) return true;
  
  // Count how many images are uploaded
  let uploadedCount = 0;
  for (let i = 0; i < imageCount; i++) {
    if (photos[`photo_${i}`]) {
      uploadedCount++;
    }
  }

  // Return true if all images are uploaded, false otherwise
  return uploadedCount === imageCount;
};

// Function to validate all required text fields
export const validateTextFields = (currentTemplate, customText, inputValues) => {
  if (!currentTemplate?.texts || currentTemplate.texts.length === 0) {
    return true; // No text fields to validate
  }
  
  // Check all text fields
  for (const field of currentTemplate.texts) {
    const isDateOrTime = field.name.includes('date') || field.name.includes('time');
    const value = isDateOrTime ? inputValues[field.name] : customText[field.name];
    
    if (!value || value.trim() === '') {
      return false; // Found an empty required field
    }
  }
  
  return true; // All fields are filled
};

// Function to show a modal alert for empty text fields
export const showTextFieldsAlert = (onConfirm, onCancel) => {
  const confirmMessage = `Some required text fields are empty. 
Would you like to proceed with sample texts for the empty fields?`;
  
  showAlertModal(
    confirmMessage,
    () => {
      console.log("User confirmed to use sample texts");
      if (onConfirm) onConfirm();
    },
    () => {
      console.log("User declined to use sample texts");
      if (onCancel) onCancel();
    }
  );
};

// Function to directly create and show the alert modal
export const showAlertModal = (message, onConfirm, onCancel) => {
  console.log("showAlertModal called with message:", message);
  
  // Remove any existing modal first
  const existingModal = document.getElementById('custom-alert-modal');
  if (existingModal) {
    document.body.removeChild(existingModal);
  }
  
  // Create modal container
  const modalContainer = document.createElement('div');
  modalContainer.id = 'custom-alert-modal';
  modalContainer.style.position = 'fixed';
  modalContainer.style.top = '0';
  modalContainer.style.left = '0';
  modalContainer.style.right = '0';
  modalContainer.style.bottom = '0';
  modalContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.75)';
  modalContainer.style.display = 'flex';
  modalContainer.style.alignItems = 'center';
  modalContainer.style.justifyContent = 'center';
  modalContainer.style.zIndex = '1100';
  modalContainer.style.padding = '16px';
  
  // Create modal content
  const modalContent = document.createElement('div');
  modalContent.style.width = '100%';
  modalContent.style.maxWidth = '400px';
  modalContent.style.borderRadius = '16px';
  modalContent.style.overflow = 'hidden';
  modalContent.style.display = 'flex';
  modalContent.style.flexDirection = 'column';
  modalContent.style.background = '#1E1E1E';
  modalContent.style.border = 'none';
  modalContent.style.boxSizing = 'border-box';
  modalContent.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.3)';
  
  // Create header
  const header = document.createElement('div');
  header.style.padding = '20px';
  header.style.borderBottom = '1px solid #333';
  header.style.background = '#1E1E1E';
  header.style.color = 'white';
  header.style.boxSizing = 'border-box';
  
  const title = document.createElement('h2');
  title.style.margin = '0';
  title.style.fontWeight = '600';
  title.style.fontSize = '18px';
  title.textContent = 'Missing Images';
  
  header.appendChild(title);
  
  // Create body
  const body = document.createElement('div');
  body.style.padding = '24px';
  body.style.background = '#1E1E1E';
  body.style.color = 'white';
  body.style.boxSizing = 'border-box';
  body.style.fontSize = '15px';
  body.style.lineHeight = '1.5';
  body.textContent = message;
  
  // Create footer
  const footer = document.createElement('div');
  footer.style.padding = '20px';
  footer.style.borderTop = '1px solid #333';
  footer.style.display = 'flex';
  footer.style.justifyContent = 'flex-end';
  footer.style.gap = '12px';
  footer.style.background = '#1E1E1E';
  footer.style.boxSizing = 'border-box';
  
  // Create Cancel button
  const cancelButton = document.createElement('button');
  cancelButton.style.background = 'transparent';
  cancelButton.style.color = '#fff';
  cancelButton.style.border = '1px solid #5D5FEF';
  cancelButton.style.borderRadius = '8px';
  cancelButton.style.padding = '10px 24px';
  cancelButton.style.fontSize = '15px';
  cancelButton.style.fontWeight = '500';
  cancelButton.style.cursor = 'pointer';
  cancelButton.style.transition = 'all 0.2s ease';
  cancelButton.textContent = 'Cancel';
  
  cancelButton.onclick = () => {
    console.log("Cancel button clicked");
    if (onCancel) onCancel();
    document.body.removeChild(modalContainer);
  };
  
  // Create Proceed button
  const confirmButton = document.createElement('button');
  confirmButton.style.background = '#5D5FEF';
  confirmButton.style.color = 'white';
  confirmButton.style.border = 'none';
  confirmButton.style.borderRadius = '8px';
  confirmButton.style.padding = '10px 24px';
  confirmButton.style.fontSize = '15px';
  confirmButton.style.fontWeight = '500';
  confirmButton.style.cursor = 'pointer';
  confirmButton.style.transition = 'all 0.2s ease';
  confirmButton.textContent = 'Proceed';
  
  confirmButton.onclick = () => {
    console.log("Proceed button clicked");
    if (onConfirm) onConfirm();
    document.body.removeChild(modalContainer);
  };
  
  // Assemble modal
  footer.appendChild(cancelButton);
  footer.appendChild(confirmButton);
  
  modalContent.appendChild(header);
  modalContent.appendChild(body);
  modalContent.appendChild(footer);
  
  modalContainer.appendChild(modalContent);
  
  // Add to DOM
  document.body.appendChild(modalContainer);
  
  console.log("Alert modal added to DOM");
};

// Function to handle the completion of the image upload process
export const handleImageUploadCompletion = (photos, imageCount, onClose, currentTemplate) => {
  console.log("handleImageUploadCompletion called", { photos, imageCount });
  
  if (checkRequiredImages(photos, imageCount)) {
    // All images uploaded, close the modal
    console.log("All images uploaded, closing modal");
    const hasTextFields = currentTemplate?.texts && currentTemplate.texts.length > 0;
    onClose(hasTextFields ? 'text' : null);
    return true;
  } else {
    // Not all images uploaded, show alert
    const uploadedCount = Object.values(photos).filter(Boolean).length;
    const missingCount = imageCount - uploadedCount;
    
    console.log("Missing images", { uploadedCount, missingCount });
    
    const confirmMessage = `You've only uploaded ${uploadedCount} of ${imageCount} required images. 
Would you like to proceed with default images for the remaining ${missingCount} ${missingCount === 1 ? 'slot' : 'slots'}?`;
    
    // Show the alert directly using our new function
    showAlertModal(
      confirmMessage,
      () => {
        console.log("User confirmed to use default images");
        const hasTextFields = currentTemplate?.texts && currentTemplate.texts.length > 0;
        onClose(hasTextFields ? 'text' : null);
      },
      () => {
        console.log("User declined to use default images");
      }
    );
    
    return false;
  }
};

// Replace the previous renderAlertModal with a simple empty implementation
// since we're now directly manipulating the DOM
export const renderAlertModal = () => null;

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

  // Function to handle clicking the Done button
  const handleDoneClick = () => {
    console.log("Done button clicked", { photos, imageCount });
    
    if (checkRequiredImages(photos, imageCount)) {
      // All images uploaded, close the modal and switch to text tab if needed
      console.log("All images uploaded, will check for text fields");
      const hasTextFields = currentTemplate?.texts && currentTemplate.texts.length > 0;
      onClose(hasTextFields ? 'text' : null); // Pass 'text' to switch to text tab if text fields exist
      return true;
    } else {
      // Not all images uploaded, show custom alert modal
      const uploadedCount = Object.values(photos).filter(Boolean).length;
      const missingCount = imageCount - uploadedCount;
      
      const confirmMessage = `You've only uploaded ${uploadedCount} of ${imageCount} required images. 
Would you like to proceed with default images for the remaining ${missingCount} ${missingCount === 1 ? 'slot' : 'slots'}?`;
      
      // Show the alert directly using our new function
      showAlertModal(
        confirmMessage,
        () => {
          console.log("User confirmed to use default images");
          const hasTextFields = currentTemplate?.texts && currentTemplate.texts.length > 0;
          onClose(hasTextFields ? 'text' : null); // Pass 'text' to switch to text tab if text fields exist
        },
        () => {
          console.log("User declined to use default images");
        }
      );
      
      return false;
    }
  };

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
    renderFooter: () => {
      return (
        <div style={{
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid #5D5FEF',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleDoneClick}
            style={{
              background: '#5D5FEF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 24px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Done
          </button>
        </div>
      );
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
                <button
                  className="single-remove-button"
                  onClick={() => handlePhotoRemove("photo_0")}
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
                <div 
                  className="image-click-area"
                  onClick={() => document.getElementById(fileInputId).click()}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    cursor: 'pointer'
                  }}
                />
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

// Function to show a notification toast
export const showNotificationToast = (message) => {
  console.log("Showing notification:", message);
  
  // Remove any existing notification first
  const existingToast = document.getElementById('notification-toast');
  if (existingToast) {
    document.body.removeChild(existingToast);
  }
  
  // Create toast container
  const toastContainer = document.createElement('div');
  toastContainer.id = 'notification-toast';
  toastContainer.style.position = 'fixed';
  toastContainer.style.bottom = '20px';
  toastContainer.style.left = '50%';
  toastContainer.style.transform = 'translateX(-50%)';
  toastContainer.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
  toastContainer.style.color = 'white';
  toastContainer.style.padding = '12px 20px';
  toastContainer.style.borderRadius = '8px';
  toastContainer.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.3)';
  toastContainer.style.zIndex = '2000';
  toastContainer.style.fontSize = '14px';
  toastContainer.style.border = '1px solid #444';
  toastContainer.style.display = 'flex';
  toastContainer.style.alignItems = 'center';
  toastContainer.style.gap = '8px';
  
  // Add info icon
  const infoIcon = document.createElement('span');
  infoIcon.innerHTML = '&#9432;'; // Info symbol
  infoIcon.style.fontSize = '16px';
  infoIcon.style.color = '#5D5FEF';
  
  // Add message
  const messageEl = document.createElement('div');
  messageEl.textContent = message;
  
  // Assemble toast
  toastContainer.appendChild(infoIcon);
  toastContainer.appendChild(messageEl);
  
  // Add to DOM
  document.body.appendChild(toastContainer);
  
  // Automatically remove after 5 seconds
  setTimeout(() => {
    if (document.body.contains(toastContainer)) {
      document.body.removeChild(toastContainer);
    }
  }, 5000);
}; 