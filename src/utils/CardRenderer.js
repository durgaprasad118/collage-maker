import React, { useState, useEffect } from "react";
import { X, Grid, ArrowLeft, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import { renderImageUploadModal, validateTextFields, showTextFieldsAlert } from "./ImageUploadManager";
import ZoomableImage from "../components/shared/ZoomableImage"; 
/**
 * Preloads all images for a template to ensure they load simultaneously
 */
export const preloadTemplateImages = (template, photos = {}, callback) => {
  if (!template || !template.images || template.images.length === 0) {
    callback();
    return;
  }

  // Create a generic image loader function
  const loadImage = (src) => {
    return new Promise((resolve, reject) => {
      if (!src) {
        resolve(); // Skip if src is undefined
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => {
        console.error(`Failed to load image: ${src}`);
        resolve(); // Resolve anyway to prevent blocking
      };
      img.src = src;
    });
  };
  
  // Collect all images to preload
  const promises = [];
  
  // 1. Load the base template image
  promises.push(loadImage(template.images[0]?.template));
  
  // 2. Load all placeholder images if they exist
  template.images.forEach((image, index) => {
    if (image.placeholder) {
      promises.push(loadImage(image.placeholder));
    }
  });
  
  // 3. Load all user-uploaded photos if they exist
  Object.values(photos).forEach(photoUrl => {
    if (photoUrl) {
      promises.push(loadImage(photoUrl));
    }
  });
  
  // Wait for all images to load
  Promise.all(promises)
    .then(() => {
      callback();
    })
    .catch(error => {
      console.error("Error loading images:", error);
      callback();
    });
};

/**
 * Renders the template gallery overlay
 */
export const renderTemplateGallery = ({
  showTemplateGallery,
  setShowTemplateGallery,
  allTemplates,
  currentIndex,
  handleTemplateSelect,
  cardType
}) => {
  if (!showTemplateGallery) return null;

  let cardTypeName = "Card";
  if (cardType === "birthday") cardTypeName = "Card";
  else if (cardType === "collage") cardTypeName = "Collage";
  else if (cardType === "wedding") cardTypeName = "Wedding Card";

  return (
    <div className="template-gallery-overlay">
      <div className="template-gallery-header">
        <button
          className="back-button"
          onClick={() => setShowTemplateGallery(false)}
        >
          <ArrowLeft size={24} />
          <span>Back to {cardTypeName}</span>
        </button>
        <h2>Select Template</h2>
      </div>
      <div className="template-gallery-grid">
        {allTemplates.map((template, index) => (
          <div
            key={index}
            className={`template-thumbnail ${
              index === currentIndex ? "active" : ""
            }`}
            onClick={() => handleTemplateSelect(index)}
          >
            <img
              src={template?.images[0]?.template}
              alt={`Template ${index + 1}`}
            />
            <div className="template-number">{index + 1}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Renders the image upload modal
 */
export const renderModal = ({
  isEditModalOpen,
  setIsEditModalOpen,
  currentTemplate,
  photos,
  customText = {},
  inputValues = {},
  uploadError,
  handleDrag,
  handleDrop,
  handlePhotoRemove,
  handlePhotoChange,
  handleMultipleImageDrop,
  handleMultipleImageSelect,
  handleInputChange
}) => {
  if (!isEditModalOpen) return null;

  // Get upload modal elements from shared utility
  const uploadModal = renderImageUploadModal({
    isOpen: isEditModalOpen,
    onClose: (targetTab) => {
      if (targetTab === 'text') {
        // Store the active tab in session storage
        try {
          sessionStorage.setItem('lastActiveTab', 'text');
        } catch (e) {
          // Ignore storage errors
        }
        
        // Force a re-render with the text tab active
        setIsEditModalOpen(false);
        setTimeout(() => setIsEditModalOpen(true), 0);
      } else {
        // Just close the modal
        setIsEditModalOpen(false);
      }
    },
    currentTemplate,
    photos,
    uploadError,
    handleDrag,
    handleDrop,
    handlePhotoRemove,
    handlePhotoChange,
    handleMultipleImageDrop,
    handleMultipleImageSelect,
  });
  
  // Determine if we should show tabs (if template has both images and texts)
  const hasImages = currentTemplate?.images && currentTemplate.images.length > 0;
  const hasTexts = currentTemplate?.texts && currentTemplate.texts.length > 0;
  const hasNameTexts = currentTemplate?.texts?.some(text => 
    text.name.includes('name') || text.name.includes('groom') || text.name.includes('bride')
  );
  const showTabs = hasImages && hasTexts;
  
  if (!uploadModal && !hasTexts) return null;
  
  // Instead of using hooks, create regular variables and render conditionally
  let activeTab = 'images';
  
  // Try to get the last active tab from session storage
  try {
    const lastTab = sessionStorage.getItem('lastActiveTab');
    if (lastTab && (lastTab === 'images' || lastTab === 'text')) {
      activeTab = lastTab;
    }
  } catch (e) {
    // Ignore storage errors
  }
  
  // If template only has images, force the active tab to be 'images'
  // If template only has texts, force the active tab to be 'text'
  if (!hasImages && hasNameTexts) {
    activeTab = 'text';
  } else if (!hasNameTexts && hasImages) {
    activeTab = 'images';
  }

  // Get the modal title based on active tab and card type
  let modalTitle = "Edit Content";
  if (currentTemplate) {
    if (activeTab === 'images') {
      modalTitle = uploadModal ? uploadModal.headerTitle : "Upload Images";
    } else {
      modalTitle = "Edit Text";
    }
  }

  // Create a function to handle tab changes
  const handleTabChange = (tab) => {
    activeTab = tab;
    
    // Store the active tab in session storage
    try {
      sessionStorage.setItem('lastActiveTab', tab);
    } catch (e) {
      // Ignore storage errors
    }
    
    // Force a re-render through the parent component
    // by hiding/showing the modal
    setIsEditModalOpen(false);
    setTimeout(() => setIsEditModalOpen(true), 0);
  };

  // Function to handle the Done button click in the text tab
  const handleTextDoneClick = () => {
    // Check if all required text fields are filled
    if (validateTextFields(currentTemplate, customText, inputValues)) {
      // All fields are filled, close the modal
      setIsEditModalOpen(false);
    } else {
      // Some fields are empty, show alert
      showTextFieldsAlert(
        () => {
          // User confirmed to proceed with sample texts
          setIsEditModalOpen(false);
        },
        () => {
          // User declined, keep the modal open
          console.log("User wants to fill in all text fields");
        }
      );
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px'
    }}>
      <div className="modal-content" style={{
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: '#1E1E1E',
        border: 'none',
        boxSizing: 'border-box',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)'
      }}>
        <div className="modal-header" style={{
          padding: '20px',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#1E1E1E',
          color: 'white',
          boxSizing: 'border-box'
        }}>
          <h2 style={{margin: 0, fontWeight: '600', fontSize: '20px'}}>{modalTitle}</h2>
          <button
            className="close-button"
            onClick={() => setIsEditModalOpen(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '24px',
              padding: '4px'
            }}
          >
            <X size={24} />
          </button>
        </div>

        {showTabs && (
          <div className="modal-tabs" style={{
            display: 'flex',
            borderBottom: '1px solid #333',
            background: '#1E1E1E'
          }}>
            <button
              className={`tab-button ${activeTab === 'images' ? 'active' : ''}`}
              onClick={() => handleTabChange('images')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'images' ? '#2A2A2A' : 'transparent',
                color: activeTab === 'images' ? '#5D5FEF' : '#888',
                fontWeight: activeTab === 'images' ? '600' : '400',
                borderBottom: activeTab === 'images' ? '2px solid #5D5FEF' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Images
            </button>
            <button
              className={`tab-button ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => handleTabChange('text')}
              style={{
                flex: 1,
                padding: '12px',
                border: 'none',
                background: activeTab === 'text' ? '#2A2A2A' : 'transparent',
                color: activeTab === 'text' ? '#5D5FEF' : '#888',
                fontWeight: activeTab === 'text' ? '600' : '400',
                borderBottom: activeTab === 'text' ? '2px solid #5D5FEF' : 'none',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Text
            </button>
          </div>
        )}

        <div className="modal-body" style={{
          padding: '24px',
          flex: '1 1 auto',
          overflowY: 'auto',
          overflowX: 'hidden',
          background: '#1E1E1E',
          color: 'white',
          boxSizing: 'border-box'
        }}>
          {activeTab === 'images' && uploadModal && (
            <>
              {uploadModal.renderUploadArea()}
              {uploadModal.renderPreviewGrid && uploadModal.renderPreviewGrid()}
            </>
          )}
          
          {activeTab === 'text' && (
            <div className="text-inputs-container">
              {renderTextInputs({ currentTemplate, customText, inputValues, handleInputChange })}
            </div>
          )}
        </div>
        
        {activeTab === 'images' && uploadModal && uploadModal.renderFooter && (
          <div className="modal-footer" style={{
            padding: '20px',
            borderTop: '1px solid #333',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#1E1E1E',
            boxSizing: 'border-box'
          }}>
            {uploadModal.renderFooter()}
          </div>
        )}
        
        {activeTab === 'text' && (
          <div className="modal-footer" style={{
            padding: '20px',
            borderTop: '1px solid #333',
            display: 'flex',
            justifyContent: 'flex-end',
            background: '#1E1E1E',
            boxSizing: 'border-box'
          }}>
            <button
              onClick={handleTextDoneClick}
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
        )}
      </div>
    </div>
  );
};

/**
 * Component that renders the template content with images
 */
const TemplateContent = ({
  template,
  photos,
  customText = {}, // Optional for collage cards
  allTemplates,
  currentIndex,
  setCurrentIndex,
  setCurrentTemplate,
  cardType,
  onAddImageClick, // Optional callback for collage cards
}) => {
  // Use state to track when content is ready to display
  const [isLoading, setIsLoading] = useState(true);
  const [templateContent, setTemplateContent] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    
    preloadTemplateImages(template, photos, () => {
      // Create the template content once images are loaded
      const content = (
        <div className="template-content">
          <img
            src={template?.images[0]?.template}
            alt="Base Template"
            className="base-template"
          />
          {template?.images.map((image, index) => {
            const photoKey = `photo_${index}`;
            return (
              <ZoomableImage
                key={index}
                image={image}
                coordinates={image.coordinates}
                backgroundImage={photos[photoKey]}
                allTemplates={allTemplates}
                currentIndex={currentIndex}
                setCurrentIndex={setCurrentIndex}
                currentTemplate={template}
                setCurrentTemplate={setCurrentTemplate}
                cardType={cardType}
                index={index}
                onAddImageClick={onAddImageClick}
              />
            );
          })}
          {template?.texts && template.texts.length > 0 && template.texts.map((text, index) => (
            <div
              key={index}
              className="text-overlay"
              style={{
                position: "absolute",
                width: `${text.coordinates.width_in_px}px`,
                height: `${text.coordinates.height_in_px}px`,
                top: `${text.coordinates.top_in_px}px`,
                left: `${text.coordinates.left_in_px}px`,
                fontSize: `${text.text_configs.size}px`,
                color: text.text_configs.color,
                textAlign: text.text_configs.text_alignment.toLowerCase(),
                fontFamily: `${text.text_configs.font_id.replace(
                  ".ttf",
                  ""
                )}, sans-serif`,
                display: "flex",
                alignItems: "center",
                justifyContent: text.text_configs.text_alignment.toLowerCase() === "center" ? "center" : 
                              text.text_configs.text_alignment.toLowerCase() === "right" ? "flex-end" : "flex-start",
                overflow: "hidden",
                wordBreak: "break-word"
              }}
            >
              {customText[text.name] || text.text_configs.sample_text}
            </div>
          ))}
        </div>
      );
      
      setTemplateContent(content);
      setIsLoading(false);
    });
  }, [template, photos, customText, currentIndex, allTemplates, setCurrentIndex, setCurrentTemplate, cardType, onAddImageClick]);

  if (isLoading) {
    return null;
  }

  return templateContent;
};

/**
 * Wrapper function to maintain backward compatibility
 */
export const renderTemplateContent = (props) => {
  return <TemplateContent {...props} />;
};

/**
 * Handles downloading the card as an image
 */
export const handleDownload = () => {
  const captureDiv = document.querySelector(".template-content");
  if (!captureDiv) return;

  // Create loading indicator
  const loadingIndicator = document.createElement('div');
  Object.assign(loadingIndicator.style, {
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '15px 20px',
    borderRadius: '10px',
    zIndex: '9999'
  });
  loadingIndicator.textContent = 'Creating your image...';
  document.body.appendChild(loadingIndicator);
  
  // Set export flag for ZoomableImage components to detect
  document.body.setAttribute('data-card-exporting', 'true');

  // Hide UI controls
  const uiControls = document.querySelectorAll(
    '.save-button, .selection-border, .image-controls, .react-transform-component__content--bottom-right'
  );
  const selectedElements = document.querySelectorAll('.selected');
  const originalStates = [];

  // Store original template-content styles
  const originalCaptureDivStyles = {
    padding: captureDiv.style.padding,
    margin: captureDiv.style.margin,
    border: captureDiv.style.border,
    boxSizing: captureDiv.style.boxSizing,
    position: captureDiv.style.position,
    overflow: captureDiv.style.overflow
  };

  // Apply temporary styles to fix white borders
  captureDiv.style.padding = '0';
  captureDiv.style.margin = '0';
  captureDiv.style.border = 'none';
  captureDiv.style.boxSizing = 'border-box';
  captureDiv.style.position = 'relative';
  captureDiv.style.overflow = 'hidden';

  uiControls.forEach(element => {
    if (element && element.style.display !== 'none') {
      originalStates.push({ element, display: element.style.display });
      element.style.display = 'none';
    }
  });

  selectedElements.forEach(element => {
    originalStates.push({ element, className: element.className });
    element.classList.remove('selected');
  });

  // Small delay before rendering to canvas
  setTimeout(() => {
    html2canvas(captureDiv, {
      scale: 3, // Higher resolution output
      useCORS: true, // To allow cross-origin images
      allowTaint: false,
      logging: false,
      imageTimeout: 0,
      backgroundColor: "#ffffff",
      scrollY: -window.scrollY,
      removeContainer: false,
      x: 0,
      y: 0,
      windowWidth: document.documentElement.offsetWidth,
      windowHeight: document.documentElement.offsetHeight,
      foreignObjectRendering: false, // Disable to fix potential border issues
      onclone: (documentClone) => {
        // Add special class to cloned document for extra styling if needed
        documentClone.documentElement.classList.add('html2canvas-document');
        
        // Get the cloned element
        const clonedCaptureDiv = documentClone.querySelector('.template-content');
        if (clonedCaptureDiv) {
          // Apply additional styles to ensure no borders
          clonedCaptureDiv.style.padding = '0';
          clonedCaptureDiv.style.margin = '0';
          clonedCaptureDiv.style.border = 'none';
          clonedCaptureDiv.style.borderRadius = '0';
          clonedCaptureDiv.style.boxShadow = 'none';
          clonedCaptureDiv.style.overflow = 'hidden';
          clonedCaptureDiv.style.inset = '0';
        }
        
        // Find all images in zoomable containers and ensure they have proper rendering settings
        const allImages = documentClone.querySelectorAll('.zoomable-container img');
        allImages.forEach(img => {
          img.style.imageRendering = 'high-quality';
          img.style.willChange = 'transform';
        });
      }
    })
      .then(canvas => {
        // Explicit fix for mobile grayscale issue: force full alpha channel
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Optionally normalize alpha (fully opaque)
        for (let i = 3; i < data.length; i += 4) {
          data[i] = 255; // Set alpha to 255
        }
        ctx.putImageData(imageData, 0, 0);

        // Remove potential transparent border by cropping
        const cropCanvas = cropWhitespace(canvas);

        // Export PNG with higher quality
        const pngDataUrl = cropCanvas.toDataURL("image/png", 1.0);
        const downloadLink = document.createElement("a");
        downloadLink.href = pngDataUrl;
        downloadLink.download = "card-maker-export.png";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      })
      .catch(err => {
        console.error("html2canvas error:", err);
        alert("Could not generate the image. Please try again.");
      })
      .finally(() => {
        // Restore UI state
        originalStates.forEach(state => {
          if (state.display !== undefined) {
            state.element.style.display = state.display;
          }
          if (state.className) {
            state.element.className = state.className;
          }
        });

        // Restore original captureDiv styles
        Object.entries(originalCaptureDivStyles).forEach(([prop, value]) => {
          captureDiv.style[prop] = value;
        });

        // Remove export flag
        document.body.removeAttribute('data-card-exporting');
        document.body.removeChild(loadingIndicator);
      });
  }, 100);
};

// Helper function to crop any transparent/white borders
function cropWhitespace(canvas) {
  const ctx = canvas.getContext('2d');
  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  
  // Find the bounds of the content
  let left = canvas.width, right = 0, top = canvas.height, bottom = 0;
  
  // Use a small threshold to determine what constitutes a "white" pixel
  const isWhiteOrTransparent = (idx) => {
    return data[idx + 3] < 10 || (data[idx] > 240 && data[idx + 1] > 240 && data[idx + 2] > 240);
  };
  
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;
      if (!isWhiteOrTransparent(idx)) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    }
  }
  
  // Add a small padding
  left = Math.max(0, left - 1);
  top = Math.max(0, top - 1);
  right = Math.min(canvas.width - 1, right + 1);
  bottom = Math.min(canvas.height - 1, bottom + 1);
  
  // If the image has content, crop it
  if (left < right && top < bottom) {
    const width = right - left + 1;
    const height = bottom - top + 1;
    
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = width;
    cropCanvas.height = height;
    
    const cropCtx = cropCanvas.getContext('2d');
    cropCtx.drawImage(canvas, left, top, width, height, 0, 0, width, height);
    
    return cropCanvas;
  }
  
  // If nothing was found, return the original canvas
  return canvas;
}

/**
 * Handles sharing the card via WhatsApp
 */
export const handleWhatsAppShare = async (customText = {}) => {
  const captureDiv = document.querySelector(".template-content");
  if (!captureDiv) return;

  // Display a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.position = 'fixed';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translate(-50%, -50%)';
  loadingIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
  loadingIndicator.style.color = 'white';
  loadingIndicator.style.padding = '20px';
  loadingIndicator.style.borderRadius = '10px';
  loadingIndicator.style.zIndex = '9999';
  loadingIndicator.textContent = 'Creating your image for sharing...';
  document.body.appendChild(loadingIndicator);
  
  // Set export flag for ZoomableImage components to detect
  document.body.setAttribute('data-card-exporting', 'true');

  // Store original states
  const originalStates = [];

  try {
    // Hide selection indicators for clean capture
    const selectedElements = document.querySelectorAll('.selected');
    const selectionBorders = document.querySelectorAll('.selection-border');
    const saveButtons = document.querySelectorAll('.save-button');
    
    // Hide all selection indicators
    selectionBorders.forEach(border => {
      if (border.style.display !== 'none') {
        originalStates.push({
          element: border,
          display: border.style.display
        });
        border.style.display = 'none';
      }
    });
    
    // Hide save buttons
    saveButtons.forEach(button => {
      if (button.style.display !== 'none') {
        originalStates.push({
          element: button,
          display: button.style.display
        });
        button.style.display = 'none';
      }
    });
    
    // Reset selection classes
    selectedElements.forEach(element => {
      originalStates.push({
        element: element,
        className: element.className
      });
      element.classList.remove('selected');
    });

    // Wait for a moment to ensure the UI updates
    await new Promise(resolve => setTimeout(resolve, 100));

    const options = {
      scale: 4, // Higher scale for better quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      imageTimeout: 0,
      backgroundColor: '#FFFFFF',
      onclone: (documentClone) => {
        // Add special class to cloned document for extra styling if needed
        documentClone.documentElement.classList.add('html2canvas-document');
        
        // Find all images in zoomable containers and ensure they have proper rendering settings
        const allImages = documentClone.querySelectorAll('.zoomable-container img');
        allImages.forEach(img => {
          img.style.imageRendering = 'high-quality';
          // Ensure smooth rendering
          img.style.willChange = 'transform';
        });
      }
    };

    const canvas = await html2canvas(captureDiv, options);
    
    // Convert data URL to blob with max quality
    const blob = await fetch(canvas.toDataURL('image/jpeg', 1.0)).then(res => res.blob());
    
    // Create file from blob with high quality
    const file = new File([blob], "card-maker-image.jpg", {
      type: "image/jpeg",
      lastModified: Date.now()
    });
    
    let message = "";
    
    // Determine message content based on availability of custom text
    if (customText.birthday_name) {
      message = `🎉 *Birthday Celebration* 🎉\n\nCelebrating ${
        customText.birthday_name || "[Name]"
      }'s Birthday!\n\n📅 ${customText.birthday_date || "Date TBA"}\n⏰ ${
        customText.birthday_time || "Time TBA"
      }\n📍 ${
        customText.birthday_venue || "Venue TBA"
      }\n\nJoin us for this special celebration! 🎂`;
    } else if (customText.bride_name || customText.groom_name) {
      message = `💍 *Wedding Invitation* 💍\n\n${
        customText.bride_name || "[Bride]"
      } & ${
        customText.groom_name || "[Groom]"
      }\n\n📅 ${customText.wedding_date || "Date TBA"}\n⏰ ${
        customText.wedding_time || "Time TBA"
      }\n📍 ${
        customText.wedding_venue || "Venue TBA"
      }\n\nWe request the honor of your presence as we unite in marriage 💕`;
    } else {
      message = `✨ Check out this awesome creation I made with Card Maker! ✨`;
    }

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        files: [file],
        text: message,
        title: 'Card Maker'
      });
    } else {
      window.open(
        `https://wa.me/?text=${encodeURIComponent(message)}`,
        "_blank"
      );
    }
  } catch (error) {
    console.error("Error sharing:", error);
    alert("Unable to share. Please try again.");
  } finally {
    // Restore original states
    originalStates.forEach(state => {
      if (state.display !== undefined) state.element.style.display = state.display;
      if (state.className) state.element.className = state.className;
    });
    
    // Remove export flag
    document.body.removeAttribute('data-card-exporting');
    document.body.removeChild(loadingIndicator);
  }
};

/**
 * Renders action buttons for card manipulation
 */
export const renderActionButtons = ({
  setIsEditModalOpen,
  handleWhatsAppShare,
  handleDownload,
  editIcon,
  cardType
}) => {
  return (
    <div className="fixed bottom-0 z-50 md:w-full w-[98%] h-16 max-w-lg -translate-x-1/2 bg-gray-700 border border-gray-600 rounded-lg left-1/2">
      <div className="grid h-full max-w-lg grid-cols-4 mx-auto">
        <button 
          data-tooltip-target="tooltip-templates" 
          type="button" 
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-600 transition-colors duration-200"
          onClick={() => {
            // Navigate to the appropriate library based on card type
            switch(cardType) {
              case "birthday":
                window.location.href = "/BirthdayLibrary";
                break;
              case "collage":
                window.location.href = "/CollageLibrary";
                break;
              case "wedding":
                window.location.href = "/WeddingLibrary";
                break;
              default:
                window.location.href = "/";
                break;
            }
          }}
        >
          <Grid className="w-5 h-5 mb-1 text-white group-hover:text-blue-400" />
          <span className="text-xs text-white">Templates</span>
        </button>
        <div id="tooltip-templates" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-md shadow-sm opacity-0 tooltip">
          Templates
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        
        <button 
          data-tooltip-target="tooltip-upload" 
          type="button" 
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-600 transition-colors duration-200"
          onClick={() => setIsEditModalOpen(true)}
        >
          <img 
            src={editIcon} 
            alt="Upload" 
            className="w-5 h-5 mb-1 filter brightness-0 invert group-hover:text-blue-400" 
          />
          <span className="text-xs text-white">Edit</span>
        </button>
        <div id="tooltip-upload" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-md shadow-sm opacity-0 tooltip">
          Upload
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        
        <button 
          data-tooltip-target="tooltip-download" 
          type="button" 
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-600 transition-colors duration-200"
          onClick={handleDownload}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span className="text-xs text-white">Download</span>
        </button>
        <div id="tooltip-download" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-md shadow-sm opacity-0 tooltip">
          Download
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
        
        <button 
          data-tooltip-target="tooltip-share" 
          type="button" 
          className="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-600 transition-colors duration-200"
          onClick={handleWhatsAppShare}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mb-1 text-white group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          <span className="text-xs text-white">Share</span>
        </button>
        <div id="tooltip-share" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-md shadow-sm opacity-0 tooltip">
          Share
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders text input fields based on template text configuration,
 * with appropriate input types for different fields
 */
export const renderTextInputs = ({
  currentTemplate,
  customText = {},
  inputValues = {},
  handleInputChange
}) => {
  if (!currentTemplate?.texts || currentTemplate.texts.length === 0) {
    return null;
  }

  // Group fields by their purpose for better organization
  const nameFields = currentTemplate.texts.filter(text => 
    text.name.includes('name') || text.name.includes('groom') || text.name.includes('bride'));
  
  const dateFields = currentTemplate.texts.filter(text => 
    text.name.includes('date'));
    
  const timeFields = currentTemplate.texts.filter(text => 
    text.name.includes('time'));
    
  const venueFields = currentTemplate.texts.filter(text => 
    text.name.includes('venue') || text.name.includes('location'));
    
  const otherFields = currentTemplate.texts.filter(text => 
    !text.name.includes('name') && 
    !text.name.includes('groom') && 
    !text.name.includes('bride') && 
    !text.name.includes('date') && 
    !text.name.includes('time') && 
    !text.name.includes('venue') &&
    !text.name.includes('location'));
  
  // Get placeholders from sample_text when available
  const getPlaceholder = (field) => {
    return field.text_configs.sample_text || 
           `Enter ${field.name.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase())}`;
  };

  // Get the field label text
  const getFieldLabel = (field) => {
    // Extract the main part of the name (e.g., "Groom" from "wedding_groom_name")
    const nameParts = field.name.split('_');
    
    // Try to find a meaningful part of the name
    for (const part of ['name', 'groom', 'bride', 'date', 'time', 'venue', 'location']) {
      const partIndex = nameParts.findIndex(p => p === part);
      if (partIndex >= 0) {
        return nameParts[partIndex].charAt(0).toUpperCase() + nameParts[partIndex].slice(1);
      }
    }
    
    // Fallback to the full formatted name
    return field.name.replace(/_/g, ' ').replace(/^\w/, c => c.toUpperCase());
  };

  // Check if field is required (all fields are considered required for now)
  const isFieldRequired = (field) => {
    return true; // Making all fields required
  };

  // Determine if there are fields to display
  const hasAnyFields = nameFields.length > 0 || dateFields.length > 0 || 
                       timeFields.length > 0 || venueFields.length > 0 || 
                       otherFields.length > 0;

  if (!hasAnyFields) return null;

  return (
    <div className="input-sections" style={{ width: '100%', paddingTop: '10px' }}>
      {/* Names Section */}
      {nameFields.length > 0 && (
        <div className="input-section" style={{ marginBottom: '24px' }}>
          <div className="fields-grid" style={{
            display: 'flex',
            flexDirection: nameFields.length >= 2 ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {nameFields.map((field, index) => (
              <div key={index} className="input-group" style={{ 
                marginBottom: '8px',
                flex: nameFields.length >= 2 ? '1 1 calc(50% - 8px)' : '1 1 100%',
                minWidth: '200px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#e0e0e0'
                }}>
                  {getFieldLabel(field)}
                  {isFieldRequired(field) && <span style={{ color: '#FF4D4D', marginLeft: '4px' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={customText[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={getPlaceholder(field)}
                  maxLength={field.text_configs.char_limit || 30}
                  style={{
                    fontSize: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#2A2A2A',
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Date Fields Section */}
      {dateFields.length > 0 && (
        <div className="input-section" style={{ marginBottom: '24px' }}>
          <div className="fields-grid" style={{
            display: 'flex',
            flexDirection: dateFields.length >= 2 ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {dateFields.map((field, index) => (
              <div key={index} className="input-group" style={{ 
                marginBottom: '8px',
                flex: dateFields.length >= 2 ? '1 1 calc(50% - 8px)' : '1 1 100%',
                minWidth: '200px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#e0e0e0'
                }}>
                  {getFieldLabel(field)}
                  {isFieldRequired(field) && <span style={{ color: '#FF4D4D', marginLeft: '4px' }}>*</span>}
                </label>
                <input
                  type="date"
                  value={inputValues[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  style={{
                    fontSize: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#2A2A2A',
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Time Fields Section */}
      {timeFields.length > 0 && (
        <div className="input-section" style={{ marginBottom: '24px' }}>
          <div className="fields-grid" style={{
            display: 'flex',
            flexDirection: timeFields.length >= 2 ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {timeFields.map((field, index) => (
              <div key={index} className="input-group" style={{ 
                marginBottom: '8px',
                flex: timeFields.length >= 2 ? '1 1 calc(50% - 8px)' : '1 1 100%',
                minWidth: '200px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#e0e0e0'
                }}>
                  {getFieldLabel(field)}
                  {isFieldRequired(field) && <span style={{ color: '#FF4D4D', marginLeft: '4px' }}>*</span>}
                </label>
                <input
                  type="time"
                  value={inputValues[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  style={{
                    fontSize: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#2A2A2A',
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Venue Fields Section */}
      {venueFields.length > 0 && (
        <div className="input-section" style={{ marginBottom: '24px' }}>
          <div className="fields-grid" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '16px'
          }}>
            {venueFields.map((field, index) => (
              <div key={index} className="input-group" style={{ 
                marginBottom: '8px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#e0e0e0'
                }}>
                  {getFieldLabel(field)}
                  {isFieldRequired(field) && <span style={{ color: '#FF4D4D', marginLeft: '4px' }}>*</span>}
                </label>
                <textarea
                  value={customText[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={getPlaceholder(field)}
                  maxLength={field.text_configs.char_limit || 100}
                  style={{
                    fontSize: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#2A2A2A',
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box',
                    minHeight: '80px',
                    resize: 'vertical'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Other Fields Section */}
      {otherFields.length > 0 && (
        <div className="input-section" style={{ marginBottom: '24px' }}>
          <div className="fields-grid" style={{
            display: 'flex',
            flexDirection: otherFields.length >= 2 ? 'row' : 'column',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            {otherFields.map((field, index) => (
              <div key={index} className="input-group" style={{ 
                marginBottom: '8px',
                flex: otherFields.length >= 2 ? '1 1 calc(50% - 8px)' : '1 1 100%',
                minWidth: '200px'
              }}>
                <label style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '15px',
                  fontWeight: '500',
                  color: '#e0e0e0'
                }}>
                  {getFieldLabel(field)}
                  {isFieldRequired(field) && <span style={{ color: '#FF4D4D', marginLeft: '4px' }}>*</span>}
                </label>
                <input
                  type="text"
                  value={customText[field.name] || ''}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={getPlaceholder(field)}
                  maxLength={field.text_configs.char_limit || 50}
                  style={{
                    fontSize: '16px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #333',
                    background: '#2A2A2A',
                    color: 'white',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Note about required fields */}
      <div className="required-fields-note" style={{ 
        marginTop: '16px', 
        fontSize: '14px', 
        color: '#aaa',
        display: 'flex',
        alignItems: 'center',
        gap: '4px'
      }}>
        <span style={{ color: '#FF4D4D' }}>*</span> Required fields
      </div>
    </div>
  );
};

