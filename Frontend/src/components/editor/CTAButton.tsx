/**
 * CTA Button Component
 * Customizable Call-to-Action button for forms
 */

import React from 'react';
import type { FieldStyle } from '../../types/editorTypes';

export interface CTAButtonData {
  id: string;
  text: string;
  style: {
    backgroundColor: string;
    textColor: string;
    fontSize: string;
    fontWeight: string;
    borderRadius: string;
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    width: string;
    hoverBackgroundColor?: string;
  };
  order: number;
}

interface CTAButtonProps {
  button: CTAButtonData;
  isSelected: boolean;
  onClick: () => void;
}

const CTAButton: React.FC<CTAButtonProps> = ({ button, isSelected, onClick }) => {
  // Provide safe defaults for style properties
  const safeStyle = {
    backgroundColor: button.style?.backgroundColor || '#3b82f6',
    textColor: button.style?.textColor || '#ffffff',
    fontSize: button.style?.fontSize || '16px',
    fontWeight: button.style?.fontWeight || '500',
    borderRadius: button.style?.borderRadius || '8px',
    paddingTop: button.style?.paddingTop || '12px',
    paddingRight: button.style?.paddingRight || '24px',
    paddingBottom: button.style?.paddingBottom || '12px',
    paddingLeft: button.style?.paddingLeft || '24px',
    width: button.style?.width || '100%',
    hoverBackgroundColor: button.style?.hoverBackgroundColor,
  };

  return (
    <div
      onClick={onClick}
      className={`
        relative cursor-pointer transition-all
        ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
      `}
    >
      <button
        type="button"
        className="transition-all duration-200 font-medium"
        style={{
          backgroundColor: safeStyle.backgroundColor,
          color: safeStyle.textColor,
          fontSize: safeStyle.fontSize,
          fontWeight: safeStyle.fontWeight,
          borderRadius: safeStyle.borderRadius,
          padding: `${safeStyle.paddingTop} ${safeStyle.paddingRight} ${safeStyle.paddingBottom} ${safeStyle.paddingLeft}`,
          width: safeStyle.width,
          border: 'none',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          if (safeStyle.hoverBackgroundColor) {
            e.currentTarget.style.backgroundColor = safeStyle.hoverBackgroundColor;
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = safeStyle.backgroundColor;
        }}
      >
        {button.text}
      </button>
    </div>
  );
};

export default CTAButton;
