import React from 'react';
import { MessageCircle, Sparkles, Palette } from 'lucide-react';
import SectionWrapper from '../ui/SectionWrapper';

/**
 * How It Works Section Component - Canva Style
 * Clean 3-step process with simple numbered icons
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
        <SectionWrapper background="white">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                    How It Works
                </h2>
                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
                    Create professional forms in three simple steps
                </p>
            </div>

            {/* Steps Container */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 max-w-5xl mx-auto">
                {steps.map((step) => {
                    const Icon = step.icon;

                    return (
                        <div key={step.number} className="text-center">
                            {/* Icon with Number */}
                            <div className="flex justify-center mb-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-2xl bg-accent-purple flex items-center justify-center">
                                        <Icon className="w-10 h-10 text-primary-500" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center shadow-md">
                                        {step.number}
                                    </div>
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl md:text-2xl font-bold text-text-primary mb-3">
                                {step.title}
                            </h3>

                            {/* Description */}
                            <p className="text-base text-text-secondary leading-relaxed">
                                {step.description}
                            </p>
                        </div>
                    );
                })}
            </div>
        </SectionWrapper>
    );
};

export default HowItWorksSection;
