import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        // Transform JSON structure into an array and extract numeric ID
        const templates = Object.entries(data).map(([id, details]) => ({
          id: id,
          numericId: id.replace('id_', ''), // Extract numeric part
          ...details,
        }));

        // Shuffle and pick templates based on screen size
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
    // Extract the numeric part from the template ID
    const numericId = templateId.replace('id_', '');
    navigate(`/card/${numericId}`);
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading beautiful templates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-rose-400 to-pink-600 bg-clip-text text-transparent mb-2">
            Wedding Cards
          </h1>
          <p className="text-gray-600 text-xs sm:text-sm font-light">
            Create beautiful memories that last forever
          </p>
        </div>

        {/* Template Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {currentTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md hover:shadow-lg shadow-pink-100 cursor-pointer transform transition-all duration-300 hover:-translate-y-1"
              onClick={() => handleTemplateSelect(template.id)}
            >
              <div className="relative aspect-[3/4] w-full rounded-lg sm:rounded-xl overflow-hidden">
                <img
                  src={template.images[0].thumbnail}
                  alt={`Wedding Template ${template.numericId}`}
                  className="w-full h-full object-cover transform transition-transform hover:scale-105 duration-500"
                  loading="lazy"
                  onError={(e) => {
                    console.error('Error loading thumbnail:', e);
                    e.target.src = '/placeholder-image.jpg'; // Add a placeholder image if available
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-center">
                    Template {template.numericId}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;