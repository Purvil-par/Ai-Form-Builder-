import React from 'react';
import { Zap, Brain, Palette, Smartphone, Lock, BarChart } from 'lucide-react';
import Card from '../ui/Card';
import SectionWrapper from '../ui/SectionWrapper';

/**
 * Benefits Section Component
 * Displays 6 key value propositions
 */
const BenefitsSection = () => {
    const benefits = [
        {
            icon: Zap,
            title: 'Generate Forms in Seconds',
            description: 'Create complex forms instantly with AI-powered generation',
            gradient: 'from-yellow-400 to-orange-500',
        },
        {
            icon: Brain,
            title: 'AI-Powered Smart Questions',
            description: 'Intelligent question suggestions based on your form type',
            gradient: 'from-purple-400 to-pink-500',
        },
        {
            icon: Palette,
            title: 'Fully Customizable UI',
            description: 'Tailor every aspect to match your brand identity',
            gradient: 'from-blue-400 to-cyan-500',
        },
        {
            icon: Smartphone,
            title: 'Mobile-Friendly Forms',
            description: 'Perfect experience on any device, any screen size',
            gradient: 'from-green-400 to-emerald-500',
        },
        {
            icon: Lock,
            title: 'Secure & Privacy-First',
            description: 'Enterprise-grade security for your sensitive data',
            gradient: 'from-red-400 to-rose-500',
        },
        {
            icon: BarChart,
            title: 'Easy Response Management',
            description: 'Analyze and export responses with powerful tools',
            gradient: 'from-indigo-400 to-purple-500',
        },
    ];

    return (
        <SectionWrapper background="darker">
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                    Why Choose AI Form Builder?
                </h2>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Everything you need to create, manage, and analyze forms
                </p>
            </div>

            {/* Benefits Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {benefits.map((benefit, index) => {
                    const Icon = benefit.icon;

                    return (
                        <Card
                            key={index}
                            hoverable={false}
                            className="text-center group hover:shadow-neon-glow transition-all duration-300"
                        >
                            {/* Icon with Gradient Background */}
                            <div className="flex justify-center mb-6">
                                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${benefit.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                    <Icon className="w-8 h-8 text-white" />
                                </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-xl font-bold text-text-primary mb-3">
                                {benefit.title}
                            </h3>

                            {/* Description */}
                            <p className="text-text-secondary">
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
