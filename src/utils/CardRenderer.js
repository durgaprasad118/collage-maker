import React from "react";
import { X, Grid, ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";
import { renderImageUploadModal } from "./ImageUploadManager";
import ZoomableImage from "../components/shared/ZoomableImage"; 
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

  return (
    <div className="template-gallery-overlay">
      <div className="template-gallery-header">
        <button
          className="back-button"
          onClick={() => setShowTemplateGallery(false)}
        >
          <ArrowLeft size={24} />
          <span>Back to {cardType === "birthday" ? "Card" : "Collage"}</span>
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
  uploadError,
  handleDrag,
  handleDrop,
  handlePhotoRemove,
  handlePhotoChange,
  handleMultipleImageDrop,
  handleMultipleImageSelect,
}) => {
  if (!isEditModalOpen) return null;

  // Get upload modal elements from shared utility
  const uploadModal = renderImageUploadModal({
    isOpen: isEditModalOpen,
    onClose: () => setIsEditModalOpen(false),
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

  if (!uploadModal) return null;

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
      zIndex: 1000
    }}>
      <div className="modal-content" style={{
        ...uploadModal.modalStyles.content,
        width: '100%',
        maxWidth: '550px',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxSizing: 'border-box'
      }}>
        <div className="modal-header" style={uploadModal.modalStyles.header}>
          <h2 style={{margin: 0, fontWeight: '600', fontSize: '20px'}}>{uploadModal.headerTitle}</h2>
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

        <div className="modal-body" style={{
          ...uploadModal.modalStyles.body,
          overflowY: 'auto',
          overflowX: 'hidden',
          maxHeight: 'calc(90vh - 140px)',
          boxSizing: 'border-box'
        }}>
          {uploadModal.renderUploadArea()}
          {uploadModal.renderPreviewGrid()}
        </div>

        <div className="modal-footer" style={uploadModal.modalStyles.footer}>
          <button
            className="primary-button"
            onClick={() => setIsEditModalOpen(false)}
            style={{
              background: '#5D5FEF',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 48px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Renders the template content with images
 */
export const renderTemplateContent = ({
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
  return (
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
      {cardType === "birthday" && template?.texts?.map((text, index) => (
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
          }}
        >
          {customText[text.name] || text.text_configs.sample_text}
        </div>
      ))}
    </div>
  );
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
            if (cardType === "birthday") {
              window.location.href = "/BirthdayLibrary";
            } else {
              window.location.href = "/CollageLibrary";
            }
          }}
        >
          <Grid className="w-5 h-5 mb-1 text-white group-hover:text-blue-400" />
          <span className="sr-only">Templates</span>
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
          <span className="sr-only">Upload</span>
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
          <span className="sr-only">Download</span>
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
          <span className="sr-only">Share</span>
        </button>
        <div id="tooltip-share" role="tooltip" className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-md shadow-sm opacity-0 tooltip">
          Share
          <div className="tooltip-arrow" data-popper-arrow></div>
        </div>
      </div>
    </div>
  );
};

