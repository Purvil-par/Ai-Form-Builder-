import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { FormField } from '../../api/formBuilder';
import FieldPreview from './FieldPreview';

/**
 * Sortable Field Item Component
 * Individual draggable field with preview and controls
 */

interface SortableFieldItemProps {
    field: FormField;
    isSelected: boolean;
    onSelect: () => void;
    onDelete: () => void;
}

const SortableFieldItem: React.FC<SortableFieldItemProps> = ({
    field,
    isSelected,
    onSelect,
    onDelete
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: field.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={onSelect}
            className={`p-4 bg-dark-card border-2 rounded-lg cursor-pointer transition-all ${isDragging
                    ? 'opacity-50 scale-95'
                    : isSelected
                        ? 'border-primary-600 shadow-neon-glow'
                        : 'border-dark-border hover:border-primary-600/50'
                }`}
        >
            <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-1 hover:bg-dark-bg rounded transition-colors"
                >
                    <GripVertical className="w-5 h-5 text-text-muted" />
                </div>

                {/* Field Preview */}
                <div className="flex-1 min-w-0">
                    <FieldPreview field={field} />
                </div>

                {/* Delete Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                    }}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                    title="Delete field"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

export default SortableFieldItem;
