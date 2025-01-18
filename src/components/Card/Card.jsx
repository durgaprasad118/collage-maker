import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, X, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import "./Card.css";

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

// Image Storage Service
const ImageStorageService = {
  dbName: 'WeddingCardDB',
  storeName: 'cardImages',
  version: 1,

  initDB: () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(ImageStorageService.dbName, ImageStorageService.version);
      
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(ImageStorageService.storeName)) {
          db.createObjectStore(ImageStorageService.storeName);
        }
      };
    });
  },

  saveImage: async (key, imageData) => {
    try {
      // First compress the image
      const compressedImage = await ImageStorageService.compressImage(imageData, 800);
      
      // Then start a new transaction
      const db = await ImageStorageService.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([ImageStorageService.storeName], 'readwrite');
        const store = transaction.objectStore(ImageStorageService.storeName);
        
        const request = store.put(compressedImage, key);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
        
        // Handle transaction completion
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      console.error('Error in saveImage:', error);
      throw error;
    }
  },

  getImage: async (key) => {
    try {
      const db = await ImageStorageService.initDB();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction([ImageStorageService.storeName], 'readonly');
        const store = transaction.objectStore(ImageStorageService.storeName);
        const request = store.get(key);
        
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error in getImage:', error);
      throw error;
    }
  },

  compressImage: (base64String, maxWidth) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = () => {
        console.error('Error loading image for compression');
        resolve(base64String); // Fallback to original
      };
    });
  }
};

