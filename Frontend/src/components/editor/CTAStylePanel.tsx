/**
 * CTA Button Style Panel
 * Customization controls for CTA button
 */

import React from 'react';
import { HexColorPicker } from 'react-colorful';
import type { CTAButtonData } from './CTAButton';

interface CTAStylePanelProps {
  button: CTAButtonData;
  onStyleChange: (changes: Partial<CTAButtonData>) => void;
}

const CTAStylePanel: React.FC<CTAStylePanelProps> = ({ button, onStyleChange }) => {
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
    <div className="space-y-4 p-4">
      <h3 className="text-sm font-semibold text-gray-900">CTA Button Settings</h3>

      {/* Button Text */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Button Text</label>
        <input
          type="text"
          value={button.text}
          onChange={(e) => onStyleChange({ text: e.target.value })}
          className="style-input"
          placeholder="Submit"
        />
      </div>

      {/* Colors */}
      <div className="space-y-3">
        <ColorPickerPopup
          color={button.style.backgroundColor}
          onChange={(color) => onStyleChange({ style: { ...button.style, backgroundColor: color } })}
          label="bg"
          title="Background Color"
        />
        <ColorPickerPopup
          color={button.style.textColor}
          onChange={(color) => onStyleChange({ style: { ...button.style, textColor: color } })}
          label="text"
          title="Text Color"
        />
        <ColorPickerPopup
          color={button.style.hoverBackgroundColor || button.style.backgroundColor}
          onChange={(color) => onStyleChange({ style: { ...button.style, hoverBackgroundColor: color } })}
          label="hover"
          title="Hover Color"
        />
      </div>

      {/* Font Size */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Font Size</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="12"
            max="24"
            value={parseInt(button.style.fontSize)}
            onChange={(e) => onStyleChange({ style: { ...button.style, fontSize: `${e.target.value}px` } })}
            className="style-slider flex-1"
          />
          <input
            type="text"
            value={button.style.fontSize}
            onChange={(e) => onStyleChange({ style: { ...button.style, fontSize: e.target.value } })}
            className="style-input w-16 text-center"
          />
        </div>
      </div>

      {/* Font Weight */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Font Weight</label>
        <select
          value={button.style.fontWeight}
          onChange={(e) => onStyleChange({ style: { ...button.style, fontWeight: e.target.value } })}
          className="style-input"
          style={{ color: '#1f2937' }}
        >
          <option value="400">Regular (400)</option>
          <option value="500">Medium (500)</option>
          <option value="600">Semibold (600)</option>
          <option value="700">Bold (700)</option>
        </select>
      </div>

      {/* Border Radius */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Border Radius</label>
        <div className="flex gap-2">
          <input
            type="range"
            min="0"
            max="50"
            value={parseInt(button.style.borderRadius)}
            onChange={(e) => onStyleChange({ style: { ...button.style, borderRadius: `${e.target.value}px` } })}
            className="style-slider flex-1"
          />
          <input
            type="text"
            value={button.style.borderRadius}
            onChange={(e) => onStyleChange({ style: { ...button.style, borderRadius: e.target.value } })}
            className="style-input w-16 text-center"
          />
        </div>
      </div>

      {/* Width */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Width</label>
        <select
          value={button.style.width}
          onChange={(e) => onStyleChange({ style: { ...button.style, width: e.target.value } })}
          className="style-input"
          style={{ color: '#1f2937' }}
        >
          <option value="auto">Auto</option>
          <option value="100%">Full Width</option>
          <option value="50%">Half Width</option>
          <option value="200px">200px</option>
          <option value="300px">300px</option>
        </select>
      </div>

      {/* Padding */}
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-2">Padding</label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={button.style.paddingTop}
            onChange={(e) => onStyleChange({ style: { ...button.style, paddingTop: e.target.value } })}
            className="style-input text-center"
            placeholder="Top"
          />
          <input
            type="text"
            value={button.style.paddingRight}
            onChange={(e) => onStyleChange({ style: { ...button.style, paddingRight: e.target.value } })}
            className="style-input text-center"
            placeholder="Right"
          />
          <input
            type="text"
            value={button.style.paddingBottom}
            onChange={(e) => onStyleChange({ style: { ...button.style, paddingBottom: e.target.value } })}
            className="style-input text-center"
            placeholder="Bottom"
          />
          <input
            type="text"
            value={button.style.paddingLeft}
            onChange={(e) => onStyleChange({ style: { ...button.style, paddingLeft: e.target.value } })}
            className="style-input text-center"
            placeholder="Left"
          />
        </div>
      </div>
    </div>
  );
};

export default CTAStylePanel;
