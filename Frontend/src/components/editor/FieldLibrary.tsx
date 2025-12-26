import React from 'react';
import {
    Type,
    Mail,
    Phone,
    Hash,
    AlignLeft,
    ChevronDown,
    Circle,
    CheckSquare,
    Upload,
    Calendar,
    Star
} from 'lucide-react';

/**
 * Field Library Component
 * Displays all available field types that can be added to the form
 */

const FIELD_TYPES = [
    { type: 'text', label: 'Text Input', icon: Type },
    { type: 'email', label: 'Email', icon: Mail },
    { type: 'tel', label: 'Phone', icon: Phone },
    { type: 'number', label: 'Number', icon: Hash },
    { type: 'textarea', label: 'Text Area', icon: AlignLeft },
    { type: 'select', label: 'Dropdown', icon: ChevronDown },
    { type: 'radio', label: 'Radio Buttons', icon: Circle },
    { type: 'checkbox', label: 'Checkboxes', icon: CheckSquare },
    { type: 'file', label: 'File Upload', icon: Upload },
    { type: 'date', label: 'Date Picker', icon: Calendar },
    { type: 'rating', label: 'Star Rating', icon: Star },
];

interface FieldLibraryProps {
    onAddField: (type: string) => void;
}

const FieldLibrary: React.FC<FieldLibraryProps> = ({ onAddField }) => {
    return (
        <div className="h-full flex flex-col">
            <h3 className="font-semibold text-text-primary mb-4 px-2">Add Fields</h3>
            <div className="space-y-2 overflow-y-auto flex-1">
                {FIELD_TYPES.map((field) => {
                    const Icon = field.icon;
                    return (
                        <button
                            key={field.type}
                            onClick={() => onAddField(field.type)}
                            className="w-full flex items-center gap-3 p-3 bg-dark-bg hover:bg-dark-bg/80 border border-dark-border hover:border-primary-600/50 rounded-lg transition-all text-left group"
                        >
                            <div className="w-8 h-8 rounded-lg bg-primary-600/10 flex items-center justify-center group-hover:bg-primary-600/20 transition-colors">
                                <Icon className="w-4 h-4 text-primary-600" />
                            </div>
                            <span className="text-sm text-text-primary">{field.label}</span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default FieldLibrary;