const Card = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Initialize all states
  const [customText, setCustomText] = useState({
    wedding_groom_name: "",
    wedding_bride_name: "",
    wedding_date: "",
    wedding_time: "",
    wedding_venue: "",
  });

  const [inputValues, setInputValues] = useState({
    wedding_date: "",
    wedding_time: "",
  });

  const [photos, setPhotos] = useState({
    groom_photo: null,
    bride_photo: null,
    couple_photo: null,
  });

  const [photoMetadata, setPhotoMetadata] = useState({
    groom_photo: false,
    bride_photo: false,
    couple_photo: false,
  });

  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Initialize refs
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
        'wedding_card_text',
        JSON.stringify({
          customText,
          inputValues,
        })
      );

      localStorage.setItem(
        'wedding_card_metadata',
        JSON.stringify(photoMetadata)
      );
    } catch (error) {
      console.error('Error saving data:', error);
    }
  }, [customText, inputValues, photoMetadata]);

  // Load saved data effect
  const loadSavedData = useCallback(async () => {
    try {
      // Load metadata first
      const savedMetadata = localStorage.getItem('wedding_card_metadata');
      const metadata = savedMetadata ? JSON.parse(savedMetadata) : null;

      if (metadata) {
        setPhotoMetadata(metadata);

        // Load photos from IndexedDB
        for (const [key, exists] of Object.entries(metadata)) {
          if (exists) {
            const photo = await ImageStorageService.getImage(key);
            if (photo) {
              setPhotos(prev => ({ ...prev, [key]: photo }));
            }
          }
        }
      }

      // Load text data
      const savedTextData = localStorage.getItem('wedding_card_text');
      if (savedTextData) {
        const textData = JSON.parse(savedTextData);
        if (textData.customText) {
          setCustomText(textData.customText);
        }
        if (textData.inputValues) {
          setInputValues(textData.inputValues);
        }
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Modal handlers
  const handleModalClose = useCallback(() => {
    saveData();
    setIsEditModalOpen(false);
  }, [saveData]);

  // Utility functions
  const getOrdinalSuffix = useCallback((day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  }, []);

  // Photo change handler
  const handlePhotoChange = useCallback(async (name, file) => {
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Please choose an image under 5MB");
      return;
    }

    try {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          // Update UI immediately
          setPhotos(prev => ({ ...prev, [name]: reader.result }));
          
          // Save to IndexedDB
          await ImageStorageService.saveImage(name, reader.result);
          
          // Update metadata
          const newMetadata = { ...photoMetadata, [name]: true };
          setPhotoMetadata(newMetadata);
          
          // Save metadata
          localStorage.setItem(
            'wedding_card_metadata',
            JSON.stringify(newMetadata)
          );

          // Get the compressed saved image
          const savedImage = await ImageStorageService.getImage(name);
          if (savedImage) {
            setPhotos(prev => ({ ...prev, [name]: savedImage }));
          }
        } catch (error) {
          console.error('Error processing image:', error);
          alert('Error processing image. Please try again.');
        }
      };

      reader.onerror = () => {
        alert('Error reading file. Please try again.');
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error handling photo:', error);
      alert('Error uploading photo. Please try again.');
    }
  }, [photoMetadata]);

  // Input handlers with auto-save
  const handleInputChange = useCallback((name, value) => {
    if (name === "wedding_date") {
      setInputValues(prev => {
        const newInputValues = {
          ...prev,
          wedding_date: value
        };
        return newInputValues;
      });

      if (value) {
        const date = new Date(value);
        const dayName = date.toLocaleString("en-US", { weekday: "long" });
        const monthName = date.toLocaleString("en-US", { month: "long" });
        const day = date.getDate();
        const ordinalSuffix = getOrdinalSuffix(day);
        const formattedDate = `${dayName}, ${monthName} ${day}${ordinalSuffix}`;

        setCustomText(prev => {
          const newCustomText = {
            ...prev,
            wedding_date: formattedDate
          };
          return newCustomText;
        });
      }
    } else if (name === "wedding_time") {
      setInputValues(prev => {
        const newInputValues = {
          ...prev,
          wedding_time: value
        };
        return newInputValues;
      });

      if (value) {
        const [hours, minutes] = value.split(":");
        const time = new Date();
        time.setHours(hours, minutes);
        const formattedTime = time.toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true
        }).toLowerCase();

        setCustomText(prev => {
          const newCustomText = {
            ...prev,
            wedding_time: formattedTime
          };
          return newCustomText;
        });
      }
    } else {
      setCustomText(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Save after any change
    saveData();
  }, [getOrdinalSuffix, saveData]);

  // Navigation handlers
  const goToHomePage = useCallback(() => {
    navigate("/");
  }, [navigate]);

  // Font preloading
  const preloadFonts = useCallback(async () => {
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
        const loadedFont = await fontFace.load();
        document.fonts.add(loadedFont);
        return loadedFont;
      });

      await Promise.all(fontPromises);
      setFontsLoaded(true);
    } catch (error) {
      console.error("Failed to preload fonts:", error);
      setFontsLoaded(true); // Fallback
    }
  }, []);

  useEffect(() => {
    preloadFonts();
  }, [preloadFonts]);

  // Download handler
  const handleDownload = useCallback(() => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    html2canvas(captureDiv, { scale: 8 }).then((canvas) => {
      const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0);
      const downloadLink = document.createElement("a");
      downloadLink.href = jpgDataUrl;
      downloadLink.download = "wedding-invitation.jpg";
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
      const canvas = await html2canvas(captureDiv, { 
        scale: 4,
        useCORS: true,
        allowTaint: true,
        backgroundColor: null 
      });

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8));
      const file = new File([blob], 'wedding-invitation.jpg', { type: 'image/jpeg' });

      const message = `🎊 *Wedding Invitation* 🎊\n\n${customText.wedding_bride_name || "[Bride Name]"} & ${customText.wedding_groom_name || "[Groom Name]"}\n\n📅 ${customText.wedding_date || "Date TBA"}\n⏰ ${customText.wedding_time || "Time TBA"}\n📍 ${customText.wedding_venue || "Venue TBA"}\n\nYour presence will make our day special! 💑`;

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

  // Viewport management
  useEffect(() => {
    const metaTag = document.querySelector("meta[name='viewport']");
    const originalContent = metaTag?.getAttribute("content");

    const newContent = "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";

    if (metaTag) {
      metaTag.setAttribute("content", newContent);
    } else {
      const newMetaTag = document.createElement("meta");
      newMetaTag.name = "viewport";
      newMetaTag.content = newContent;
      document.head.appendChild(newMetaTag);
    }

    return () => {
      if (metaTag && originalContent) {
        metaTag.setAttribute("content", originalContent);
      }
    };
  }, []);

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        const response = await fetch("/data/wedding.json");
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
      }
    };

    fetchTemplateData();
  }, [id]);

  // Scroll handling
  const handleScroll = useCallback((deltaY, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (isScrolling.current || isAnimating) return;

    const currentTime = Date.now();
    if (currentTime - lastScrollTimeRef.current < scrollCooldown) return;

    scrollAccumulator.current = Math.min(
      scrollAccumulator.current + Math.abs(deltaY),
      scrollThreshold * 1.5
    );

    if (scrollAccumulator.current > scrollThreshold) {
      lastScrollTimeRef.current = currentTime;
      scrollAccumulator.current = 0;

      const scrollVelocity = Math.abs(deltaY) / 100;
      if (scrollVelocity < 0.5) return;

      if (deltaY > 0 && currentIndex < allTemplates.length - 1) {
        isScrolling.current = true;
        setIsAnimating(true);
        setSlideDirection("up");
        prevTemplateRef.current = currentTemplate;

        setTimeout(() => {
          const nextIndex = currentIndex + 1;
          setCurrentIndex(nextIndex);
          setCurrentTemplate(allTemplates[nextIndex]);
          navigate(`/card/${allTemplates[nextIndex].id.replace('id_', '')}`, { replace: true });
        }, 10);

        setTimeout(() => {
          setSlideDirection(null);
          setIsAnimating(false);
          isScrolling.current = false;
        }, 700);
      } else if (deltaY < 0 && currentIndex > 0) {
        isScrolling.current = true;
        setIsAnimating(true);
        setSlideDirection("down");
        prevTemplateRef.current = currentTemplate;

        setTimeout(() => {
          const prevIndex = currentIndex - 1;
          setCurrentIndex(prevIndex);
          setCurrentTemplate(allTemplates[prevIndex]);
          navigate(`/card/${allTemplates[prevIndex].id.replace('id_', '')}`, { replace: true });
        }, 10);

        setTimeout(() => {
          setSlideDirection(null);
          setIsAnimating(false);
          isScrolling.current = false;
        }, 700);
      }
    }
  }, [currentIndex, allTemplates, navigate, currentTemplate, isAnimating]);

  // Scroll and touch event listeners
  useEffect(() => {
    if (!containerRef.current) return;

    const handleWheel = (e) => handleScroll(e.deltaY, e);
    const handleTouchStart = (e) => {
      touchStartRef.current = e.touches[0].clientY;
      scrollAccumulator.current = 0;
    };

    const handleTouchMove = (e) => {
      if (touchStartRef.current === null) return;
      
      const touchDeltaY = e.touches[0].clientY - touchStartRef.current;
      const absDeltaY = Math.abs(touchDeltaY);
      
      scrollAccumulator.current = Math.min(
        scrollAccumulator.current + absDeltaY,
        touchScrollThreshold * 1.5
      );
      
      if (scrollAccumulator.current > touchScrollThreshold) {
        handleScroll(-touchDeltaY * 1.5, e);
        touchStartRef.current = null;
        scrollAccumulator.current = 0;
      }
    };

    const container = containerRef.current;
    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    container.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchmove", handleTouchMove);
    };
  }, );

  // Template rendering
  const renderTemplateContent = useCallback((template) => {
    const isSingleImageTemplate = template?.images?.length === 1;

    return (
      <div className="template-content">
        <img
          src={template?.images[0]?.template}
          alt="Base Template"
          className="base-template"
        />
        {template?.images.map((image, index) => {
          let photoToUse = isSingleImageTemplate ? 
            photos.couple_photo : 
            (image.name === "wedding_groom_image" ? photos.groom_photo : photos.bride_photo);

          return (
            <div
              key={index}
              style={{
                width: `${image.coordinates.width_in_px}px`,
                height: `${image.coordinates.height_in_px}px`,
                position: "absolute",
                top: `${image.coordinates.top_in_px}px`,
                left: `${image.coordinates.left_in_px}px`,
                zIndex: 0,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundImage: `url(${photoToUse || image.sample_image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
          );
        })}
        {template?.texts.map((text, index) => {
          const getFontFamily = (fontId) => {
            if (!fontId) return "Tinos-Regular, sans-serif";
            const fontName = fontId.replace(".ttf", "");
            return `${fontName}, sans-serif`;
          };

          return (
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
                fontFamily: getFontFamily(text.text_configs.font_id),
                textRendering: "optimizeLegibility",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
              }}
            >
              {customText[text.name] || text.text_configs.sample_text}
            </div>
          );
        })}
      </div>
    );
  }, [photos, customText]);

  if (!fontsLoaded) {
    return (
      <div className="loading-container">
        <div className="spinner" />
        <p className="loading-text">Loading resources...</p>
      </div>
    );
  }

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

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
  
      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Wedding Card Details</h2>
              <button className="close-button" onClick={handleModalClose}>
                <X size={24} />
              </button>
            </div>
  
            <div className="modal-body">
              {currentTemplate?.images?.length > 0 && (
                <div className="input-sections">
                  {(() => {
                    const imageFields = currentTemplate.images.filter((img) =>
                      img.name.includes("image")
                    );
  
                    if (imageFields.length === 1) {
                      return (
                        <div className="section">
                          <div className="photo-input">
                            <label>Couple Photo</label>
                            <div className="photo-upload">
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  handlePhotoChange(
                                    "couple_photo",
                                    e.target.files[0]
                                  )
                                }
                              />
                              {photos.couple_photo && (
                                <img
                                  src={photos.couple_photo}
                                  alt="Couple preview"
                                  className="photo-preview"
                                />
                              )}
                            </div>
                          </div>
  
                          <div className="input-group">
                            <label>Couple Names</label>
                            <input
                              type="text"
                              value={customText.wedding_groom_name}
                              onChange={(e) =>
                                handleInputChange("wedding_groom_name", e.target.value)
                              }
                              placeholder="Enter groom's name"
                            />
                            <input
                              type="text"
                              value={customText.wedding_bride_name}
                              onChange={(e) =>
                                handleInputChange("wedding_bride_name", e.target.value)
                              }
                              placeholder="Enter bride's name"
                            />
                          </div>
                        </div>
                      );
                    } else {
                      return (
                        <>
                          <div className="section">
                            <div className="photo-input">
                              <label>Groom's Photo</label>
                              <div className="photo-upload">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handlePhotoChange(
                                      "groom_photo",
                                      e.target.files[0]
                                    )
                                  }
                                />
                                {photos.groom_photo && (
                                  <img
                                    src={photos.groom_photo}
                                    alt="Groom preview"
                                    className="photo-preview"
                                  />
                                )}
                              </div>
                            </div>
  
                            <div className="input-group">
                              <label>Groom's Name</label>
                              <input
                                type="text"
                                value={customText.wedding_groom_name}
                                onChange={(e) =>
                                  handleInputChange("wedding_groom_name", e.target.value)
                                }
                                placeholder="Enter groom's name"
                              />
                            </div>
                          </div>
  
                          <div className="section">
                            <div className="photo-input">
                              <label>Bride's Photo</label>
                              <div className="photo-upload">
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handlePhotoChange(
                                      "bride_photo",
                                      e.target.files[0]
                                    )
                                  }
                                />
                                {photos.bride_photo && (
                                  <img
                                    src={photos.bride_photo}
                                    alt="Bride preview"
                                    className="photo-preview"
                                  />
                                )}
                              </div>
                            </div>
  
                            <div className="input-group">
                              <label>Bride's Name</label>
                              <input
                                type="text"
                                value={customText.wedding_bride_name}
                                onChange={(e) =>
                                  handleInputChange("wedding_bride_name", e.target.value)
                                }
                                placeholder="Enter bride's name"
                              />
                            </div>
                          </div>
                        </>
                      );
                    }
                  })()}
  
                  <div className="section wedding-details">
                    <div className="input-group">
                      <label>Wedding Date</label>
                      <input
                        type="date"
                        value={inputValues.wedding_date}
                        onChange={(e) =>
                          handleInputChange("wedding_date", e.target.value)
                        }
                      />
                    </div>
  
                    <div className="input-group">
                      <label>Wedding Time</label>
                      <input
                        type="time"
                        value={inputValues.wedding_time}
                        onChange={(e) =>
                          handleInputChange("wedding_time", e.target.value)
                        }
                      />
                    </div>
  
                    <div className="input-group">
                      <label>Venue</label>
                      <textarea
                        value={customText.wedding_venue}
                        onChange={(e) =>
                          handleInputChange("wedding_venue", e.target.value)
                        }
                        placeholder="Enter venue details"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
  
            <div className="modal-footer">
              <button className="save-button" onClick={handleModalClose}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
  
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
  
  export default Card;