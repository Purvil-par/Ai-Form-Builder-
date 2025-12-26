import React from 'react';

/**
 * Reusable Button Component
 * Supports primary, secondary, and outline variants
 */
const Button = ({
    children,
    variant = 'primary',
    onClick,
    className = '',
    ...props
}) => {
    const baseStyles = 'px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-bg';

    const variants = {
        primary: 'bg-gradient-to-r from-primary-600 to-secondary-500 text-white hover:shadow-neon-pink focus:ring-primary-600',
        secondary: 'bg-transparent text-text-primary border-2 border-primary-600 hover:bg-primary-600/10 hover:shadow-neon-purple focus:ring-primary-600',
        outline: 'bg-transparent text-text-primary border-2 border-primary-600 hover:border-secondary-500 hover:shadow-neon-pink focus:ring-secondary-500',
    };

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </button>
    );
};

export default Button;
