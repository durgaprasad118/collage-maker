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