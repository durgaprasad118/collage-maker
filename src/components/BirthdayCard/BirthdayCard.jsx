import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Grid, ArrowLeft } from "lucide-react";
import html2canvas from "html2canvas";
import "./BirthdayCard.css";
import ZoomableImage from "../shared/ZoomableImage";
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

const BirthdayCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [customText, setCustomText] = useState({
    birthday_name: "",
    birthday_date: "",
    birthday_time: "",
    birthday_venue: "",
  });
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // Refs
  const containerRef = useRef(null);

  // Hooks
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

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/data/birthday.json");
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

  // Load fonts and add body class
  useEffect(() => {
    preloadFonts();
    document.body.classList.add('birthday-card-active');
    
    return () => {
      document.body.classList.remove('birthday-card-active');
    };
  }, []);

  // Download handler
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
  
    // Small delay before rendering to canvas
    setTimeout(() => {
      html2canvas(captureDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        logging: false,
        imageTimeout: 0,
        backgroundColor: "#ffffff",
        scrollY: -window.scrollY
      })
        .then(canvas => {
          // Fix for mobile grayscale issue: force full alpha channel
          const ctx = canvas.getContext('2d');
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
  
          // Normalize alpha (fully opaque)
          for (let i = 3; i < data.length; i += 4) {
            data[i] = 255; // Set alpha to 255
          }
          ctx.putImageData(imageData, 0, 0);
  
          // Export PNG
          const pngDataUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngDataUrl;
          downloadLink.download = "birthday-invitation.png";
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

  // WhatsApp share handler
  const handleWhatsAppShare = useCallback(async () => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    // Display a loading indicator
    const loadingIndicator = document.createElement('div');
    Object.assign(loadingIndicator.style, {
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      zIndex: '9999'
    });
    loadingIndicator.textContent = 'Creating your image for sharing...';
    document.body.appendChild(loadingIndicator);

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

      // Create a canvas snapshot
      let pngDataUrl;
      try {
        // Get dimensions and create canvas
        const rect = captureDiv.getBoundingClientRect();
        const canvas = document.createElement('canvas');
        canvas.width = rect.width;
        canvas.height = rect.height;
        
        // Draw the template directly onto the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(captureDiv, 0, 0);
        
        pngDataUrl = canvas.toDataURL('image/png');
      } catch (canvasError) {
        console.error("Direct canvas approach failed:", canvasError);
        
        // Fallback to html2canvas
        const canvas = await html2canvas(captureDiv, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0
        });
        
        pngDataUrl = canvas.toDataURL('image/png');
      }

      // Convert data URL to blob
      const blob = await fetch(pngDataUrl).then(res => res.blob());
      
      // Create file from blob
      const file = new File([blob], "birthday-invitation.png", {
        type: "image/png",
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
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Unable to share. Please try again.");
    } finally {
      // Restore original states
      originalStates.forEach(state => {
        if (state.display !== undefined) state.element.style.display = state.display;
        if (state.className) state.element.className = state.className;
      });
      
      document.body.removeChild(loadingIndicator);
    }
  }, [customText]);

  // Handle template selection
  const handleTemplateSelect = (index) => {
    setCurrentIndex(index);
    setCurrentTemplate(allTemplates[index]);
    navigate(`/birthday/${index + 1}`, { replace: true });
    setShowTemplateGallery(false);
  };

  // Template rendering logic
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
          {template.images.map((image, index) => {
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
          {template.texts.map((text, index) => (
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
    [photos, customText, allTemplates, currentIndex, setCurrentIndex, setCurrentTemplate, currentTemplate]
  );

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

  // Render modal content 
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
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>{uploadModal.headerTitle}</h2>
            <button
              className="close-button"
              onClick={() => setIsEditModalOpen(false)}
            >
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            {uploadModal.renderUploadArea()}
            {uploadModal.renderPreviewGrid()}
          </div>

          <div className="modal-footer">
            <button
              className="primary-button"
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

  return (
    <div className={`main-container ${isEditModalOpen ? "modal-open" : ""}`}>
      {renderTemplateGallery()}
      
      <div ref={containerRef} className="template-wrapper">
        <div className="template-positioning">
          {renderTemplateContent(currentTemplate)}
        </div>
      </div>

      {renderModal()}

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