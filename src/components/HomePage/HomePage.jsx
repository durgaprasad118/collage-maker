import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import { SlArrowRight } from "react-icons/sl";
import Header from '../Header/Header';

const HomePage = () => {
  const [weddingTemplates, setWeddingTemplates] = useState([]);
  const [birthdayTemplates, setBirthdayTemplates] = useState([]);
  const [collageTemplates, setCollageTemplates] = useState([]);
  const [loading, setLoading] = useState({
    wedding: true,
    birthday: true,
    collage: true
  });
  const [error, setError] = useState({
    wedding: null,
    birthday: null,
    collage: null
  });
  const [retryCount, setRetryCount] = useState({
    wedding: 0,
    birthday: 0,
    collage: 0
  });
  const sliderRef = useRef(null);
  const navigate = useNavigate();

  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const fetchTemplates = async (type) => {
  
    try {
      const response = await fetch(`/data/${type}.json`);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${type} templates`);
      }
  
      const data = await response.json();
      let templates = Object.entries(data).map(([id, details]) => ({
        id: id,
        numericId: id.replace('id_', ''),
        type: type,
        ...details,
      }));
  
      templates = shuffleArray(templates);
      
      switch(type) {
        case 'wedding':
          setWeddingTemplates(templates);
          break;
        case 'birthday':
          setBirthdayTemplates(templates);
          break;
        case 'collage':
          setCollageTemplates(templates);
          break;
      }
      
      setError(prev => ({ ...prev, [type]: null }));
    } catch (err) {
      console.error(`Fetch error for ${type}:`, err);
      setError(prev => ({ 
        ...prev, 
        [type]: `Failed to load ${type} templates. Please try again.` 
      }));
      
      if (retryCount[type] < 3) {
        setTimeout(() => {
          setRetryCount(prev => ({
            ...prev,
            [type]: prev[type] + 1
          }));
        }, 2000);
      }
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  useEffect(() => {
    fetchTemplates('wedding');
    fetchTemplates('birthday');
    fetchTemplates('collage');
  }, [retryCount.wedding, retryCount.birthday, retryCount.collage]);

  const handleTemplateSelect = (template) => {
    switch(template.type) {
      case 'birthday':
        navigate(`/birthday/${template.numericId}`);
        break;
      case 'collage':
        navigate(`/collage/${template.numericId}`);
        break;
      default:
        navigate(`/card/${template.numericId}`);
    }
  };

  const handleRetry = (type) => {
    setRetryCount(prev => ({ ...prev, [type]: 0 }));
    setError(prev => ({ ...prev, [type]: null }));
  };

  const handleViewAllClick = (type) => {
    switch(type) {
      case 'birthday':
        navigate('/BirthdayLibrary');
        break;
      case 'collage':
        navigate('/CollageLibrary');
        break;
      default:
        navigate('/TemplateLibrary');
    }
  };

  const ShimmerEffect = () => (
    <div className="template-gallery-container">
      <div className="template-gallery">
        {[1, 2, 3].map((_, index) => (
          <div key={index} className="template-card shimmer-card">
            <div className="shimmer-wrapper">
              <div className="shimmer-animation"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTemplateSection = (type, templates) => {
    const getTemplateImagePath = (template) => {
      if (type === 'collage') {
        return template?.images?.[0]?.thumbnail?.replace('/Wedding-Templates/', '/Collage-Templates/') || '/placeholder-image.jpg';
      }
      return template?.images?.[0]?.thumbnail || '/placeholder-image.jpg';
    };

    return (
      <>
        <section className="section-title">
          <h2 className="template-title">{type.charAt(0).toUpperCase() + type.slice(1)} Cards</h2>
          <button className="view-all-btn" onClick={() => handleViewAllClick(type)}>
            view all<SlArrowRight className="arrow-icon" />
          </button>
        </section>
  
        {loading[type] ? (
          <ShimmerEffect />
        ) : error[type] ? (
          <div className="error-container">
            <p className="error-text">{error[type]}</p>
            <button onClick={() => handleRetry(type)} className="retry-button">
              Try Again
            </button>
          </div>
        ) : (
          <div className="template-gallery-container">
            <div className="template-gallery" ref={sliderRef}>
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="template-card"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <img
                    src={getTemplateImagePath(template)}
                    alt={`${type.charAt(0).toUpperCase() + type.slice(1)} Template ${template.numericId}`}
                    className="template-image"
                    onError={(e) => {
                      e.target.src = '/placeholder-image.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="homepage-container">
      {renderTemplateSection('wedding', weddingTemplates)}
      {renderTemplateSection('birthday', birthdayTemplates)}
      {renderTemplateSection('collage', collageTemplates)}
    </div>
  );
};

export default HomePage;