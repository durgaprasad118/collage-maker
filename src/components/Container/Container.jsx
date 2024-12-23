import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from '../Header/Header'; // Ensure Header exists in the components folder
import HomePage from '../HomePage/HomePage';
import Card from '../Card/Card';

// Loading fallback for lazy-loaded components
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-pink-300 border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

function Container() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white">
        <Header />
        <main className="pb-8">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              {/* Home page route */}
              <Route path="/" element={<HomePage />} />

              {/* Wedding card route */}
              <Route path="/card/:id" element={<Card />} />

              {/* Redirect old route pattern to new one */}
              <Route
                path="/Weddingcard/:id"
                element={<Navigate to={(location) => `/card/${location.pathname.split('/')[2]}`} replace />}
              />

              {/* Catch all route for 404s */}
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
        </main>
      </div>
    </Router>
  );
}

export default Container;
