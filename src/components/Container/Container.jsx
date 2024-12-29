import React, { Suspense, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from '../HomePage/HomePage';
import Card from '../Card/Card';
import './Container.css';

const LoadingFallback = () => (
  <div className="loading-container">
    <div className="loading-content">
      <div className="loading-spinner"></div>
      <p className="loading-text">Loading...</p>
    </div>
  </div>
);

// Custom component to handle redirection
const RedirectToCard = () => {
  const id = window.location.pathname.split('/')[2]; // Extract the ID from the URL
  return <Navigate to={`/card/${id}`} replace />;
};

function Container() {
  return (
    <Router>
      <div className="container-wrapper">
        <main className="main-content">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/card/:id" element={<Card />} />
              <Route path="/Weddingcard/:id" element={<RedirectToCard />} />
              <Route
                path="*"
                element={
                  <div className="not-found-container">
                    <div className="not-found-content">
                      <h1 className="not-found-title">Page Not Found</h1>
                      <p className="not-found-text">The page you're looking for doesn't exist.</p>
                      <a href="/" className="not-found-button">
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