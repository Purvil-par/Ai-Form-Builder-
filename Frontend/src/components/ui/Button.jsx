import React from 'react';

/**
 * Reusable Button Component - Canva Style
 * Clean, professional buttons with subtle interactions
 */
const Button = ({
    children,
    variant = 'primary',
    onClick,
    className = '',
    disabled = false,
    ...props
}) => {
    const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-all duration-250 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
        primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500 shadow-sm hover:shadow-md',
        secondary: 'bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-sm hover:shadow-md',
        outline: 'bg-white text-text-primary border-2 border-border-medium hover:border-primary-500 hover:text-primary-500 focus:ring-primary-500',
        ghost: 'bg-transparent text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
