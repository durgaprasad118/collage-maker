import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TemplateLibrary.css';
import Logo from '../Logo/Logo';

const TemplateLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set viewport meta tag for mobile responsiveness
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/data/wedding.json');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        const templateList = Object.entries(data).map(([id, details]) => ({
          id,
          numericId: id.replace('id_', ''),
          thumbnail: details.images[0]?.thumbnail || '/placeholder-image.jpg',
          ...details,
        }));
        setTemplates(templateList);
        setError(null);
      } catch (err) {
        setError('Error fetching templates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
    
    // Clean up function
    return () => {
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#0F1725] flex items-center justify-center">
      <div className="loading-spinner"></div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-[#0F1725] flex items-center justify-center text-white">
      <div className="text-center">
        <p className="mb-4">{error}</p>
        <button 
          className="bg-[#9CCC65] text-[#0F1725] px-4 py-2 rounded-full"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-[#0F1725] min-h-screen">
      <Logo type="svg" />
      <div className="template-library">
        <h1>Wedding Templates</h1>
        <div className="template-grid">
          {templates.map((template) => (
            <div 
              key={template.id} 
              onClick={() => navigate(`/card/${template.numericId}`)}
              className="template-grid-item"
            >
              <img
                src={template.thumbnail}
                alt={`Template ${template.numericId}`}
                onError={(e) => (e.target.src = 'https://via.placeholder.com/400x600/1a2438/ffffff?text=Wedding+Card')}
                loading="lazy"
              />
            </div>
          ))}
        </div>
        
        {/* Mobile helper text */}
        <div className="text-center text-gray-400 text-sm mt-6 md:hidden">
          Tap on any template to customize
        </div>
      </div>
    </div>
  );
};

export default TemplateLibrary;
