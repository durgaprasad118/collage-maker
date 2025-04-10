import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../TemplateLibrary/TemplateLibrary.css';
import Header from '../Header/Header';

const BirthdayLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/data/birthday.json');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        const templateList = Object.entries(data).map(([id, details]) => ({
          id,
          numericId: id.replace('id_', ''),
          thumbnail: details.images?.[0]?.thumbnail || '/placeholder-image.jpg',
          ...details,
        }));
        setTemplates(templateList);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Error fetching birthday templates. Please try again.');
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
        <h1 className="text-3xl font-bold text-white mb-8 text-center pt-8">Birthday Card Templates</h1>
        <div className="template-grid">
          {templates.map((template) => (
            <div 
              key={template.id} 
              className="template-item hover:transform hover:scale-105 transition-transform duration-300"
              onClick={() => navigate(`/birthday/${template.numericId}`)}
            >
              <img
                src={template.thumbnail}
                alt={`Birthday Template ${template.numericId}`}
                className="w-full h-full object-cover rounded-lg"
                onError={(e) => (e.target.src = 'https://via.placeholder.com/400x600/1a2438/ffffff?text=Birthday+Card')}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BirthdayLibrary; 