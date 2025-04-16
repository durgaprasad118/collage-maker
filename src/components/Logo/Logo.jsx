import React from "react";
import { Link } from "react-router-dom";
import "./Logo.css";
import { ReactComponent as CollageMarkerLogo } from './CollageMarkerLogo.svg';

const Logo = ({ type = 'default' }) => (
  <div className="logo-container">
    <Link to="/" className="logo-link">
      {type === 'collage' ? (
        <CollageMarkerLogo className="svg-logo" />
      ) : (
        <div className="logo-wrapper">
          <h1 className="logo-text">Card Maker</h1>
          <div className="logo-tagline">Create beautiful memories</div>
        </div>
      )}
    </Link>
  </div>
);

export default Logo; 