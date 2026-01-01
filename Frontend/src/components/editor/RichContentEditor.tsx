/**
 * Rich Content Editor Component
 * Jodit Editor integration for adding rich content below forms
 */

import React, { useRef, useMemo } from 'react';
import JoditEditor from 'jodit-react';

interface RichContentEditorProps {
  content: string;
  onChange: (content: string) => void;
  isReadOnly?: boolean;
}

const RichContentEditor: React.FC<RichContentEditorProps> = ({
  content,
  onChange,
  isReadOnly = false,
}) => {
  const editor = useRef(null);

  // Full Jodit Editor configuration with complete 3-row toolbar
  const config = useMemo(
    () => ({
      readonly: isReadOnly,
      toolbar: !isReadOnly,
      showCharsCounter: false,
      showWordsCounter: false,
      showXPathInStatusbar: false,
      height: 400,
      minHeight: 300,
      placeholder: isReadOnly ? '' : 'Add additional content below your form (text, images, links, etc.)',
      
      // Use default full toolbar (3 rows with all features)
      // This gives the complete Jodit experience as shown in image 2
      
      // Image upload configuration with compression
      uploader: {
        insertImageAsBase64URI: true,
        imagesExtensions: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
        
        // Process images before insert to compress them
        process: async (resp: any) => {
          return {
            files: resp.files || [],
            path: resp.path || '',
            baseurl: resp.baseurl || '',
            error: resp.error,
            msg: resp.msg
          };
        },
      },
      
      // Image resize and quality settings
      imageDefaultWidth: 800, // Max width
      resizeMaxWidth: 800,
      resizeMaxHeight: 800,
      
      // File browser
      filebrowser: {
        ajax: {
          url: ''
        }
      },
      
      // Styling
      style: {
        background: '#ffffff',
        color: '#1f2937',
      },
      
      // Events
      events: {
        change: (newContent: string) => {
          if (!isReadOnly) {
            console.log('📝 Jodit content changed, length:', newContent.length);
            onChange(newContent);
          }
        },
        afterInsertImage: (img: HTMLImageElement) => {
          if (!isReadOnly && editor.current) {
            console.log('🖼️ Image inserted:', img.src.substring(0, 50) + '...');
            // Trigger change event after image insert
            // @ts-ignore - Jodit editor ref typing issue
            const currentContent = editor.current.value || '';
            onChange(currentContent);
          }
        },
      },
      
      // Toolbar settings
      toolbarAdaptive: true,
      toolbarSticky: true,
      toolbarButtonSize: 'middle' as const,
      
      // Enable all features
      allowHTML: true,
      allowResizeX: false,
      allowResizeY: true,
      
      // Sanitize options
      sanitize: {
        allowTags: true,
        allowAttributes: true,
      },
      
      // Additional features
      askBeforePasteHTML: false,
      askBeforePasteFromWord: false,
      defaultActionOnPaste: 'insert_clear_html' as const,
      
      // Link options
      link: {
        openInNewTabCheckbox: true,
      },
      
      // Image options
      image: {
        openOnDblClick: true,
        editSrc: true,
        useImageEditor: true,
      },
    }),
    [isReadOnly, onChange]
  );

  return (
    <div className={`rich-content-editor ${isReadOnly ? 'readonly' : 'editable'}`}>
      <JoditEditor
        ref={editor}
        value={content}
        config={config}
        onBlur={(newContent) => !isReadOnly && onChange(newContent)}
      />
    </div>
  );
};

export default RichContentEditor;
