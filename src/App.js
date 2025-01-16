import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import CollageCard from './components/CollageCard/CollageCard';
import './App.css';

// Lazy-loaded components
const HomePage = React.lazy(() => import('./components/HomePage/HomePage'));
const Card = React.lazy(() => import('./components/Card/Card'));
const BirthdayCard = React.lazy(() => import('./components/BirthdayCard/BirthdayCard'));
const TemplateLibrary = React.lazy(() => import('./components/TemplateLibrary/TemplateLibrary'));

const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#0F1725]">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#9CCC65] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-white">Loading...</p>
    </div>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingFallback />}>
        <div className="bg-[#0F1725] min-h-screen">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/card/:id" element={<Card />} />
            <Route path="/birthday/:id" element={<BirthdayCard />} />
            <Route path="/TemplateLibrary" element={<TemplateLibrary />} />
            <Route path="/collage/:id" element={<CollageCard />} />
            <Route
              path="*"
              element={
                <div className="min-h-screen flex items-center justify-center text-white">
                  <div className="text-center">
                    <h1 className="text-2xl mb-4">404 - Page Not Found</h1>
                    <a href="/" className="text-[#9CCC65] hover:underline">
                      Go Back to Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </div>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;