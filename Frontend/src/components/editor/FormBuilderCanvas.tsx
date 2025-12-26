import React from 'react';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { FormSchema, FormField } from '../../api/formBuilder';
import SortableFieldItem from './SortableFieldItem';

/**
 * Form Builder Canvas Component
 * Main canvas with drag-drop field reordering
 */

interface FormBuilderCanvasProps {
    schema: FormSchema;
    selectedFieldId: string | null;
    onSelectField: (id: string) => void;
    onDeleteField: (id: string) => void;
    onReorderFields: (fields: FormField[]) => void;
    onAddFieldClick: () => void;
}

const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({
    schema,
    selectedFieldId,
    onSelectField,
    onDeleteField,
    onReorderFields,
    onAddFieldClick,
}) => {
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = schema.fields.findIndex((f) => f.id === active.id);
            const newIndex = schema.fields.findIndex((f) => f.id === over.id);

            const newFields = arrayMove(schema.fields, oldIndex, newIndex);
            onReorderFields(newFields);
        }
    };

    return (
        <div className="max-w-3xl mx-auto">
            {/* Form Header */}
            <div className="mb-8 p-6 bg-dark-card border border-dark-border rounded-lg">
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    {schema.title}
                </h1>
                {schema.description && (
                    <p className="text-text-secondary">{schema.description}</p>
                )}
            </div>

            {/* Fields */}
            {schema.fields.length > 0 ? (
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={schema.fields.map((f) => f.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        <div className="space-y-4">
                            {schema.fields.map((field) => (
                                <SortableFieldItem
                                    key={field.id}
                                    field={field}
                                    isSelected={selectedFieldId === field.id}
                                    onSelect={() => onSelectField(field.id)}
                                    onDelete={() => onDeleteField(field.id)}
                                />
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            ) : (
                <div className="text-center py-12 bg-dark-card border border-dark-border rounded-lg">
                    <p className="text-text-muted mb-4">No fields yet. Add your first field!</p>
                </div>
            )}

            {/* Add Field Button */}
            <button
                onClick={onAddFieldClick}
                className="w-full mt-6 p-4 border-2 border-dashed border-dark-border hover:border-primary-600 rounded-lg text-text-muted hover:text-primary-600 transition-all flex items-center justify-center gap-2 group"
            >
                <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
                <span>Add Field</span>
            </button>
        </div>
    );
};

export default FormBuilderCanvas;
