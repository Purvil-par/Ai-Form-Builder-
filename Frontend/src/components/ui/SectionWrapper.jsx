import React from 'react';

/**
 * Section Wrapper Component - Canva Style
 * Provides consistent padding and max-width for sections with clean backgrounds
 */
const SectionWrapper = ({
    children,
    className = '',
    background = 'white',
    ...props
}) => {
    const backgrounds = {
        white: 'bg-white',
        light: 'bg-bg-secondary',
        accent: 'bg-accent-purple',
        blue: 'bg-accent-blue',
    };

    return (
        <section
            className={`py-16 md:py-20 lg:py-24 ${backgrounds[background]} ${className}`}
            {...props}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </section>
    );
};

export default SectionWrapper;
