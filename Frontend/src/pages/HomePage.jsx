import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import FormCardsSection from '../components/sections/FormCardsSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import BenefitsSection from '../components/sections/BenefitsSection';
import CTASection from '../components/sections/CTASection';

/**
 * Home Page Component
 * Main landing page with all sections
 */
function HomePage() {
    return (
        <div className="min-h-screen">
            <HeroSection />
            <FormCardsSection />
            <HowItWorksSection />
            <BenefitsSection />
            <CTASection />
        </div>
    );
}

export default HomePage;
