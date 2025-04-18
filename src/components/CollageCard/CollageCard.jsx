import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Grid, ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";
import "../BirthdayCard/BirthdayCard.css"; // Reuse the same CSS
import ZoomableImage from "../shared/ZoomableImage"; // Using shared component
import { useImageUpload, renderImageUploadModal } from "../../utils/ImageUploadManager";
import { downloadCanvas } from "../../utils/CanvasDownloader";

// Icon imports
import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";
import shareIcon from "../../assets/icons/Share_Icon.svg";

const CollageCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Refs for touch handling
  const containerRef = useRef(null);
  const isScrolling = useRef(false);

  // Use the shared image upload hook
  const {
    photos,
    uploadError,
    handleDrag,
    handleDrop,
    handlePhotoChange,
    handlePhotoRemove,
    handleMultipleImageDrop,
    handleMultipleImageSelect,
  } = useImageUpload(currentTemplate);

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching collage template data for ID:", id);
        const response = await fetch("/data/collage.json");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("Fetched data:", data);

        const templates = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        console.log("Processed templates:", templates);

        const startIndex = templates.findIndex(
          (template) => template.id === `id_${id}`
        );
        console.log("Found template index:", startIndex);

        if (startIndex === -1) throw new Error("Template not found.");

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

    fetchTemplateData();
  }, [id]);

  // Render modal content using the shared utility
  const renderModal = () => {
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

  // WhatsApp share handler
  const handleWhatsAppShare = useCallback(async () => {
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
  
    try {
      // Wait for a moment to ensure the UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
  
      const options = {
        scale: 4, // Higher scale for better quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF', // Set explicit white background
        logging: false,
        imageTimeout: 0,
        // Don't modify transforms in the clone - capture exactly as visible
        onclone: (clonedDoc) => {
          // Only enhance image quality, don't reset transforms
          const images = clonedDoc.getElementsByTagName('img');
          for (let img of images) {
            img.style.imageRendering = 'high-quality';
          }
        }
      };
  
      const canvas = await html2canvas(captureDiv, options);
  
      // Create high resolution canvas
      const scaledCanvas = document.createElement('canvas');
      scaledCanvas.width = canvas.width * 2;
      scaledCanvas.height = canvas.height * 2;
      const ctx = scaledCanvas.getContext('2d');
      
      // Add white background to eliminate black transparency artifacts
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
      
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
  
      const file = new File([blob], "collage.jpg", {
        type: "image/jpeg",
        lastModified: Date.now()
      });
  
      const message = `🎬 *Check out my collage!* 🎬\n\nI created this awesome collage using Card Maker!`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: message,
          title: 'Collage'
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
      document.body.removeChild(loadingIndicator);
    }
  }, []);

  const handleDownload = useCallback(() => {
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
  
    // Hide UI controls
    const uiControls = document.querySelectorAll(
      '.save-button, .selection-border, .image-controls, .react-transform-component__content--bottom-right'
    );
    const selectedElements = document.querySelectorAll('.selected');
    const originalStates = [];
  
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
  
    // Delay to allow UI updates before capture
    setTimeout(() => {
      html2canvas(captureDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        backgroundColor: null, // Transparent background
        scrollY: -window.scrollY,
        windowWidth: captureDiv.scrollWidth,
        windowHeight: captureDiv.scrollHeight
      })
        .then(canvas => {
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
  
          // Replace pure white pixels with transparency
          for (let i = 0; i < data.length; i += 4) {
            if (data[i] === 255 && data[i + 1] === 255 && data[i + 2] === 255 && data[i + 3] === 255) {
              data[i + 3] = 0;
            }
          }
          ctx.putImageData(imageData, 0, 0);
  
          // Download as PNG
          const pngDataUrl = canvas.toDataURL("image/png", 1.0);
          const downloadLink = document.createElement("a");
          downloadLink.href = pngDataUrl;
          downloadLink.download = "collage.png";
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
  
          document.body.removeChild(loadingIndicator);
        });
    }, 100);
  }, []);
  

  // Template rendering logic
  const renderTemplateContent = useCallback(
    (template) => {
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
              currentTemplate={currentTemplate}
              setCurrentTemplate={setCurrentTemplate}
              cardType="collage"
              index={index}
              onAddImageClick={() => {
                setIsEditModalOpen(true);
                // Focus on the file input field after modal opens
                setTimeout(() => {
                  const fileInput = document.getElementById('multiple-photo-input');
                  if (fileInput) fileInput.click();
                }, 300);
              }}
            />
            );
          })}
        </div>
      );
    },
    [photos, allTemplates, currentIndex, setCurrentIndex, setCurrentTemplate, currentTemplate]
  );

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  // Handle template selection
  const handleTemplateSelect = (index) => {
    setCurrentIndex(index);
    setCurrentTemplate(allTemplates[index]);
    navigate(`/collage/${index + 1}`, { replace: true });
    setShowTemplateGallery(false);
  };

  // Template gallery component
  const renderTemplateGallery = () => {
    if (!showTemplateGallery) return null;

    return (
      <div className="template-gallery-overlay">
        <div className="template-gallery-header">
          <button
            className="back-button"
            onClick={() => setShowTemplateGallery(false)}
          >
            <ArrowLeft size={24} />
            <span>Back to Collage</span>
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

  // Main render
  return (
    <div className={`main-container ${isEditModalOpen ? "modal-open" : ""}`}>
      {renderTemplateGallery()}
      
      <div ref={containerRef} className="template-wrapper">
        <div className="template-positioning">
          {renderTemplateContent(currentTemplate)}
        </div>
      </div>

      {/* Render modal */}
      {renderModal()}

      {/* Action buttons */}
      <div className="button-container">
        <button
          className="action-button gallery-button"
          onClick={() => setShowTemplateGallery(true)}
        >
          <Grid size={20} />
          <span>Templates</span>
        </button>
        <button
          className="action-button edit-button"
          onClick={() => setIsEditModalOpen(true)}
        >
          <img src={editIcon} alt="Edit" className="icon" />
          <span>Upload</span>
        </button>
        <button
          className="action-button share-button"
          onClick={handleWhatsAppShare}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
            alt="WhatsApp"
            className="icon"
            style={{ width: "20px", height: "20px" }}
          />
          <span>Share</span>
        </button>
        <button
          className="action-button download-button"
          onClick={handleDownload}
        >
          <img src={downloadIcon} alt="Download" className="icon" />
          <span>Download</span>
        </button>
      </div>
    </div>
  );
};

export default CollageCard;