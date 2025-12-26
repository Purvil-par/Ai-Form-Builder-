/**
 * Global Styles Panel Component
 * Manage global theme settings for the entire form
 */

import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { Palette, X } from 'lucide-react';
import type { GlobalStyles } from '../../types/editorTypes';

interface GlobalStylesPanelProps {
  globalStyles: GlobalStyles;
  onStylesChange: (styles: Partial<GlobalStyles>) => void;
  onApplyToAll: () => void;
  onClose: () => void;
}

const GlobalStylesPanel: React.FC<GlobalStylesPanelProps> = ({
  globalStyles,
  onStylesChange,
  onApplyToAll,
  onClose,
}) => {
  const [showColorPicker, setShowColorPicker] = React.useState<string | null>(null);

  const ColorPickerPopup: React.FC<{ 
    color: string; 
    onChange: (color: string) => void; 
    label: string;
    title: string;
  }> = ({ color, onChange, label, title }) => (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-700 mb-1">{title}</label>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setShowColorPicker(showColorPicker === label ? null : label)}
          className="color-swatch"
          style={{ backgroundColor: color }}
        />
        <input
          type="text"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="style-input flex-1 font-mono text-xs"
          placeholder="#000000"
        />
      </div>
      {showColorPicker === label && (
        <div className="absolute z-50 mt-2">
          <div className="fixed inset-0" onClick={() => setShowColorPicker(null)} />
          <div className="relative bg-white p-3 rounded-lg shadow-xl border border-gray-200">
            <HexColorPicker color={color} onChange={onChange} />
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Palette className="text-purple-600" size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Global Styles</h2>
              <p className="text-sm text-gray-500">Set default styles for your form</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Color Palette */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Color Palette</h3>
            <div className="grid grid-cols-2 gap-4">
              <ColorPickerPopup
                color={globalStyles.primaryColor}
                onChange={(color) => onStylesChange({ primaryColor: color })}
                label="primary"
                title="Primary Color"
              />
              <ColorPickerPopup
                color={globalStyles.secondaryColor}
                onChange={(color) => onStylesChange({ secondaryColor: color })}
                label="secondary"
                title="Secondary Color"
              />
              <ColorPickerPopup
                color={globalStyles.textColor}
                onChange={(color) => onStylesChange({ textColor: color })}
                label="text"
                title="Text Color"
              />
              <ColorPickerPopup
                color={globalStyles.backgroundColor}
                onChange={(color) => onStylesChange({ backgroundColor: color })}
                label="background"
                title="Background Color"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Typography</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Font Family
                </label>
                <select
                  value={globalStyles.fontFamily}
                  onChange={(e) => onStylesChange({ fontFamily: e.target.value })}
                  className="style-input"
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Lato', sans-serif">Lato</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="Georgia, serif">Georgia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Font Size
                </label>
                <input
                  type="text"
                  value={globalStyles.fontSize}
                  onChange={(e) => onStylesChange({ fontSize: e.target.value })}
                  className="style-input"
                  placeholder="14px"
                />
              </div>
            </div>
          </div>

          {/* Spacing & Borders */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Spacing & Borders</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Spacing
                </label>
                <input
                  type="text"
                  value={globalStyles.defaultSpacing}
                  onChange={(e) => onStylesChange({ defaultSpacing: e.target.value })}
                  className="style-input"
                  placeholder="16px"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Default Border Radius
                </label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={parseInt(globalStyles.defaultBorderRadius)}
                    onChange={(e) => onStylesChange({ defaultBorderRadius: `${e.target.value}px` })}
                    className="style-slider flex-1"
                  />
                  <input
                    type="text"
                    value={globalStyles.defaultBorderRadius}
                    onChange={(e) => onStylesChange({ defaultBorderRadius: e.target.value })}
                    className="style-input w-20 text-center"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-4">Preview</h3>
            <div className="space-y-3">
              <div>
                <label 
                  className="block mb-2"
                  style={{ 
                    fontFamily: globalStyles.fontFamily,
                    fontSize: globalStyles.fontSize,
                    color: globalStyles.textColor,
                  }}
                >
                  Sample Input Field
                </label>
                <input
                  type="text"
                  placeholder="Preview of your styles..."
                  className="w-full"
                  style={{
                    fontFamily: globalStyles.fontFamily,
                    fontSize: globalStyles.fontSize,
                    color: globalStyles.textColor,
                    backgroundColor: globalStyles.backgroundColor,
                    borderRadius: globalStyles.defaultBorderRadius,
                    padding: globalStyles.defaultSpacing,
                    border: `1px solid ${globalStyles.primaryColor}`,
                  }}
                />
              </div>
              <button
                className="w-full py-3 rounded-lg font-medium transition-colors"
                style={{
                  backgroundColor: globalStyles.primaryColor,
                  color: '#ffffff',
                  borderRadius: globalStyles.defaultBorderRadius,
                }}
              >
                Sample Button
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onApplyToAll();
              onClose();
            }}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Apply to All Fields
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalStylesPanel;
