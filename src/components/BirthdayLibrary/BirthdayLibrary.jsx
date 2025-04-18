import React from 'react';
import Logo from '../Logo/Logo';
import GenericTemplateLibrary from '../TemplateLibrary/GenericTemplateLibrary';
import './BirthdayLibrary.css';

const BirthdayLibrary = () => {
  return (
    <GenericTemplateLibrary 
      title="Birthday Card Templates"
      dataUrl="/data/birthday.json"
      navigatePath="/birthday"
      placeholderText="Birthday+Card"
      helperText="Tap on any template to customize"
      logoComponent={<Logo />}
    />
  );
};

export default BirthdayLibrary; 