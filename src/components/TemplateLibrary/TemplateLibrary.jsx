import React from 'react';
import Logo from '../Logo/Logo';
import GenericTemplateLibrary from './GenericTemplateLibrary';

const TemplateLibrary = () => {
  return (
    <GenericTemplateLibrary 
      title="Wedding Templates"
      dataUrl="/data/wedding.json"
      navigatePath="/card"
      placeholderText="Wedding+Card"
      helperText="Tap on any template to customize"
      logoComponent={<Logo />}
    />
  );
};

export default TemplateLibrary;
