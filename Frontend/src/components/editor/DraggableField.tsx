/**
 * Draggable Field Wrapper Component
 * Wraps each form field with drag-and-drop functionality and Canva-like resize handles
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GripVertical, Trash2, Copy } from 'lucide-react';
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
  onResize?: (width: string, height?: string) => void;
  children: React.ReactNode;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'nw' | 'ne' | 'sw' | 'se';

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
  onResize,
  children,
}) => {
  const [isHovering, setIsHovering] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Handle resize start
  const handleResizeStart = useCallback((direction: ResizeDirection) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    startPosRef.current = {
      x: clientX,
      y: clientY,
      width: rect.width,
      height: rect.height,
    };
    
    setResizeDirection(direction);
    setIsResizing(true);
  }, []);

  // Handle resize move
  useEffect(() => {
    if (!isResizing || !resizeDirection) return;

    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
      
      const deltaX = clientX - startPosRef.current.x;
      const deltaY = clientY - startPosRef.current.y;
      
      let newWidth = startPosRef.current.width;
      let newHeight = startPosRef.current.height;
      
      // Calculate new dimensions based on resize direction
      if (resizeDirection.includes('e')) {
        newWidth = Math.max(100, startPosRef.current.width + deltaX);
      }
      if (resizeDirection.includes('w')) {
        newWidth = Math.max(100, startPosRef.current.width - deltaX);
      }
      if (resizeDirection.includes('s')) {
        newHeight = Math.max(40, startPosRef.current.height + deltaY);
      }
      if (resizeDirection.includes('n')) {
        newHeight = Math.max(40, startPosRef.current.height - deltaY);
      }
      
      // For corner handles, maintain aspect ratio when Shift is NOT pressed
      // (reverse of typical - corners default to proportional)
      if (['nw', 'ne', 'sw', 'se'].includes(resizeDirection)) {
        const aspectRatio = startPosRef.current.width / startPosRef.current.height;
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          newHeight = newWidth / aspectRatio;
        } else {
          newWidth = newHeight * aspectRatio;
        }
      }
      
      // Apply the width directly for visual feedback
      containerRef.current.style.width = `${newWidth}px`;
      if (resizeDirection.includes('n') || resizeDirection.includes('s')) {
        containerRef.current.style.minHeight = `${newHeight}px`;
      }
    };

    const handleEnd = () => {
      if (containerRef.current && onResize) {
        const rect = containerRef.current.getBoundingClientRect();
        // Convert to percentage of parent for responsive behavior
        const parentWidth = containerRef.current.parentElement?.clientWidth || rect.width;
        const widthPercent = Math.round((rect.width / parentWidth) * 100);
        onResize(`${widthPercent}%`);
      }
      setIsResizing(false);
      setResizeDirection(null);
    };

    // Add event listeners
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);
    document.addEventListener('touchmove', handleMove);
    document.addEventListener('touchend', handleEnd);

    return () => {
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleMove);
      document.removeEventListener('touchend', handleEnd);
    };
  }, [isResizing, resizeDirection, onResize]);

  return (
    <div
      ref={containerRef}
      draggable={!isResizing}
      onDragStart={(e) => {
        if (isResizing) {
          e.preventDefault();
          return;
        }
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
        ${isSelected ? 'selected-field' : ''}
        ${isDragging ? 'opacity-40 scale-98' : 'opacity-100 scale-100'}
        ${isHovering ? 'border-t-2 border-blue-500' : ''}
        ${isResizing ? 'cursor-grabbing' : ''}
      `}
      style={{
        marginBottom: field.style.marginBottom,
        width: field.width || '100%',
      }}
    >
      {/* Selection Bounding Box - Canva Style */}
      {isSelected && (
        <div className="absolute inset-0 pointer-events-none border-2 border-blue-500 rounded-md z-10" />
      )}

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

      {/* Resize Handles - Only show when selected */}
      {isSelected && (
        <>
          {/* Corner Handles */}
          <div 
            className="resize-handle resize-handle-nw"
            onMouseDown={handleResizeStart('nw')}
            onTouchStart={handleResizeStart('nw')}
          />
          <div 
            className="resize-handle resize-handle-ne"
            onMouseDown={handleResizeStart('ne')}
            onTouchStart={handleResizeStart('ne')}
          />
          <div 
            className="resize-handle resize-handle-sw"
            onMouseDown={handleResizeStart('sw')}
            onTouchStart={handleResizeStart('sw')}
          />
          <div 
            className="resize-handle resize-handle-se"
            onMouseDown={handleResizeStart('se')}
            onTouchStart={handleResizeStart('se')}
          />
          
          {/* Side Handles */}
          <div 
            className="resize-handle resize-handle-n"
            onMouseDown={handleResizeStart('n')}
            onTouchStart={handleResizeStart('n')}
          />
          <div 
            className="resize-handle resize-handle-s"
            onMouseDown={handleResizeStart('s')}
            onTouchStart={handleResizeStart('s')}
          />
          <div 
            className="resize-handle resize-handle-w"
            onMouseDown={handleResizeStart('w')}
            onTouchStart={handleResizeStart('w')}
          />
          <div 
            className="resize-handle resize-handle-e"
            onMouseDown={handleResizeStart('e')}
            onTouchStart={handleResizeStart('e')}
          />
        </>
      )}

      {/* Action Buttons (shown on selection) */}
      {isSelected && (
        <div className="absolute -top-10 right-0 flex items-center gap-1 bg-white border border-gray-200 rounded-lg shadow-lg p-1 z-20">
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
