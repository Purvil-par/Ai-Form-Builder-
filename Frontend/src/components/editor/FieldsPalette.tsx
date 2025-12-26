/**
 * Fields Palette - Left Sidebar
 * Draggable field types for the canvas
 */

import React from 'react';
import { 
  Type, Mail, Phone, Hash, AlignLeft, ChevronDown, 
  CheckSquare, Circle, Calendar, Clock, Upload, Link as LinkIcon
} from 'lucide-react';

interface FieldType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  category: 'input' | 'selection' | 'other';
}

const FIELD_TYPES: FieldType[] = [
  { id: 'text', type: 'text', label: 'Text Input', icon: <Type size={18} />, category: 'input' },
  { id: 'email', type: 'email', label: 'Email', icon: <Mail size={18} />, category: 'input' },
  { id: 'tel', type: 'tel', label: 'Phone', icon: <Phone size={18} />, category: 'input' },
  { id: 'number', type: 'number', label: 'Number', icon: <Hash size={18} />, category: 'input' },
  { id: 'textarea', type: 'textarea', label: 'Text Area', icon: <AlignLeft size={18} />, category: 'input' },
  { id: 'url', type: 'url', label: 'URL', icon: <LinkIcon size={18} />, category: 'input' },
  { id: 'select', type: 'select', label: 'Dropdown', icon: <ChevronDown size={18} />, category: 'selection' },
  { id: 'checkbox', type: 'checkbox', label: 'Checkbox', icon: <CheckSquare size={18} />, category: 'selection' },
  { id: 'radio', type: 'radio', label: 'Radio Button', icon: <Circle size={18} />, category: 'selection' },
  { id: 'date', type: 'date', label: 'Date', icon: <Calendar size={18} />, category: 'other' },
  { id: 'time', type: 'time', label: 'Time', icon: <Clock size={18} />, category: 'other' },
  { id: 'file', type: 'file', label: 'File Upload', icon: <Upload size={18} />, category: 'other' },
];

interface FieldsPaletteProps {
  onFieldDragStart: (fieldType: string) => void;
  fieldCount: number;
}

const FieldsPalette: React.FC<FieldsPaletteProps> = ({ onFieldDragStart, fieldCount }) => {
  const groupedFields = {
    input: FIELD_TYPES.filter(f => f.category === 'input'),
    selection: FIELD_TYPES.filter(f => f.category === 'selection'),
    other: FIELD_TYPES.filter(f => f.category === 'other'),
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Add Fields</h2>
        <p className="text-sm text-gray-500 mt-1">
          {fieldCount} field{fieldCount !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Field Types */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
        {/* Input Fields */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Input Fields
          </h3>
          <div className="space-y-2">
            {groupedFields.input.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => onFieldDragStart(field.type)}
                className="field-palette-item"
              >
                <div className="text-blue-600">{field.icon}</div>
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Selection Fields */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Selection Fields
          </h3>
          <div className="space-y-2">
            {groupedFields.selection.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => onFieldDragStart(field.type)}
                className="field-palette-item"
              >
                <div className="text-purple-600">{field.icon}</div>
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Other Fields */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Other Fields
          </h3>
          <div className="space-y-2">
            {groupedFields.other.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => onFieldDragStart(field.type)}
                className="field-palette-item"
              >
                <div className="text-green-600">{field.icon}</div>
                <span className="text-sm font-medium text-gray-700">{field.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="p-4 bg-blue-50 border-t border-blue-100">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> Drag and drop fields onto the canvas to add them to your form
        </p>
      </div>
    </div>
  );
};

export default FieldsPalette;
