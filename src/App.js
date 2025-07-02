import React, { useState, useRef, useCallback } from 'react';
import { Upload, Type, RotateCw, ZoomIn, ZoomOut, Download, Trash2 } from 'lucide-react';

const LaPetiteEnseigne = () => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePosition, setImagePosition] = useState({ x: 0, y: 0 });
  const [imageScale, setImageScale] = useState(1);
  const [imageRotation, setImageRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isGesturing, setIsGesturing] = useState(false);
  const [lastTouchDistance, setLastTouchDistance] = useState(0);
  const [lastTouchAngle, setLastTouchAngle] = useState(0);
  const [texts, setTexts] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const [showTextControls, setShowTextControls] = useState(false);
  const [textGesturing, setTextGesturing] = useState(null);
  const [lastTextTouchDistance, setLastTextTouchDistance] = useState(0);
  const [lastTextTouchAngle, setLastTextTouchAngle] = useState(0);
  const fileInputRef = useRef(null);
  const circleRef = useRef(null);
  const canvasRef = useRef(null);

  const fonts = [
    { name: 'Script', style: 'font-serif italic' },
    { name: 'Impact', style: 'font-sans font-black' },
    { name: 'Vintage', style: 'font-mono' },
    { name: 'Handwrite', style: 'font-serif' },
    { name: 'Modern', style: 'font-sans font-light' }
  ];

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
        setImagePosition({ x: 0, y: 0 });
        setImageScale(1);
        setImageRotation(0);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePosition({ x: 0, y: 0 });
    setImageScale(1);
    setImageRotation(0);
  };

  const getTouchDistance = (touches) => {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const getTouchAngle = (touches) => {
    const dx = touches[1].clientX - touches[0].clientX;
    const dy = touches[1].clientY - touches[0].clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
  };

  const handleTouchStart = useCallback((e) => {
    if (!selectedImage) return;
    e.preventDefault();
    
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - imagePosition.x,
        y: e.touches[0].clientY - imagePosition.y
      });
    } else if (e.touches.length === 2) {
      setIsGesturing(true);
      setLastTouchDistance(getTouchDistance(e.touches));
      setLastTouchAngle(getTouchAngle(e.touches));
    }
  }, [selectedImage, imagePosition]);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    
    if (e.touches.length === 1 && isDragging) {
      setImagePosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y
      });
    } else if (e.touches.length === 2 && isGesturing) {
      const distance = getTouchDistance(e.touches);
      const angle = getTouchAngle(e.touches);
      
      // Zoom
      const scaleChange = distance / lastTouchDistance;
      setImageScale(prev => Math.max(0.1, Math.min(3, prev * scaleChange)));
      setLastTouchDistance(distance);
      
      // Rotation
      const angleDiff = angle - lastTouchAngle;
      setImageRotation(prev => prev + angleDiff);
      setLastTouchAngle(angle);
    }
  }, [isDragging, isGesturing, dragStart, lastTouchDistance, lastTouchAngle]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    setIsGesturing(false);
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (!selectedImage) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - imagePosition.x,
      y: e.clientY - imagePosition.y
    });
  }, [selectedImage, imagePosition]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    setImagePosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging || isGesturing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, isGesturing, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const addText = () => {
    const newText = {
      id: Date.now(),
      content: 'Votre texte',
      x: 50,
      y: 50,
      fontSize: 24,
      rotation: 0,
      font: fonts[0]
    };
    setTexts([...texts, newText]);
    setSelectedTextId(newText.id);
    setShowTextControls(true);
  };

  const updateText = (id, updates) => {
    setTexts(texts.map(text => 
      text.id === id ? { ...text, ...updates } : text
    ));
  };

  const deleteText = (id) => {
    setTexts(texts.filter(text => text.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
      setShowTextControls(false);
    }
  };

  // Gestion tactile pour le texte
  const handleTextTouchStart = useCallback((textId, e) => {
    e.stopPropagation();
    setSelectedTextId(textId);
    setShowTextControls(true);
    
    if (e.touches.length === 1) {
      // Un doigt : déplacement
      const text = texts.find(t => t.id === textId);
      const rect = circleRef.current.getBoundingClientRect();
      const startX = (text.x / 100) * 300 + 150;
      const startY = (text.y / 100) * 300 + 150;
      
      const handleTextDrag = (e) => {
        const x = ((e.touches[0].clientX - rect.left - 150) / 300) * 100;
        const y = ((e.touches[0].clientY - rect.top - 150) / 300) * 100;
        updateText(textId, { 
          x: Math.max(0, Math.min(100, x)), 
          y: Math.max(0, Math.min(100, y)) 
        });
      };
      
      const handleTextRelease = () => {
        document.removeEventListener('touchmove', handleTextDrag);
        document.removeEventListener('touchend', handleTextRelease);
      };
      
      document.addEventListener('touchmove', handleTextDrag, { passive: false });
      document.addEventListener('touchend', handleTextRelease);
      
    } else if (e.touches.length === 2) {
      // Deux doigts : zoom et rotation
      setTextGesturing(textId);
      setLastTextTouchDistance(getTouchDistance(e.touches));
      setLastTextTouchAngle(getTouchAngle(e.touches));
      
      const handleTextGesture = (e) => {
        if (e.touches.length === 2) {
          const distance = getTouchDistance(e.touches);
          const angle = getTouchAngle(e.touches);
          const text = texts.find(t => t.id === textId);
          
          // Zoom du texte
          const scaleChange = distance / lastTextTouchDistance;
          const newFontSize = Math.max(12, Math.min(72, text.fontSize * scaleChange));
          
          // Rotation du texte
          const angleDiff = angle - lastTextTouchAngle;
          const newRotation = (text.rotation + angleDiff) % 360;
          
          updateText(textId, { 
            fontSize: Math.round(newFontSize),
            rotation: Math.round(newRotation)
          });
          
          setLastTextTouchDistance(distance);
          setLastTextTouchAngle(angle);
        }
      };
      
      const handleTextGestureEnd = () => {
        setTextGesturing(null);
        document.removeEventListener('touchmove', handleTextGesture);
        document.removeEventListener('touchend', handleTextGestureEnd);
      };
      
      document.addEventListener('touchmove', handleTextGesture, { passive: false });
      document.addEventListener('touchend', handleTextGestureEnd);
    }
  }, [texts]);

  // Export et envoi par email
  const exportImage = useCallback(async () => {
    if (!selectedImage) return;
    
    try {
      // Créer un canvas pour l'export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const size = 600;
      canvas.width = size;
      canvas.height = size;
      
      // Fond blanc
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      
      // Dessiner le cercle de cadrage
      ctx.save();
      ctx.beginPath();
      ctx.arc(size/2, size/2, size/2 - 10, 0, 2 * Math.PI);
      ctx.clip();
      
      // Dessiner l'image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise((resolve) => {
        img.onload = () => {
          const centerX = size/2 + (imagePosition.x * size/320);
          const centerY = size/2 + (imagePosition.y * size/320);
          
          ctx.save();
          ctx.translate(centerX, centerY);
          ctx.rotate((imageRotation * Math.PI) / 180);
          ctx.scale(imageScale, imageScale);
          ctx.drawImage(img, -img.width/2, -img.height/2);
          ctx.restore();
          resolve();
        };
        img.src = selectedImage;
      });
      
      ctx.restore();
      
      // Dessiner les textes
      texts.forEach(text => {
        ctx.save();
        ctx.font = `${text.fontSize * (size/320)}px ${text.font.style.includes('serif') ? 'serif' : text.font.style.includes('mono') ? 'monospace' : 'sans-serif'}`;
        ctx.fillStyle = '#000000';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const textX = (text.x / 100) * size;
        const textY = (text.y / 100) * size;
        
        ctx.translate(textX, textY);
        ctx.rotate((text.rotation * Math.PI) / 180);
        ctx.fillText(text.content, 0, 0);
        ctx.restore();
      });
      
      // Convertir en blob
      canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append('image', blob, 'ma-creation.png');
        formData.append('email', 'minimalflowstudio@gmail.com');
        
        // Téléchargement local
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `la-petite-enseigne-${Date.now()}.png`;
        link.click();
        URL.revokeObjectURL(url);
        
        // Stockage local pour l'utilisateur
        const reader = new FileReader();
        reader.onload = () => {
          const projects = JSON.parse(localStorage.getItem('petite-enseigne-projects') || '[]');
          projects.push({
            id: Date.now(),
            date: new Date().toISOString(),
            image: reader.result,
            texts: texts,
            imageData: {
              position: imagePosition,
              scale: imageScale,
              rotation: imageRotation
            }
          });
          localStorage.setItem('petite-enseigne-projects', JSON.stringify(projects));
        };
        reader.readAsDataURL(blob);
        
        // Envoyer par email (simulation - dans un vrai projet, vous utiliseriez un service backend)
        const emailBody = `Nouvelle création La Petite Enseigne créée le ${new Date().toLocaleString()}`;
        const emailUrl = `mailto:minimalflowstudio@gmail.com?subject=Nouvelle création La Petite Enseigne&body=${encodeURIComponent(emailBody)}`;
        window.open(emailUrl);
        
        alert('✅ Image téléchargée et sauvegardée !');
      }, 'image/png');
      
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('❌ Erreur lors de l\'export de l\'image');
    }
  }, [selectedImage, imagePosition, imageScale, imageRotation, texts]);

  const selectedText = texts.find(text => text.id === selectedTextId);

  const handleTextDrag = (id, e) => {
    const rect = circleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - 150) / 300) * 100;
    const y = ((e.clientY - rect.top - 150) / 300) * 100;
    updateText(id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            🎨 La Petite Enseigne
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Créez vos designs personnalisés facilement
          </p>
          <div className="text-xs text-gray-500 text-center mt-2 space-y-1">
            <p>📱 <strong>Tactile :</strong> 1 doigt = déplacer | 2 doigts = zoom & rotation</p>
            <p>🖱️ <strong>Souris :</strong> Clic = déplacer | Ctrl+Molette = zoom | Molette = rotation</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          
          {/* Zone de design principale */}
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Zone de création</h2>
            
            {/* Cercle de cadrage */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div 
                  ref={circleRef}
                  className="relative w-80 h-80 border-4 border-dashed border-purple-300 rounded-full overflow-hidden bg-gray-50 cursor-move touch-none"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                  onWheel={(e) => {
                    e.preventDefault();
                    if (selectedImage) {
                      if (e.ctrlKey) {
                        // Ctrl + molette = zoom de l'image
                        const delta = e.deltaY > 0 ? -0.1 : 0.1;
                        setImageScale(prev => Math.max(0.1, Math.min(3, prev + delta)));
                      } else {
                        // Molette = rotation de l'image
                        const delta = e.deltaY > 0 ? 15 : -15;
                        setImageRotation(prev => prev + delta);
                      }
                    }
                  }}
                >
                  {selectedImage && (
                    <>
                      <img
                        src={selectedImage}
                        alt="Image à cadrer"
                        className="absolute pointer-events-none select-none"
                        style={{
                          transform: `translate(${imagePosition.x}px, ${imagePosition.y}px) scale(${imageScale}) rotate(${imageRotation}deg)`,
                          transformOrigin: 'center center'
                        }}
                        draggable={false}
                      />
                      {/* Croix pour supprimer l'image */}
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center z-10"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  
                  {/* Textes */}
                  {texts.map(text => (
                    <div
                      key={text.id}
                      className={`absolute cursor-move select-none ${text.font.style} ${selectedTextId === text.id ? 'ring-2 ring-blue-400' : ''}`}
                      style={{
                        left: `${text.x}%`,
                        top: `${text.y}%`,
                        fontSize: `${text.fontSize}px`,
                        transform: `rotate(${text.rotation}deg)`,
                        color: '#000000',
                        transformOrigin: 'center',
                        touchAction: 'none'
                      }}
                      onClick={() => {
                        setSelectedTextId(text.id);
                        setShowTextControls(true);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        const handleDrag = (e) => handleTextDrag(text.id, e);
                        const handleRelease = () => {
                          document.removeEventListener('mousemove', handleDrag);
                          document.removeEventListener('mouseup', handleRelease);
                        };
                        document.addEventListener('mousemove', handleDrag);
                        document.addEventListener('mouseup', handleRelease);
                      }}
                      onTouchStart={(e) => handleTextTouchStart(text.id, e)}
                      onWheel={(e) => {
                        e.preventDefault();
                        if (selectedTextId === text.id) {
                          if (e.ctrlKey) {
                            // Ctrl + molette = zoom du texte
                            const delta = e.deltaY > 0 ? -2 : 2;
                            const newSize = Math.max(12, Math.min(72, text.fontSize + delta));
                            updateText(text.id, { fontSize: newSize });
                          } else {
                            // Molette = rotation du texte
                            const delta = e.deltaY > 0 ? 15 : -15;
                            updateText(text.id, { rotation: (text.rotation + delta) % 360 });
                          }
                        }
                      }}
                    >
                      {text.content}
                    </div>
                  ))}
                  
                  {!selectedImage && (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                      <div className="text-center">
                        <Upload className="w-12 h-12 mx-auto mb-2" />
                        <p>Ajoutez une image ci-dessous</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Upload d'image directement sous le cercle */}
                <div className="mt-4 flex justify-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    {selectedImage ? 'Changer l\'image' : 'Ajouter une image'}
                  </button>
                </div>
              </div>
            </div>

            {/* Contrôles d'image */}
            {selectedImage && (
              <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
                <h4 className="text-sm font-medium mb-3 text-center text-gray-700">Contrôles Image</h4>
                <div className="flex justify-center items-center gap-4 mb-3">
                  <button
                    onClick={() => setImageScale(Math.max(0.1, imageScale - 0.1))}
                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium min-w-16 justify-center">
                    {Math.round(imageScale * 100)}%
                  </span>
                  <button
                    onClick={() => setImageScale(imageScale + 0.1)}
                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => setImageRotation(imageRotation - 15)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    ↺
                  </button>
                  <span className="flex items-center px-3 py-2 bg-gray-100 rounded-lg text-sm font-medium min-w-16 justify-center">
                    {Math.round(imageRotation)}°
                  </span>
                  <button
                    onClick={() => setImageRotation(imageRotation + 15)}
                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    ↻
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Panneau de contrôles */}
          <div className="space-y-6">
            
            {/* Contrôles de texte */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">✏️ Texte</h3>
                <button
                  onClick={addText}
                  className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                >
                  <Type className="w-5 h-5" />
                </button>
              </div>

              {showTextControls && selectedText && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Contenu</label>
                    <input
                      type="text"
                      value={selectedText.content}
                      onChange={(e) => updateText(selectedTextId, { content: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Police</label>
                    <select
                      value={selectedText.font.name}
                      onChange={(e) => {
                        const font = fonts.find(f => f.name === e.target.value);
                        updateText(selectedTextId, { font });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    >
                      {fonts.map(font => (
                        <option key={font.name} value={font.name}>
                          {font.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Taille: {selectedText.fontSize}px
                    </label>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={selectedText.fontSize}
                      onChange={(e) => updateText(selectedTextId, { fontSize: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rotation: {selectedText.rotation}°
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={selectedText.rotation}
                        onChange={(e) => updateText(selectedTextId, { rotation: parseInt(e.target.value) })}
                        className="flex-1"
                      />
                      <button
                        onClick={() => updateText(selectedTextId, { rotation: (selectedText.rotation + 90) % 360 })}
                        className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                      >
                        <RotateCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={() => deleteText(selectedTextId)}
                    className="w-full p-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Supprimer le texte
                  </button>
                </div>
              )}

              {texts.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Cliquez sur + pour ajouter du texte
                </p>
              )}
            </div>

            {/* Export */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">💾 Export</h3>
              <button
                onClick={exportImage}
                disabled={!selectedImage}
                className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Télécharger & Envoyer
              </button>
              <p className="text-xs text-gray-500 mt-2 text-center">
                📧 Copie envoyée à minimalflowstudio@gmail.com<br/>
                💾 Sauvegarde automatique locale
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaPetiteEnseigne;
