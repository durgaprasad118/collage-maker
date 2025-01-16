import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import html2canvas from "html2canvas";
import './CollageCard.css';

// Icon imports
import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";

// Image Storage Service for local persistence
const ImageStorageService = {
  saveImage: async (key, imageData) => {
    try {
      localStorage.setItem(`collage_image_${key}`, imageData);
      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  },
  
  getImage: async (key) => {
    try {
      return localStorage.getItem(`collage_image_${key}`);
    } catch (error) {
      console.error('Error getting image:', error);
      return null;
    }
  }
};

const CollageCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [photos, setPhotos] = useState({});
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

  // Load saved photos
  const loadSavedPhotos = useCallback(async () => {
    try {
      const savedMetadata = localStorage.getItem('collage_photos_metadata');
      if (savedMetadata) {
        const metadata = JSON.parse(savedMetadata);
        setPhotoMetadata(metadata);

        const loadedPhotos = {};
        for (const [key, exists] of Object.entries(metadata)) {
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
      console.error('Error loading saved photos:', error);
    }
  }, []);

  useEffect(() => {
    loadSavedPhotos();
  }, [loadSavedPhotos]);

  // Handle photo uploads
  const handlePhotoChange = useCallback(async (key, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image under 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        setPhotos(prev => ({ ...prev, [key]: reader.result }));
        await ImageStorageService.saveImage(key, reader.result);
        setPhotoMetadata(prev => {
          const updated = { ...prev, [key]: true };
          localStorage.setItem('collage_photos_metadata', JSON.stringify(updated));
          return updated;
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling photo:', error);
      alert('Error uploading photo. Please try again.');
    }
  }, []);

  // Download handler
  const handleDownload = useCallback(() => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    html2canvas(captureDiv, { scale: 8 }).then((canvas) => {
      const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0);
      const downloadLink = document.createElement("a");
      downloadLink.href = jpgDataUrl;
      downloadLink.download = `collage-${Date.now()}.jpg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }).catch(error => {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
    });
  }, []);

  // Share handler
  const handleWhatsAppShare= useCallback(async () => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    try {
      const canvas = await html2canvas(captureDiv, { scale: 4 });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const file = new File([blob], 'collage.jpg', { type: 'image/jpeg' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
        });
      } else {
        // Fallback for browsers that don't support native sharing
        const imageUrl = URL.createObjectURL(blob);
        window.open(imageUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Unable to share. Please try again.');
    }
  }, []);

  // Fetch templates
  useEffect(() => {
    const fetchTemplates = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/data/collage.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
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
  const renderTemplateContent = useCallback((template) => {
    if (!template) return null;

    return (
      <div className="template-content">
        <img
          src={template.images[0]?.template}
          alt="Base Template"
          className="base-template"
        />
        {template.images.map((image, index) => (
          <div
            key={index}
            style={{
              width: `${image.coordinates.width_in_px}px`,
              height: `${image.coordinates.height_in_px}px`,
              position: "absolute",
              top: `${image.coordinates.top_in_px}px`,
              left: `${image.coordinates.left_in_px}px`,
              zIndex: 0,
            }}
          >
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundImage: `url(${photos[`photo_${index}`] || image.sample_image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
          </div>
        ))}
      </div>
    );
  }, [photos]);

  // Scroll handling
  useEffect(() => {
    const handleScroll = (deltaY, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }

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
      handleScroll(e.deltaY, e);
    };

    const handleTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e) => {
      if (touchStartRef.current === null) return;
      const touchDeltaY = e.touches[0].clientY - touchStartRef.current;
      handleScroll(-touchDeltaY, e);
      touchStartRef.current = null;
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleWheel, { passive: false });
      container.addEventListener("touchstart", handleTouchStart, { passive: false });
      container.addEventListener("touchmove", handleTouchMove, { passive: false });
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleWheel);
        container.removeEventListener("touchstart", handleTouchStart);
        container.removeEventListener("touchmove", handleTouchMove);
      }
    };
  }, [currentIndex, allTemplates, navigate, currentTemplate, isAnimating]);

  // Modal content
  const renderModal = () => {
    if (!isEditModalOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Upload Images</h2>
            <button className="close-button" onClick={() => setIsEditModalOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            {currentTemplate?.images?.length > 0 && (
              <div className="photo-inputs">
                {currentTemplate.images.map((image, index) => (
                  <div key={index} className="photo-input">
                    <label>{`Image ${index + 1}`}</label>
                    <div className="photo-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handlePhotoChange(`photo_${index}`, e.target.files[0])}
                      />
                      {photos[`photo_${index}`] && (
                        <img
                          src={photos[`photo_${index}`]}
                          alt={`Preview ${index + 1}`}
                          className="photo-preview"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="save-button" onClick={() => setIsEditModalOpen(false)}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
 

  // Error state
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
    </div>
  );
};

export default CollageCard;