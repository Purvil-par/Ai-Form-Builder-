/**
 * Canvas Form Editor - Main Canva-style Editor Component
 * White background, drag-and-drop, full customization
 */

import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Download, Undo, Redo, Monitor, Tablet, Smartphone, X, Palette, Layout, Plus } from 'lucide-react';
import FieldsPalette from './editor/FieldsPalette';
import StylePanel from './editor/StylePanel';
import FieldPropertiesPanel from './editor/FieldPropertiesPanel';
import TemplateGallery from './editor/TemplateGallery';
import GlobalStylesPanel from './editor/GlobalStylesPanel';
import DraggableField from './editor/DraggableField';
import CTAButton, { type CTAButtonData } from './editor/CTAButton';
import CTAStylePanel from './editor/CTAStylePanel';
import { useUndoRedo } from '../hooks/useUndoRedo';
import type { FormSchema, FormFieldData, FieldStyle, GlobalStyles } from '../types/editorTypes';
import * as formsService from '../api/formsService';
import '../styles/canvasEditor.css';

interface CanvasFormEditorProps {
  initialFormData: FormSchema;
  onSave: (schema: FormSchema) => void | Promise<void>;
  onClose: () => void;
  formId?: string; // Optional: if provided, update existing form instead of creating new
}

const CanvasFormEditor: React.FC<CanvasFormEditorProps> = ({
  initialFormData,
  onSave,
  onClose,
  formId, // Get formId prop
}) => {
  // Debug: Log formId on component mount
  React.useEffect(() => {
    console.log('🎨 CanvasFormEditor MOUNTED');
    console.log('📝 formId prop received:', formId);
    console.log('📝 formId type:', typeof formId);
    console.log('📝 formId is truthy?', !!formId);
  }, [formId]);
  // Ensure initialFormData has all required fields with defaults
  const safeInitialData = {
    title: initialFormData?.title || 'Untitled Form',
    description: initialFormData?.description || '',
    fields: initialFormData?.fields || [],
    globalStyles: initialFormData?.globalStyles || {
      primaryColor: '#3b82f6',
      secondaryColor: '#8b5cf6',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '14px',
      defaultSpacing: '16px',
      defaultBorderRadius: '6px',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
    },
  };

  const { state: formSchema, setState: setFormSchema, undo, redo, canUndo, canRedo } = useUndoRedo<FormSchema>(safeInitialData);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'field' | 'cta' | null>(null);
  const [activeTab, setActiveTab] = useState<'properties' | 'styles'>('properties');
  const [canvasMode, setCanvasMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);
  const [draggedFieldIndex, setDraggedFieldIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showGlobalStyles, setShowGlobalStyles] = useState(false);
  const [ctaButton, setCTAButton] = useState<CTAButtonData | null>((initialFormData as any)?.ctaButton || null);
  const [globalStyles, setGlobalStyles] = useState<GlobalStyles>(safeInitialData.globalStyles);

  // Convert old schema format to new format with styles
  const convertToStyledFields = (fields: any[]): FormFieldData[] => {
    return fields.map((field, index) => ({
      ...field,
      style: field.style || {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
        textAlign: 'left' as const,
        color: '#1f2937',
        backgroundColor: '#ffffff',
        borderWidth: '1px',
        borderStyle: 'solid' as const,
        borderColor: '#d1d5db',
        borderRadius: '6px',
        paddingTop: '10px',
        paddingRight: '12px',
        paddingBottom: '10px',
        paddingLeft: '12px',
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '16px',
        marginLeft: '0px',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
      },
      width: field.width || '100%',
      order: field.order ?? index,
    }));
  };

  // Convert and use fields directly from formSchema
  const fields = React.useMemo(() => 
    convertToStyledFields(formSchema.fields || []),
    [formSchema.fields]
  );

  const selectedField = fields.find(f => f.id === selectedFieldId);

  const handleFieldDragStart = (fieldType: string) => {
    setDraggedFieldType(fieldType);
  };

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedFieldType) return;

    // Initialize options for select/radio/checkbox fields
    const needsOptions = ['select', 'radio', 'checkbox'].includes(draggedFieldType);
    const defaultOptions = needsOptions ? ['Option 1', 'Option 2', 'Option 3'] : undefined;

    const newField: FormFieldData = {
      id: `field_${Date.now()}`,
      type: draggedFieldType as any,
      label: `${draggedFieldType.charAt(0).toUpperCase() + draggedFieldType.slice(1)} Field`,
      placeholder: `Enter ${draggedFieldType}`,
      required: false,
      options: defaultOptions,
      style: {
        fontFamily: 'Inter, system-ui, sans-serif',
        fontSize: '14px',
        fontWeight: '400',
        lineHeight: '1.5',
        letterSpacing: '0',
        textAlign: 'left',
        color: '#1f2937',
        backgroundColor: '#ffffff',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: '#d1d5db',
        borderRadius: '6px',
        paddingTop: '10px',
        paddingRight: '12px',
        paddingBottom: '10px',
        paddingLeft: '12px',
        marginTop: '0px',
        marginRight: '0px',
        marginBottom: '16px',
        marginLeft: '0px',
        boxShadow: 'none',
        transition: 'all 0.2s ease',
      },
      width: '100%',
      order: fields.length,
    };

    const updatedFields = [...fields, newField];
    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
    setSelectedFieldId(newField.id);
    setSelectedType('field');
    setDraggedFieldType(null);
  };

  const handleStyleChange = (styleChanges: Partial<FieldStyle>) => {
    if (!selectedFieldId) return;

    const updatedFields = fields.map(field =>
      field.id === selectedFieldId
        ? { ...field, style: { ...field.style, ...styleChanges } }
        : field
    );

    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
  };

  const handleFieldUpdate = (updates: Partial<FormFieldData>) => {
    if (!selectedFieldId) return;

    const updatedFields = fields.map(field =>
      field.id === selectedFieldId
        ? { ...field, ...updates }
        : field
    );

    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
  };

  const handleFieldClick = (fieldId: string) => {
    setSelectedFieldId(fieldId);
    setSelectedType('field');
    setActiveTab('properties'); // Default to properties tab
  };

  // Drag-and-drop handlers
  const handleFieldDragStartReorder = (index: number) => (e: React.DragEvent) => {
    setDraggedFieldIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDragOver = (index: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleFieldDrop = (dropIndex: number) => (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (draggedFieldIndex === null || draggedFieldIndex === dropIndex) {
      setDraggedFieldIndex(null);
      setDragOverIndex(null);
      return;
    }

    // Create new array and reorder
    const newFields = [...fields];
    const [draggedField] = newFields.splice(draggedFieldIndex, 1);
    newFields.splice(dropIndex, 0, draggedField);

    // Update order property for all fields
    const reorderedFields = newFields.map((field, idx) => ({
      ...field,
      order: idx,
    }));

    // Update both states
    const updatedSchema = {
      ...formSchema,
      fields: reorderedFields,
    };
    setFormSchema(updatedSchema);
    
    // Clear drag state
    setDraggedFieldIndex(null);
    setDragOverIndex(null);
  };

  const handleFieldDragEnd = () => {
    setDraggedFieldIndex(null);
    setDragOverIndex(null);
  };

  const handleDuplicateField = (fieldId: string) => {
    const fieldIndex = fields.findIndex(f => f.id === fieldId);
    if (fieldIndex === -1) return;

    const fieldToDuplicate = fields[fieldIndex];
    const newField = {
      ...fieldToDuplicate,
      id: `field_${Date.now()}`,
      label: `${fieldToDuplicate.label} (Copy)`,
    };

    const newFields = [
      ...fields.slice(0, fieldIndex + 1),
      newField,
      ...fields.slice(fieldIndex + 1),
    ].map((field, idx) => ({ ...field, order: idx }));

    setFormSchema({
      ...formSchema,
      fields: newFields,
    });
    setSelectedFieldId(newField.id);
    setSelectedType('field');
  };

  // CTA Button handlers
  const handleAddCTA = () => {
    setCTAButton({
      id: 'cta_button',
      text: 'Submit',
      style: {
        backgroundColor: globalStyles.primaryColor,
        textColor: '#ffffff',
        fontSize: '16px',
        fontWeight: '600',
        borderRadius: globalStyles.defaultBorderRadius,
        paddingTop: '12px',
        paddingRight: '24px',
        paddingBottom: '12px',
        paddingLeft: '24px',
        width: '100%',
        hoverBackgroundColor: globalStyles.secondaryColor,
      },
      order: fields.length,
    });
    setSelectedFieldId(null);
    setSelectedType('cta');
  };

  const handleRemoveCTA = () => {
    setCTAButton(null);
    setSelectedType(null);
  };

  const handleCTAStyleChange = (changes: Partial<CTAButtonData>) => {
    if (!ctaButton) return;
    setCTAButton({ ...ctaButton, ...changes });
  };

  const handleDeleteField = (fieldId: string) => {
    const updatedFields = fields.filter(f => f.id !== fieldId);
    setFormSchema({
      ...formSchema,
      fields: updatedFields,
    });
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
      setSelectedType(null);
    }
  };

  const handleSave = async () => {
    try {
      console.log('\n=== 💾 SAVE FORM CLICKED ===');
      console.log('formId prop value:', formId);
      console.log('formId type:', typeof formId);
      console.log('formId is truthy?', !!formId);
      console.log('formSchema:', formSchema);
      console.log('fields count:', fields.length);
      
      if (formId) {
        console.log('\n✅ UPDATE PATH - formId exists:', formId);
        // Update existing form
        const updateData = {
          title: formSchema.title,
          description: formSchema.description,
          fields: fields,
          globalStyles: globalStyles,
          ctaButton: ctaButton || undefined,
        };
        console.log('Calling updateForm API with:', updateData);
        await formsService.updateForm(formId, updateData);
        console.log('✅ Form updated successfully');
      } else {
        console.log('\n❌ CREATE PATH - formId is missing/falsy!');
        console.log('⚠️ WARNING: This will create a DUPLICATE form!');
        // Create new form
        const createData = {
          title: formSchema.title,
          description: formSchema.description,
          fields: fields,
          globalStyles: globalStyles,
          ctaButton: ctaButton || undefined,
          status: 'draft' as const
        };
        console.log('Calling createForm API with:', createData);
        const savedForm = await formsService.createForm(createData);
        console.log('❌ New form created (DUPLICATE!):', savedForm);
      }
      
      // Navigate to dashboard after successful save
      console.log('Navigating to dashboard...');
      window.location.href = '/dashboard';
    } catch (err) {
      console.error('❌ Failed to save form:', err);
      alert('Failed to save form: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const getCanvasWidth = () => {
    switch (canvasMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Top Toolbar */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-6 bg-white">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold text-gray-900">Form Editor</h1>
          <span className="text-sm text-gray-500">{formSchema.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Undo/Redo */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="toolbar-button"
              title="Undo (Ctrl+Z)"
            >
              <Undo size={18} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="toolbar-button"
              title="Redo (Ctrl+Y)"
            >
              <Redo size={18} />
            </button>
          </div>

          {/* Canvas Mode */}
          <div className="flex items-center gap-1 border-r border-gray-200 pr-3">
            <button
              onClick={() => setCanvasMode('desktop')}
              className={`canvas-mode-button ${canvasMode === 'desktop' ? 'active' : ''}`}
              title="Desktop View"
            >
              <Monitor size={18} />
            </button>
            <button
              onClick={() => setCanvasMode('tablet')}
              className={`canvas-mode-button ${canvasMode === 'tablet' ? 'active' : ''}`}
              title="Tablet View"
            >
              <Tablet size={18} />
            </button>
            <button
              onClick={() => setCanvasMode('mobile')}
              className={`canvas-mode-button ${canvasMode === 'mobile' ? 'active' : ''}`}
              title="Mobile View"
            >
              <Smartphone size={18} />
            </button>
          </div>

          {/* Actions */}
          {!ctaButton && (
            <button onClick={handleAddCTA} className="toolbar-button">
              <Plus size={18} className="mr-2" />
              Add CTA
            </button>
          )}
          <button onClick={handleSave} className="toolbar-button bg-blue-600 text-white border-blue-600 hover:bg-blue-700">
            <Save size={18} className="mr-2" />
            Save Form
          </button>
          <button 
            onClick={() => {
              if (confirm('Close editor? Any unsaved changes will be lost.')) {
                window.location.href = '/dashboard';
              }
            }} 
            className="toolbar-button"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Fields Palette */}
        <FieldsPalette
          onFieldDragStart={handleFieldDragStart}
          fieldCount={fields.length}
        />

        {/* Canvas Area */}
        <div className="flex-1 overflow-auto custom-scrollbar canvas-grid p-8">
          <div
            className={`mx-auto bg-white shadow-lg rounded-lg transition-all duration-300`}
            style={{ width: getCanvasWidth(), minHeight: '600px' }}
            onDrop={handleCanvasDrop}
            onDragOver={handleCanvasDragOver}
          >
            {/* Form Header */}
            <div className="p-8 border-b border-gray-200">
              <input
                type="text"
                value={formSchema.title}
                onChange={(e) => setFormSchema({ ...formSchema, title: e.target.value })}
                className="text-3xl font-bold text-gray-900 w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                placeholder="Form Title"
              />
              {formSchema.description && (
                <textarea
                  value={formSchema.description}
                  onChange={(e) => setFormSchema({ ...formSchema, description: e.target.value })}
                  className="mt-2 text-gray-600 w-full border-none outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
                  placeholder="Form Description"
                  rows={2}
                />
              )}
            </div>

            {/* Form Fields */}
            <div className="p-8 space-y-4">
              {fields.length === 0 ? (
                <div className="drop-zone-active py-16">
                  <p>Drag and drop fields here to start building your form</p>
                </div>
              ) : (
                fields.map((field, index) => (
                  <DraggableField
                    key={field.id}
                    field={field}
                    index={index}
                    isSelected={selectedFieldId === field.id && selectedType === 'field'}
                    isDragging={draggedFieldIndex === index}
                    onSelect={() => handleFieldClick(field.id)}
                    onDelete={() => handleDeleteField(field.id)}
                    onDuplicate={() => handleDuplicateField(field.id)}
                    onDragStart={handleFieldDragStartReorder(index)}
                    onDragEnd={handleFieldDragEnd}
                    onDragOver={handleFieldDragOver(index)}
                    onDrop={handleFieldDrop(index)}
                  >
                    {/* Field Label */}
                    <label
                      className="block mb-2"
                      style={{
                        fontFamily: field.style.fontFamily,
                        fontSize: field.style.fontSize,
                        fontWeight: '500',
                        color: field.style.color,
                      }}
                    >
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>

                    {/* Field Input */}
                    {field.type === 'textarea' ? (
                      <textarea
                        placeholder={field.placeholder}
                        className="w-full"
                        rows={4}
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: field.style.fontWeight,
                          lineHeight: field.style.lineHeight,
                          color: field.style.color,
                          backgroundColor: field.style.backgroundColor,
                          borderWidth: field.style.borderWidth,
                          borderStyle: field.style.borderStyle,
                          borderColor: field.style.borderColor,
                          borderRadius: field.style.borderRadius,
                          padding: `${field.style.paddingTop} ${field.style.paddingRight} ${field.style.paddingBottom} ${field.style.paddingLeft}`,
                          boxShadow: field.style.boxShadow,
                          transition: field.style.transition,
                        }}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        className="w-full"
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: field.style.fontWeight,
                          color: field.style.color,
                          backgroundColor: field.style.backgroundColor,
                          borderWidth: field.style.borderWidth,
                          borderStyle: field.style.borderStyle,
                          borderColor: field.style.borderColor,
                          borderRadius: field.style.borderRadius,
                          padding: `${field.style.paddingTop} ${field.style.paddingRight} ${field.style.paddingBottom} ${field.style.paddingLeft}`,
                          boxShadow: field.style.boxShadow,
                        }}
                      >
                        <option>Select an option</option>
                        {field.options?.map((opt, i) => (
                          <option key={i}>{opt}</option>
                        ))}
                      </select>
                    ) : field.type === 'radio' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="radio"
                              name={field.id}
                              value={opt}
                              style={{
                                accentColor: field.style.color,
                              }}
                            />
                            <span style={{
                              fontFamily: field.style.fontFamily,
                              fontSize: field.style.fontSize,
                              color: field.style.color,
                            }}>
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : field.type === 'checkbox' ? (
                      <div className="space-y-2">
                        {(field.options || []).map((opt, i) => (
                          <label key={i} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              value={opt}
                              style={{
                                accentColor: field.style.color,
                              }}
                            />
                            <span style={{
                              fontFamily: field.style.fontFamily,
                              fontSize: field.style.fontSize,
                              color: field.style.color,
                            }}>
                              {opt}
                            </span>
                          </label>
                        ))}
                      </div>
                    ) : (
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full"
                        style={{
                          fontFamily: field.style.fontFamily,
                          fontSize: field.style.fontSize,
                          fontWeight: field.style.fontWeight,
                          lineHeight: field.style.lineHeight,
                          color: field.style.color,
                          backgroundColor: field.style.backgroundColor,
                          borderWidth: field.style.borderWidth,
                          borderStyle: field.style.borderStyle,
                          borderColor: field.style.borderColor,
                          borderRadius: field.style.borderRadius,
                          padding: `${field.style.paddingTop} ${field.style.paddingRight} ${field.style.paddingBottom} ${field.style.paddingLeft}`,
                          boxShadow: field.style.boxShadow,
                          transition: field.style.transition,
                        }}
                      />
                    )}
                  </DraggableField>
                ))
              )}

              {/* CTA Button */}
              {ctaButton && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <CTAButton
                    button={ctaButton}
                    isSelected={selectedType === 'cta'}
                    onClick={() => {
                      setSelectedFieldId(null);
                      setSelectedType('cta');
                    }}
                  />
                  {selectedType === 'cta' && (
                    <button
                      onClick={handleRemoveCTA}
                      className="mt-2 text-sm text-red-600 hover:text-red-700"
                    >
                      Remove CTA Button
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Tabbed Panel */}
        {selectedType === 'field' && selectedField ? (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('properties')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'properties'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setActiveTab('styles')}
                className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'styles'
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                Styles
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {activeTab === 'properties' ? (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Field Properties
                  </h3>
                  <FieldPropertiesPanel
                    field={selectedField}
                    onFieldUpdate={handleFieldUpdate}
                    onDelete={() => handleDeleteField(selectedField.id)}
                    onDuplicate={() => handleDuplicateField(selectedField.id)}
                  />
                </div>
              ) : (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">
                    Field Styles
                  </h3>
                  <StylePanel
                    selectedFieldStyle={selectedField.style}
                    onStyleChange={handleStyleChange}
                    selectedFieldLabel={selectedField.label}
                  />
                </div>
              )}
            </div>
          </div>
        ) : selectedType === 'cta' && ctaButton ? (
          <div className="w-80 bg-white border-l border-gray-200 flex flex-col h-full overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">CTA Button Settings</h2>
            </div>
            <CTAStylePanel
              button={ctaButton}
              onStyleChange={handleCTAStyleChange}
            />
          </div>
        ) : (
          <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                </svg>
              </div>
              <p className="text-sm text-gray-500">
                Click on a field or CTA button to edit its properties
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CanvasFormEditor;
