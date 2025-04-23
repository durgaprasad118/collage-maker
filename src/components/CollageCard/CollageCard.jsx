import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../BirthdayCard/BirthdayCard.css"; // Reuse the same CSS
import { useImageUpload } from "../../utils/ImageUploadManager";
import {
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

  // Text states
  const [customText, setCustomText] = useState({});
  const [inputValues, setInputValues] = useState({});

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

  // Input change handler
  const handleInputChange = useCallback((name, value) => {
    if (name.includes('date')) {
      setInputValues(prev => ({
        ...prev,
        [name]: value
      }));

      if (value) {
        const date = new Date(value);
        const dayName = date.toLocaleString('en-US', { weekday: 'long' });
        const monthName = date.toLocaleString('en-US', { month: 'long' });
        const day = date.getDate();
        
        // Get ordinal suffix
        let ordinalSuffix = 'th';
        if (day === 1 || day === 21 || day === 31) ordinalSuffix = 'st';
        else if (day === 2 || day === 22) ordinalSuffix = 'nd';
        else if (day === 3 || day === 23) ordinalSuffix = 'rd';
        
        const formattedDate = `${dayName}, ${monthName} ${day}${ordinalSuffix}`;
        
        setCustomText(prev => ({
          ...prev,
          [name]: formattedDate
        }));
      }
    } 
    else if (name.includes('time')) {
      setInputValues(prev => ({
        ...prev,
        [name]: value
      }));

      if (value) {
        const [hours, minutes] = value.split(':');
        const time = new Date();
        time.setHours(hours, minutes);
        const formattedTime = time.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }).toLowerCase();
        
        setCustomText(prev => ({
          ...prev,
          [name]: formattedTime
        }));
      }
    } 
    else {
      setCustomText(prev => ({
        ...prev,
        [name]: value
      }));
    }
  }, []);

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
    // Check if template has text fields to prefill tab selection
    const hasTextFields = currentTemplate?.texts && currentTemplate.texts.length > 0;
    
    // Store current active tab in session storage to remember user's preference
    if (hasTextFields) {
      try {
        const lastTab = sessionStorage.getItem('lastActiveTab') || 'images';
        sessionStorage.setItem('lastActiveTab', lastTab);
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, [currentTemplate]);

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  // Main render
  return (
    <div className={`main-container ${isEditModalOpen ? "modal-open" : ""}`}>      
      <div ref={containerRef} className="template-wrapper">
        <div className="template-positioning">
          {currentTemplate && renderTemplateContent({
            template: currentTemplate,
            photos,
            customText,
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
        customText,
        inputValues,
        uploadError,
        handleDrag,
        handleDrop,
        handlePhotoRemove,
        handlePhotoChange,
        handleMultipleImageDrop,
        handleMultipleImageSelect,
        handleInputChange
      })}

      {/* Action buttons */}
      {renderActionButtons({
        setIsEditModalOpen,
        handleWhatsAppShare: handleShareOnWhatsApp,
        handleDownload: handleDownloadCard,
        editIcon,
        downloadIcon,
        cardType: "collage"
      })}
    </div>
  );
};

export default CollageCard;