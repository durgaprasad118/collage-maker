import React, { Suspense } from 'react';
import './App.css';
import Container from '../src/components/Container/Container';

const HomePage = React.lazy(() => import('./components/HomePage/HomePage'));
const Card = React.lazy(() => import('./components/Card/Card'));

// Loading fallback component
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
    <Suspense fallback={<LoadingFallback />}>

      <Container />
    </Suspense>
  );
};

export default App;
