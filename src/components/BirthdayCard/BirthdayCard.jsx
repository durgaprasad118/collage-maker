import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import CropModal from "../CropModal/CropModal";
import "./BirthdayCard.css";
import ZoomableImage from "./ZoomableImage";

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

const compressImage = (file) => {
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
// Image Storage Service (same as Card.jsx)
// Update the ImageStorageService object by adding the removeImage method
const ImageStorageService = {
  saveImage: async (key, imageData) => {
    try {
      localStorage.setItem(`birthday_image_${key}`, imageData);
      return true;
    } catch (error) {
      console.error("Error saving image:", error);
      return false;
    }
  },

  getImage: async (key) => {
    try {
      return localStorage.getItem(`birthday_image_${key}`);
    } catch (error) {
      console.error("Error getting image:", error);
      return null;
    }
  },

  // Add this new method
  removeImage: async (key) => {
    try {
      localStorage.removeItem(`birthday_image_${key}`);
      return true;
    } catch (error) {
      console.error("Error removing image:", error);
      return false;
    }
  },
};

const BirthdayCard = () => {
  const [showCropModal, setShowCropModal] = useState(false);
  const [cropImage, setCropImage] = useState(null);
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
  // const scrollThreshold = 120;
  // const touchScrollThreshold = 120;
  // const scrollCooldown = 500;

  const handleCroppedImage = async (croppedImage) => {
    try {
      let blob;

      if (croppedImage instanceof Blob) {
        blob = croppedImage;
      } else if (
        typeof croppedImage === "string" &&
        croppedImage.startsWith("data:")
      ) {
        const response = await fetch(croppedImage);
        blob = await response.blob();
      } else {
        throw new Error("Invalid image format received from crop");
      }

      if (!blob.type.startsWith("image/")) {
        throw new Error("Invalid image type");
      }

      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read blob"));
        reader.readAsDataURL(blob);
      });

      const base64Data = await base64Promise;

      let imageData = base64Data;
      if (blob.size > 5 * 1024 * 1024) {
        imageData = await compressImage(new Blob([blob]));
      }

      const saveResult = await ImageStorageService.saveImage(
        "person_photo",
        imageData
      );

      if (!saveResult) {
        throw new Error("Failed to save image to storage");
      }

      setPhotos((prev) => ({
        ...prev,
        person_photo: imageData,
      }));

      setPhotoMetadata((prev) => ({
        ...prev,
        person_photo: true,
      }));

      setShowCropModal(false);
      setCropImage(null);
    } catch (error) {
      console.error("Detailed cropping error:", error);

      let errorMessage = "Error saving cropped image. ";
      if (error.message.includes("storage")) {
        errorMessage +=
          "Storage is full. Please free up some space and try again.";
      } else if (error.message.includes("Invalid image")) {
        errorMessage += "Please ensure you are uploading a valid image file.";
      } else {
        errorMessage += "Please try again with a smaller image.";
      }

      alert(errorMessage);

      setShowCropModal(false);
      setCropImage(null);
    }
  };
  const handlePhotoRemove = useCallback(async (photoKey) => {
    try {
      // Remove image from localStorage
      await ImageStorageService.removeImage(photoKey);

      // Update photos state
      setPhotos((prev) => {
        const newPhotos = { ...prev };
        delete newPhotos[photoKey];
        return newPhotos;
      });

      // Update metadata
      setPhotoMetadata((prev) => {
        const newMetadata = {
          ...prev,
          [photoKey]: false,
        };
        localStorage.setItem(
          "birthday_card_metadata",
          JSON.stringify(newMetadata)
        );
        return newMetadata;
      });
    } catch (error) {
      console.error("Error removing photo:", error);
      alert("Error removing photo. Please try again.");
    }
  }, []);
  // Save data function
  const saveData = useCallback(async () => {
    try {
      localStorage.setItem(
        "birthday_card_text",
        JSON.stringify({
          customText,
          inputValues,
        })
      );

      localStorage.setItem(
        "birthday_card_metadata",
        JSON.stringify(photoMetadata)
      );
    } catch (error) {
      console.error("Error saving data:", error);
    }
  }, [customText, inputValues, photoMetadata]);

  // Load saved data
  const loadSavedData = useCallback(async () => {
    try {
      const savedMetadata = localStorage.getItem("birthday_card_metadata");
      if (savedMetadata) {
        const metadata = JSON.parse(savedMetadata);
        setPhotoMetadata(metadata);

        for (const [key, exists] of Object.entries(metadata)) {
          if (exists) {
            const photo = await ImageStorageService.getImage(key);
            if (photo) {
              setPhotos((prev) => ({ ...prev, [key]: photo }));
            }
          }
        }
      }

      const savedTextData = localStorage.getItem("birthday_card_text");
      if (savedTextData) {
        const textData = JSON.parse(savedTextData);
        if (textData.customText) setCustomText(textData.customText);
        if (textData.inputValues) setInputValues(textData.inputValues);
      }
    } catch (error) {
      console.error("Error loading saved data:", error);
    }
  }, []);

  useEffect(() => {
    loadSavedData();
  }, [loadSavedData]);

  // Handle input changes
  const handleInputChange = useCallback(
    (name, value) => {
      if (name === "birthday_date") {
        setInputValues((prev) => ({
          ...prev,
          birthday_date: value,
        }));

        if (value) {
          const date = new Date(value);
          const dayName = date.toLocaleString("en-US", { weekday: "long" });
          const monthName = date.toLocaleString("en-US", { month: "long" });
          const day = date.getDate();
          const formattedDate = `${dayName}, ${monthName} ${day}`;

          setCustomText((prev) => ({
            ...prev,
            birthday_date: formattedDate,
          }));
        }
      } else if (name === "birthday_time") {
        setInputValues((prev) => ({
          ...prev,
          birthday_time: value,
        }));

        if (value) {
          const [hours, minutes] = value.split(":");
          const time = new Date();
          time.setHours(hours, minutes);
          const formattedTime = time
            .toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
            })
            .toLowerCase();

          setCustomText((prev) => ({
            ...prev,
            birthday_time: formattedTime,
          }));
        }
      } else {
        setCustomText((prev) => ({
          ...prev,
          [name]: value,
        }));
      }

      saveData();
    },
    [saveData]
  );

  // Photo handling
  const handlePhotoChange = useCallback(async (name, file) => {
    if (!file) return;
  
    try {
      // Compress image if it exceeds 5MB
      let processedFile = file;
      if (file.size > 5 * 1024 * 1024) {
        const compressedDataUrl = await compressImage(file); // Use the compressImage function
        const compressedBlob = await fetch(compressedDataUrl).then((res) => res.blob());
  
        // Create a new file object from the compressed blob
        processedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });
      }
  
      // Create a URL for cropping
      const imageUrl = URL.createObjectURL(processedFile);
      setCropImage(imageUrl);
      setShowCropModal(true);
    } catch (error) {
      console.error("Error handling photo:", error);
      alert("Error processing photo. Please try again.");
    }
  }, []);
  

  // Download handler
  const handleDownload = useCallback(() => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    html2canvas(captureDiv, { scale: 10 })
      .then((canvas) => {
        const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0);
        const downloadLink = document.createElement("a");
        downloadLink.href = jpgDataUrl;
        downloadLink.download = "birthday-invitation.jpg";
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      })
      .catch((error) => {
        console.error("Error generating image:", error);
        alert("Error generating image. Please try again.");
      });
  }, []);

  // WhatsApp share handler
  const handleWhatsAppShare = useCallback(async () => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    try {
      const canvas = await html2canvas(captureDiv, { scale: 8 });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 5)
      );
      const file = new File([blob], "birthday-invitation.jpg", {
        type: "image/jpeg",
      });

      const message = `🎉 *Birthday Celebration* 🎉\n\nCelebrating ${
        customText.birthday_name || "[Name]"
      }'s Birthday!\n\n📅 ${customText.birthday_date || "Date TBA"}\n⏰ ${
        customText.birthday_time || "Time TBA"
      }\n📍 ${
        customText.birthday_venue || "Venue TBA"
      }\n\nJoin us for this special celebration! 🎂`;

      const shareData = {
        files: [file],
        text: message,
      };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(message)}`,
          "_blank"
        );
      }
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Unable to share. Please try again.");
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
            <button
              className="close-button"
              onClick={() => setIsEditModalOpen(false)}
            >
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
                    <label
                      className="upload-label"
                      htmlFor="person-photo-input"
                    >
                      {photos.person_photo ? "Change Image" : "Upload Image"}
                    </label>
                    <input
                      id="person-photo-input"
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handlePhotoChange("person_photo", e.target.files[0])
                      }
                      style={{ display: "none" }} // Hides the input for custom styling
                    />
                    {photos.person_photo && (
                      <div className="photo-preview-container">
                        <img
                          src={photos.person_photo}
                          alt="Preview"
                          className="photo-preview"
                        />
                        <button
                          className="remove-photo-btn"
                          onClick={() => handlePhotoRemove("person_photo")}
                          aria-label="Remove person photo"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
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
                  value={customText.birthday_name || ""}
                  onChange={(e) =>
                    handleInputChange("birthday_name", e.target.value)
                  }
                  placeholder="Enter name"
                />
              </div>

              <div className="input-group">
                <label>Birthday Date</label>
                <input
                  type="date"
                  value={inputValues.birthday_date || ""}
                  onChange={(e) =>
                    handleInputChange("birthday_date", e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <label>Celebration Time</label>
                <input
                  type="time"
                  value={inputValues.birthday_time || ""}
                  onChange={(e) =>
                    handleInputChange("birthday_time", e.target.value)
                  }
                />
              </div>

              <div className="input-group">
                <label>Venue</label>
                <textarea
                  value={customText.birthday_venue || ""}
                  onChange={(e) =>
                    handleInputChange("birthday_venue", e.target.value)
                  }
                  placeholder="Enter venue details"
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="save-button"
              onClick={() => setIsEditModalOpen(false)}
            >
              Save Changes
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
          {template?.images.map((image, index) => (
            <ZoomableImage
              key={index}
              image={image}
              coordinates={image.coordinates}
              backgroundImage={photos.person_photo}
            />
          ))}
          {/* Text overlays remain unchanged */}
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
    [photos, customText]
  );
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
      {showCropModal && (
        <CropModal
          image={cropImage}
          onCropComplete={handleCroppedImage}
          onClose={() => {
            setShowCropModal(false);
            setCropImage(null);
          }}
        />
      )}
    </div>
  );
};

export default BirthdayCard;
