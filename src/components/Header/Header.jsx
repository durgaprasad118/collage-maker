import React from "react";
import "./Header.css";

const Header = () => (
  <header className="header">
    <div className="header-container">
      <div className="header-content">
        <h1 className="header-title">Card Customizer</h1>
        <p className="header-subtitle">
          Craft Memories, Design Emotions
        </p>
      </div>
      <div className="header-overlay"></div>
    </div>
  </header>
);

export default Header;