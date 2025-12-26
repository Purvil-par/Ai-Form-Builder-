/**
 * Draggable Field Wrapper Component
 * Wraps each form field with drag-and-drop functionality
 */

import React from 'react';
import { GripVertical, Trash2, Copy, Lock, Unlock } from 'lucide-react';
import type { FormFieldData } from '../../types/editorTypes';

interface DraggableFieldProps {
  field: FormFieldData;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  children: React.ReactNode;
}

const DraggableField: React.FC<DraggableFieldProps> = ({
  field,
  index,
  isSelected,
  isDragging,
  onSelect,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
  children,
}) => {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <div
      draggable
      onDragStart={(e) => {
        onDragStart(e);
        setIsHovering(false);
        e.dataTransfer.setData('fieldReorder', 'true');
      }}
      onDragEnd={onDragEnd}
      onDragOver={(e) => {
        // Only handle if it's a field reorder, not a palette drop
        const isFieldReorder = e.dataTransfer.types.includes('fieldreorder');
        if (isFieldReorder) {
          onDragOver(e);
          setIsHovering(true);
        }
      }}
      onDragLeave={() => setIsHovering(false)}
      onDrop={(e) => {
        // Only handle if it's a field reorder
        const isFieldReorder = e.dataTransfer.types.includes('fieldreorder');
        if (isFieldReorder) {
          onDrop(e);
        }
        setIsHovering(false);
      }}
      onClick={onSelect}
      className={`
        field-wrapper relative group cursor-pointer transition-all duration-200
        ${isSelected ? 'field-selected ring-2 ring-blue-500 ring-offset-2' : ''}
        ${isDragging ? 'opacity-40 scale-98' : 'opacity-100 scale-100'}
        ${isHovering ? 'border-t-2 border-blue-500' : ''}
      `}
      style={{
        marginBottom: field.style.marginBottom,
      }}
    >
      {/* Drag Handle */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10">
        <GripVertical size={20} className="text-gray-400 hover:text-blue-600" />
      </div>

      {/* Drop Indicator - Top */}
      {isHovering && !isDragging && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-blue-500 animate-pulse" />
      )}

      {/* Field Content */}
      <div className="relative">
        {children}
      </div>

      {/* Action Buttons (shown on selection) */}
      {isSelected && (
        <div className="absolute -top-10 right-0 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            className="p-1.5 hover:bg-blue-50 rounded transition-colors"
            title="Duplicate Field"
          >
            <Copy size={14} className="text-blue-600" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1.5 hover:bg-red-50 rounded transition-colors"
            title="Delete Field"
          >
            <Trash2 size={14} className="text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
};

export default DraggableField;
