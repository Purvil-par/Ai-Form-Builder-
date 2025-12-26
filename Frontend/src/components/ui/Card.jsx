import React from 'react';

/**
 * Reusable Card Component
 * Features hover lift effect with shadow and smooth transitions
 */
const Card = ({
    children,
    onClick,
    className = '',
    hoverable = true,
    ...props
}) => {
    const baseStyles = 'bg-dark-card border border-dark-border rounded-2xl p-6 transition-all duration-300';
    const hoverStyles = hoverable && onClick
        ? 'hover:shadow-neon-glow hover:-translate-y-2 cursor-pointer hover:border-primary-600/50'
        : 'shadow-lg';

    return (
        <div
            className={`${baseStyles} ${hoverStyles} ${className}`}
            onClick={onClick}
            {...props}
        >
            {children}
        </div>
    );
};

export default Card;
