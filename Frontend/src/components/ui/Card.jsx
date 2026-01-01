import React from 'react';

/**
 * Reusable Card Component - Canva Style
 * Clean white cards with subtle shadows and gentle interactions
 */
const Card = ({
    children,
    onClick,
    className = '',
    hoverable = true,
    ...props
}) => {
    const baseStyles = 'bg-white border border-border rounded-xl p-6 transition-all duration-250';
    const hoverStyles = hoverable && onClick
        ? 'hover:shadow-card-hover hover:-translate-y-1 cursor-pointer hover:border-primary-300'
        : 'shadow-card';

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
