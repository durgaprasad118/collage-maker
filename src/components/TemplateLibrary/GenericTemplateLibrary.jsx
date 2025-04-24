import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import './TemplateLibrary.css';

const GenericTemplateLibrary = ({
  title,
  dataUrl,
  navigatePath,
  placeholderText,
  helperText,
  logoComponent,
  thumbnailProcessor
}) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Set loading to true only when we're actually fetching
    setLoading(true);
    
    // Set viewport meta tag for mobile responsiveness
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    const fetchTemplates = async () => {
      try {
        const response = await fetch(dataUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${title.toLowerCase()} templates`);
        }
        const data = await response.json();
        const templateList = Object.entries(data).map(([id, details]) => {
          const thumbnail = details.images?.[0]?.thumbnail || '/placeholder-image.jpg';
          return {
            id,
            numericId: id.replace('id_', ''),
            thumbnail: thumbnailProcessor ? thumbnailProcessor(thumbnail) : thumbnail,
            ...details,
          };
        });
        setTemplates(templateList);
        setError(null);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(`Error fetching ${title.toLowerCase()} templates. Please try again.`);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if we haven't loaded templates yet
    if (templates.length === 0) {
      fetchTemplates();
    } else {
      setLoading(false);
    }
    
    // Clean up function
    return () => {
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, [dataUrl, title, thumbnailProcessor]);

  if (loading) return (
    <div className="min-h-screen bg-[#0F1725] flex items-center justify-center">
      {/* Hidden loading spinner to avoid duplicating the Suspense loader */}
      <div className="hidden">Loading templates...</div>
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
      {/* Back to Home Button */}
      <button 
        className="back-button absolute md:fixed top-4 left-4 z-50 flex items-center gap-2 bg-gray-800/60 text-white px-3 py-2 rounded-md"
        onClick={() => navigate('/')}
      >
        <ArrowLeft size={20} />
        <span>Back</span>
      </button>
      
      <div className="pt-2 md:pt-0">
        {logoComponent && logoComponent}
      </div>
      <div className="template-library">
        <h1 className="text-3xl font-bold text-white mb-4 text-center pt-2">{title}</h1>
        
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3  gap-x-4 gap-y-6 md:gap-4 place-items-center px-1">
          {templates.map((template) => (
            <div 
              key={template.id} 
              onClick={() => navigate(`${navigatePath}/${template.numericId}`)}
              aria-label={`${title} Template ${template.numericId}`}
              className="template-grid-item"
            >
              <img
                src={template.thumbnail}
                alt={`${title} Template ${template.numericId}`}
                className="w-[90%] h-[80%] md:w-[100%] md:h-[100%] object-cover rounded-lg"
                onError={(e) => (e.target.src = `https://via.placeholder.com/400x600/1a2438/ffffff?text=${placeholderText}`)}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenericTemplateLibrary; 