/**
 * Form Editor Page
 * Wrapper page for the Canvas Form Editor component
 * Handles loading form data and navigation
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CanvasFormEditor from '../components/CanvasFormEditor';
import type { FormSchema } from '../types/editorTypes';
import * as formsService from '../api/formsService';

const FormEditorPage: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormSchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadForm = async () => {
      if (!formId) {
        setError('Form ID is required');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await formsService.getFormById(formId);
        
        // Convert API response to FormSchema format
        const schema: FormSchema = {
          title: data.title || 'Untitled Form',
          description: data.description || '',
          fields: data.fields || [],
          globalStyles: data.globalStyles || {},
          ctaButton: data.ctaButton || undefined,
        };
        
        setFormData(schema);
        setError(null);
      } catch (err: any) {
        console.error('Error loading form:', err);
        setError(err.message || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [formId]);

  const handleSave = async (schema: FormSchema) => {
    if (!formId) return;

    try {
      await formsService.updateForm(formId, {
        title: schema.title,
        description: schema.description,
        fields: schema.fields,
        globalStyles: schema.globalStyles,
        ctaButton: schema.ctaButton,
      });
      
      // Optionally show success message
      console.log('Form saved successfully');
    } catch (err: any) {
      console.error('Error saving form:', err);
      throw err; // Let CanvasFormEditor handle the error
    }
  };

  const handleClose = () => {
    navigate('/dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Form</h2>
            <p className="text-red-600 mb-4">{error || 'Form not found'}</p>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <CanvasFormEditor
      initialFormData={formData}
      onSave={handleSave}
      onClose={handleClose}
      formId={formId}
    />
  );
};

export default FormEditorPage;
