import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import './TemplateLibrary.css';
import ShimmerTemplates from '../ShimmerTemplates/ShimmerTemplates';

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
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set viewport meta tag for mobile responsiveness
    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    }
    
    const fetchTemplates = async () => {
      setIsLoading(true);
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
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
    
    // Clean up function
    return () => {
      if (viewportMeta) {
        viewportMeta.setAttribute('content', 'width=device-width, initial-scale=1.0');
      }
    };
  }, [dataUrl, title, thumbnailProcessor]);

  // Show loading state with the ShimmerTemplates component
  if (isLoading) {
    return (
      <div className="bg-[#0F1725] min-h-screen">
        <div className="flex justify-center pt-8">
          <h1 className="text-3xl font-bold mb-4 relative inline-block" style={{ 
            background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {title}
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                height: '2px',
                background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
                position: 'absolute',
                bottom: '-8px',
                left: 0
              }}
            />
          </h1>
        </div>
        <ShimmerTemplates />
      </div>
    );
  }

  // Only show error state, skip the loading state since Suspense handles it
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
      <div className="flex justify-center pt-8">
        <h1 className="text-3xl font-bold mb-4 relative inline-block" style={{ 
          background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          {title}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1, ease: "easeOut" }}
            style={{
              height: '2px',
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4, #45B7D1, #96CEB4)',
              position: 'absolute',
              bottom: '-8px',
              left: 0
            }}
          />
        </h1>
      </div>
      <div className="template-library pt-8">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-6 md:gap-8 place-items-center px-1">
          {templates.map((template) => (
            <motion.div 
              key={template.id} 
              onClick={() => navigate(`${navigatePath}/${template.numericId}`)}
              aria-label={`${title} Template ${template.numericId}`}
              className="template-grid-item cursor-pointer"
              whileHover={{ 
                scale: 1.05,
                boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                transition: { duration: 0.2 }
              }}
            >
              <img
                src={template.thumbnail}
                alt={`${title} Template ${template.numericId}`}
                className="w-[90%] h-[80%] md:w-[100%] md:h-[100%] object-cover rounded-lg"
                onError={(e) => (e.target.src = `https://via.placeholder.com/400x600/1a2438/ffffff?text=${placeholderText}`)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GenericTemplateLibrary; 