import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";

const Card = () => {
  const { id } = useParams(); // Extract ID from the URL
  const navigate = useNavigate(); // For navigation
  const [allTemplates, setAllTemplates] = useState([]); // All templates data
  const [currentTemplate, setCurrentTemplate] = useState(null); // Current template data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [currentIndex, setCurrentIndex] = useState(0); // Current index for templates
  const containerRef = useRef(null); // Reference to container for scroll handling
  const isScrolling = useRef(false); // Flag to manage throttling

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
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [id]);

  // Handle scrolling to navigate templates
  useEffect(() => {
    const handleScroll = (e) => {
      if (isScrolling.current) return; // Prevent multiple scroll actions at once

      if (e.deltaY > 0 && currentIndex < allTemplates.length - 1) {
        isScrolling.current = true; // Set throttling flag
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTemplate(allTemplates[nextIndex]);
        navigate(`/card/${nextIndex + 1}`, { replace: true });

        setTimeout(() => {
          isScrolling.current = false; // Reset throttling flag
        }, 700); // Adjust throttle delay for smoother interaction
      } else if (e.deltaY < 0 && currentIndex > 0) {
        isScrolling.current = true; // Set throttling flag
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTemplate(allTemplates[prevIndex]);
        navigate(`/card/${prevIndex + 1}`, { replace: true });

        setTimeout(() => {
          isScrolling.current = false; // Reset throttling flag
        }, 700); // Adjust throttle delay for smoother interaction
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
    <div
      ref={containerRef}
      className="min-h-screen flex justify-center items-center"
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
              zIndex: 2,
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
            {text.text_configs.sample_text}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Card;
