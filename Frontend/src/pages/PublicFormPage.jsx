/**
 * Public Form Page
 * Displays published forms for public viewing and submission
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import * as formsService from '../api/formsService';
import * as submissionsService from '../api/submissionsService';

export default function PublicFormPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadForm();
  }, [slug]);

  const loadForm = async () => {
    try {
      setIsLoading(true);
      setError('');
      const formData = await formsService.getPublicForm(slug);
      setForm(formData);
      
      // Initialize form data with empty values
      const initialData = {};
      formData.fields.forEach(field => {
        initialData[field.id] = field.type === 'checkbox' ? [] : '';
      });
      setFormData(initialData);
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
      // Fixed: Use slug instead of form.id, and wrap formData in proper structure
      await submissionsService.submitForm(slug, { form_data: formData });
      setIsSubmitted(true);
    } catch (err) {
      alert('Failed to submit form: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsSubmitting(false);
    }
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
                <span style={{ fontFamily: fieldStyle.fontFamily, fontSize: fieldStyle.fontSize, color: fieldStyle.color }}>
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
                <span style={{ fontFamily: fieldStyle.fontFamily, fontSize: fieldStyle.fontSize, color: fieldStyle.color }}>
                  {option}
                </span>
              </label>
            ))}
          </div>
        );

      default:
        return null;
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You!</h2>
          <p className="text-gray-600 mb-6">Your response has been submitted successfully.</p>
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Form Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-8 mb-6 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{form.title}</h1>
          {form.description && (
            <p className="text-gray-600">{form.description}</p>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
          {form.fields.map((field) => (
            <div key={field.id} className="mb-6">
              <label
                htmlFor={field.id}
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </label>
              {renderField(field)}
            </div>
          ))}

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
                Submitting...
              </>
            ) : (
              form.ctaButton?.text || 'Submit'
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
