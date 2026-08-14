import React, { useState } from 'react';
import api from '../api/axios';

const MealLogger = ({ onMealLogged }) => {
  const [activeMode, setActiveMode] = useState('text'); // 'text' or 'image'
  const [mealType, setMealType] = useState('lunch');
  
  // Text Mode State
  const [description, setDescription] = useState('');
  
  // Image Mode State
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);
  const [savedImageUrl, setSavedImageUrl] = useState(null);
  
  // Saving State
  const [isSaving, setIsSaving] = useState(false);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageSelect(e.dataTransfer.files[0]);
    }
  };

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
  };

  // Analyze Text
  const handleAnalyzeText = async () => {
    if (!description.trim()) {
      setAnalysisError('Please enter a meal description.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      const res = await api.post('/gemini/analyze-text', { description });
      setAnalysisResults(res.data.items);
    } catch (err) {
      console.error('Analyze text error:', err);
      setAnalysisError(err.response?.data?.message || 'Failed to analyze text. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Analyze Image
  const handleAnalyzeImage = async () => {
    if (!selectedImage) {
      setAnalysisError('Please select an image to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const res = await api.post('/gemini/analyze-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      setAnalysisResults(res.data.items);
      setSavedImageUrl(res.data.imageUrl);
    } catch (err) {
      console.error('Analyze image error:', err);
      setAnalysisError(err.response?.data?.message || 'Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Save Meal
  const handleSaveMeal = async () => {
    if (!analysisResults || analysisResults.length === 0) return;

    setIsSaving(true);

    try {
      await api.post('/meals', {
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
      
      // Notify parent
      if (onMealLogged) {
        onMealLogged();
      }
      
      alert('Meal logged successfully!');
    } catch (err) {
      console.error('Save meal error:', err);
      alert('Failed to save meal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate totals for preview
  const totals = analysisResults ? analysisResults.reduce((acc, item) => ({
    calories: acc.calories + item.calories,
    protein: acc.protein + item.protein,
    carbs: acc.carbs + item.carbs,
    fat: acc.fat + item.fat
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 }) : null;

  return (
    <div className="meal-logger">
      <div className="page-header">
        <h2>Log a Meal</h2>
        <p>Describe your meal or snap a photo for AI analysis.</p>
      </div>

      <div className="logger-tabs delay-1">
        <button 
          className={`logger-tab ${activeMode === 'text' ? 'active' : ''}`}
          onClick={() => { setActiveMode('text'); setAnalysisResults(null); setAnalysisError(null); }}
        >
          Text Input
        </button>
        <button 
          className={`logger-tab ${activeMode === 'image' ? 'active' : ''}`}
          onClick={() => { setActiveMode('image'); setAnalysisResults(null); setAnalysisError(null); }}
        >
          Image Upload
        </button>
      </div>

      <div className="logger-input-area delay-2">
        <div className="meal-type-selector">
          {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
            <button
              key={type}
              className={`meal-type-btn ${mealType === type ? 'active' : ''}`}
              onClick={() => setMealType(type)}
            >
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {activeMode === 'text' ? (
          <div className="input-group" style={{ marginBottom: 0 }}>
            <textarea 
              className="input-field" 
              placeholder="e.g., I ate 2 chapatis, 1 bowl of dal, and a glass of buttermilk..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isAnalyzing}
            ></textarea>
            
            <button 
              className="btn btn-primary" 
              style={{ marginTop: 'var(--space-4)', width: '100%' }}
              onClick={handleAnalyzeText}
              disabled={isAnalyzing || !description.trim()}
            >
              {isAnalyzing ? (
                <><div className="spinner"></div> Analyzing...</>
              ) : (
                'Analyze Meal'
              )}
            </button>
          </div>
        ) : (
          <div>
            {!imagePreview ? (
              <div 
                className={`image-upload-area ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload').click()}
              >
                <span className="image-upload-icon">📸</span>
                <p className="image-upload-text">
                  Drag and drop an image here, or <span>click to browse</span>
                </p>
                <input 
                  id="file-upload" 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="image-preview">
                <img src={imagePreview} alt="Meal preview" />
                {!isAnalyzing && (
                  <button className="image-preview-remove" onClick={clearImage}>
                    ×
                  </button>
                )}
              </div>
            )}
            
            {imagePreview && (
              <button 
                className="btn btn-primary" 
                style={{ marginTop: 'var(--space-4)', width: '100%' }}
                onClick={handleAnalyzeImage}
                disabled={isAnalyzing}
              >
                {isAnalyzing ? (
                  <><div className="spinner"></div> AI is analyzing your food...</>
                ) : (
                  'Analyze Image'
                )}
              </button>
            )}
          </div>
        )}

        {analysisError && (
          <div className="auth-error" style={{ marginTop: 'var(--space-4)' }}>
            ⚠️ {analysisError}
          </div>
        )}
      </div>

      {analysisResults && totals && (
        <div className="analysis-results delay-3">
          <h3>
            <span className="icon">✨</span> AI Analysis Results
          </h3>
          
          <div className="analysis-items">
            {analysisResults.map((item, idx) => (
              <div key={idx} className="analysis-item">
                <div className="analysis-item-name">
                  {item.name}
                  <span className="analysis-item-quantity">{item.quantity}</span>
                </div>
                <div className="analysis-item-macros">
                  <span className="macro-badge cal">{item.calories} kcal</span>
                  <span className="macro-badge protein">{item.protein}g P</span>
                  <span className="macro-badge carbs">{item.carbs}g C</span>
                  <span className="macro-badge fat">{item.fat}g F</span>
                </div>
              </div>
            ))}
          </div>

          <div className="analysis-total">
            <div className="analysis-total-label">Total Estimate</div>
            <div className="analysis-item-macros" style={{ fontSize: '1rem', fontWeight: '600' }}>
              <span className="macro-badge cal">{totals.calories} kcal</span>
              <span className="macro-badge protein">{totals.protein}g P</span>
              <span className="macro-badge carbs">{totals.carbs}g C</span>
              <span className="macro-badge fat">{totals.fat}g F</span>
            </div>
          </div>

          <div className="analysis-actions">
            <button 
              className="btn btn-secondary" 
              style={{ flex: 1 }}
              onClick={() => setAnalysisResults(null)}
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
                <><div className="spinner"></div> Saving...</>
              ) : (
                'Confirm & Log Meal'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealLogger;
