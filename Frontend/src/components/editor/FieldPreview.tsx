import React from 'react';
import { FormField } from '../../api/formBuilder';
import { Star } from 'lucide-react';

/**
 * Field Preview Component
 * Renders a preview of a form field based on its type
 */

interface FieldPreviewProps {
    field: FormField;
}

const FieldPreview: React.FC<FieldPreviewProps> = ({ field }) => {
    const baseInputClass = "w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-text-primary placeholder-text-muted";

    const renderField = () => {
        switch (field.type) {
            case 'text':
            case 'email':
            case 'tel':
            case 'url':
            case 'number':
                return (
                    <input
                        type={field.type}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className={baseInputClass}
                        disabled
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className={`${baseInputClass} min-h-[100px] resize-none`}
                        disabled
                    />
                );

            case 'select':
                return (
                    <select className={baseInputClass} disabled>
                        <option>{field.placeholder || 'Select an option'}</option>
                        {field.options?.map((option, idx) => (
                            <option key={idx}>{option}</option>
                        ))}
                    </select>
                );

            case 'radio':
                return (
                    <div className="space-y-2">
                        {(field.options || ['Option 1', 'Option 2']).map((option, idx) => (
                            <label key={idx} className="flex items-center gap-2">
                                <input
                                    type="radio"
                                    name={field.id}
                                    className="w-4 h-4 text-primary-600"
                                    disabled
                                />
                                <span className="text-sm text-text-primary">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'checkbox':
                return (
                    <div className="space-y-2">
                        {(field.options || ['Option 1', 'Option 2']).map((option, idx) => (
                            <label key={idx} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 text-primary-600 rounded"
                                    disabled
                                />
                                <span className="text-sm text-text-primary">{option}</span>
                            </label>
                        ))}
                    </div>
                );

            case 'file':
                return (
                    <div className="border-2 border-dashed border-dark-border rounded-lg p-6 text-center">
                        <p className="text-sm text-text-muted">
                            {field.placeholder || 'Click to upload or drag and drop'}
                        </p>
                        {field.accept && (
                            <p className="text-xs text-text-muted mt-1">
                                Accepted: {field.accept.join(', ')}
                            </p>
                        )}
                    </div>
                );

            case 'date':
                return (
                    <input
                        type="date"
                        className={baseInputClass}
                        disabled
                    />
                );

            case 'rating':
                return (
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className="w-6 h-6 text-yellow-500 fill-yellow-500"
                            />
                        ))}
                    </div>
                );

            default:
                return (
                    <input
                        type="text"
                        placeholder={field.placeholder}
                        className={baseInputClass}
                        disabled
                    />
                );
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-primary">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <span className="text-xs text-text-muted capitalize">{field.type}</span>
            </div>
            {renderField()}
        </div>
    );
};

export default FieldPreview;
