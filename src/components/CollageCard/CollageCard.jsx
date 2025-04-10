import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import CropModal from "../CropModal/CropModal";
import ZoomableImage from "./ZoomableImage";

import "./CollageCard.css";

// Icon imports
import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";

// Image Storage Service for local persistence
const compressImage = (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        const maxDimension = 1920; // Maximum dimension for either width or height

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality adjustment
        let quality = 0.8; // Start with 80% quality
        let output = canvas.toDataURL("image/jpeg", quality);
        let size = new Blob([output]).size;

        // Gradually reduce quality until file size is under 5MB
        while (size > 5 * 1024 * 1024 && quality > 0.1) {
          quality -= 0.1;
          output = canvas.toDataURL("image/jpeg", quality);
          size = new Blob([output]).size;
        }

        resolve(output);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
};

// Replace the ImageStorageService with in-memory storage
// Create an in-memory storage for images instead of using localStorage
const memoryStorage = {
  images: {},
  metadata: {}
};

const ImageStorageService = {
  saveImage: async (key, imageData) => {
    try {
      // Store image in memory instead of localStorage
      memoryStorage.images[key] = imageData;
      return true;
    } catch (error) {
      console.error("Error saving image:", error);
      return false;
    }
  },

  getImage: async (key) => {
    try {
      // Get image from memory
      return memoryStorage.images[key] || null;
    } catch (error) {
      console.error("Error getting image:", error);
      return null;
    }
  },

  removeImage: async (key) => {
    try {
      // Remove image from memory
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

const CollageCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [photos, setPhotos] = useState({});
  const [filledSlots, setFilledSlots] = useState({});
  const [photoMetadata, setPhotoMetadata] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Refs for scroll/swipe handling
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartRef = useRef(null);
  const prevTemplateRef = useRef(null);

  // Add these with your other state declarations
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
  const [currentUploadIndex, setCurrentUploadIndex] = useState(null);

  // Load saved photos
  const loadSavedPhotos = useCallback(async () => {
    try {
      // Use memory storage for metadata instead of localStorage
      if (memoryStorage.metadata) {
        setPhotoMetadata(memoryStorage.metadata);

        const loadedPhotos = {};
        for (const [key, exists] of Object.entries(memoryStorage.metadata)) {
          if (exists) {
            const photo = await ImageStorageService.getImage(key);
            if (photo) {
              loadedPhotos[key] = photo;
            }
          }
        }
        setPhotos(loadedPhotos);
      }
    } catch (error) {
      console.error("Error loading saved photos:", error);
    }
  }, []);

  useEffect(() => {
    loadSavedPhotos();
  }, [loadSavedPhotos]);

  const getPhotoStatus = useCallback(() => {
    const totalSlots = currentTemplate?.images?.length || 0;
    const filledSlots = Object.keys(photos).length;
    const remainingSlots = totalSlots - filledSlots;

    return {
      total: totalSlots,
      filled: filledSlots,
      remaining: remainingSlots,
    };
  }, [currentTemplate?.images?.length, photos]);

  // const handleMultiplePhotos = useCallback(
  //   async (files) => {
  //     if (!files || files.length === 0) return;

  //     const filledPhotosCount = Object.keys(photos).length;
  //     const remainingSlots =
  //       currentTemplate?.images?.length - filledPhotosCount;

  //     if (files.length > remainingSlots) {
  //       alert(
  //         `You can only upload ${remainingSlots} more photo${
  //           remainingSlots > 1 ? "s" : ""
  //         }`
  //       );
  //       return;
  //     }

  //     // Handle first image with crop modal
  //     const firstFile = files[0];
  //     const imageUrl = URL.createObjectURL(firstFile);
  //     setCurrentUploadIndex(0);
  //     setCropImage(imageUrl);
  //     setShowCropModal(true);

  //     // Store remaining files for later processing
  //     const remainingFiles = Array.from(files).slice(1);
  //     // You might want to store these in state if you want to process them after the first crop is complete
  //   },
  //   [currentTemplate?.images?.length, photos]
  // );

  const handleCroppedImage = async (croppedImage) => {
    try {
      let blob;
      
      // Handle different types of input
      if (croppedImage instanceof Blob) {
        blob = croppedImage;
      } else if (typeof croppedImage === 'string' && croppedImage.startsWith('data:')) {
        // Convert base64 to blob
        const response = await fetch(croppedImage);
        blob = await response.blob();
      } else {
        throw new Error('Invalid image format received from crop');
      }
  
      // Verify blob type
      if (!blob.type.startsWith('image/')) {
        throw new Error('Invalid image type');
      }
  
      // Convert blob to base64 for compression
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read blob'));
        reader.readAsDataURL(blob);
      });
  
      const base64Data = await base64Promise;
  
      // Compress image if needed
      let imageData = base64Data;
      if (blob.size > 5 * 1024 * 1024) {
        imageData = await compressImage(new Blob([blob]));
      }
  
      // Save to memory storage
      const saveResult = await ImageStorageService.saveImage(
        `photo_${currentUploadIndex}`,
        imageData
      );
  
      if (!saveResult) {
        throw new Error('Failed to save image to storage');
      }
  
      // Update states
      setPhotos(prev => ({
        ...prev,
        [`photo_${currentUploadIndex}`]: imageData,
      }));
  
      setFilledSlots(prev => ({
        ...prev,
        [`photo_${currentUploadIndex}`]: true,
      }));
  
      // Update metadata in memory
      const newMetadata = {
        ...photoMetadata,
        [`photo_${currentUploadIndex}`]: true,
      };
      setPhotoMetadata(newMetadata);
      memoryStorage.metadata = newMetadata; // Store in memory instead of localStorage
  
      // Close modal and reset states
      setShowCropModal(false);
      setCropImage(null);
      setCurrentUploadIndex(null);
  
    } catch (error) {
      console.error('Detailed cropping error:', error);
      
      let errorMessage = 'Error saving cropped image. ';
      if (error.message.includes('Invalid image')) {
        errorMessage += 'Please ensure you are uploading a valid image file.';
      } else {
        errorMessage += 'Please try again with a smaller image.';
      }
      
      alert(errorMessage);
      
      // Clean up
      setShowCropModal(false);
      setCropImage(null);
      setCurrentUploadIndex(null);
    }
  };
  // Download handler
  const handleDownload = useCallback(() => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;
  
    // Save current state of zoomed images
    const zoomedElements = document.querySelectorAll('.zoomed');
    const zoomedContainers = document.querySelectorAll('.zoomable-container');
    
    // Create an array to store the original states for restoration
    const originalStates = [];
    
    // Temporarily reset all zoomed images for capture
    zoomedElements.forEach(element => {
      originalStates.push({
        element,
        scale: element.style.transform,
        zIndex: element.style.zIndex
      });
      
      // Reset transform and z-index for clean capture
      element.style.transform = 'scale(1) translateX(0px) translateY(0px)';
      element.style.zIndex = 'auto';
    });
    
    // Also reset any zoomable containers
    zoomedContainers.forEach(container => {
      if (container.style.zIndex) {
        originalStates.push({
          element: container,
          zIndex: container.style.zIndex
        });
        container.style.zIndex = 'auto';
      }
    });
  
    const options = {
      scale: 4,
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      imageTimeout: 0,
      onclone: (clonedDoc) => {
        const images = clonedDoc.getElementsByTagName('img');
        for (let img of images) {
          img.style.imageRendering = 'high-quality';
          img.style.webkitImageRendering = 'high-quality';
        }
      }
    };
  
    html2canvas(captureDiv, options)
      .then((canvas) => {
        // Create high resolution canvas
        const scaledCanvas = document.createElement('canvas');
        scaledCanvas.width = canvas.width * 2;
        scaledCanvas.height = canvas.height * 2;
        const ctx = scaledCanvas.getContext('2d');
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  
        const jpgDataUrl = scaledCanvas.toDataURL("image/jpeg", 1.0);
        
        const downloadLink = document.createElement("a");
        downloadLink.href = jpgDataUrl;
        downloadLink.download = `wedding-card-${Date.now()}.jpg`;
        
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Restore original states after capture
        originalStates.forEach(state => {
          if (state.scale) state.element.style.transform = state.scale;
          if (state.zIndex) state.element.style.zIndex = state.zIndex;
        });
      })
      .catch((error) => {
        console.error("Error generating image:", error);
        
        // Restore original states in case of error
        originalStates.forEach(state => {
          if (state.scale) state.element.style.transform = state.scale;
          if (state.zIndex) state.element.style.zIndex = state.zIndex;
        });
      });
  }, []);
  
  const handleWhatsAppShare = useCallback(async () => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;
  
    try {
      // Save current state of zoomed images
      const zoomedElements = document.querySelectorAll('.zoomed');
      const zoomedContainers = document.querySelectorAll('.zoomable-container');
      
      // Create an array to store the original states for restoration
      const originalStates = [];
      
      // Temporarily reset all zoomed images for capture
      zoomedElements.forEach(element => {
        originalStates.push({
          element,
          scale: element.style.transform,
          zIndex: element.style.zIndex
        });
        
        // Reset transform and z-index for clean capture
        element.style.transform = 'scale(1) translateX(0px) translateY(0px)';
        element.style.zIndex = 'auto';
      });
      
      // Also reset any zoomable containers
      zoomedContainers.forEach(container => {
        if (container.style.zIndex) {
          originalStates.push({
            element: container,
            zIndex: container.style.zIndex
          });
          container.style.zIndex = 'auto';
        }
      });
  
      const canvas = await html2canvas(captureDiv, {
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        logging: false,
        onclone: (clonedDoc) => {
          const images = clonedDoc.getElementsByTagName('img');
          for (let img of images) {
            img.style.imageRendering = 'high-quality';
            img.style.webkitImageRendering = 'high-quality';
          }
        }
      });
      
      // Restore original states after capture
      originalStates.forEach(state => {
        if (state.scale) state.element.style.transform = state.scale;
        if (state.zIndex) state.element.style.zIndex = state.zIndex;
      });
  
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = canvas.width * 2;
      scaledCanvas.height = canvas.height * 2;
      const ctx = scaledCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
  
      const blob = await new Promise((resolve) => {
        scaledCanvas.toBlob(
          (blob) => resolve(blob),
          'image/jpeg',
          0.95
        );
      });
  
      const file = new File([blob], "wedding-card.jpg", {
        type: "image/jpeg",
        lastModified: Date.now()
      });
  
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Wedding Card',
        });
      } else {
        const whatsappUrl = `https://wa.me/?text=Check%20out%20my%20wedding%20card!`;
        window.open(whatsappUrl, '_blank');
      }
    } catch (error) {
      console.error("Sharing error:", error);
    }
  }, []);



  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/data/collage.json");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        const templates = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        const startIndex = templates.findIndex(
          (template) => template.id === `id_${id}`
        );
        if (startIndex === -1) throw new Error("Template not found");

        setAllTemplates(templates);
        setCurrentTemplate(templates[startIndex]);
        setCurrentIndex(startIndex);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplates();
  }, [id]);

  // Template rendering
  const renderTemplateContent = useCallback(
    (template) => {
      if (!template) return null;

      return (
        <div className="template-content">
          <img
            src={template.images[0]?.template}
            alt="Base Template"
            className="base-template"
          />
          {template.images.map((image, index) => (
            <ZoomableImage 
              key={index}
              index={index}
              coordinates={image.coordinates}
              backgroundImage={photos[`photo_${index}`] || image.sample_image}
              templateId={template.id}
            />
          ))}
        </div>
      );
    },
    [photos]
  );

  // Scroll handling
  useEffect(() => {
    const handleScroll = (deltaY, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

      // Don't scroll between templates if any image is zoomed in
      const hasZoomedImages = document.querySelectorAll('.zoomed').length > 0;
      if (hasZoomedImages) return;

      if (isScrolling.current || isAnimating) return;

      if (deltaY > 0 && currentIndex < allTemplates.length - 1) {
        // Scroll down - next template
        isScrolling.current = true;
        setIsAnimating(true);
        setSlideDirection("up");
        prevTemplateRef.current = currentTemplate;

        setTimeout(() => {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setCurrentTemplate(allTemplates[nextIndex]);
          navigate(`/collage/${nextIndex + 1}`, { replace: true });
        }, 30);

        setTimeout(() => {
          setSlideDirection(null);
          setIsAnimating(false);
          isScrolling.current = false;
        }, 1000);
      } else if (deltaY < 0 && currentIndex > 0) {
        // Scroll up - previous template
        isScrolling.current = true;
        setIsAnimating(true);
        setSlideDirection("down");
        prevTemplateRef.current = currentTemplate;

        setTimeout(() => {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentTemplate(allTemplates[prevIndex]);
          navigate(`/collage/${prevIndex + 1}`, { replace: true });
        }, 100);

        setTimeout(() => {
          setSlideDirection(null);
          setIsAnimating(false);
          isScrolling.current = false;
        }, 1000);
      }
    };

    const handleWheel = (e) => {
      // Check if the event originated from a zoomable container
      const isFromZoomableContainer = e.target.closest('.zoomable-container');
      
      // If from zoomable container, let the container handle it
      if (isFromZoomableContainer) return;
      
      handleScroll(e.deltaY, e);
    };

    const handleTouchStart = (e) => {
      // Don't handle template scrolling if touching a zoomable container
      const isFromZoomableContainer = e.target.closest('.zoomable-container');
      if (isFromZoomableContainer) return;
      
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      // Don't handle template scrolling if any image is zoomed
      const hasZoomedImages = document.querySelectorAll('.zoomed').length > 0;
      if (hasZoomedImages) return;
      
      // Don't handle template scrolling if touching a zoomable container
      const isFromZoomableContainer = e.target.closest('.zoomable-container');
      if (isFromZoomableContainer) return;
      
      if (touchStartRef.current === null) return;
      const touchDeltaY = e.touches[0].clientY - touchStartRef.current;
      handleScroll(-touchDeltaY, e);
      touchStartRef.current = null;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("touchstart", handleTouchStart, {
        passive: false,
      });
      container.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [currentIndex, allTemplates, navigate, currentTemplate, isAnimating]);

  const handleSinglePhotoUpload = async (index, file) => {
    if (!file) return;

    try {
      const imageUrl = URL.createObjectURL(file);
      setCurrentUploadIndex(index);
      setCropImage(imageUrl);
      setShowCropModal(true);
    } catch (error) {
      console.error("Error handling single photo:", error);
      alert("Error uploading photo. Please try again.");
    }
  };

  const handleRemovePhoto = async (index) => {
    try {
      // Remove from memory storage
      await ImageStorageService.removeImage(`photo_${index}`);

      // Update states
      setPhotos((prev) => {
        const newPhotos = { ...prev };
        delete newPhotos[`photo_${index}`];
        return newPhotos;
      });

      setFilledSlots((prev) => ({
        ...prev,
        [`photo_${index}`]: false,
      }));

      // Update metadata in memory
      const newMetadata = {
        ...photoMetadata,
        [`photo_${index}`]: false,
      };
      setPhotoMetadata(newMetadata);
      memoryStorage.metadata = newMetadata; // Store in memory instead of localStorage
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Error removing photo. Please try again.");
    }
  };
  // Modal content
  const renderModal = () => {
    const photoStatus = getPhotoStatus();
    const statusMessage =
      photoStatus.remaining > 0
        ? `${photoStatus.remaining} photo${
            photoStatus.remaining > 1 ? "s" : ""
          } remaining`
        : "All photos uploaded";
    if (!isEditModalOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <div className="header-content">
              <h2>Edit Photos</h2>
              <p
                className="photo-status"
                style={{
                  color: photoStatus.remaining > 0 ? "#64748b" : "#9CCC65",
                }}
              >
                {statusMessage}
              </p>
            </div>
            <button
              className="close-button"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
        
            <div className="separator">
              <span>upload-images</span>
            </div>

            <div className="photo-grid">
              {currentTemplate?.images?.map((_, index) => (
                <div key={index} className="photo-slot">
                  {photos[`photo_${index}`] ? (
                    <div className="photo-preview-container">
                      <img
                        src={photos[`photo_${index}`]}
                        alt={`Photo ${index + 1}`}
                        className="photo-preview"
                      />
                      <button
                        className="remove-photo-btn"
                        onClick={() => handleRemovePhoto(index)}
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ) : (
                    <div className="photo-upload-slot">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleSinglePhotoUpload(index, e.target.files[0])
                        }
                        className="file-input"
                      />
                      <div className="upload-placeholder">
                        <span>+</span>
                        <p>Add Photo {index + 1}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="save-button"
              onClick={() => setIsEditModalOpen(false)}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  // Main render
  return (
    <div className={`main-container ${isEditModalOpen ? "modal-open" : ""}`}>
      <div ref={containerRef} className="template-wrapper">
        {isAnimating && prevTemplateRef.current && (
          <div
            className={`template-positioning ${
              slideDirection === "up" ? "slide-up-exit" : "slide-down-exit"
            }`}
          >
            {renderTemplateContent(prevTemplateRef.current)}
          </div>
        )}

        <div
          className={`template-positioning ${
            slideDirection === "up"
              ? "slide-up-enter"
              : slideDirection === "down"
              ? "slide-down-enter"
              : ""
          }`}
        >
          {renderTemplateContent(currentTemplate)}
        </div>
      </div>

      {renderModal()}

      <div className="button-container">
        <button
          className="floating-button edit-button"
          onClick={() => setIsEditModalOpen(true)}
        >
          <img src={editIcon} alt="Edit" className="icon" />
        </button>
        <button
          className="floating-button share-button"
          onClick={handleWhatsAppShare}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className="icon"
            style={{ width: "24px", height: "24px" }}
          />
          <span
            style={{
              fontFamily: "Poppins, sans-serif",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            Share
          </span>
        </button>
        <button
          className="floating-button download-button"
          onClick={handleDownload}
        >
          <img src={downloadIcon} alt="Download" className="icon" />
        </button>
      </div>
      {showCropModal && (
        <CropModal
          image={cropImage}
          onCropComplete={handleCroppedImage}
          onClose={() => {
            setShowCropModal(false);
            setCropImage(null);
            setCurrentUploadIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default CollageCard;