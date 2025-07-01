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
  const fileInputRef = useRef(null);
  const circleRef = useRef(null);

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
      
      const scaleChange = distance / lastTouchDistance;
      setImageScale(prev => Math.max(0.1, Math.min(3, prev * scaleChange)));
      setLastTouchDistance(distance);
      
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

  const selectedText = texts.find(text => text.id === selectedTextId);

  const handleTextDrag = (id, e) => {
    const rect = circleRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - 150) / 300) * 100;
    const y = ((e.clientY - rect.top - 150) / 300) * 100;
    updateText(id, { x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <h1 className="text-3xl font-bold text-gray-800 text-center">
            🎨 La Petite Enseigne
          </h1>
          <p className="text-gray-600 text-center mt-2">
            Créez vos designs personnalisés facilement
          </p>
          <p className="text-sm text-gray-500 text-center mt-1">
            📱 Utilisez vos doigts : 1 doigt = déplacer, 2 doigts = zoom & rotation
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid lg:grid-cols-2 gap-8">
          
          <div className="bg-white rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Zone de création</h2>
            
            <div className="flex justify-center mb-4">
              <div className="relative">
                <div 
                  ref={circleRef}
                  className="relative w-80 h-80 border-4 border-dashed border-purple-300 rounded-full overflow-hidden bg-gray-50 cursor-move touch-none"
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
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
                      <button
                        onClick={clearImage}
                        className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center justify-center z-10"
                      >
                        ✕
                      </button>
                    </>
                  )}
                  
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
                        transformOrigin: 'center'
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

          <div className="space-y-6">
            
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

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">💾 Export</h3>
              <button
                disabled={!selectedImage}
                className="w-full p-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                Télécharger l'image
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaPetiteEnseigne;

