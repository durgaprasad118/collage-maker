import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, X } from 'lucide-react';
import './Card.css';

const Card = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartRef = useRef(null);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const prevTemplateRef = useRef(null);

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
  });

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

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        const response = await fetch("/data/wedding.json");
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();
        const templates = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));

        const startIndex = templates.findIndex((template) => template.id === `id_${id}`);
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

  const handleScroll = (deltaY, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isScrolling.current || isAnimating) return;

    if (deltaY > 0 && currentIndex < allTemplates.length - 1) {
      isScrolling.current = true;
      setIsAnimating(true);
      setSlideDirection('up');
      prevTemplateRef.current = currentTemplate;

      setTimeout(() => {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTemplate(allTemplates[nextIndex]);
        navigate(`/card/${nextIndex + 1}`, { replace: true });
      }, 350);

      setTimeout(() => {
        setSlideDirection(null);
        setIsAnimating(false);
        isScrolling.current = false;
      }, 700);
    } else if (deltaY < 0 && currentIndex > 0) {
      isScrolling.current = true;
      setIsAnimating(true);
      setSlideDirection('down');
      prevTemplateRef.current = currentTemplate;

      setTimeout(() => {
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTemplate(allTemplates[prevIndex]);
        navigate(`/card/${prevIndex + 1}`, { replace: true });
      }, 350);

      setTimeout(() => {
        setSlideDirection(null);
        setIsAnimating(false);
        isScrolling.current = false;
      }, 700);
    }
  };

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

  const handleInputChange = (name, value) => {
    setCustomText((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePhotoChange = (name, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => ({
          ...prev,
          [name]: reader.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTemplateContent = (template) => (
    <div className="template-content">
      <img
        src={template?.images[0]?.template}
        alt="Base Template"
        className="base-template"
      />
      {template?.images.map((image, index) => (
        <img
          key={index}
          src={
            photos[image.name === "wedding_groom_image" ? "groom_photo" : "bride_photo"] ||
            image.sample_image
          }
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
          }}
        >
          {customText[text.name] || text.text_configs.sample_text}
        </div>
      ))}
    </div>
  );

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  return (
    <div className="main-container">
      <div ref={containerRef} className="template-wrapper">
        {isAnimating && prevTemplateRef.current && (
          <div className={`template-positioning ${slideDirection === 'up' ? 'slide-up-exit' : 'slide-down-exit'}`}>
            {renderTemplateContent(prevTemplateRef.current)}
          </div>
        )}
        
        <div className={`template-positioning ${
          slideDirection === 'up' ? 'slide-up-enter' : 
          slideDirection === 'down' ? 'slide-down-enter' : ''
        }`}>
          {renderTemplateContent(currentTemplate)}
        </div>
      </div>

      {isEditModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Edit Wedding Card Details</h2>
              <button className="close-button" onClick={() => setIsEditModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="photo-inputs">
                <div className="photo-input">
                  <label>Groom's Photo</label>
                  <div className="photo-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoChange("groom_photo", e.target.files[0])}
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
                      onChange={(e) => handlePhotoChange("bride_photo", e.target.files[0])}
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
              </div>

              <div className="text-inputs">
                <div className="input-group">
                  <label>Groom's Name</label>
                  <input
                    type="text"
                    value={customText.wedding_groom_name}
                    onChange={(e) => handleInputChange("wedding_groom_name", e.target.value)}
                    placeholder="Enter groom's name"
                  />
                </div>

                <div className="input-group">
                  <label>Bride's Name</label>
                  <input
                    type="text"
                    value={customText.wedding_bride_name}
                    onChange={(e) => handleInputChange("wedding_bride_name", e.target.value)}
                    placeholder="Enter bride's name"
                  />
                </div>

                <div className="input-group">
                  <label>Wedding Date</label>
                  <input
                    type="date"
                    value={customText.wedding_date}
                    onChange={(e) => handleInputChange("wedding_date", e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Wedding Time</label>
                  <input
                    type="time"
                    value={customText.wedding_time}
                    onChange={(e) => handleInputChange("wedding_time", e.target.value)}
                  />
                </div>

                <div className="input-group">
                  <label>Venue</label>
                  <textarea
                    value={customText.wedding_venue}
                    onChange={(e) => handleInputChange("wedding_venue", e.target.value)}
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
      )}

      <button className="edit-button" onClick={() => setIsEditModalOpen(true)}>
        <Edit2 size={20} />
        Edit
      </button>
    </div>
  );
};

export default Card;