import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import './HomePage.css';

const HomePage = () => {
  const [currentTemplates, setCurrentTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchAndSetTemplates = async () => {
      try {
        setLoading(true);
        const response = await fetch('/data/wedding.json');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }

        const data = await response.json();
        const templates = Object.entries(data).map(([id, details]) => ({
          id: id,
          numericId: id.replace('id_', ''),
          ...details,
        }));

        const shuffled = templates.sort(() => 0.5 - Math.random());
        const numTemplates = window.innerWidth < 768 ? 2 : 3;
        setCurrentTemplates(shuffled.slice(0, numTemplates));
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
    const numericId = templateId.replace('id_', '');
    navigate(`/card/${numericId}`);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
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
        <button onClick={handleRetry} className="retry-button">Try Again</button>
      </div>
    );
  }

  return (
    <>
    <Header/>
    <div className="homepage-container">
      <header className="homepage-header">
        <h1 className="homepage-title">Wedding Cards</h1>
      </header>
      <div className="template-gallery" style={{ display: 'flex', gap: '16px', justifyContent: 'center', alignItems: 'center', padding: '16px' }}>
        {currentTemplates.map((template) => (
          <div
            key={template.id}
            className="template-card"
            onClick={() => handleTemplateSelect(template.id)}
            style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', background: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)', flex: '1', maxWidth: '300px' }}
          >
            <div className="template-image-wrapper" style={{ width: '100%', height: 'auto', aspectRatio: '3 / 4', overflow: 'hidden' }}>
              <img
                src={template.images[0].thumbnail}
                alt={`Wedding Template ${template.numericId}`}
                className="template-image"
                style={{ objectFit: 'contain', width: '100%', height: '100%' }}
                onError={(e) => {
                  e.target.src = '/placeholder-image.jpg';
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
    );
};

export default HomePage;
