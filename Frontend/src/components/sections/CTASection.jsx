import React from 'react';
import { Rocket, Layers } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Bottom CTA Section Component - Canva Style
 * Clean, professional call-to-action with soft background
 */
const CTASection = () => {
    return (
        <section className="relative py-20 md:py-24 bg-accent-purple overflow-hidden">
            {/* Subtle Background Accent */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-primary-200 opacity-30 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-secondary-200 opacity-20 rounded-full blur-3xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Headline */}
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-text-primary mb-6">
                    Start Building Smarter Forms Today
                </h2>

                {/* Sub-headline */}
                <p className="text-lg md:text-xl text-text-secondary mb-10 max-w-2xl mx-auto">
                    Join thousands of users who are creating beautiful, intelligent forms with AI
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
                    <Button
                        variant="primary"
                        className="min-w-[220px] text-base sm:text-lg px-8 py-4"
                        onClick={() => console.log('Create Your First Form clicked')}
                    >
                        <div className="flex items-center gap-2">
                            <Rocket className="w-5 h-5" />
                            <span>Create Your First Form</span>
                        </div>
                    </Button>

                    <Button
                        variant="outline"
                        className="min-w-[220px] text-base sm:text-lg px-8 py-4"
                        onClick={() => console.log('Explore Templates clicked')}
                    >
                        <div className="flex items-center gap-2">
                            <Layers className="w-5 h-5" />
                            <span>Explore Templates</span>
                        </div>
                    </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8 text-sm md:text-base text-text-muted">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span>No credit card required</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Free forever plan</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-primary-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <span>Setup in 2 minutes</span>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;
