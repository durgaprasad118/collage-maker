import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';
import Logo from '../Logo/Logo';

const HomePage = () => {
  const navigate = useNavigate();
  const [isLoaded, setIsLoaded] = useState(false);

  // Dummy image URLs as fallbacks
  const dummyImages = {
    wedding: 'https://via.placeholder.com/400x600/141927/ffffff?text=Wedding+Cards',
    birthday: 'https://via.placeholder.com/400x600/141927/ffffff?text=Birthday+Cards',
    collage: 'https://via.placeholder.com/400x600/141927/ffffff?text=Photo+Collages'
  };

  const categories = [
    {
      id: 'wedding',
      title: 'Wedding Cards',
      description: 'Beautiful cards for your special day',
      image: '/Wedding-Templates/id_1/thumbnail.jpg',
      fallbackImage: dummyImages.wedding,
      path: '/TemplateLibrary',
      icon: '💍'
    },
    {
      id: 'birthday',
      title: 'Birthday Cards',
      description: 'Celebrate with custom birthday cards',
      image: '/Birthday-Templates/id_1/thumbnail.jpg',
      fallbackImage: dummyImages.birthday,
      path: '/BirthdayLibrary',
      icon: '🎂'
    },
    {
      id: 'collage',
      title: 'Photo Collages',
      description: 'Create amazing photo collections',
      image: '/Collage-Templates/id_1/thumbnail.jpg',
      fallbackImage: dummyImages.collage,
      path: '/CollageLibrary',
      icon: '📸'
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

  // Background decoration elements
  const GlowCircle = ({ className, size, color, delay }) => (
    <div 
      className={`glow-circle ${className}`} 
      style={{ 
        width: size, 
        height: size, 
        backgroundColor: color,
        animationDelay: `${delay}s` 
      }} 
    />
  );

  const FloatingShape = ({ className, shape, size, color, delay }) => (
    <div 
      className={`floating-shape ${className} ${shape}`} 
      style={{ 
        width: size, 
        height: size, 
        borderColor: color,
        animationDelay: `${delay}s` 
      }} 
    />
  );

  return (
    <div className="min-h-screen bg-gradient-custom">
      {/* Background decorative elements */}
      <div className="background-decoration">
        <GlowCircle className="top-right" size="300px" color="rgba(0, 242, 195, 0.03)" delay={0} />
        <GlowCircle className="bottom-left" size="250px" color="rgba(0, 114, 255, 0.03)" delay={0.5} />
        <FloatingShape className="top-left" shape="square" size="120px" color="rgba(0, 242, 195, 0.1)" delay={1.2} />
        <FloatingShape className="bottom-right" shape="circle" size="80px" color="rgba(0, 114, 255, 0.1)" delay={0.8} />
        <FloatingShape className="middle-left" shape="triangle" size="100px" color="rgba(0, 242, 195, 0.1)" delay={1.5} />
      </div>
      
      <Logo />
      
      <div className="hero-section">
        <div className="hero-content container mx-auto px-4">
          <h1 className="hero-title animate__animated animate__fadeInUp">
            Design Beautiful <span className="text-highlight">Cards</span>
          </h1>
          <div className="glowing-line animate__animated animate__fadeInUp animate__delay-1s"></div>
          <p className="hero-subtitle animate__animated animate__fadeInUp animate__delay-1s">
            Express your emotions through our elegant designs
          </p>
          <div className="hero-cta animate__animated animate__fadeInUp animate__delay-2s">
            <p className="cta-text">Choose a category to begin creating</p>
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
                <div className="card-overlay">
                  <h2 className="card-title">
                    <span className="card-icon">{category.icon}</span>
                    {category.title}
                  </h2>
                </div>
              </div>
              <div className="card-content">
                <p className="card-description">{category.description}</p>
                <button className="browse-button">
                  <span>Browse {category.title}</span>
                  <span className="button-arrow">→</span>
                </button>
              </div>
            </div>
          ))}
        </div>
        
        <div className="features-section">
          <div className="shine-effect"></div>
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