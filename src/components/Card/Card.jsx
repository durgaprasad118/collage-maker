import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, X, Download, Share2 } from "lucide-react";
import html2canvas from "html2canvas";
import "./Card.css";
import TinosRegular from "../../assets/fonts/Tinos-Regular.ttf";
import MontserratSemiBold from "../../assets/fonts/Montserrat-SemiBold.ttf";
import MontserratRegular from "../../assets/fonts/Montserrat-Regular.ttf";
import AbrilFatface from "../../assets/fonts/AbrilFatface-Regular.ttf";
import Allura from "../../assets/fonts/Allura-Regular.ttf";
import TimesNewRoman from "../../assets/fonts/Times-New-Roman-Regular.ttf";

// Import SVG icons
import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";

const Card = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartRef = useRef(null);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTemplateRef = useRef(null);
  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  const [customText, setCustomText] = useState({
    wedding_groom_name: "",
    wedding_bride_name: "",
    wedding_date: "",
    wedding_time: "",
    wedding_venue: "",
  });

  const [photos, setPhotos] = useState({
    groom_photo: null,
    bride_photo: null,
    couple_photo: null,
  });
  const [inputValues, setInputValues] = useState({
    wedding_date: "",
    wedding_time: "",
  });

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

  const goToHomePage = () => {
    navigate("/");
  };
  const handleInputChange = (name, value) => {
    if (name === "wedding_date") {
      setInputValues((prev) => ({
        ...prev,
        wedding_date: value,
      }));

      if (value) {
        const date = new Date(value);
        const dayName = date.toLocaleString("en-US", { weekday: "long" });
        const monthName = date.toLocaleString("en-US", { month: "long" });
        const day = date.getDate();
        const ordinalSuffix = getOrdinalSuffix(day);
        const formattedDate = `${dayName}, ${monthName} ${day}${ordinalSuffix}`;

        setCustomText((prev) => ({
          ...prev,
          wedding_date: formattedDate,
        }));
      }
    } else if (name === "wedding_time") {
      setInputValues((prev) => ({
        ...prev,
        wedding_time: value,
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
          wedding_time: formattedTime,
        }));
      }
    } else {
      setCustomText((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handlePhotoChange = (name, file) => {
    if (file) {
      // Add file size check
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        alert("Please choose an image under 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          setPhotos((prev) => ({
            ...prev,
            [name]: reader.result,
          }));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    // Wait for fonts to be loaded
    await document.fonts.ready;

    const templateContent = document.querySelector(".template-content");
    if (!templateContent) return;

    try {
      const images = templateContent.getElementsByTagName("img");
      await Promise.all(
        [...images].map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((resolve) => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })
      );

      const canvas = await html2canvas(templateContent, {
        useCORS: true,
        allowTaint: true,
        scrollY: -window.scrollY,
        scrollX: -window.scrollX,
        scale: window.devicePixelRatio * 2, // Increased scale for better quality
        logging: false,
        backgroundColor: null,
        onclone: (clonedDoc) => {
          const clonedTemplate = clonedDoc.querySelector(".template-content");
          if (clonedTemplate) {
            clonedTemplate.style.opacity = "1";
            clonedTemplate.style.transform = "none";
          }
        },
      });

      const image = canvas.toDataURL("image/png", 1.0);
      const link = document.createElement("a");
      link.href = image;
      link.download = `wedding-card-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Failed to download the image. Please try again.");
    }
  };

  // Viewport management
  useEffect(() => {
    const metaTag = document.querySelector("meta[name='viewport']");
    const originalContent = metaTag ? metaTag.getAttribute("content") : null;

    if (metaTag) {
      metaTag.setAttribute(
        "content",
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      );
    } else {
      const newMetaTag = document.createElement("meta");
      newMetaTag.name = "viewport";
      newMetaTag.content =
        "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no";
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
        navigate(`/card/${nextIndex + 1}`, { replace: true });
      }, 100);

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
        navigate(`/card/${prevIndex + 1}`, { replace: true });
      }, 100);

      setTimeout(() => {
        setSlideDirection(null);
        setIsAnimating(false);
        isScrolling.current = false;
      }, 1000);
    }
  };

  // Scroll and touch event listeners
  useEffect(() => {
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

  const renderTemplateContent = (template) => {
    // Check if template has single or double image layout
    const isSingleImageTemplate = template?.images?.length === 1;

    return (
      <div className="template-content">
        <img
          src={template?.images[0]?.template}
          alt="Base Template"
          className="base-template"
        />
        {template?.images.map((image, index) => {
          // Determine which photo to use based on template type
          let photoToUse;
          if (isSingleImageTemplate) {
            photoToUse = photos.couple_photo;
          } else {
            photoToUse =
              image.name === "wedding_groom_image"
                ? photos.groom_photo
                : photos.bride_photo;
          }

          return (
            <img
              key={index}
              src={photoToUse || image.sample_image}
              alt={image.name}
              style={{
                position: "absolute",
                width: `${image.coordinates.width_in_px}px`,
                height: `${image.coordinates.height_in_px}px`,
                top: `${image.coordinates.top_in_px}px`,
                left: `${image.coordinates.left_in_px}px`,
                zIndex: 0,
                objectFit: "cover",
              }}
            />
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
  };

  // Loading state
  if (!fontsLoaded) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading resources...</p>
      </div>
    );
  }

  // Error state
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
              <button
                className="close-button"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              {/* Only render photo inputs if template has images */}
              {currentTemplate?.images?.length > 0 && (
                <div className="photo-inputs">
                  {(() => {
                    // Count actual image fields
                    const imageFields = currentTemplate.images.filter((img) =>
                      img.name.includes("image")
                    );

                    if (imageFields.length === 1) {
                      // Single image case - show Couple Photo
                      return (
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
                      );
                    } else {
                      // Two images case - show Groom and Bride photos
                      return (
                        <>
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
                        </>
                      );
                    }
                  })()}
                </div>
              )}

              <div className="text-inputs">
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
      )}

      <div className="button-container">
        <button className="floating-button share-button" onClick={goToHomePage}>
          <span>Home</span>
        </button>
        <button
          className="floating-button download-button"
          onClick={handleDownload}
        >
          <img src={downloadIcon} alt="Download" className="icon" />
        </button>
        <button
          className="floating-button edit-button"
          onClick={() => setIsEditModalOpen(true)}
        >
          <img src={editIcon} alt="Edit" className="icon" />
        </button>
      </div>
    </div>
  );
};

export default Card;
