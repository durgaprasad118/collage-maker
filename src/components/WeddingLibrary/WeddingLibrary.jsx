import React from 'react';
import Logo from '../Logo/Logo';
import GenericTemplateLibrary from '../TemplateLibrary/GenericTemplateLibrary';
import './WeddingLibrary.css';

const WeddingLibrary = () => {
  return (
    <GenericTemplateLibrary 
      title="Wedding Card Templates"
      dataUrl="/data/wedding.json"
      navigatePath="/wedding"
      placeholderText="Wedding+Card"
      helperText="Tap on any template to customize"
      logoComponent={<Logo />}
    />
  );
};

export default WeddingLibrary; 