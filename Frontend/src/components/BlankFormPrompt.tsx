import React, { useState } from 'react';
import { Sparkles, X, Lightbulb } from 'lucide-react';

/**
 * Blank Form Prompt Component
 * Captures user's custom prompt for AI-driven form generation
 */

interface BlankFormPromptProps {
    onSubmit: (prompt: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const BlankFormPrompt: React.FC<BlankFormPromptProps> = ({ onSubmit, onCancel, isLoading = false }) => {
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');

    const examplePrompts = [
        "Create a job application form with resume upload, cover letter, and 3 professional references",
        "I need a customer feedback form with star ratings, comments section, and Net Promoter Score",
        "Build an event registration form with attendee details, meal preferences, and emergency contact",
        "Make a contact form for my website with name, email, phone, subject, and message fields"
    ];

    const handleSubmit = () => {
        const trimmedPrompt = prompt.trim();

        // Validation
        if (trimmedPrompt.length < 10) {
            setError('Please provide a more detailed description (at least 10 characters)');
            return;
        }

        setError('');
        onSubmit(trimmedPrompt);
    };

    const handleExampleClick = (example: string) => {
        setPrompt(example);
        setError('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Submit on Ctrl+Enter or Cmd+Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-dark-card border border-dark-border rounded-2xl shadow-neon-glow max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-dark-card border-b border-dark-border p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-600 to-secondary-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">Describe Your Form</h2>
                            <p className="text-sm text-text-secondary">Tell the AI what kind of form you need</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 hover:bg-dark-bg rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Textarea */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Form Description
                        </label>
                        <textarea
                            value={prompt}
                            onChange={(e) => {
                                setPrompt(e.target.value);
                                setError('');
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Example: I need a customer survey form with satisfaction ratings, multiple choice questions about our services, and an optional comments section..."
                            className="w-full h-40 px-4 py-3 bg-dark-bg border border-dark-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-600 focus:border-transparent resize-none"
                            disabled={isLoading}
                            autoFocus
                        />
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-text-muted">
                                Tip: Press <kbd className="px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-dark-bg border border-dark-border rounded text-xs">Enter</kbd> to submit
                            </p>
                            <span className={`text-xs ${prompt.length < 10 ? 'text-red-500' : 'text-text-muted'}`}>
                                {prompt.length} characters
                            </span>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 mt-2">{error}</p>
                        )}
                    </div>

                    {/* Example Prompts */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-secondary-500" />
                            <h3 className="text-sm font-medium text-text-primary">Example Prompts</h3>
                        </div>
                        <div className="grid gap-2">
                            {examplePrompts.map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(example)}
                                    disabled={isLoading}
                                    className="text-left p-3 bg-dark-bg hover:bg-dark-bg/80 border border-dark-border hover:border-primary-600/50 rounded-lg transition-all text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Helper Text */}
                    <div className="bg-primary-600/10 border border-primary-600/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-text-primary mb-2">💡 Tips for better results:</h4>
                        <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                            <li>Be specific about what information you need to collect</li>
                            <li>Mention if certain fields should be required or optional</li>
                            <li>Specify if you need file uploads, dropdowns, or special field types</li>
                            <li>Include any validation requirements (email format, phone numbers, etc.)</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-dark-card border-t border-dark-border p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-3 bg-dark-bg hover:bg-dark-bg/80 text-text-primary rounded-lg transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || prompt.trim().length < 10}
                        className="px-6 py-3 bg-gradient-to-r from-primary-600 to-secondary-500 hover:from-primary-700 hover:to-secondary-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Generate Form</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlankFormPrompt;
