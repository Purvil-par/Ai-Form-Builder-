/**
 * Field Properties Panel
 * Edit field-specific properties like label, placeholder, required, validation
 */

import React, { useState } from 'react';
import { Eye, EyeOff, Trash2, Copy } from 'lucide-react';
import type { FormFieldData } from '../../types/editorTypes';

interface FieldPropertiesPanelProps {
  field: FormFieldData;
  onFieldUpdate: (updates: Partial<FormFieldData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

const FieldPropertiesPanel: React.FC<FieldPropertiesPanelProps> = ({
  field,
  onFieldUpdate,
  onDelete,
  onDuplicate,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="space-y-4">
      {/* Field Label */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Field Label <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={field.label}
          onChange={(e) => onFieldUpdate({ label: e.target.value })}
          className="style-input"
          placeholder="Enter field label"
        />
      </div>

      {/* Placeholder */}
      {!['checkbox', 'radio', 'file'].includes(field.type) && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Placeholder Text
          </label>
          <input
            type="text"
            value={field.placeholder || ''}
            onChange={(e) => onFieldUpdate({ placeholder: e.target.value })}
            className="style-input"
            placeholder="Enter placeholder"
          />
        </div>
      )}

      {/* Required Toggle */}
      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div>
          <label className="text-sm font-medium text-gray-700">Required Field</label>
          <p className="text-xs text-gray-500">User must fill this field</p>
        </div>
        <button
          onClick={() => onFieldUpdate({ required: !field.required })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            field.required ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              field.required ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Field Width */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Field Width</label>
        <div className="flex gap-2 items-center">
          <input
            type="range"
            min="25"
            max="100"
            step="5"
            value={parseInt(field.width) || 100}
            onChange={(e) => onFieldUpdate({ width: `${e.target.value}%` })}
            className="style-slider flex-1"
          />
          <input
            type="text"
            value={field.width || '100%'}
            onChange={(e) => onFieldUpdate({ width: e.target.value })}
            className="style-input w-16 text-center text-sm"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Resize the field width</p>
      </div>

      {/* Type-Specific Options */}
      {(field.type === 'select' || field.type === 'radio' || field.type === 'checkbox') && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-medium text-gray-700">
              Options
            </label>
            <button
              onClick={() => {
                const currentOptions = field.options || [];
                onFieldUpdate({ options: [...currentOptions, `Option ${currentOptions.length + 1}`] });
              }}
              className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              <span className="text-lg leading-none">+</span> Add Option
            </button>
          </div>
          
          <div className="space-y-2">
            {(field.options || []).map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                  Option {index + 1}
                </span>
                <input
                  type="text"
                  value={option}
                  onChange={(e) => {
                    const newOptions = [...(field.options || [])];
                    newOptions[index] = e.target.value;
                    onFieldUpdate({ options: newOptions });
                  }}
                  className="style-input flex-1"
                  placeholder={`Enter option ${index + 1}`}
                />
                <button
                  onClick={() => {
                    const newOptions = (field.options || []).filter((_, i) => i !== index);
                    onFieldUpdate({ options: newOptions.length > 0 ? newOptions : ['Option 1'] });
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete option"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          
          {(!field.options || field.options.length === 0) && (
            <p className="text-xs text-gray-500 mt-2 italic">
              Click "Add Option" to create options for this field
            </p>
          )}
        </div>
      )}

      {/* Number Fields */}
      {field.type === 'number' && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Min Value</label>
            <input
              type="number"
              value={field.min ?? ''}
              onChange={(e) => onFieldUpdate({ min: e.target.value ? Number(e.target.value) : undefined })}
              className="style-input"
              placeholder="No limit"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Max Value</label>
            <input
              type="number"
              value={field.max ?? ''}
              onChange={(e) => onFieldUpdate({ max: e.target.value ? Number(e.target.value) : undefined })}
              className="style-input"
              placeholder="No limit"
            />
          </div>
        </div>
      )}

      {/* File Upload */}
      {field.type === 'file' && (
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Accepted File Types
          </label>
          <input
            type="text"
            value={(field.accept || []).join(', ')}
            onChange={(e) => onFieldUpdate({ accept: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
            className="style-input"
            placeholder=".pdf, .doc, .jpg"
          />
          <p className="text-xs text-gray-500 mt-1">Separate with commas</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-4 border-t border-gray-200 space-y-2">
        <button
          onClick={onDuplicate}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Copy size={16} />
          Duplicate Field
        </button>
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
        >
          <Trash2 size={16} />
          Delete Field
        </button>
      </div>
    </div>
  );
};

export default FieldPropertiesPanel;
