import React, { useState } from 'react';
import { Check } from 'lucide-react';
import Button from './ui/Button';


/**
 * Question Checkboxes Component
 * Renders AI questions as interactive checkboxes
 */

interface Question {
    id: string;
    label: string;
    default: boolean;
}

interface QuestionCheckboxesProps {
    questions: Question[];
    onSubmit: (selectedIds: string[]) => void;
    onBack?: () => void;
    isLoading?: boolean;
}

const QuestionCheckboxes: React.FC<QuestionCheckboxesProps> = ({
    questions,
    onSubmit,
    onBack,
    isLoading = false,
}) => {
    // Initialize with default selections
    const [selectedIds, setSelectedIds] = useState<string[]>(() => {
        return questions.filter(q => q.default).map(q => q.id);
    });

    const handleToggle = (questionId: string) => {
        setSelectedIds(prev => {
            if (prev.includes(questionId)) {
                return prev.filter(id => id !== questionId);
            } else {
                return [...prev, questionId];
            }
        });
    };

    const handleSelectAll = () => {
        setSelectedIds(questions.map(q => q.id));
    };

    const handleDeselectAll = () => {
        setSelectedIds([]);
    };

    const handleSubmit = () => {
        if (selectedIds.length === 0) {
            alert('Please select at least one option');
            return;
        }
        onSubmit(selectedIds);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-text-primary">
                    Select the features you need:
                </h3>
                <div className="flex gap-2">
                    <button
                        onClick={handleSelectAll}
                        className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
                    >
                        Select All
                    </button>
                    <span className="text-text-muted">|</span>
                    <button
                        onClick={handleDeselectAll}
                        className="text-sm text-primary-600 hover:text-primary-500 transition-colors"
                    >
                        Deselect All
                    </button>
                </div>
            </div>

            {/* Questions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {questions.map((question) => {
                    const isSelected = selectedIds.includes(question.id);

                    return (
                        <div
                            key={question.id}
                            onClick={() => handleToggle(question.id)}
                            className={`
                relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                ${isSelected
                                    ? 'border-primary-600 bg-primary-600/10'
                                    : 'border-dark-border bg-dark-card hover:border-primary-600/50'
                                }
              `}
                        >
                            {/* Checkbox */}
                            <div className="flex items-start gap-3">
                                <div
                                    className={`
                    flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all
                    ${isSelected
                                            ? 'border-primary-600 bg-primary-600'
                                            : 'border-dark-border bg-dark-bg'
                                        }
                  `}
                                >
                                    {isSelected && <Check className="w-4 h-4 text-white" />}
                                </div>

                                {/* Label */}
                                <label className="flex-1 text-text-primary font-medium cursor-pointer select-none">
                                    {question.label}
                                </label>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Selection Count */}
            <div className="text-sm text-text-secondary">
                {selectedIds.length} of {questions.length} selected
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end pt-4 border-t border-dark-border">
                {onBack && (
                    <Button
                        variant="secondary"
                        onClick={onBack}
                        disabled={isLoading}
                    >
                        Back
                    </Button>
                )}
                <Button
                    variant="primary"
                    onClick={handleSubmit}
                    disabled={isLoading || selectedIds.length === 0}
                    className="min-w-[150px]"
                >
                    {isLoading ? 'Processing...' : 'Next'}
                </Button>
            </div>
        </div>
    );
};

export default QuestionCheckboxes;
