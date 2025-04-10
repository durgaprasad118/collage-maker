import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../TemplateLibrary/TemplateLibrary.css';
import './CollageLibrary.css';
import Header from '../Header/Header';

const CollageLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/data/collage.json');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        const templateList = Object.entries(data).map(([id, details]) => ({
          id,
          numericId: id.replace('id_', ''),
          thumbnail: details.images?.[0]?.thumbnail?.replace('/Wedding-Templates/', '/Collage-Templates/') || '/placeholder-image.jpg',
          ...details,
        }));
        setTemplates(templateList);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Error fetching collage templates. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
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
      <Header />
      <div className="template-library">
        <h1>Photo Collage Templates</h1>
        <div className="template-grid">
          {templates.map((template) => (
            <div 
              key={template.id} 
              onClick={() => navigate(`/collage/${template.numericId}`)}
            >
              <img
                src={template.thumbnail}
                alt={`Collage Template ${template.numericId}`}
                onError={(e) => (e.target.src = 'https://via.placeholder.com/400x600/1a2438/ffffff?text=Photo+Collage')}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CollageLibrary; 