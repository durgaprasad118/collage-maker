import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { SlArrowRight } from "react-icons/sl";

import Header from '../Header/Header'

const HomePage = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const sliderRef = useRef(null);

  const navigate = useNavigate();

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  useEffect(() => {
    const fetchAndSetTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/wedding.json');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        let templates = Object.entries(data).map(([id, details]) => ({
          id: id,
          numericId: id.replace('id_', ''),
          ...details,
        }));

        templates = shuffleArray(templates); // Shuffle the templates for randomness
        setTemplates(templates);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to load templates. Please try again.');
        if (retryCount < 3) {
          setTimeout(() => {
            setRetryCount((prev) => prev + 1);
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAndSetTemplates();
  }, [retryCount]);

  const handleTemplateSelect = (templateId) => {
    navigate(`/card/${templateId.replace('id_', '')}`);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
  };

  const handleViewAllClick = () => {
    navigate('/TemplateLibrary');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading beautiful templates...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p className="error-text">{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <>
 
    <div className="homepage-container">
    <section className="section-title">
     <h2 className="wedding-title">Wedding Cards</h2>
      <button className="view-all-btn"onClick={handleViewAllClick}>
         view all<SlArrowRight className="arrow-icon" />
     </button>
    </section>

      <div className="template-gallery-container">
        <div className="template-gallery" ref={sliderRef}>
          {templates.map((template) => (
            <div
              key={template.id}
              className="template-card"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <img
                src={
                  template?.images?.[0]?.thumbnail || '/placeholder-image.jpg'
                }
                alt={`Wedding Template ${template.numericId}`}
                className="template-image"
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
    </>
  );
};

export default HomePage;
