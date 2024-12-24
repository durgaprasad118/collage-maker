import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from '../Header/Header';
import HomePage from '../HomePage/HomePage';
import Card from '../Card/Card';
import InputSection from '../InputSection/InputSection';
import './Container.css';

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function Container() {
  const [isInputSectionOpen, setIsInputSectionOpen] = useState(false);

  const handleEditClick = (e) => {
    e.stopPropagation();
    setIsInputSectionOpen(true);
  };

  const handleCloseInputSection = () => {
    setIsInputSectionOpen(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white relative">
        
        <main className="pb-8 relative">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/card/:id" element={<Card />} />
              <Route
                path="/Weddingcard/:id"
                element={<Navigate to={(location) => `/card/${location.pathname.split('/')[2]}`} replace />}
              />
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h1>
                      <p className="text-gray-600 mb-4">The page you're looking for doesn't exist.</p>
                      <a
                        href="/"
                        className="px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                      >
                        Go Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
            
          </Suspense>

          {/* Edit Button with improved positioning and z-index */}
          <div className="fixed top-20 right-4 z-30">
            <button
              onClick={handleEditClick}
              className="bg-white px-4 py-2 rounded-lg shadow-md text-pink-600 hover:text-pink-700 flex items-center gap-2 transition-all hover:shadow-lg"
            >
              <span className="text-lg">✏️</span>
              <span>Edit Template</span>
            </button>
          </div>

          {/* Modal with improved structure */}
          {isInputSectionOpen && (
            <div className="modal-wrapper">
              <div 
                className="modal-backdrop"
                onClick={handleCloseInputSection}
              />
              <div className="modal-container">
                <InputSection onClose={handleCloseInputSection} />
              </div>
            </div>
          )}
        </main>
      </div>
    </Router>
  );
}

export default Container;