import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import "./BirthdayCard.css";
import { useImageUpload } from "../../utils/ImageUploadManager";
import {
  renderModal,
  renderTemplateContent,
  handleDownload,
  handleWhatsAppShare,
  renderActionButtons
} from "../../utils/CardRenderer";

import TinosRegular from "../../assets/fonts/Tinos-Regular.ttf";
import MontserratSemiBold from "../../assets/fonts/Montserrat-SemiBold.ttf";
import MontserratRegular from "../../assets/fonts/Montserrat-Regular.ttf";
import AbrilFatface from "../../assets/fonts/AbrilFatface-Regular.ttf";
import Allura from "../../assets/fonts/Allura-Regular.ttf";
import TimesNewRoman from "../../assets/fonts/Times-New-Roman-Regular.ttf";

import downloadIcon from "../../assets/icons/Download_Icon.svg";
import editIcon from "../../assets/icons/Edit_Icon.svg";


const BirthdayCard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { id } = useParams();
  const navigate = useNavigate();
  const hasFetchedData = useRef(false);

  // Initialize states
  const [customText, setCustomText] = useState({
    birthday_name: "",
    birthday_date: "",
    birthday_time: "",
    birthday_venue: "",
  });

  const [inputValues, setInputValues] = useState({
    birthday_date: "",
    birthday_time: "",
  });

  const [allTemplates, setAllTemplates] = useState([]);
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [error, setError] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [slideDirection, setSlideDirection] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // Same refs as Card.jsx
  const containerRef = useRef(null);
  const isScrolling = useRef(false);
  const touchStartRef = useRef(null);
  const prevTemplateRef = useRef(null);
  const scrollAccumulator = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());

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

  // Font preloading
  const preloadFonts = async () => {
    const fonts = [
      { name: "Tinos-Regular", url: TinosRegular },
      { name: "Montserrat-SemiBold", url: MontserratSemiBold },
      { name: "Montserrat-Regular", url: MontserratRegular },
      { name: "AbrilFatface-Regular", url: AbrilFatface },
      { name: "Allura-Regular", url: Allura },
      { name: "Times-New-Roman-Regular", url: TimesNewRoman },
    ];

    try {
      const fontPromises = fonts.map(async (font) => {
        const fontFace = new FontFace(font.name, `url(${font.url})`);
        return fontFace.load().then((loadedFont) => {
          document.fonts.add(loadedFont);
          return loadedFont;
        });
      });

      await Promise.all(fontPromises);
      setFontsLoaded(true);
    } catch (error) {
      console.error("Failed to preload fonts:", error);
      setFontsLoaded(true); 
    }
  };
  
  useEffect(() => {
    preloadFonts();
  }, []);

  // Download and share handlers using shared utilities
  const handleDownloadCard = useCallback(() => {
    handleDownload();
  }, []);

  const handleShareOnWhatsApp = useCallback(() => {
    handleWhatsAppShare(customText);
  }, [customText]);

  // Template data fetching
  useEffect(() => {
    const fetchTemplateData = async () => {
      if (hasFetchedData.current) return;
      hasFetchedData.current = true;
      
      setIsLoading(true);
      try {
        console.log("Fetching birthday template data for ID:", id);
        const response = await fetch("/data/birthday.json");
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

  // Add birthday-card-active class to body when component mounts
  useEffect(() => {
    document.body.classList.add('birthday-card-active');
    
    // Clean up function to remove the class when component unmounts
    return () => {
      document.body.classList.remove('birthday-card-active');
    };
  }, []);

  if (error) {
    return <div className="error-screen">{error}</div>;
  }

  if (isLoading) {
    return (
      <div className="loading-spinner-container">
        <div className="spinner"></div>
      </div>
    );
  }

  // Main render
  return (
    <div className={`main-container ${isEditModalOpen ? "modal-open" : ""}`}>
      {/* Back to Library Button */}
      <button 
        className=" absolute top-0 left-2 z-50 flex items-center gap-2  text-white px-3 py-2 rounded-md"
        onClick={() => navigate('/BirthdayLibrary')}
      >
        <ArrowLeft size={20} />
      </button>

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
            cardType: "birthday"
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
        cardType: "birthday"
      })}
    </div>
  );
};

export default BirthdayCard;