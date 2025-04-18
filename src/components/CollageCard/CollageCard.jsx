import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../BirthdayCard/BirthdayCard.css"; // Reuse the same CSS
import { useImageUpload } from "../../utils/ImageUploadManager";
import {
  renderTemplateGallery,
  renderModal,
  renderTemplateContent,
  handleDownload,
  handleWhatsAppShare,
  renderActionButtons
} from "../../utils/CardRenderer";

// Icon imports
import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";

const CollageCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);

  // Refs for touch handling
  const containerRef = useRef(null);
  const isScrolling = useRef(false);

  // Use the shared image upload hook
  const {
    photos,
    uploadError,
    handleDrag,
    handleDrop,
    handlePhotoChange,
    handlePhotoRemove,
    handleMultipleImageDrop,
    handleMultipleImageSelect,
  } = useImageUpload(currentTemplate);

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      setIsLoading(true);
      try {
        console.log("Fetching collage template data for ID:", id);
        const response = await fetch("/data/collage.json");
        if (!response.ok)
          throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();
        console.log("Fetched data:", data);

        const templates = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        console.log("Processed templates:", templates);

        const startIndex = templates.findIndex(
          (template) => template.id === `id_${id}`
        );
        console.log("Found template index:", startIndex);

        if (startIndex === -1) throw new Error("Template not found.");

        setAllTemplates(templates);
        setCurrentTemplate(templates[startIndex]);
        setCurrentIndex(startIndex);
      } catch (err) {
        console.error("Error fetching templates:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTemplateData();
  }, [id]);

  // Download and share handlers using shared utilities
  const handleDownloadCard = useCallback(() => {
    handleDownload();
  }, []);

  const handleShareOnWhatsApp = useCallback(() => {
    handleWhatsAppShare();
  }, []);

  // Handle image upload modal opening with auto-focus on file input
  const handleAddImageClick = useCallback(() => {
    setIsEditModalOpen(true);
    // Focus on the file input field after modal opens
    setTimeout(() => {
      const fileInput = document.getElementById('multiple-photo-input');
      if (fileInput) fileInput.click();
    }, 300);
  }, []);

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  // Handle template selection
  const handleTemplateSelect = (index) => {
    setCurrentIndex(index);
    setCurrentTemplate(allTemplates[index]);
    navigate(`/collage/${index + 1}`, { replace: true });
    setShowTemplateGallery(false);
  };

  // Main render
  return (
    <div className={`main-container ${isEditModalOpen ? "modal-open" : ""}`}>
      {renderTemplateGallery({
        showTemplateGallery,
        setShowTemplateGallery,
        allTemplates,
        currentIndex,
        handleTemplateSelect,
        cardType: "collage"
      })}
      
      <div ref={containerRef} className="template-wrapper">
        <div className="template-positioning">
          {currentTemplate && renderTemplateContent({
            template: currentTemplate,
            photos,
            allTemplates,
            currentIndex,
            setCurrentIndex,
            setCurrentTemplate,
            cardType: "collage",
            onAddImageClick: handleAddImageClick
          })}
        </div>
      </div>

      {/* Render modal */}
      {renderModal({
        isEditModalOpen,
        setIsEditModalOpen,
        currentTemplate,
        photos,
        uploadError,
        handleDrag,
        handleDrop,
        handlePhotoRemove,
        handlePhotoChange,
        handleMultipleImageDrop,
        handleMultipleImageSelect
      })}

      {/* Action buttons */}
      {renderActionButtons({
        setShowTemplateGallery,
        setIsEditModalOpen,
        handleWhatsAppShare: handleShareOnWhatsApp,
        handleDownload: handleDownloadCard,
        editIcon,
        downloadIcon
      })}
    </div>
  );
};

export default CollageCard;