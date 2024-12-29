import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './TemplateLibrary.css';

const TemplateLibrary = () => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
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
  }, []);

  if (loading) return <div>Loading templates...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="template-library">
      <h1>All Templates</h1>
      <div className="template-grid">
        {templates.map((template) => (
          <div key={template.id} onClick={() => navigate(`/card/${template.numericId}`)}>
            <img
              src={template.thumbnail}
              alt={`Template ${template.numericId}`}
              onError={(e) => (e.target.src = '/placeholder-image.jpg')}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default TemplateLibrary;
