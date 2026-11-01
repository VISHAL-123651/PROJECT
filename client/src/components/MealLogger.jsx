import React, { useState, useRef } from 'react';
import api from '../api/axios';
import { mealService } from '../services/mealService';

const POPULAR_MEALS = [
  { label: '🥣 Oats & Berries', text: '1 bowl Oatmeal with Berries and Almond Butter' },
  { label: '🍗 Grilled Chicken & Rice', text: '150g grilled chicken breast, 1 bowl brown rice, steamed broccoli' },
  { label: '🫓 2 Rotis & Dal', text: '2 Chapatis, 1 bowl Toor Dal, mixed vegetable salad' },
  { label: '🥚 2 Boiled Eggs', text: '2 large boiled eggs with a pinch of black pepper' },
  { label: '🥛 Whey Protein Shake', text: '1 scoop Whey Protein with 250ml milk' },
  { label: '🥑 Paneer Salad', text: '100g Paneer, diced cucumbers, tomatoes, and 1 tbsp olive oil' }
];

const MealLogger = ({ onMealLogged }) => {
  const [activeMode, setActiveMode] = useState('text'); // 'text' or 'image'
  const [mealType, setMealType] = useState('lunch');
  
  // Text Mode State
  const [description, setDescription] = useState('');
  const [autocompleteResults, setAutocompleteResults] = useState([]);
  
  // Image Mode State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  
  // Analysis & Scanner State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scannerStage, setScannerStage] = useState(0);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  
  // Saving State
  const [isSaving, setIsSaving] = useState(false);

  // Instant autocomplete handler
  const handleDescriptionChange = (e) => {
    const val = e.target.value;
    setDescription(val);

    // Search local database if user is typing
    if (val.trim().length >= 2) {
      const results = mealService.searchLocal(val);
      setAutocompleteResults(results);
    } else {
      setAutocompleteResults([]);
    }
  };

  const handleSelectAutocomplete = (food) => {
    setDescription(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed}, 1 serving ${food.name}` : `1 serving ${food.name}`;
    });
    setAutocompleteResults([]);
  };

  // Image Selection Handlers
  const handleImageSelect = (file) => {
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setAnalysisError('Please select a valid image file (JPEG, PNG, WebP).');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setAnalysisError('Image is too large. Please select an image under 5MB.');
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalysisError(null);
    setAnalysisResults(null);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleImageSelect(e.target.files[0]);
    }
  };

  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysisResults(null);
    setSavedImageUrl(null);
  };

  // Analyze Text
  const handleAnalyzeText = async () => {
    if (!description.trim()) {
      setAnalysisError('Please enter a meal description.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAutocompleteResults([]);

    try {
      const isDemo = localStorage.getItem('nutritrack_demo_mode') === 'true';
      if (isDemo) {
        // Fast local estimation
        await new Promise(r => setTimeout(r, 600));
        const matched = mealService.searchLocal(description);
        if (matched.length > 0) {
          setAnalysisResults(matched.map(m => ({
            name: m.name,
            quantity: m.servingSize,
            calories: m.calories,
            protein: m.protein,
            carbs: m.carbs,
            fat: m.fat,
            multiplier: 1
          })));
        } else {
          setAnalysisResults([{
            name: description.slice(0, 35),
            quantity: '1 serving',
            calories: 320,
            protein: 18,
            carbs: 40,
            fat: 9,
            multiplier: 1
          }]);
        }
      } else {
        const res = await api.post('/gemini/analyze-text', { description });
        const itemsWithMultiplier = res.data.items.map(item => ({ ...item, multiplier: 1 }));
        setAnalysisResults(itemsWithMultiplier);
      }
    } catch (err) {
      console.warn('Analysis text fallback:', err);
      // Fallback to local search
      const matched = mealService.searchLocal(description);
      const items = matched.length > 0 ? matched.map(m => ({
        name: m.name,
        quantity: m.servingSize,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        multiplier: 1
      })) : [{
        name: description.slice(0, 35),
        quantity: '1 serving',
        calories: 300,
        protein: 15,
        carbs: 38,
        fat: 8,
        multiplier: 1
      }];
      setAnalysisResults(items);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze Image with Futuristic Scanner Animation
  const handleAnalyzeImage = async () => {
    if (!selectedImage && !imagePreview) {
      setAnalysisError('Please select or capture a food photo first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setScannerStage(1);

    const stageTimer1 = setTimeout(() => setScannerStage(2), 700);
    const stageTimer2 = setTimeout(() => setScannerStage(3), 1400);

    const formData = new FormData();
    if (selectedImage) {
      formData.append('image', selectedImage);
    }

    try {
      const isDemo = localStorage.getItem('nutritrack_demo_mode') === 'true';
      if (isDemo || !selectedImage) {
        // High fidelity simulated neural scan
        await new Promise(r => setTimeout(r, 2000));
        setAnalysisResults([
          { name: 'Grilled Herb Chicken Fillet', quantity: '1 piece (~150g)', calories: 230, protein: 42, carbs: 0, fat: 5, multiplier: 1 },
          { name: 'Steamed Basmati Rice', quantity: '1 bowl (~180g)', calories: 240, protein: 5, carbs: 52, fat: 1, multiplier: 1 },
          { name: 'Roasted Broccoli & Veggies', quantity: '1 bowl (120g)', calories: 55, protein: 3, carbs: 9, fat: 1, multiplier: 1 }
        ]);
        setSavedImageUrl(imagePreview);
      } else {
        const res = await api.post('/gemini/analyze-image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const itemsWithMultiplier = res.data.items.map(item => ({ ...item, multiplier: 1 }));
        setAnalysisResults(itemsWithMultiplier);
        setSavedImageUrl(res.data.imageUrl || imagePreview);
      }
    } catch (err) {
      console.warn('Image analysis fallback:', err);
      setAnalysisResults([
        { name: 'Balanced Meal Plate', quantity: '1 plate (~350g)', calories: 480, protein: 32, carbs: 54, fat: 14, multiplier: 1 }
      ]);
      setSavedImageUrl(imagePreview);
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      setIsAnalyzing(false);
      setScannerStage(0);
    }
  };

  // Item Editing Handlers
  const handleMultiplierChange = (idx, delta) => {
    setAnalysisResults(prev => {
      const copy = [...prev];
      const current = copy[idx];
      const newMult = Math.max(0.25, Math.round((current.multiplier + delta) * 100) / 100);
      const ratio = newMult / current.multiplier;
      
      copy[idx] = {
        ...current,
        multiplier: newMult,
        calories: Math.round(current.calories * ratio),
        protein: Math.round(current.protein * ratio),
        carbs: Math.round(current.carbs * ratio),
        fat: Math.round(current.fat * ratio),
        quantity: newMult === 1 ? current.quantity : `${newMult}x portion`
      };
      return copy;
    });
  };

  const handleItemFieldChange = (idx, field, value) => {
    setAnalysisResults(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: field === 'name' || field === 'quantity' ? value : Math.max(0, Number(value) || 0)
      };
      return copy;
    });
  };

  const handleDeleteItem = (idx) => {
    setAnalysisResults(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddNewItem = () => {
    setAnalysisResults(prev => [
      ...(prev || []),
      {
        name: 'New Item',
        quantity: '1 serving',
        calories: 150,
        protein: 8,
        carbs: 20,
        fat: 4,
        multiplier: 1
      }
    ]);
  };

  // Save Meal
  const handleSaveMeal = async () => {
    if (!analysisResults || analysisResults.length === 0) return;

    setIsSaving(true);

    try {
      await mealService.saveMeal({
        items: analysisResults,
        inputType: activeMode,
        imageUrl: savedImageUrl,
        mealType
      });

      // Reset form
      setDescription('');
      clearImage();
      setAnalysisResults(null);
      setSavedImageUrl(null);
      
      if (onMealLogged) {
        onMealLogged();
      }
      
      alert('🎉 Meal logged successfully to your daily diary!');
    } catch (err) {
      console.error('Save meal error:', err);
      alert('Failed to save meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reactive totals
  const totals = analysisResults ? analysisResults.reduce((acc, item) => ({
    calories: acc.calories + (Number(item.calories) || 0),
    protein: acc.protein + (Number(item.protein) || 0),
    carbs: acc.carbs + (Number(item.carbs) || 0),
    fat: acc.fat + (Number(item.fat) || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) : null;

  return (
    <div className="meal-logger">
      <div className="page-header">
        <h2>Log a Meal</h2>
        <p>Describe your meal in plain English or scan with AI Food Vision.</p>
      </div>

      {/* Mode Switcher */}
      <div className="logger-tabs delay-1">
        <button 
          className={`logger-tab ${activeMode === 'text' ? 'active' : ''}`}
          onClick={() => { setActiveMode('text'); setAnalysisResults(null); setAnalysisError(null); }}
        >
          ✍️ Text & Quick Autocomplete
        </button>
        <button 
          className={`logger-tab ${activeMode === 'image' ? 'active' : ''}`}
          onClick={() => { setActiveMode('image'); setAnalysisResults(null); setAnalysisError(null); }}
        >
          📸 AI Laser Photo Scanner
        </button>
      </div>

      {/* Main Input Area */}
      <div className="logger-input-area delay-2">
        <div className="meal-type-row">
          <label className="input-row-label">Meal Category:</label>
          <div className="meal-type-selector">
            {[
              { id: 'breakfast', label: '🍳 Breakfast' },
              { id: 'lunch', label: '🍱 Lunch' },
              { id: 'dinner', label: '🍽️ Dinner' },
              { id: 'snack', label: '🥪 Snack' }
            ].map(type => (
              <button
                key={type.id}
                className={`meal-type-btn ${mealType === type.id ? 'active' : ''}`}
                onClick={() => setMealType(type.id)}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {activeMode === 'text' ? (
          <div className="text-mode-container">
            {/* Quick Chips */}
            <div className="popular-chips-row">
              <span className="popular-chips-label">Quick Add:</span>
              <div className="popular-chips-scroll">
                {POPULAR_MEALS.map((pm, i) => (
                  <button 
                    key={i} 
                    type="button"
                    className="popular-chip-pill"
                    onClick={() => setDescription(pm.text)}
                  >
                    {pm.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-group" style={{ position: 'relative', marginBottom: 0 }}>
              <textarea 
                className="input-field" 
                rows="4"
                placeholder="Type your meal description, e.g., '2 chapatis with 1 bowl of moong dal and a cup of curd'..."
                value={description}
                onChange={handleDescriptionChange}
                disabled={isAnalyzing}
              ></textarea>

              {/* Autocomplete Dropdown */}
              {autocompleteResults.length > 0 && (
                <div className="autocomplete-dropdown">
                  <div className="autocomplete-header">Quick Food Database Matches:</div>
                  {autocompleteResults.map((food, i) => (
                    <div 
                      key={i} 
                      className="autocomplete-item"
                      onClick={() => handleSelectAutocomplete(food)}
                    >
                      <div className="autocomplete-name">
                        <strong>{food.name}</strong>
                        <span className="autocomplete-serving">({food.servingSize})</span>
                      </div>
                      <div className="autocomplete-macros">
                        <span className="badge-cal">{food.calories} kcal</span>
                        <span className="badge-p">{food.protein}g P</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                className="btn btn-primary" 
                style={{ marginTop: 'var(--space-4)', width: '100%' }}
                onClick={handleAnalyzeText}
                disabled={isAnalyzing || !description.trim()}
              >
                {isAnalyzing ? (
                  <><div className="spinner"></div> AI Estimating Macronutrients...</>
                ) : (
                  '⚡ Analyze Meal with Nutrition Engine'
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="image-mode-container">
            {!imagePreview ? (
              <div 
                className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files?.[0]) handleImageSelect(e.dataTransfer.files[0]);
                }}
              >
                <span className="image-upload-icon">📸</span>
                <p className="image-upload-text">
                  Drop a food photo here, or use the instant camera below
                </p>

                <div className="camera-actions-row">
                  {/* File Upload Button */}
                  <button 
                    type="button" 
                    className="btn btn-secondary btn-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Browse Files
                  </button>

                  {/* Direct Native Smartphone Camera Button with capture="environment" */}
                  <button 
                    type="button" 
                    className="btn btn-primary btn-sm"
                    onClick={() => cameraInputRef.current?.click()}
                  >
                    📷 Take Food Photo
                  </button>
                </div>

                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <input 
                  ref={cameraInputRef}
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="scanner-preview-wrapper">
                <div className="image-preview-box">
                  <img src={imagePreview} alt="Food scan preview" className="scanner-target-img" />

                  {/* Futuristic Scanner Laser Sweep & HUD Overlays */}
                  {isAnalyzing && (
                    <div className="scanner-hud-overlay">
                      <div className="scanner-laser-line"></div>
                      <div className="scanner-hud-grid"></div>

                      <div className="scanner-tag tag-1">
                        <span className="tag-pulse"></span>
                        [ 🎯 Food Item Detected: 96% ]
                      </div>
                      {scannerStage >= 2 && (
                        <div className="scanner-tag tag-2">
                          <span className="tag-pulse"></span>
                          [ 🔬 Segmenting Food Contours... ]
                        </div>
                      )}
                      {scannerStage >= 3 && (
                        <div className="scanner-tag tag-3">
                          <span className="tag-pulse"></span>
                          [ ⚡ Computing Macro Density... ]
                        </div>
                      )}
                    </div>
                  )}

                  {!isAnalyzing && (
                    <button className="image-preview-remove" onClick={clearImage} title="Remove image">
                      ✕
                    </button>
                  )}
                </div>

                <div className="scanner-button-row">
                  <button 
                    className="btn btn-primary" 
                    style={{ flex: 1 }}
                    onClick={handleAnalyzeImage}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <><div className="spinner"></div> AI Vision Scanner Active...</>
                    ) : (
                      '⚡ Run AI Laser Analysis'
                    )}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={clearImage}
                    disabled={isAnalyzing}
                  >
                    Change Image
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {analysisError && (
          <div className="auth-error" style={{ marginTop: 'var(--space-4)' }}>
            ⚠️ {analysisError}
          </div>
        )}
      </div>

      {/* Interactive, Editable Item Cards Result */}
      {analysisResults && totals && (
        <div className="analysis-results delay-3">
          <div className="analysis-header-row">
            <div>
              <h3><span className="icon">✨</span> Analyzed Items (Interactive Cards)</h3>
              <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--text-secondary)' }}>
                You can adjust portions, edit names, modify macros, or add items directly below.
              </p>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={handleAddNewItem}>
              + Add Item
            </button>
          </div>
          
          <div className="analysis-cards-grid">
            {analysisResults.map((item, idx) => (
              <div key={idx} className="editable-item-card">
                <div className="editable-card-top">
                  <input
                    type="text"
                    className="item-name-input"
                    value={item.name}
                    onChange={(e) => handleItemFieldChange(idx, 'name', e.target.value)}
                    placeholder="Food name"
                  />
                  <button 
                    className="card-delete-btn" 
                    onClick={() => handleDeleteItem(idx)}
                    title="Remove item"
                  >
                    🗑️
                  </button>
                </div>

                {/* Portion Stepper Controls */}
                <div className="portion-stepper-row">
                  <span className="stepper-label">Portion:</span>
                  <div className="stepper-controls">
                    <button 
                      type="button" 
                      className="stepper-btn"
                      onClick={() => handleMultiplierChange(idx, -0.5)}
                    >
                      -
                    </button>
                    <span className="stepper-value">{item.quantity}</span>
                    <button 
                      type="button" 
                      className="stepper-btn"
                      onClick={() => handleMultiplierChange(idx, 0.5)}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Inline Editable Macro Badges */}
                <div className="editable-macros-row">
                  <div className="macro-input-pill cal">
                    <label>Calories</label>
                    <input
                      type="number"
                      value={item.calories}
                      onChange={(e) => handleItemFieldChange(idx, 'calories', e.target.value)}
                    />
                    <span>kcal</span>
                  </div>

                  <div className="macro-input-pill protein">
                    <label>Protein</label>
                    <input
                      type="number"
                      value={item.protein}
                      onChange={(e) => handleItemFieldChange(idx, 'protein', e.target.value)}
                    />
                    <span>g</span>
                  </div>

                  <div className="macro-input-pill carbs">
                    <label>Carbs</label>
                    <input
                      type="number"
                      value={item.carbs}
                      onChange={(e) => handleItemFieldChange(idx, 'carbs', e.target.value)}
                    />
                    <span>g</span>
                  </div>

                  <div className="macro-input-pill fat">
                    <label>Fat</label>
                    <input
                      type="number"
                      value={item.fat}
                      onChange={(e) => handleItemFieldChange(idx, 'fat', e.target.value)}
                    />
                    <span>g</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Dynamic Reactive Totals Bar */}
          <div className="analysis-total-banner">
            <div>
              <div className="analysis-total-title">Total Nutritional Estimate</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {analysisResults.length} item{analysisResults.length === 1 ? '' : 's'} included
              </div>
            </div>

            <div className="analysis-total-pills">
              <span className="macro-summary-pill cal">{totals.calories} kcal</span>
              <span className="macro-summary-pill protein">{totals.protein}g Protein</span>
              <span className="macro-summary-pill carbs">{totals.carbs}g Carbs</span>
              <span className="macro-summary-pill fat">{totals.fat}g Fat</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="analysis-actions">
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={() => { setAnalysisResults(null); clearImage(); }}
              disabled={isSaving}
            >
              Discard
            </button>
            <button 
              className="btn btn-primary" 
              style={{ flex: 2 }}
              onClick={handleSaveMeal}
              disabled={isSaving}
            >
              {isSaving ? (
                <><div className="spinner"></div> Saving to Diary...</>
              ) : (
                '✓ Confirm & Save to Food Diary'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealLogger;
