import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import RadioGroup from './ui/RadioGroup';
import CheckboxGroup from './ui/CheckboxGroup';

/**
 * Single Question Component
 * Displays ONE question at a time with appropriate input type
 */

export interface QuestionData {
    id: string;
    label: string;
    type: 'radio' | 'checkbox' | 'text';
    options?: string[];
    allow_multiple?: boolean;
}

interface SingleQuestionProps {
    question: QuestionData;
    questionNumber: number;
    onAnswer: (questionId: string, answer: string | string[]) => void;
    onBack?: () => void;
    isLoading?: boolean;
}

const SingleQuestion: React.FC<SingleQuestionProps> = ({
    question,
    questionNumber,
    onAnswer,
    onBack,
    isLoading = false
}) => {
    const [answer, setAnswer] = useState<string | string[]>(
        question.type === 'checkbox' ? [] : ''
    );

    const handleSubmit = () => {
        // Validation
        if (question.type === 'checkbox' && (answer as string[]).length === 0) {
            return;
        }
        if (question.type !== 'checkbox' && !answer) {
            return;
        }

        onAnswer(question.id, answer);
    };

    const isValid = question.type === 'checkbox'
        ? (answer as string[]).length > 0
        : !!answer;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Question Number */}
            <div className="text-primary-600 font-semibold text-lg mb-4">
                Q{questionNumber}
            </div>

            {/* Question Label */}
            <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-8">
                {question.label}
            </h2>

            {/* Answer Input */}
            <div className="mb-8">
                {question.type === 'radio' && question.options && (
                    <RadioGroup
                        options={question.options}
                        value={answer as string}
                        onChange={setAnswer}
                        disabled={isLoading}
                    />
                )}

                {question.type === 'checkbox' && question.options && (
                    <CheckboxGroup
                        options={question.options}
                        value={answer as string[]}
                        onChange={setAnswer}
                        disabled={isLoading}
                    />
                )}

                {question.type === 'text' && (
                    <textarea
                        value={answer as string}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        disabled={isLoading}
                        className="w-full h-32 px-4 py-3 bg-dark-bg border-2 border-dark-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
                    />
                )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
                {onBack && (
                    <button
                        onClick={onBack}
                        disabled={isLoading}
                        className="px-6 py-3 text-text-secondary hover:text-text-primary transition-colors disabled:opacity-50"
                    >
                        ← Back
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !isValid}
                    className="ml-auto px-8 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                        </>
                    ) : (
                        <span>Next →</span>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SingleQuestion;
