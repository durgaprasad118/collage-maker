import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Header from '../src/components/Header/Header'

// Lazy-loaded components
const HomePage = React.lazy(() => import('./components/HomePage/HomePage'));
const Card = React.lazy(() => import('./components/Card/Card'));
const TemplateLibrary = React.lazy(() => import('./components/TemplateLibrary/TemplateLibrary'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-pink-50 to-white">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <Router>
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/card/:id" element={<Card />} />
          <Route path="/TemplateLibrary" element={<TemplateLibrary />} />
          <Route
            path="*"
            element={
              <div className="not-found-container">
                <h1>404 - Page Not Found</h1>
                <a href="/">Go Back to Home</a>
              </div>
            }
          />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
