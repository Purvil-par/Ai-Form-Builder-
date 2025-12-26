import React from 'react';

/**
 * Checkbox Group Component
 * Displays checkboxes for multi-choice questions
 */

interface CheckboxGroupProps {
    options: string[];
    value: string[];
    onChange: (value: string[]) => void;
    disabled?: boolean;
}

const CheckboxGroup: React.FC<CheckboxGroupProps> = ({
    options,
    value,
    onChange,
    disabled = false
}) => {
    const handleToggle = (option: string) => {
        if (value.includes(option)) {
            onChange(value.filter(v => v !== option));
        } else {
            onChange([...value, option]);
        }
    };

    return (
        <div className="space-y-3">
            {options.map((option, index) => (
                <label
                    key={index}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${value.includes(option)
                            ? 'border-primary-600 bg-primary-600/10'
                            : 'border-dark-border hover:border-primary-600/50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <input
                        type="checkbox"
                        checked={value.includes(option)}
                        onChange={() => handleToggle(option)}
                        disabled={disabled}
                        className="w-5 h-5 text-primary-600 rounded"
                    />
                    <span className="ml-3 text-text-primary">{option}</span>
                </label>
            ))}
        </div>
    );
};

export default CheckboxGroup;
