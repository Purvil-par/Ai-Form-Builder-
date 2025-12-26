import React from 'react';

/**
 * Section Wrapper Component
 * Provides consistent padding and max-width for sections
 */
const SectionWrapper = ({
    children,
    className = '',
    background = 'dark',
    ...props
}) => {
    const backgrounds = {
        dark: 'bg-dark-bg',
        darker: 'bg-dark-bg-alt',
        gradient: 'bg-gradient-to-br from-dark-bg via-dark-bg-alt to-dark-bg',
    };

    return (
        <section
            className={`py-16 md:py-24 ${backgrounds[background]} ${className}`}
            {...props}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {children}
            </div>
        </section>
    );
};

export default SectionWrapper;
