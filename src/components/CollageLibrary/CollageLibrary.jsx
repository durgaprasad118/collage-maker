import React from 'react';
import Logo from '../Logo/Logo';
import GenericTemplateLibrary from '../TemplateLibrary/GenericTemplateLibrary';
import './CollageLibrary.css';

const CollageLibrary = () => {
  // Custom thumbnail processor for collage templates
  const processThumbnail = (thumbnail) => {
    return thumbnail.replace('/Wedding-Templates/', '/Collage-Templates/');
  };

  return (
    <GenericTemplateLibrary 
      title="Photo Collage Templates"
      dataUrl="/data/collage.json"
      navigatePath="/collage"
      placeholderText="Photo+Collage"
      helperText="Tap on any template to create your collage"
      logoComponent={<Logo />}
      thumbnailProcessor={processThumbnail}
    />
  );
};

export default CollageLibrary; 