import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Edit2, X } from 'lucide-react';
import './Card.css';

const Card = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  
  const [customText, setCustomText] = useState({
    wedding_groom_name: "",
    wedding_bride_name: "",
    wedding_date: "",
    wedding_time: "",
    wedding_venue: "",
  });

  const [photos, setPhotos] = useState({
    groom_photo: null,
    bride_photo: null
  });

  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/data/wedding.json");
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

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
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [id]);

  useEffect(() => {
    const handleScroll = (e) => {
      if (isScrolling.current) return;

      if (e.deltaY > 0 && currentIndex < allTemplates.length - 1) {
        isScrolling.current = true;
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTemplate(allTemplates[nextIndex]);
        navigate(`/card/${nextIndex + 1}`, { replace: true });

        setTimeout(() => {
          isScrolling.current = false;
        }, 700);
      } else if (e.deltaY < 0 && currentIndex > 0) {
        isScrolling.current = true;
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTemplate(allTemplates[prevIndex]);
        navigate(`/card/${prevIndex + 1}`, { replace: true });

        setTimeout(() => {
          isScrolling.current = false;
        }, 700);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("wheel", handleScroll);
    }

    return () => {
      if (container) {
        container.removeEventListener("wheel", handleScroll);
      }
    };
  }, [currentIndex, allTemplates, navigate]);

  const handleInputChange = (name, value) => {
    setCustomText(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhotoChange = (name, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => ({
          ...prev,
          [name]: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (loading) {
    return <div className="loading-screen">Loading templates...</div>;
  }

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  return (
    <div className="card-container">
      <button className="edit-button" onClick={() => setIsEditModalOpen(true)}>
        <Edit2 size={20} />
        Edit
      </button>

      {/* Template Display Section */}
      <div ref={containerRef} className="template-section">
        <div className="template-container">
          {/* Base Template Image */}
          <img
            src={currentTemplate.images[0]?.template}
            alt="Base Template"
            className="base-template"
          />

          {/* Overlay Images */}
          {currentTemplate.images.map((image, index) => (
            <img
              key={index}
              src={photos[image.name === "wedding_groom_image" ? "groom_photo" : "bride_photo"] || image.sample_image}
              alt={image.name}
              style={{
                position: "absolute",
                width: `${image.coordinates.width_in_px}px`,
                height: `${image.coordinates.height_in_px}px`,
                top: `${image.coordinates.top_in_px}px`,
                left: `${image.coordinates.left_in_px}px`,
                zIndex: 0,
                objectFit: "cover"
              }}
            />
          ))}

          {/* Overlay Texts */}
          {currentTemplate.texts.map((text, index) => (
            <div
              key={index}
              className="text-overlay"
              style={{
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
      </div>

      {/* Edit Modal */}
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
                      <img src={photos.groom_photo} alt="Groom preview" className="photo-preview" />
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
                      <img src={photos.bride_photo} alt="Bride preview" className="photo-preview" />
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
    </div>
  );
};

export default Card;