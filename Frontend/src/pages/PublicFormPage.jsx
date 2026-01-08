/**
 * Public Form Page
 * Displays published forms for public viewing and submission
 * Supports prefill, skipped fields feedback, and editable resubmission
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Edit2, Info, Eye, Download } from 'lucide-react';
import * as formsService from '../api/formsService';
import * as submissionsService from '../api/submissionsService';
import RichContentEditor from '../components/editor/RichContentEditor';

export default function PublicFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({});
  
  // New states for prefill and skipped fields
  const [hasExistingSubmission, setHasExistingSubmission] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [skippedFields, setSkippedFields] = useState([]);
  const [sessionId, setSessionId] = useState('');
  const [previouslyUploadedFiles, setPreviouslyUploadedFiles] = useState({}); // Track file field names from previous submission
  
  // Ref to prevent double API calls (React StrictMode)
  const isLoadedRef = React.useRef(false);

  useEffect(() => {
    // Prevent double loading in React StrictMode
    if (isLoadedRef.current) return;
    isLoadedRef.current = true;
    
    // Get or create session ID for tracking
    const sid = submissionsService.getOrCreateSessionId();
    setSessionId(sid);
    loadForm(sid);
  }, [slug]);

  const loadForm = async (sid) => {
    try {
      setIsLoading(true);
      setError('');
      const loadedForm = await formsService.getPublicForm(slug);
      setForm(loadedForm);
      
      // Initialize form data with empty values
      const initialData = {};
      loadedForm.fields.forEach(field => {
        initialData[field.id] = field.type === 'checkbox' ? [] : '';
      });
      
      // Try to get existing submission for prefill
      try {
        const existingData = await submissionsService.getMySubmission(slug, sid);
        if (existingData.has_submission && existingData.submission) {
          setHasExistingSubmission(true);
          // Prefill form with existing data
          const prefillData = { ...initialData };
          const fileInfo = {};
          
          // Handle each field from previous submission
          Object.entries(existingData.submission.form_data).forEach(([key, value]) => {
            const field = loadedForm.fields.find(f => f.id === key);
            if (field?.type === 'file') {
              // For file fields, store the complete file info for viewing
              // (browsers don't allow programmatic file input setting for security)
              if (value) {
                // If value is an object with data (Base64), keep the full object
                if (typeof value === 'object' && value.data) {
                  fileInfo[key] = value;
                } else if (typeof value === 'string') {
                  // Legacy: just filename
                  fileInfo[key] = { name: value };
                }
              }
            } else {
              prefillData[key] = value;
            }
          });
          
          setPreviouslyUploadedFiles(fileInfo);
          setFormData(prefillData);
          toast.success('Your previous response has been loaded!');
        } else {
          setFormData(initialData);
        }
      } catch (prefillErr) {
        // If prefill fails, just use empty form
        console.log('No previous submission found');
        setFormData(initialData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load form');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setIsSubmitting(true);
      
      // Include session_id in metadata for tracking
      await submissionsService.submitForm(slug, { 
        form_data: formData,
        metadata: { session_id: sessionId }
      });
      
      // Find skipped optional fields
      const skipped = form.fields
        .filter(field => {
          if (field.required) return false; // Skip required fields
          const value = formData[field.id];
          // Check if field is empty
          if (Array.isArray(value)) return value.length === 0;
          return !value || value.toString().trim() === '';
        })
        .map(field => field.label);
      
      setSkippedFields(skipped);
      setHasExistingSubmission(true);
      setIsEditMode(false);
      setIsSubmitted(true);
    } catch (err) {
      toast.error('Failed to submit form: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle edit button click to allow resubmission
  const handleEdit = () => {
    setIsSubmitted(false);
    setIsEditMode(true);
  };

  const renderField = (field) => {
    const fieldStyle = field.style || {};
    const commonStyle = {
      fontFamily: fieldStyle.fontFamily || 'Inter, system-ui, sans-serif',
      fontSize: fieldStyle.fontSize || '14px',
      color: fieldStyle.color || '#1f2937',
      backgroundColor: fieldStyle.backgroundColor || '#ffffff',
      borderWidth: fieldStyle.borderWidth || '1px',
      borderStyle: fieldStyle.borderStyle || 'solid',
      borderColor: fieldStyle.borderColor || '#d1d5db',
      borderRadius: fieldStyle.borderRadius || '6px',
      padding: `${fieldStyle.paddingTop || '10px'} ${fieldStyle.paddingRight || '12px'} ${fieldStyle.paddingBottom || '10px'} ${fieldStyle.paddingLeft || '12px'}`,
      marginBottom: fieldStyle.marginBottom || '16px',
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
      case 'url':
      case 'date':
        return (
          <input
            type={field.type}
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            style={commonStyle}
            className="w-full outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      case 'textarea':
        return (
          <textarea
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            rows={4}
            style={commonStyle}
            className="w-full outline-none focus:ring-2 focus:ring-primary-500 resize-vertical"
          />
        );

      case 'select':
        return (
          <select
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            style={commonStyle}
            className="w-full outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">Select an option</option>
            {field.options?.map((option, idx) => (
              <option key={idx} value={option}>{option}</option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  required={field.required}
                  checked={formData[field.id] === option}
                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                  style={{ accentColor: fieldStyle.color }}
                />
                <span style={{ fontFamily: fieldStyle.fontFamily || 'Inter, system-ui, sans-serif', fontSize: fieldStyle.fontSize || '14px', color: fieldStyle.color || '#1f2937' }}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, idx) => (
              <label key={idx} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={(formData[field.id] || []).includes(option)}
                  onChange={(e) => {
                    const currentValues = formData[field.id] || [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleInputChange(field.id, newValues);
                  }}
                  style={{ accentColor: fieldStyle.color }}
                />
                <span style={{ fontFamily: fieldStyle.fontFamily || 'Inter, system-ui, sans-serif', fontSize: fieldStyle.fontSize || '14px', color: fieldStyle.color || '#1f2937' }}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      case 'file':
        return (
          <div className="relative">
            <input
              type="file"
              id={field.id}
              required={field.required && !previouslyUploadedFiles[field.id]}
              accept={field.accept?.join(',') || '*'}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Check file size (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('File size must be less than 5MB');
                    e.target.value = '';
                    return;
                  }
                  
                  // Convert to Base64
                  const reader = new FileReader();
                  reader.onload = () => {
                    const fileData = {
                      name: file.name,
                      type: file.type,
                      size: file.size,
                      data: reader.result // Base64 data URL
                    };
                    handleInputChange(field.id, fileData);
                  };
                  reader.onerror = () => {
                    toast.error('Failed to read file');
                  };
                  reader.readAsDataURL(file);
                }
              }}
              style={{
                ...commonStyle,
                padding: '12px',
                cursor: 'pointer',
                backgroundColor: '#f9fafb',
                borderStyle: 'dashed',
              }}
              className="w-full outline-none focus:ring-2 focus:ring-primary-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            />
            {/* Show previously uploaded file info with view/download */}
            {previouslyUploadedFiles[field.id] && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800">
                      {previouslyUploadedFiles[field.id].name || previouslyUploadedFiles[field.id]}
                    </span>
                  </div>
                  {previouslyUploadedFiles[field.id].data && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const fileInfo = previouslyUploadedFiles[field.id];
                          const newWindow = window.open();
                          if (newWindow) {
                            if (fileInfo.type?.startsWith('image/')) {
                              newWindow.document.write(`<img src="${fileInfo.data}" alt="${fileInfo.name}" style="max-width:100%;height:auto;" />`);
                            } else if (fileInfo.type === 'application/pdf') {
                              newWindow.document.write(`<iframe src="${fileInfo.data}" width="100%" height="100%" style="border:none;"></iframe>`);
                            } else {
                              newWindow.location.href = fileInfo.data;
                            }
                          }
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                        View
                      </button>
                      <a
                        href={previouslyUploadedFiles[field.id].data}
                        download={previouslyUploadedFiles[field.id].name}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                      >
                        <Download className="w-3 h-3" />
                        Download
                      </a>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Select new file to replace</p>
              </div>
            )}
            {field.accept && (
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: {field.accept.join(', ')} (Max 5MB)
              </p>
            )}
          </div>
        );

      case 'time':
        return (
          <input
            type="time"
            id={field.id}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            style={commonStyle}
            className="w-full outline-none focus:ring-2 focus:ring-primary-500"
          />
        );

      default:
        // Fallback for any unhandled field types - render as text input
        console.warn(`Unknown field type: ${field.type}, rendering as text input`);
        return (
          <input
            type="text"
            id={field.id}
            placeholder={field.placeholder}
            required={field.required}
            value={formData[field.id] || ''}
            onChange={(e) => handleInputChange(field.id, e.target.value)}
            style={commonStyle}
            className="w-full outline-none focus:ring-2 focus:ring-primary-500"
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Form Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {hasExistingSubmission && isEditMode ? 'Response Updated!' : 'Thank You!'}
            </h2>
            <p className="text-gray-600 mb-6">
              {hasExistingSubmission && isEditMode 
                ? 'Your response has been updated successfully.' 
                : 'Your Form has been submitted successfully.'}
            </p>
            
            {/* Skipped Optional Fields Feedback */}
            {skippedFields.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start gap-2">
                  <Info className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800 mb-2">
                      You skipped the following optional fields:
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside space-y-1">
                      {skippedFields.map((fieldLabel, index) => (
                        <li key={index}>{fieldLabel}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleEdit}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all"
              >
                <Edit2 className="w-5 h-5" />
                Edit Form
              </button>
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
                Go to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Single Form Container with Background */}
        <div 
          className="rounded-xl shadow-lg overflow-hidden relative"
          style={{
            ...(form.backgroundImage && {
              backgroundImage: `url(${form.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            })
          }}
        >
          {/* Light Overlay for slight text readability - mostly transparent */}
          {form.backgroundImage && (
            <div 
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(to bottom, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.2) 100%)',
              }}
            />
          )}
          
          {/* Form Header */}
          <div className={`p-8 border-b border-gray-200 relative z-10 ${form.backgroundImage ? '' : 'bg-white'}`}>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
            {form.description && (
              <p className="text-gray-600">{form.description}</p>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={`p-8 relative z-10 ${form.backgroundImage ? '' : 'bg-white'}`}>
          {/* Previously Submitted Indicator */}
          {hasExistingSubmission && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-6 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-800">
                You've previously submitted this form. Your responses have been loaded.
              </span>
            </div>
          )}
          {form.fields.map((field, index) => {
            // Calculate question number for ALL fields sequentially
            const questionNumber = index + 1;
            
            return (
              <div key={field.id} className="mb-6">
                <label
                  htmlFor={field.id}
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  {questionNumber !== null && (
                    <span className="font-semibold text-gray-900 mr-1">
                      Q{questionNumber}.
                    </span>
                  )}
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                {renderField(field)}
              </div>
            );
          })}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{
              backgroundColor: form.ctaButton?.backgroundColor || '#3b82f6',
              color: form.ctaButton?.textColor || '#ffffff',
              borderRadius: form.ctaButton?.borderRadius || '8px',
              fontSize: form.ctaButton?.fontSize || '16px',
              fontWeight: form.ctaButton?.fontWeight || '500',
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {hasExistingSubmission ? 'Updating...' : 'Submitting...'}
              </>
            ) : (
              hasExistingSubmission 
                ? 'Update Form' 
                : (form.ctaButton?.text || 'Submit')
            )}
          </button>
          </form>
          
          {/* Rich Content Preview (Read-only) */}
          {form.editorContent && (
            <div className={`p-8 border-t border-gray-200 relative z-10 ${form.backgroundImage ? '' : 'bg-white'}`}>
              <RichContentEditor
                content={form.editorContent}
                onChange={() => {}} // No-op for read-only
                isReadOnly={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
