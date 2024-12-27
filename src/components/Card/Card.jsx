import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Card = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  
  // State for custom text inputs
  const [customText, setCustomText] = useState({
    wedding_groom_name: "",
    wedding_bride_name: "",
    wedding_date: "",
    wedding_time: "",
    wedding_venue: ""
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

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>Loading templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row gap-8 p-8 bg-gray-100">
      {/* Form Section */}
      <div className="lg:w-1/3">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-6">Customize Wedding Card</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Groom's Name</label>
              <input
                type="text"
                value={customText.wedding_groom_name}
                onChange={(e) => handleInputChange("wedding_groom_name", e.target.value)}
                placeholder="Enter groom's name"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Bride's Name</label>
              <input
                type="text"
                value={customText.wedding_bride_name}
                onChange={(e) => handleInputChange("wedding_bride_name", e.target.value)}
                placeholder="Enter bride's name"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wedding Date</label>
              <input
                type="text"
                value={customText.wedding_date}
                onChange={(e) => handleInputChange("wedding_date", e.target.value)}
                placeholder="Enter wedding date"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Wedding Time</label>
              <input
                type="text"
                value={customText.wedding_time}
                onChange={(e) => handleInputChange("wedding_time", e.target.value)}
                placeholder="Enter wedding time"
                className="w-full p-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Venue</label>
              <input
                type="text"
                value={customText.wedding_venue}
                onChange={(e) => handleInputChange("wedding_venue", e.target.value)}
                placeholder="Enter venue"
                className="w-full p-2 border rounded-md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Template Display Section */}
      <div 
        ref={containerRef}
        className="lg:w-2/3 flex justify-center items-center"
        style={{ backgroundColor: "#f4f4f4" }}
      >
        <div
          className="image-container"
          style={{
            position: "relative",
            width: "fit-content",
            margin: "0 auto",
          }}
        >
          {/* Base Template Image */}
          <img
            src={currentTemplate.images[0]?.template}
            alt="Base Template"
            style={{ position: "relative", zIndex: 1 }}
          />

          {/* Overlay Images */}
          {currentTemplate.images.map((image, index) => (
            <img
              key={index}
              src={image.sample_image}
              alt={image.name}
              style={{
                position: "absolute",
                width: `${image.coordinates.width_in_px}px`,
                height: `${image.coordinates.height_in_px}px`,
                top: `${image.coordinates.top_in_px}px`,
                left: `${image.coordinates.left_in_px}px`,
                zIndex: 0,
              }}
            />
          ))}

          {/* Overlay Texts */}
          {currentTemplate.texts.map((text, index) => (
            <div
              key={index}
              style={{
                position: "absolute",
                width: `${text.coordinates.width_in_px}px`,
                height: `${text.coordinates.height_in_px}px`,
                top: `${text.coordinates.top_in_px}px`,
                left: `${text.coordinates.left_in_px}px`,
                fontSize: `${text.text_configs.size}px`,
                color: text.text_configs.color,
                fontFamily: "CustomFont, Arial, sans-serif",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: text.text_configs.text_alignment.toLowerCase(),
                zIndex: 3,
              }}
            >
              {customText[text.name] || text.text_configs.sample_text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Card;