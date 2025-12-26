import React from 'react';

/**
 * Radio Group Component
 * Displays radio buttons for single-choice questions
 */

interface RadioGroupProps {
    options: string[];
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const RadioGroup: React.FC<RadioGroupProps> = ({
    options,
    value,
    onChange,
    disabled = false
}) => {
    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${value === option
                            ? 'border-primary-600 bg-primary-600/10'
                            : 'border-dark-border hover:border-primary-600/50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input
                        type="radio"
                        name="question"
                        value={option}
                        checked={value === option}
                        onChange={(e) => onChange(e.target.value)}
                        disabled={disabled}
                        className="w-5 h-5 text-primary-600"
                    />
                    <span className="ml-3 text-text-primary">{option}</span>
                </label>
            ))}
        </div>
    );
};

export default RadioGroup;
