import React, { useState } from 'react';
import { Save, Download, Sparkles, X } from 'lucide-react';
import { FormSchema, FormField } from '../api/formBuilder';
import FieldLibrary from './editor/FieldLibrary';
import FormBuilderCanvas from './editor/FormBuilderCanvas';
import FieldPropertiesPanel from './editor/FieldPropertiesPanel';

/**
 * Visual Form Editor Component
 * Main Canva-style editor with 3-panel layout
 */

interface VisualFormEditorProps {
    initialSchema: FormSchema;
    onSave?: (schema: FormSchema) => void;
    onExport?: (schema: FormSchema) => void;
    onClose?: () => void;
}

const VisualFormEditor: React.FC<VisualFormEditorProps> = ({
    initialSchema,
    onSave,
    onExport,
    onClose,
}) => {
    const [formSchema, setFormSchema] = useState<FormSchema>(initialSchema);
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
    const [showFieldLibrary, setShowFieldLibrary] = useState(false);

    // Get selected field
    const selectedField = selectedFieldId
        ? formSchema.fields.find((f) => f.id === selectedFieldId)
        : null;

    // Add new field
    const handleAddField = (type: string) => {
        const newField: FormField = {
            id: `field_${Date.now()}`,
            type: type as any,
            label: `New ${type.charAt(0).toUpperCase() + type.slice(1)} Field`,
            required: false,
            placeholder: '',
        };

        // Add default options for select/radio/checkbox
        if (['select', 'radio', 'checkbox'].includes(type)) {
            newField.options = ['Option 1', 'Option 2', 'Option 3'];
        }

        setFormSchema({
            ...formSchema,
            fields: [...formSchema.fields, newField],
        });

        // Select the new field
        setSelectedFieldId(newField.id);
        setShowFieldLibrary(false);
    };

    // Update field
    const handleUpdateField = (id: string, updates: Partial<FormField>) => {
        setFormSchema({
            ...formSchema,
            fields: formSchema.fields.map((f) =>
                f.id === id ? { ...f, ...updates } : f
            ),
        });
    };

    // Delete field
    const handleDeleteField = (id: string) => {
        setFormSchema({
            ...formSchema,
            fields: formSchema.fields.filter((f) => f.id !== id),
        });
        if (selectedFieldId === id) {
            setSelectedFieldId(null);
        }
    };

    // Reorder fields
    const handleReorderFields = (fields: FormField[]) => {
        setFormSchema({
            ...formSchema,
            fields,
        });
    };

    // Update form metadata
    const handleUpdateFormMeta = (updates: Partial<FormSchema>) => {
        setFormSchema({
            ...formSchema,
            ...updates,
        });
    };

    // Export as JSON
    const handleExportJSON = () => {
        const dataStr = JSON.stringify(formSchema, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formSchema.title.toLowerCase().replace(/\s+/g, '-')}-schema.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col">
            {/* Top Bar */}
            <div className="bg-dark-card border-b border-dark-border px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold text-text-primary">Form Editor</h2>
                    <div className="flex items-center gap-2">
                        <input
                            type="text"
                            value={formSchema.title}
                            onChange={(e) => handleUpdateFormMeta({ title: e.target.value })}
                            className="px-3 py-1.5 bg-dark-bg border border-dark-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary-600"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handleExportJSON}
                        className="px-4 py-2 bg-dark-bg hover:bg-dark-bg/80 text-text-primary rounded-lg transition-colors flex items-center gap-2 border border-dark-border"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export JSON</span>
                    </button>

                    {onSave && (
                        <button
                            onClick={() => onSave(formSchema)}
                            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Save Form</span>
                        </button>
                    )}

                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-dark-bg rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-text-muted" />
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Sidebar - Field Library */}
                <div className="w-64 bg-dark-card border-r border-dark-border p-4 overflow-y-auto">
                    <FieldLibrary onAddField={handleAddField} />
                </div>

                {/* Center - Form Canvas */}
                <div className="flex-1 overflow-y-auto p-8 bg-dark-bg">
                    <FormBuilderCanvas
                        schema={formSchema}
                        selectedFieldId={selectedFieldId}
                        onSelectField={setSelectedFieldId}
                        onDeleteField={handleDeleteField}
                        onReorderFields={handleReorderFields}
                        onAddFieldClick={() => setShowFieldLibrary(!showFieldLibrary)}
                    />
                </div>

                {/* Right Sidebar - Properties Panel */}
                {selectedField ? (
                    <div className="w-80">
                        <FieldPropertiesPanel
                            field={selectedField}
                            onUpdate={handleUpdateField}
                            onClose={() => setSelectedFieldId(null)}
                        />
                    </div>
                ) : (
                    <div className="w-80 bg-dark-card border-l border-dark-border p-4">
                        <h3 className="font-semibold text-text-primary mb-4">Form Settings</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Form Title
                                </label>
                                <input
                                    type="text"
                                    value={formSchema.title}
                                    onChange={(e) => handleUpdateFormMeta({ title: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-text-primary mb-2">
                                    Description
                                </label>
                                <textarea
                                    value={formSchema.description || ''}
                                    onChange={(e) => handleUpdateFormMeta({ description: e.target.value })}
                                    className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-primary-600 min-h-[100px]"
                                    placeholder="Optional form description..."
                                />
                            </div>
                            <div className="pt-4 border-t border-dark-border">
                                <p className="text-sm text-text-muted">
                                    Click on a field to edit its properties
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Bar */}
            <div className="bg-dark-card border-t border-dark-border px-6 py-3 flex items-center justify-between text-sm text-text-muted">
                <div className="flex items-center gap-6">
                    <span>{formSchema.fields.length} fields</span>
                    <span>{formSchema.fields.filter(f => f.required).length} required</span>
                </div>
                <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-secondary-500" />
                    <span>AI-Generated Form</span>
                </div>
            </div>
        </div>
    );
};

export default VisualFormEditor;
