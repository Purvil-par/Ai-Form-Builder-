/**
 * Description Panel - Jodit Rich Text Editor for Form Description
 * Allows users to edit form description with rich text formatting
 */

import React, { useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';
import { X } from 'lucide-react';

interface DescriptionPanelProps {
  description: string;
  onChange: (content: string) => void;
  onClose: () => void;
}

const DescriptionPanel: React.FC<DescriptionPanelProps> = ({
  description,
  onChange,
  onClose,
}) => {
  const editor = useRef(null);

  // Jodit configuration with full toolbar
  const config = useMemo(
    () => ({
      readonly: false,
      placeholder: 'Enter form description with rich text formatting...',
      minHeight: 400,
      maxHeight: 600,
      toolbar: true,
      spellcheck: true,
      language: 'en',
      toolbarButtonSize: 'middle' as const,
      toolbarAdaptive: false,
      showCharsCounter: true,
      showWordsCounter: true,
      showXPathInStatusbar: false,
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html' as const,
      buttons: [
        'source',
        '|',
        'bold',
        'italic',
        'underline',
        'strikethrough',
        '|',
        'ul',
        'ol',
        '|',
        'outdent',
        'indent',
        '|',
        'font',
        'fontsize',
        'brush',
        'paragraph',
        '|',
        'image',
        'link',
        'table',
        '|',
        'align',
        'undo',
        'redo',
        '|',
        'hr',
        'eraser',
        'copyformat',
        '|',
        'symbol',
        'fullsize',
        'print',
      ],
      uploader: {
        insertImageAsBase64URI: true, // Insert images as base64
      },
      removeButtons: ['about'], // Remove about button
    }),
    []
  );

  return (
    <div className="w-96 bg-white border-l border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900">Form Description</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close"
        >
          <X size={20} className="text-gray-600" />
        </button>
      </div>

      {/* Jodit Editor */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-3">
          <p className="text-sm text-gray-600 mb-2">
            Add a rich text description to your form. You can format text, add links, images, and more.
          </p>
        </div>
        
        <JoditEditor
          ref={editor}
          value={description || ''}
          config={config}
          onBlur={(newContent) => onChange(newContent)} // Update on blur
          onChange={(newContent) => {}} // Controlled component
        />

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800">
            <strong>💡 Tip:</strong> Your description will be displayed at the top of the form. 
            Use formatting to make it clear and engaging for your users.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DescriptionPanel;
