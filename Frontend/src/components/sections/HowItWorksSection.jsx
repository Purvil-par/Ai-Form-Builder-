import React from 'react';
import { MessageCircle, Sparkles, Palette } from 'lucide-react';
import SectionWrapper from '../ui/SectionWrapper';

/**
 * How It Works Section Component
 * 3-step process visualization
 */
const HowItWorksSection = () => {
    const steps = [
        {
            number: 1,
            icon: MessageCircle,
            title: 'Describe Your Form',
            description: 'Tell us what kind of form you need in plain English',
        },
        {
            number: 2,
            icon: Sparkles,
            title: 'AI Generates Structure',
            description: 'Our AI creates a complete form with smart questions',
        },
        {
            number: 3,
            icon: Palette,
            title: 'Customize & Share',
            description: 'Fine-tune the design and share with your audience',
        },
    ];

    return (
        <SectionWrapper background="dark">
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                    How It Works
                </h2>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Create professional forms in three simple steps
                </p>
            </div>

            {/* Steps Container */}
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
                {steps.map((step, index) => {
                    const Icon = step.icon;

                    return (
                        <React.Fragment key={step.number}>
                            {/* Step Card */}
                            <div className="flex-1 max-w-sm">
                                <div className="text-center">
                                    {/* Step Number Badge */}
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary-600 to-secondary-500 text-white text-2xl font-bold mb-6 shadow-neon-glow">
                                        {step.number}
                                    </div>

                                    {/* Icon */}
                                    <div className="flex justify-center mb-4">
                                        <div className="w-20 h-20 rounded-2xl bg-dark-card border border-dark-border shadow-lg flex items-center justify-center group hover:scale-110 transition-transform duration-300">
                                            <Icon className="w-10 h-10 text-primary-600" />
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-2xl font-bold text-text-primary mb-3">
                                        {step.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-text-secondary">
                                        {step.description}
                                    </p>
                                </div>
                            </div>

                            {/* Arrow (hidden on mobile, shown on desktop between steps) */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block">
                                    <svg
                                        className="w-12 h-12 text-primary-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                                        />
                                    </svg>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </SectionWrapper>
    );
};

export default HowItWorksSection;
