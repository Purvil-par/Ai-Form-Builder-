import React from 'react';
import { FileText, Download, Edit } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';


/**
 * Form Preview Component
 * Displays the final generated form schema
 */

interface FormField {
    id: string;
    type: string;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: string;
    options?: string[];
    accept?: string[];
    min?: number;
    max?: number;
}

interface FormSchema {
    title: string;
    description?: string;
    fields: FormField[];
}

interface FormPreviewProps {
    formSchema: FormSchema;
    onEdit?: () => void;
    onExport?: () => void;
    onBuild?: () => void;
}

const FormPreview: React.FC<FormPreviewProps> = ({
    formSchema,
    onEdit,
    onExport,
    onBuild,
}) => {
    const getFieldTypeIcon = (type: string) => {
        const icons: Record<string, string> = {
            text: '📝',
            email: '📧',
            tel: '📞',
            number: '🔢',
            select: '📋',
            checkbox: '☑️',
            radio: '🔘',
            textarea: '📄',
            file: '📎',
            date: '📅',
            time: '⏰',
            url: '🔗',
        };
        return icons[type] || '📝';
    };

    const getFieldTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            text: 'Text Input',
            email: 'Email',
            tel: 'Phone Number',
            number: 'Number',
            select: 'Dropdown',
            checkbox: 'Checkbox',
            radio: 'Radio Buttons',
            textarea: 'Text Area',
            file: 'File Upload',
            date: 'Date Picker',
            time: 'Time Picker',
            url: 'URL',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 mb-4">
                    <FileText className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-text-primary">
                    {formSchema.title}
                </h2>
                {formSchema.description && (
                    <p className="text-text-secondary max-w-2xl mx-auto">
                        {formSchema.description}
                    </p>
                )}
            </div>

            {/* Form Fields */}
            <Card className="p-6" hoverable={false}>
                <h3 className="text-xl font-semibold text-text-primary mb-6">
                    Form Fields ({formSchema.fields.length})
                </h3>

                <div className="space-y-4">
                    {formSchema.fields.map((field, index) => (
                        <div
                            key={field.id}
                            className="p-4 rounded-lg bg-dark-bg border border-dark-border hover:border-primary-600/50 transition-colors"
                        >
                            <div className="flex items-start gap-4">
                                {/* Field Number */}
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600/20 flex items-center justify-center text-primary-600 font-semibold">
                                    {index + 1}
                                </div>

                                {/* Field Details */}
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-2xl">{getFieldTypeIcon(field.type)}</span>
                                        <h4 className="text-lg font-semibold text-text-primary">
                                            {field.label}
                                            {field.required && (
                                                <span className="text-secondary-500 ml-1">*</span>
                                            )}
                                        </h4>
                                    </div>

                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2 py-1 rounded-md bg-primary-600/20 text-primary-600 text-xs font-medium">
                                            {getFieldTypeLabel(field.type)}
                                        </span>
                                        {field.required && (
                                            <span className="px-2 py-1 rounded-md bg-secondary-500/20 text-secondary-500 text-xs font-medium">
                                                Required
                                            </span>
                                        )}
                                        {field.validation && (
                                            <span className="px-2 py-1 rounded-md bg-primary-600/20 text-primary-600 text-xs font-medium">
                                                Validation: {field.validation}
                                            </span>
                                        )}
                                    </div>

                                    {field.placeholder && (
                                        <p className="text-sm text-text-muted">
                                            Placeholder: "{field.placeholder}"
                                        </p>
                                    )}

                                    {field.options && field.options.length > 0 && (
                                        <div className="text-sm text-text-secondary">
                                            Options: {field.options.join(', ')}
                                        </div>
                                    )}

                                    {field.accept && field.accept.length > 0 && (
                                        <div className="text-sm text-text-secondary">
                                            Accepted files: {field.accept.join(', ')}
                                        </div>
                                    )}

                                    {(field.min !== undefined || field.max !== undefined) && (
                                        <div className="text-sm text-text-secondary">
                                            {field.min !== undefined && `Min: ${field.min}`}
                                            {field.min !== undefined && field.max !== undefined && ' | '}
                                            {field.max !== undefined && `Max: ${field.max}`}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {onEdit && (
                    <Button
                        variant="secondary"
                        onClick={onEdit}
                        className="min-w-[180px]"
                    >
                        <div className="flex items-center gap-2">
                            <Edit className="w-5 h-5" />
                            <span>Edit Form</span>
                        </div>
                    </Button>
                )}
                {onExport && (
                    <Button
                        variant="outline"
                        onClick={onExport}
                        className="min-w-[180px]"
                    >
                        <div className="flex items-center gap-2">
                            <Download className="w-5 h-5" />
                            <span>Export JSON</span>
                        </div>
                    </Button>
                )}
                {onBuild && (
                    <Button
                        variant="primary"
                        onClick={onBuild}
                        className="min-w-[180px]"
                    >
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5" />
                            <span>Open in Builder</span>
                        </div>
                    </Button>
                )}
            </div>
        </div>
    );
};

export default FormPreview;
