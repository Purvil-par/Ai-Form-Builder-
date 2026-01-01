import React from 'react';
import { Zap, Brain, Palette, Smartphone, Lock, BarChart } from 'lucide-react';
import Card from '../ui/Card';
import SectionWrapper from '../ui/SectionWrapper';

/**
 * Benefits Section Component - Canva Style
 * Clean cards displaying key value propositions
 */
const BenefitsSection = () => {
    const benefits = [
        {
            icon: Zap,
            title: 'Generate Forms in Seconds',
            description: 'Create complex forms instantly with AI-powered generation',
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
        },
        {
            icon: Brain,
            title: 'AI-Powered Smart Questions',
            description: 'Intelligent question suggestions based on your form type',
            color: 'text-primary-500',
            bg: 'bg-accent-purple',
        },
        {
            icon: Palette,
            title: 'Fully Customizable UI',
            description: 'Tailor every aspect to match your brand identity',
            color: 'text-secondary-500',
            bg: 'bg-accent-blue',
        },
        {
            icon: Smartphone,
            title: 'Mobile-Friendly Forms',
            description: 'Perfect experience on any device, any screen size',
            color: 'text-green-600',
            bg: 'bg-green-50',
        },
        {
            icon: Lock,
            title: 'Secure & Privacy-First',
            description: 'Enterprise-grade security for your sensitive data',
            color: 'text-red-600',
            bg: 'bg-red-50',
        },
        {
            icon: BarChart,
            title: 'Easy Response Management',
            description: 'Analyze and export responses with powerful tools',
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
    ];

    return (
        <SectionWrapper background="light">
            {/* Section Header */}
            <div className="text-center mb-12 md:mb-16">
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-4">
                    Why Choose AI Form Builder?
                </h2>
                <p className="text-lg md:text-xl text-text-secondary max-w-2xl mx-auto">
                    Everything you need to create, manage, and analyze forms
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;

                    return (
                        <Card
                            key={index}
                            hoverable={false}
                            className="text-center"
                        >
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className={`w-14 h-14 rounded-xl ${benefit.bg} flex items-center justify-center`}>
                                    <Icon className={`w-7 h-7 ${benefit.color}`} />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg md:text-xl font-bold text-text-primary mb-3">
                                {benefit.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm md:text-base text-text-secondary leading-relaxed">
                                {benefit.description}
                            </p>
                        </Card>
                    );
                })}
            </div>
        </SectionWrapper>
    );
};

export default BenefitsSection;
