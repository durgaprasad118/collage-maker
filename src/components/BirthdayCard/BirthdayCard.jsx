import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {X} from "lucide-react";
import html2canvas from "html2canvas";
import './BirthdayCard.css';

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

// Image Storage Service (same as Card.jsx)
const ImageStorageService = {
  saveImage: async (key, imageData) => {
    try {
      localStorage.setItem(`birthday_image_${key}`, imageData);
      return true;
    } catch (error) {
      console.error('Error saving image:', error);
      return false;
    }
  },
  
  getImage: async (key) => {
    try {
      return localStorage.getItem(`birthday_image_${key}`);
    } catch (error) {
      console.error('Error getting image:', error);
      return null;
    }
  }
};

const BirthdayCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();

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

  const [photos, setPhotos] = useState({
    person_photo: null,
  });

  const [photoMetadata, setPhotoMetadata] = useState({
    person_photo: false,
  });
   const [isLoading, setIsLoading] = useState(true); // Add this line
   const preloadFonts = async () => {
    const fonts = [
      { name: 'Tinos-Regular', url: TinosRegular },
      { name: 'Montserrat-SemiBold', url: MontserratSemiBold },
      { name: 'Montserrat-Regular', url: MontserratRegular },
      { name: 'AbrilFatface-Regular', url: AbrilFatface },
      { name: 'Allura-Regular', url: Allura },
      { name: 'Times-New-Roman-Regular', url: TimesNewRoman },
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
      console.error('Failed to preload fonts:', error);
      setFontsLoaded(true); // Fallback
    }
  };
  useEffect(() => {
    preloadFonts();
  }, []);
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

  // Constants
  const scrollThreshold = 120;
  const touchScrollThreshold = 120;
  const scrollCooldown = 500;

  // Save data function
  const saveData = useCallback(async () => {
    try {
      localStorage.setItem(
        'birthday_card_text',
        JSON.stringify({
          customText,
          inputValues,
        })
      );

      localStorage.setItem(
        'birthday_card_metadata',
        JSON.stringify(photoMetadata)
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [customText, inputValues, photoMetadata]);

  // Load saved data
  const loadSavedData = useCallback(async () => {
    try {
      const savedMetadata = localStorage.getItem('birthday_card_metadata');
      if (savedMetadata) {
        const metadata = JSON.parse(savedMetadata);
        setPhotoMetadata(metadata);

        for (const [key, exists] of Object.entries(metadata)) {
          if (exists) {
            const photo = await ImageStorageService.getImage(key);
            if (photo) {
              setPhotos(prev => ({ ...prev, [key]: photo }));
            }
          }
        }
      }

      const savedTextData = localStorage.getItem('birthday_card_text');
      if (savedTextData) {
        const textData = JSON.parse(savedTextData);
        if (textData.customText) setCustomText(textData.customText);
        if (textData.inputValues) setInputValues(textData.inputValues);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Handle input changes
  const handleInputChange = useCallback((name, value) => {
    if (name === "birthday_date") {
      setInputValues(prev => ({
        ...prev,
        birthday_date: value
      }));

      if (value) {
        const date = new Date(value);
        const dayName = date.toLocaleString("en-US", { weekday: "long" });
        const monthName = date.toLocaleString("en-US", { month: "long" });
        const day = date.getDate();
        const formattedDate = `${dayName}, ${monthName} ${day}`;

        setCustomText(prev => ({
          ...prev,
          birthday_date: formattedDate
        }));
      }
    } else if (name === "birthday_time") {
      setInputValues(prev => ({
        ...prev,
        birthday_time: value
      }));

      if (value) {
        const [hours, minutes] = value.split(":");
        const time = new Date();
        time.setHours(hours, minutes);
        const formattedTime = time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).toLowerCase();

        setCustomText(prev => ({
          ...prev,
          birthday_time: formattedTime
        }));
      }
    } else {
      setCustomText(prev => ({
        ...prev,
        [name]: value
      }));
    }

    saveData();
  }, [saveData]);

  // Photo handling
  const handlePhotoChange = useCallback(async (name, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image under 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        setPhotos(prev => ({ ...prev, [name]: reader.result }));
        await ImageStorageService.saveImage(name, reader.result);
        setPhotoMetadata(prev => ({ ...prev, [name]: true }));
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
      downloadLink.download = "birthday-invitation.jpg";
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }).catch(error => {
      console.error('Error generating image:', error);
      alert('Error generating image. Please try again.');
    });
  }, []);

  // WhatsApp share handler
  const handleWhatsAppShare = useCallback(async () => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    try {
      const canvas = await html2canvas(captureDiv, { scale: 4 });
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const file = new File([blob], 'birthday-invitation.jpg', { type: 'image/jpeg' });

      const message = `🎉 *Birthday Celebration* 🎉\n\nCelebrating ${customText.birthday_name || "[Name]"}'s Birthday!\n\n📅 ${customText.birthday_date || "Date TBA"}\n⏰ ${customText.birthday_time || "Time TBA"}\n📍 ${customText.birthday_venue || "Venue TBA"}\n\nJoin us for this special celebration! 🎂`;

      const shareData = {
        files: [file],
        text: message
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      alert('Unable to share. Please try again.');
    }
  }, [customText]);

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      setIsLoading(true);
      try {
        console.log('Fetching birthday template data for ID:', id);
        const response = await fetch("/data/birthday.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        console.log('Fetched data:', data);
  
        const templates = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        console.log('Processed templates:', templates);
  
        const startIndex = templates.findIndex(
          (template) => template.id === `id_${id}`
        );
        console.log('Found template index:', startIndex);
  
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

  useEffect(() => {
    const handleScroll = (deltaY, e) => {
      if (e) {
        e.preventDefault();
        e.stopPropagation();
      }
  
      if (isScrolling.current || isAnimating) return;
  
      if (deltaY > 0 && currentIndex < allTemplates.length - 1) {
        isScrolling.current = true;
        setIsAnimating(true);
        setSlideDirection("up");
        prevTemplateRef.current = currentTemplate;
  
        setTimeout(() => {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setCurrentTemplate(allTemplates[nextIndex]);
          navigate(`/birthday/${nextIndex + 1}`, { replace: true });
        }, 30);
  
        setTimeout(() => {
          setSlideDirection(null);
          setIsAnimating(false);
          isScrolling.current = false;
        }, 1000);
      } else if (deltaY < 0 && currentIndex > 0) {
        isScrolling.current = true;
        setIsAnimating(true);
        setSlideDirection("down");
        prevTemplateRef.current = currentTemplate;
  
        setTimeout(() => {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentTemplate(allTemplates[prevIndex]);
          navigate(`/birthday/${prevIndex + 1}`, { replace: true });
        }, 100);
  
        setTimeout(() => {
          setSlideDirection(null);
          setIsAnimating(false);
          isScrolling.current = false;
        }, 1000);
      }
    };
  
    // Scroll and touch event listeners
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

  // Render modal content
  const renderModal = () => {
    if (!isEditModalOpen) return null;

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h2>Edit Birthday Card Details</h2>
            <button className="close-button" onClick={() => setIsEditModalOpen(false)}>
              <X size={24} />
            </button>
          </div>

          <div className="modal-body">
            {/* Photo upload section */}
            {currentTemplate?.images?.length > 0 && (
              <div className="photo-inputs">
                <div className="photo-input">
                  <label>Birthday Person's Photo</label>
                  <div className="photo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange("person_photo", e.target.files[0])}
                    />
                    {photos.person_photo && (
                      <img
                        src={photos.person_photo}
                        alt="Preview"
                        className="photo-preview"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Text input section */}
            <div className="text-inputs">
              <div className="input-group">
                <label>Name</label>
                <input
                  type="text"
                  value={customText.birthday_name || ''}
                  onChange={(e) => handleInputChange("birthday_name", e.target.value)}
                  placeholder="Enter name"
                />
              </div>

              <div className="input-group">
                <label>Birthday Date</label>
                <input
                  type="date"
                  value={inputValues.birthday_date || ''}
                  onChange={(e) => handleInputChange("birthday_date", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Celebration Time</label>
                <input
                  type="time"
                  value={inputValues.birthday_time || ''}
                  onChange={(e) => handleInputChange("birthday_time", e.target.value)}
                />
              </div>

              <div className="input-group">
                <label>Venue</label>
                <textarea
                  value={customText.birthday_venue || ''}
                  onChange={(e) => handleInputChange("birthday_venue", e.target.value)}
                  placeholder="Enter venue details"
                />
              </div>
            </div>
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

  // Template rendering logic
  const renderTemplateContent = useCallback((template) => {
    return (
      <div className="template-content">
        <img
          src={template?.images[0]?.template}
          alt="Base Template"
          className="base-template"
        />
        {template?.images.map((image, index) => (
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
                backgroundImage: `url(${photos.person_photo || image.sample_image})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat"
              }}
            />
          </div>
        ))}
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
              fontFamily: `${text.text_configs.font_id.replace('.ttf', '')}, sans-serif`,
            }}
          >
            {customText[text.name] || text.text_configs.sample_text}
          </div>
        ))}
      </div>
    );
  }, [photos, customText]);

  // Loading and error states
// Loading and error states

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

      {/* Render modal */}
      {renderModal()}

      {/* Action buttons */}
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

export default BirthdayCard;