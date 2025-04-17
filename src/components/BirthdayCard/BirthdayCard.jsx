import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Grid, ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";
import "./BirthdayCard.css";
import ZoomableImage from "../shared/ZoomableImage"; // Using shared component
import { useImageUpload, renderImageUploadModal } from "../../utils/ImageUploadManager";

// Font imports
import TinosRegular from "../../assets/fonts/Tinos-Regular.ttf";
import MontserratSemiBold from "../../assets/fonts/Montserrat-SemiBold.ttf";
import MontserratRegular from "../../assets/fonts/Montserrat-Regular.ttf";
import AbrilFatface from "../../assets/fonts/AbrilFatface-Regular.ttf";
import Allura from "../../assets/fonts/Allura-Regular.ttf";
import TimesNewRoman from "../../assets/fonts/Times-New-Roman-Regular.ttf";

// Icon imports
import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";


// Create an in-memory storage for images instead of using localStorage
const memoryStorage = {
  images: {},
  metadata: {},
  textData: {}
};

const BirthdayCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // Initialize states
  const [customText, setCustomText] = useState({
    birthday_name: "",
    birthday_date: "",
    birthday_time: "",
    birthday_venue: "",
  });

  const [inputValues, setInputValues] = useState({
    birthday_date: "",
    birthday_time: "",
  });

  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Same refs as Card.jsx
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartRef = useRef(null);
  const prevTemplateRef = useRef(null);
  const scrollAccumulator = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());

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

  // Font preloading
  const preloadFonts = async () => {
    const fonts = [
      { name: "Tinos-Regular", url: TinosRegular },
      { name: "Montserrat-SemiBold", url: MontserratSemiBold },
      { name: "Montserrat-Regular", url: MontserratRegular },
      { name: "AbrilFatface-Regular", url: AbrilFatface },
      { name: "Allura-Regular", url: Allura },
      { name: "Times-New-Roman-Regular", url: TimesNewRoman },
    ];

    try {
      const fontPromises = fonts.map(async (font) => {
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        return fontFace.load().then((loadedFont) => {
          document.fonts.add(loadedFont);
          return loadedFont;
        });
      });

      await Promise.all(fontPromises);
      setFontsLoaded(true);
    } catch (error) {
      console.error("Failed to preload fonts:", error);
      setFontsLoaded(true); 
    }
  };
  
  useEffect(() => {
    preloadFonts();
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    // Add a loading indicator
    const loadingIndicator = document.createElement('div');
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
    loadingIndicator.style.color = 'white';
    loadingIndicator.style.padding = '15px 20px';
    loadingIndicator.style.borderRadius = '10px';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.textContent = 'Creating your image...';
    document.body.appendChild(loadingIndicator);

    // Hide all UI controls and selection indicators
    const saveButtons = document.querySelectorAll('.save-button');
    const selectionBorders = document.querySelectorAll('.selection-border');
    const selectedElements = document.querySelectorAll('.selected');
    const zoomControls = document.querySelectorAll('.image-controls, .react-transform-component__content--bottom-right');
    
    // Store original states to restore later
    const originalStates = [];
    
    // Hide any UI controls that shouldn't be in the image
    [...saveButtons, ...selectionBorders, ...zoomControls].forEach(element => {
      if (element && element.style.display !== 'none') {
        originalStates.push({
          element,
          display: element.style.display
        });
        element.style.display = 'none';
      }
    });
    
    // Remove selection styling
    selectedElements.forEach(element => {
      originalStates.push({
        element,
        className: element.className
      });
      element.classList.remove('selected');
    });
    
    // Capture current transform states of all zoomed content
    const transformComponents = document.querySelectorAll('.react-transform-component');
    const zoomableContainers = document.querySelectorAll('.zoomable-container');
    const transformStates = [];
    
    // First process transform components (react-zoom-pan-pinch)
    transformComponents.forEach(element => {
      const style = window.getComputedStyle(element);
      const img = element.querySelector('img');
      
      if (img) {
        const imgStyle = window.getComputedStyle(img);
        transformStates.push({
          element,
          transform: style.transform,
          transformOrigin: style.transformOrigin,
          img,
          imgTransform: imgStyle.transform,
          imgTransformOrigin: imgStyle.transformOrigin,
          imgWidth: imgStyle.width,
          imgHeight: imgStyle.height,
          imgObjectFit: imgStyle.objectFit,
          imgObjectPosition: imgStyle.objectPosition
        });
      }
    });
    
    // Also process zoomable containers
    zoomableContainers.forEach(container => {
      originalStates.push({
        element: container,
        className: container.className
      });
      // Add a special class to identify this container during capture
      container.classList.add('capturing');
    });

    // Create a direct capture with exact styles without any HTML changes
    const options = {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      imageTimeout: 0,
      ignoreElements: (element) => {
        // Ignore any remaining UI elements that shouldn't be in the image
        return element.classList.contains('save-button') || 
               element.classList.contains('selection-border') ||
               element.classList.contains('image-controls') ||
               element.classList.contains('react-transform-component__content--bottom-right');
      },
      onclone: (clonedDoc) => {
        // Add a temporary stylesheet to the cloned document to ensure transforms are preserved
        const style = clonedDoc.createElement('style');
        style.innerHTML = `
          .react-transform-component {
            transform-style: preserve-3d !important;
          }
          .capturing img {
            object-fit: cover !important;
            transform-origin: center !important;
          }
        `;
        clonedDoc.head.appendChild(style);
        
        // For react-zoom-pan-pinch, we need to preserve exact transforms
        const clonedTransformComponents = clonedDoc.querySelectorAll('.react-transform-component');
        
        clonedTransformComponents.forEach((element, index) => {
          if (index < transformStates.length) {
            const state = transformStates[index];
            // Apply exact transform to ensure it matches the current view
            element.style.transform = state.transform;
            element.style.transformOrigin = state.transformOrigin;
            
            const img = element.querySelector('img');
            if (img && state.img) {
              // Apply exact image styles
              img.style.transform = state.imgTransform;
              img.style.transformOrigin = state.imgTransformOrigin;
              img.style.width = state.imgWidth;
              img.style.height = state.imgHeight;
              img.style.objectFit = state.imgObjectFit;
              img.style.objectPosition = state.imgObjectPosition;
              img.style.maxWidth = 'none';
              img.style.maxHeight = 'none';
            }
          }
        });
      }
    };

    html2canvas(captureDiv, options)
      .then((canvas) => {
        // Convert to JPEG with high quality
        const jpgDataUrl = canvas.toDataURL("image/jpeg", 0.95);
        
        // Create download link
        const downloadLink = document.createElement("a");
        downloadLink.href = jpgDataUrl;
        downloadLink.download = "birthday-invitation.jpg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
        
        // Restore original UI states
        originalStates.forEach(state => {
          if (state.display !== undefined) {
            state.element.style.display = state.display;
          }
          if (state.className) {
            state.element.className = state.className;
          }
        });
        
        // Remove loading indicator
        document.body.removeChild(loadingIndicator);
      })
      .catch((error) => {
        console.error("Error generating image:", error);
        
        // Restore original UI states
        originalStates.forEach(state => {
          if (state.display !== undefined) {
            state.element.style.display = state.display;
          }
          if (state.className) {
            state.element.className = state.className;
          }
        });
        
        document.body.removeChild(loadingIndicator);
        alert("Error generating image. Please try again.");
      });
  }, []);

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
      // Hide selection indicators for clean capture
      const selectedElements = document.querySelectorAll('.selected');
      const selectionBorders = document.querySelectorAll('.selection-border');
      const saveButtons = document.querySelectorAll('.save-button');
      
      // Store original states
      const originalStates = [];
      
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

      const file = new File([blob], "birthday-invitation.jpg", {
        type: "image/jpeg",
        lastModified: Date.now()
      });

      const message = `🎉 *Birthday Celebration* 🎉\n\nCelebrating ${
        customText.birthday_name || "[Name]"
      }'s Birthday!\n\n📅 ${customText.birthday_date || "Date TBA"}\n⏰ ${
        customText.birthday_time || "Time TBA"
      }\n📍 ${
        customText.birthday_venue || "Venue TBA"
      }\n\nJoin us for this special celebration! 🎂`;

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          text: message,
          title: 'Birthday Invitation'
        });
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }

      // Restore original states
      originalStates.forEach(state => {
        if (state.display !== undefined) state.element.style.display = state.display;
        if (state.className) state.element.className = state.className;
      });
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Unable to share. Please try again.");
    } finally {
      document.body.removeChild(loadingIndicator);
    }
  }, [customText]);

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching birthday template data for ID:", id);
        const response = await fetch("/data/birthday.json");
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

  // Add birthday-card-active class to body when component mounts
  useEffect(() => {
    document.body.classList.add('birthday-card-active');
    
    // Clean up function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('birthday-card-active');
    };
  }, []);

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
          overflow: 'hidden'
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
            overflow: 'auto',
            maxHeight: 'calc(90vh - 140px)'
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
                cardType="birthday"
                index={index}
              />
            );
          })}
          {template?.texts.map((text, index) => (
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
    },
    [photos, customText, allTemplates, currentIndex, setCurrentIndex, setCurrentTemplate]
  );

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  // Handle template selection
  const handleTemplateSelect = (index) => {
    setCurrentIndex(index);
    setCurrentTemplate(allTemplates[index]);
    navigate(`/birthday/${index + 1}`, { replace: true });
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
            <span>Back to Card</span>
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

export default BirthdayCard;