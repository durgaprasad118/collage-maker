import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { X, Trash2 } from "lucide-react";
import html2canvas from "html2canvas";
import ZoomableImage from './ZoomableImage';

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

const ImageStorageService = {
  saveImage: async (key, imageData) => {
    try {
      localStorage.setItem(`collage_image_${key}`, imageData);
      return true;
    } catch (error) {
      console.error("Error saving image:", error);
      return false;
    }
  },

  getImage: async (key) => {
    try {
      return localStorage.getItem(`collage_image_${key}`);
    } catch (error) {
      console.error("Error getting image:", error);
      return null;
    }
  },

  removeImage: async (key) => {
    try {
      localStorage.removeItem(`collage_image_${key}`);
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

  // Load saved photos
  const loadSavedPhotos = useCallback(async () => {
    try {
      const savedMetadata = localStorage.getItem("collage_photos_metadata");
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

  // Handle photo uploads
  const handleMultiplePhotos = useCallback(
    async (files) => {
      if (!files || files.length === 0) return;

      // Get remaining slots count
      const filledPhotosCount = Object.keys(photos).length;
      const remainingSlots =
        currentTemplate?.images?.length - filledPhotosCount;

      // Check if user is trying to upload more photos than available slots
      if (files.length > remainingSlots) {
        alert(
          `You can only upload ${remainingSlots} more photo${
            remainingSlots > 1 ? "s" : ""
          }`
        );
        return;
      }

      try {
        const promises = Array.from(files).map(async (file, index) => {
          let imageData;

          // Check if file needs compression
          if (file.size > 5 * 1024 * 1024) {
            const compressedData = await compressImage(file);
            imageData = compressedData;
          } else {
            imageData = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => resolve(e.target.result);
              reader.readAsDataURL(file);
            });
          }

          // Find next available slot
          let slotIndex = index;
          while (
            photos[`photo_${slotIndex}`] &&
            slotIndex < currentTemplate?.images?.length
          ) {
            slotIndex++;
          }

          // Save to storage
          await ImageStorageService.saveImage(`photo_${slotIndex}`, imageData);
          return { index: slotIndex, result: imageData };
        });

        const results = await Promise.all(promises);

        // Update photos state
        const newPhotos = { ...photos };
        const newMetadata = { ...photoMetadata };
        results.forEach(({ index, result }) => {
          newPhotos[`photo_${index}`] = result;
          newMetadata[`photo_${index}`] = true;
        });

        setPhotos(newPhotos);
        setPhotoMetadata(newMetadata);
        localStorage.setItem(
          "collage_photos_metadata",
          JSON.stringify(newMetadata)
        );

        // Close modal only if all slots are filled
        if (Object.keys(newPhotos).length === currentTemplate?.images?.length) {
          setIsEditModalOpen(false);
        }
      } catch (error) {
        console.error("Error handling photos:", error);
        alert("Error uploading photos. Please try again.");
      }
    },
    [currentTemplate?.images?.length, photos, photoMetadata]
  );

  // Download handler
  const handleDownload = useCallback(() => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    html2canvas(captureDiv, { scale: 9 })
      .then((canvas) => {
        const jpgDataUrl = canvas.toDataURL("image/jpeg", 1.0);
        const downloadLink = document.createElement("a");
        downloadLink.href = jpgDataUrl;
        downloadLink.download = `collage-${Date.now()}.jpg`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      })
      .catch((error) => {
        console.error("Error generating image:", error);
        alert("Error generating image. Please try again.");
      });
  }, []);

  // Share handler
  const handleWhatsAppShare = useCallback(async () => {
    const captureDiv = document.querySelector(".template-content");
    if (!captureDiv) return;

    try {
      const canvas = await html2canvas(captureDiv, { scale: 4 });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.8)
      );
      const file = new File([blob], "collage.jpg", { type: "image/jpeg" });

      if (navigator.share) {
        await navigator.share({
          files: [file],
        });
      } else {
        // Fallback for browsers that don't support native sharing
        const imageUrl = URL.createObjectURL(blob);
        window.open(imageUrl, "_blank");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      alert("Unable to share. Please try again.");
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
                  backgroundImage: `url(${
                    photos[`photo_${index}`] || image.sample_image
                  })`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                }}
              />
            </div>
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
      let imageData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.readAsDataURL(file);
      });

      // Save to storage
      await ImageStorageService.saveImage(`photo_${index}`, imageData);

      // Update states
      setPhotos((prev) => ({
        ...prev,
        [`photo_${index}`]: imageData,
      }));

      setFilledSlots((prev) => ({
        ...prev,
        [`photo_${index}`]: true,
      }));

      // Update metadata
      const newMetadata = {
        ...photoMetadata,
        [`photo_${index}`]: true,
      };
      setPhotoMetadata(newMetadata);
      localStorage.setItem(
        "collage_photos_metadata",
        JSON.stringify(newMetadata)
      );
    } catch (error) {
      console.error("Error handling single photo:", error);
      alert("Error uploading photo. Please try again.");
    }
  };

  const handleRemovePhoto = async (index) => {
    try {
      // Remove from storage
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

      // Update metadata
      const newMetadata = {
        ...photoMetadata,
        [`photo_${index}`]: false,
      };
      setPhotoMetadata(newMetadata);
      localStorage.setItem(
        "collage_photos_metadata",
        JSON.stringify(newMetadata)
      );
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
            <div className="upload-all-section">
              <p className="upload-info">
                Upload all {currentTemplate?.images?.length} photos at once
              </p>
              <div className="multi-upload-container">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => handleMultiplePhotos(e.target.files)}
                  className="multi-file-input"
                />
                <div className="upload-zone">
                  <span className="upload-icon">+</span>
                  <p>
                    Select {currentTemplate?.images?.length} photos together
                  </p>
                </div>
              </div>
            </div>

            <div className="separator">
              <span>or upload individually</span>
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
    </div>
  );
};

export default CollageCard;
