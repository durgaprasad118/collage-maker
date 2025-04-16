import html2canvas from 'html2canvas';

export const downloadCanvas = async (element, fileName = 'download.jpg') => {
  if (!element) return;

  // Display a loading indicator
  const loadingIndicator = document.createElement('div');
  loadingIndicator.style.position = 'fixed';
  loadingIndicator.style.top = '50%';
  loadingIndicator.style.left = '50%';
  loadingIndicator.style.transform = 'translate(-50%, -50%)';
  loadingIndicator.style.background = 'rgba(0, 0, 0, 0.7)';
  loadingIndicator.style.color = 'white';
  loadingIndicator.style.padding = '15px 20px';
  loadingIndicator.style.borderRadius = '10px';
  loadingIndicator.style.zIndex = '9999';
  loadingIndicator.textContent = 'Creating your image...';
  document.body.appendChild(loadingIndicator);

  try {
    // Hide selection indicators for clean capture
    const selectedElements = document.querySelectorAll('.selected');
    const selectionBorders = document.querySelectorAll('.selection-border');
    const saveButtons = document.querySelectorAll('.save-button');
    
    // Store original states
    const originalStates = [];
    
    // Get exact dimensions
    const width = element.offsetWidth;
    const height = element.offsetHeight;
    const scale = window.devicePixelRatio || 1; // Get device pixel ratio for higher resolution
    
    // Store original transform styles
    const originalTransform = element.style.transform;
    const originalZoom = element.style.zoom;
    const originalScale = element.style.scale;
    
    // Hide all selection indicators
    selectionBorders.forEach(border => {
      if (border.style.display !== 'none') {
        originalStates.push({
          element: border,
          display: border.style.display
        });
        border.style.display = 'none';
      }
    });
    
    // Hide save buttons
    saveButtons.forEach(button => {
      if (button.style.display !== 'none') {
        originalStates.push({
          element: button,
          display: button.style.display
        });
        button.style.display = 'none';
      }
    });
    
    // Reset selection classes
    selectedElements.forEach(element => {
      originalStates.push({
        element: element,
        className: element.className
      });
      element.classList.remove('selected');
    });

    // Create a direct, immediate capture with exact dimensions
    const options = {
      scale: scale, // Use device pixel ratio for higher resolution
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#FFFFFF',
      logging: false,
      imageTimeout: 0,
      width: width,
      height: height,
      onclone: (clonedDoc) => {
        const clonedElement = clonedDoc.querySelector(".template-content");
        
        if (clonedElement) {
          // Apply exact dimensions to clone
          clonedElement.style.margin = '0';
          clonedElement.style.padding = '0';
          clonedElement.style.width = `${width}px`;
          clonedElement.style.height = `${height}px`;
          
          // Preserve all image containers exactly as they are
          const imageContainers = clonedElement.querySelectorAll("[class*='image-container']");
          imageContainers.forEach(container => {
            const dataId = container.getAttribute('data-id') || '';
            const originalContainer = document.querySelector(`[data-id="${dataId}"]`);
            if (originalContainer) {
              // Preserve exact styles
              const originalStyle = window.getComputedStyle(originalContainer);
              
              // Apply key styles directly
              container.style.width = originalStyle.width;
              container.style.height = originalStyle.height;
              container.style.position = originalStyle.position;
              container.style.top = originalStyle.top;
              container.style.left = originalStyle.left;
              container.style.transform = originalStyle.transform;
              container.style.transformOrigin = originalStyle.transformOrigin;
            }
          });
          
          // Preserve all images exactly as they are
          const images = clonedElement.querySelectorAll("img");
          images.forEach(img => {
            const imgId = img.getAttribute('id') || '';
            const originalImg = document.querySelector(`img[id="${imgId}"]`);
            
            if (originalImg) {
              const originalStyle = window.getComputedStyle(originalImg);
              
              // Copy all critical style properties exactly
              img.style.width = originalStyle.width;
              img.style.height = originalStyle.height;
              img.style.objectFit = originalStyle.objectFit;
              img.style.objectPosition = originalStyle.objectPosition;
              img.style.maxWidth = "none";
              img.style.maxHeight = "none";
              img.style.transform = originalStyle.transform;
              img.style.transformOrigin = originalStyle.transformOrigin;
              img.crossOrigin = "anonymous";
              img.style.imageRendering = 'high-quality';
            }
          });
          
          // Preserve text elements if any
          const textElements = clonedElement.querySelectorAll(".text-overlay");
          textElements.forEach(text => {
            text.style.whiteSpace = 'pre-wrap';
            text.style.overflow = 'hidden';
            text.style.transform = window.getComputedStyle(text).transform;
            text.style.transformOrigin = window.getComputedStyle(text).transformOrigin;
          });
        }
      }
    };

    const canvas = await html2canvas(element, options);
    
    // Create high resolution canvas
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = canvas.width;
    scaledCanvas.height = canvas.height;
    const ctx = scaledCanvas.getContext('2d');
    
    // Ensure white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, scaledCanvas.width, scaledCanvas.height);
    
    // Use high quality settings for drawing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    
    // Get high quality jpeg
    const jpgDataUrl = scaledCanvas.toDataURL("image/jpeg", 1.0);
    
    // Check if device is iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    
    if (isIOS) {
      const newTab = window.open();
      if (newTab) {
        newTab.document.write(`
          <html>
            <head>
              <title>Download</title>
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; }
                img { max-width: 100%; height: auto; }
                .instructions { padding: 15px; text-align: center; font-family: Arial, sans-serif; }
              </style>
            </head>
            <body>
              <div class="instructions">
                <p>Press and hold on the image, then select "Save Image" to download.</p>
              </div>
              <img src="${jpgDataUrl}" alt="Download">
            </body>
          </html>
        `);
        newTab.document.close();
      }
    } else {
      try {
        if (navigator.share) {
          fetch(jpgDataUrl)
            .then(res => res.blob())
            .then(blob => {
              const file = new File([blob], fileName, { type: "image/jpeg" });
              navigator.share({
                files: [file],
                title: 'Download',
              }).catch(error => {
                const downloadLink = document.createElement("a");
                downloadLink.href = jpgDataUrl;
                downloadLink.download = fileName;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              });
            });
        } else {
          const downloadLink = document.createElement("a");
          downloadLink.href = jpgDataUrl;
          downloadLink.download = fileName;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      } catch (error) {
        console.error("Error during download:", error);
        
        const newTab = window.open();
        if (newTab) {
          newTab.document.write(`
            <html>
              <head>
                <title>Download</title>
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <style>
                  body { margin: 0; padding: 0; display: flex; flex-direction: column; align-items: center; }
                  img { max-width: 100%; height: auto; }
                  .instructions { padding: 15px; text-align: center; font-family: Arial, sans-serif; }
                </style>
              </head>
              <body>
                <div class="instructions">
                  <p>Press and hold on the image, then select "Save Image" to download.</p>
                </div>
                <img src="${jpgDataUrl}" alt="Download">
              </body>
            </html>
          `);
          newTab.document.close();
        }
      }
    }
    
    // Restore original states
    originalStates.forEach(state => {
      if (state.display !== undefined) state.element.style.display = state.display;
      if (state.className) state.element.className = state.className;
    });
    
  } catch (error) {
    console.error("Error generating image:", error);
    alert("Error generating image. Please try again.");
  } finally {
    document.body.removeChild(loadingIndicator);
  }
}; 