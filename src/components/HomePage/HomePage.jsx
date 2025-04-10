import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import Header from '../Header/Header';

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Dummy image URLs as fallbacks
  const dummyImages = {
    wedding: 'https://via.placeholder.com/400x600/1a2438/ffffff?text=Wedding+Cards',
    birthday: 'https://via.placeholder.com/400x600/1a2438/ffffff?text=Birthday+Cards',
    collage: 'https://via.placeholder.com/400x600/1a2438/ffffff?text=Photo+Collages'
  };

  const categories = [
    {
      id: 'wedding',
      title: 'Wedding Cards',
      description: 'Beautiful cards for your special day',
      image: '/Wedding-Templates/id_1/thumbnail.jpg',
      fallbackImage: dummyImages.wedding,
      path: '/TemplateLibrary'
    },
    {
      id: 'birthday',
      title: 'Birthday Cards',
      description: 'Celebrate with custom birthday cards',
      image: '/Birthday-Templates/id_1/thumbnail.jpg',
      fallbackImage: dummyImages.birthday,
      path: '/BirthdayLibrary'
    },
    {
      id: 'collage',
      title: 'Photo Collages',
      description: 'Create amazing photo collections',
      image: '/Collage-Templates/id_1/thumbnail.jpg',
      fallbackImage: dummyImages.collage,
      path: '/CollageLibrary'
    }
  ];

  const handleCategoryClick = (category) => {
    switch(category.id) {
      case 'wedding':
        navigate('/TemplateLibrary');
        break;
      case 'birthday':
        navigate('/BirthdayLibrary');
        break;
      case 'collage':
        navigate('/CollageLibrary');
        break;
      default:
        navigate('/');
    }
  };

  useEffect(() => {
    // Add animation delay for elements to appear
    setTimeout(() => {
      setIsLoaded(true);
    }, 300);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-custom text-white">
      <Header />
      
      <div className="hero-section">
        <div className="hero-content container mx-auto px-4">
          <h1 className="hero-title animate__animated animate__fadeInUp">
            Card <span className="text-highlight">Customizer</span>
          </h1>
          <p className="hero-subtitle animate__animated animate__fadeInUp animate__delay-1s">
            Craft Memories, Design Emotions
          </p>
          <div className="hero-cta animate__animated animate__fadeInUp animate__delay-2s">
            <p className="cta-text">Choose a category below to get started</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className={`categories-grid ${isLoaded ? 'loaded' : ''}`}>
          {categories.map((category, index) => (
            <div 
              key={category.id}
              className={`category-card category-${index}`}
              onClick={() => handleCategoryClick(category)}
            >
              <div className="card-image-container">
                <img 
                  src={category.image} 
                  alt={category.title}
                  className="card-image"
                  onError={(e) => {
                    e.target.src = category.fallbackImage;
                  }}
                />
                <div className="card-overlay">
                  <h2 className="card-title">{category.title}</h2>
                </div>
              </div>
              <div className="card-content">
                <p className="card-description">{category.description}</p>
                <button className="browse-button">
                  Browse {category.title}
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="features-section">
          <h2 className="section-heading">Why Choose Our Card Maker?</h2>
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon">✨</div>
              <h3 className="feature-title">Stunning Templates</h3>
              <p className="feature-description">Choose from our collection of professionally designed templates</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">🎨</div>
              <h3 className="feature-title">Easy Customization</h3>
              <p className="feature-description">Personalize every detail to match your style</p>
            </div>
            <div className="feature-item">
              <div className="feature-icon">📱</div>
              <h3 className="feature-title">Mobile Friendly</h3>
              <p className="feature-description">Create beautiful cards on any device</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;