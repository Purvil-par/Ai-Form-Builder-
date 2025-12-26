/**
 * Style Panel - Right Sidebar
 * Comprehensive style customization controls
 */

import React from 'react';
import { HexColorPicker } from 'react-colorful';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { FieldStyle } from '../../types/editorTypes';

interface StylePanelProps {
  selectedFieldStyle: FieldStyle | null;
  onStyleChange: (style: Partial<FieldStyle>) => void;
  selectedFieldLabel?: string;
}

const StylePanel: React.FC<StylePanelProps> = ({ 
  selectedFieldStyle, 
  onStyleChange,
  selectedFieldLabel 
}) => {
  const [expandedSections, setExpandedSections] = React.useState<Set<string>>(
    new Set(['typography', 'colors', 'spacing', 'border'])
  );
  const [showColorPicker, setShowColorPicker] = React.useState<string | null>(null);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  if (!selectedFieldStyle) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">
            Click on a field to edit its properties
          </p>
        </div>
      </div>
    );
  }

  const ColorPickerPopup: React.FC<{ color: string; onChange: (color: string) => void; label: string }> = ({ color, onChange, label }) => (
    <div className="relative">
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

  const SectionHeader: React.FC<{ title: string; id: string }> = ({ title, id }) => (
    <button
      onClick={() => toggleSection(id)}
      className="w-full flex items-center justify-between py-3 px-4 hover:bg-gray-50 transition-colors"
    >
      <span className="style-section-title">{title}</span>
      {expandedSections.has(id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
    </button>
  );

  return (
    <div className="space-y-0">
      {/* Typography Section */}
      <div className="border-b border-gray-200">
        <SectionHeader title="Typography" id="typography" />
        {expandedSections.has('typography') && (
            <div className="px-4 pb-4 space-y-3">
              {/* Font Family */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Font Family</label>
                <select
                  value={selectedFieldStyle.fontFamily}
                  onChange={(e) => onStyleChange({ fontFamily: e.target.value })}
                  className="style-input"
                  style={{ color: '#1f2937' }}
                >
                  <option value="Inter, system-ui, sans-serif">Inter</option>
                  <option value="'Roboto', sans-serif">Roboto</option>
                  <option value="'Open Sans', sans-serif">Open Sans</option>
                  <option value="'Lato', sans-serif">Lato</option>
                  <option value="'Poppins', sans-serif">Poppins</option>
                  <option value="'Montserrat', sans-serif">Montserrat</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </select>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="10"
                    max="32"
                    value={parseInt(selectedFieldStyle.fontSize)}
                    onChange={(e) => onStyleChange({ fontSize: `${e.target.value}px` })}
                    className="style-slider flex-1"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.fontSize}
                    onChange={(e) => onStyleChange({ fontSize: e.target.value })}
                    className="style-input w-16 text-center"
                  />
                </div>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
                <select
                  value={selectedFieldStyle.fontWeight}
                  onChange={(e) => onStyleChange({ fontWeight: e.target.value })}
                  className="style-input"
                  style={{ color: '#1f2937' }}
                >
                  <option value="300">Light (300)</option>
                  <option value="400">Regular (400)</option>
                  <option value="500">Medium (500)</option>
                  <option value="600">Semibold (600)</option>
                  <option value="700">Bold (700)</option>
                </select>
              </div>

              {/* Line Height */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Line Height</label>
                <input
                  type="text"
                  value={selectedFieldStyle.lineHeight}
                  onChange={(e) => onStyleChange({ lineHeight: e.target.value })}
                  className="style-input"
                  placeholder="1.5"
                />
              </div>

              {/* Text Align */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Text Align</label>
                <div className="flex gap-2">
                  {(['left', 'center', 'right'] as const).map((align) => (
                    <button
                      key={align}
                      onClick={() => onStyleChange({ textAlign: align })}
                      className={`flex-1 py-2 px-3 rounded border transition-colors ${
                        selectedFieldStyle.textAlign === align
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {align.charAt(0).toUpperCase() + align.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Colors Section */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Colors" id="colors" />
          {expandedSections.has('colors') && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Text Color</label>
                <ColorPickerPopup
                  color={selectedFieldStyle.color}
                  onChange={(color) => onStyleChange({ color })}
                  label="text"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Background Color</label>
                <ColorPickerPopup
                  color={selectedFieldStyle.backgroundColor}
                  onChange={(color) => onStyleChange({ backgroundColor: color })}
                  label="background"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Border Color</label>
                <ColorPickerPopup
                  color={selectedFieldStyle.borderColor}
                  onChange={(color) => onStyleChange({ borderColor: color })}
                  label="border"
                />
              </div>
            </div>
          )}
        </div>

        {/* Spacing Section */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Spacing" id="spacing" />
          {expandedSections.has('spacing') && (
            <div className="px-4 pb-4 space-y-3">
              {/* Padding */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Padding</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={selectedFieldStyle.paddingTop}
                    onChange={(e) => onStyleChange({ paddingTop: e.target.value })}
                    className="style-input text-center"
                    placeholder="Top"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.paddingRight}
                    onChange={(e) => onStyleChange({ paddingRight: e.target.value })}
                    className="style-input text-center"
                    placeholder="Right"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.paddingBottom}
                    onChange={(e) => onStyleChange({ paddingBottom: e.target.value })}
                    className="style-input text-center"
                    placeholder="Bottom"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.paddingLeft}
                    onChange={(e) => onStyleChange({ paddingLeft: e.target.value })}
                    className="style-input text-center"
                    placeholder="Left"
                  />
                </div>
              </div>

              {/* Margin */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">Margin</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={selectedFieldStyle.marginTop}
                    onChange={(e) => onStyleChange({ marginTop: e.target.value })}
                    className="style-input text-center"
                    placeholder="Top"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.marginRight}
                    onChange={(e) => onStyleChange({ marginRight: e.target.value })}
                    className="style-input text-center"
                    placeholder="Right"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.marginBottom}
                    onChange={(e) => onStyleChange({ marginBottom: e.target.value })}
                    className="style-input text-center"
                    placeholder="Bottom"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.marginLeft}
                    onChange={(e) => onStyleChange({ marginLeft: e.target.value })}
                    className="style-input text-center"
                    placeholder="Left"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Border Section */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Border" id="border" />
          {expandedSections.has('border') && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Border Width</label>
                <input
                  type="text"
                  value={selectedFieldStyle.borderWidth}
                  onChange={(e) => onStyleChange({ borderWidth: e.target.value })}
                  className="style-input"
                  placeholder="1px"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Border Style</label>
                <select
                  value={selectedFieldStyle.borderStyle}
                  onChange={(e) => onStyleChange({ borderStyle: e.target.value as any })}
                  className="style-input"
                  style={{ color: '#1f2937' }}
                >
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                  <option value="none">None</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={parseInt(selectedFieldStyle.borderRadius)}
                    onChange={(e) => onStyleChange({ borderRadius: `${e.target.value}px` })}
                    className="style-slider flex-1"
                  />
                  <input
                    type="text"
                    value={selectedFieldStyle.borderRadius}
                    onChange={(e) => onStyleChange({ borderRadius: e.target.value })}
                    className="style-input w-16 text-center"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Effects Section */}
        <div className="border-b border-gray-200">
          <SectionHeader title="Effects" id="effects" />
          {expandedSections.has('effects') && (
            <div className="px-4 pb-4 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Box Shadow</label>
                <select
                  value={selectedFieldStyle.boxShadow}
                  onChange={(e) => onStyleChange({ boxShadow: e.target.value })}
                  className="style-input"
                  style={{ color: '#1f2937' }}
                >
                  <option value="none">None</option>
                  <option value="0 1px 2px 0 rgba(0, 0, 0, 0.05)">Small</option>
                  <option value="0 4px 6px -1px rgba(0, 0, 0, 0.1)">Medium</option>
                  <option value="0 10px 15px -3px rgba(0, 0, 0, 0.1)">Large</option>
                  <option value="0 20px 25px -5px rgba(0, 0, 0, 0.1)">Extra Large</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
  );
};

export default StylePanel;
