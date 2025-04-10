import React from 'react';
import './ShimmerTemplates.css';

const ShimmerTemplates = () => {
  // Create 4 shimmer cards for mobile view
  const dummyArray = Array(4).fill(null);

  return (
    <div className="template-gallery-container">
      <div className="template-gallery shimmer-gallery">
        {dummyArray.map((_, index) => (
          <div key={index} className="template-card shimmer-card">
            <div className="shimmer-wrapper">
              <div className="shimmer-animation"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShimmerTemplates;