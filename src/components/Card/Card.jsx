import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const Card = () => {
  const { id } = useParams(); // Extract ID from URL
  const navigate = useNavigate(); // For navigation
  const [allTemplates, setAllTemplates] = useState([]); // All templates data
  const [currentTemplate, setCurrentTemplate] = useState(null); // Current template data
  const [loading, setLoading] = useState(true); // Loading state
  const [error, setError] = useState(null); // Error state
  const [currentIndex, setCurrentIndex] = useState(0); // Current index for templates
  const containerRef = useRef(null); // Reference to container for scroll handling
  const scrollTimeout = useRef(null); // Timeout for throttling scroll events

  // Fetch template data on component mount or ID change
  useEffect(() => {
    const fetchTemplateData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/wedding.json');
        if (!response.ok) throw new Error('Failed to fetch template data');
        
        const data = await response.json();

        // Adjust paths for images if necessary
        const templates = data.templates.map(template => ({
          ...template,
          images: template.images.map(image => ({
            ...image,
            template: image.template.replace('/templates/', '/templetes/'),
            thumbnail: image.thumbnail.replace('/templates-thumbnail/', '/templetes-thumbnail/')
          }))
        }));

        const startIndex = templates.findIndex(t => t.id === parseInt(id, 10));
        if (startIndex === -1) throw new Error('Template not found');

        setAllTemplates(templates);
        setCurrentIndex(startIndex);
        setCurrentTemplate(templates[startIndex]);
        setError(null);
      } catch (err) {
        console.error('Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplateData();
  }, [id]);

  // Handle scroll events for navigation between templates
  useEffect(() => {
    const container = containerRef.current;
    let touchStart = 0;
    let touchEnd = 0;
    let isThrottled = false;

    const handleTouchStart = (e) => {
      touchStart = e.changedTouches[0].screenY;
    };

    const handleTouchEnd = (e) => {
      touchEnd = e.changedTouches[0].screenY;
      handleSwipe();
    };

    const handleWheel = (e) => {
      if (isThrottled) return;
      isThrottled = true;

      if (e.deltaY > 50 && currentIndex < allTemplates.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTemplate(allTemplates[nextIndex]);
        navigate(`/card/${allTemplates[nextIndex].id}`, { replace: true });
      } else if (e.deltaY < -50 && currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTemplate(allTemplates[prevIndex]);
        navigate(`/card/${allTemplates[prevIndex].id}`, { replace: true });
      }

      setTimeout(() => {
        isThrottled = false;
      }, 300); // Throttle interval
    };

    const handleSwipe = () => {
      const swipeDistance = touchStart - touchEnd;
      if (swipeDistance > 50 && currentIndex < allTemplates.length - 1) {
        const nextIndex = currentIndex + 1;
        setCurrentIndex(nextIndex);
        setCurrentTemplate(allTemplates[nextIndex]);
        navigate(`/card/${allTemplates[nextIndex].id}`, { replace: true });
      } else if (swipeDistance < -50 && currentIndex > 0) {
        const prevIndex = currentIndex - 1;
        setCurrentIndex(prevIndex);
        setCurrentTemplate(allTemplates[prevIndex]);
        navigate(`/card/${allTemplates[prevIndex].id}`, { replace: true });
      }
    };

    if (container) {
      container.addEventListener('wheel', handleWheel);
      container.addEventListener('touchstart', handleTouchStart);
      container.addEventListener('touchend', handleTouchEnd);

      return () => {
        container.removeEventListener('wheel', handleWheel);
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [currentIndex, allTemplates, navigate]);

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading template...</p>
        </div>
      </div>
    );
  }

  if (error || !currentTemplate) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gray-50 py-4 px-2 sm:py-6 sm:px-4 flex justify-center items-center"
    >
      <div className="max-w-md mx-auto">
        {/* <button     /// Navigated to home buttton working well need to give style only header k ander aa rha hai abhi
          onClick={handleBack}
          className="mb-4 px-3 py-1 text-sm text-pink-600 hover:text-pink-700 flex items-center"
        >
          ← Back to Templates
        </button> */}

        <div className="relative bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="relative">
            <img
              src={currentTemplate.images[0].template}
              alt={`Wedding Template ${currentTemplate.id}`}
              className="w-full h-auto"
            />

            {/* Overlay Images */}
            {currentTemplate.images.map((image, index) => (
              <div
                key={`image-${index}`}
                className="absolute"
                style={{
                  width: `${image.coordinates.width_in_px}px`,
                  height: `${image.coordinates.height_in_px}px`,
                  top: `${image.coordinates.top_in_px}px`,
                  left: `${image.coordinates.left_in_px}px`
                }}
              />
            ))}

            {/* Text Overlays */}
            {currentTemplate.texts.map((text, index) => (
              <div
                key={`text-${index}`}
                className="absolute"
                style={{
                  width: `${text.coordinates.width_in_px}px`,
                  height: `${text.coordinates.height_in_px}px`,
                  top: `${text.coordinates.top_in_px}px`,
                  left: `${text.coordinates.left_in_px}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${text.text_configs.size}px`,
                  color: text.text_configs.color,
                  textAlign: text.text_configs.text_alignment.toLowerCase()
                }}
              >
              
              </div>
            ))}
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default Card;
