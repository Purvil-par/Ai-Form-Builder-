import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

/**
 * Hero Section Component - Canva Style
 * Clean, simple, and professional hero with clear value proposition
 */
const HeroSection = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    const handleCreateForm = () => {
        if (isAuthenticated) {
            navigate('/ai-form-builder');
        } else {
            navigate('/signup');
        }
    };

    const handleLogin = () => {
        navigate('/login');
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center bg-white overflow-hidden">
            {/* Subtle Background Accent */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-gradient-to-br from-accent-purple to-transparent opacity-30 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-accent-blue to-transparent opacity-20 blur-3xl"></div>
            </div>

            {/* Top Right Auth Buttons */}
            {!isAuthenticated && (
                <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleLogin}
                        className="text-text-secondary hover:text-text-primary"
                    >
                        <div className="flex items-center gap-2">
                            <LogIn className="w-4 h-4" />
                            <span>Login</span>
                        </div>
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => navigate('/signup')}
                    >
                        Sign Up
                    </Button>
                </div>
            )}

            {isAuthenticated && (
                <div className="absolute top-6 right-6 z-20">
                    <Button
                        variant="primary"
                        onClick={() => navigate('/dashboard')}
                    >
                        Go to Dashboard
                    </Button>
                </div>
            )}

            {/* Content */}
            <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 bg-accent-purple px-4 py-2 rounded-full mb-8 animate-fade-in">
                    <Sparkles className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-medium text-text-primary">AI-Powered Form Builder</span>
                </div>

                {/* Headline */}
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 animate-fade-in leading-tight">
                    Create Beautiful Forms
                    <br />
                    <span className="text-primary-500">with AI — In Minutes</span>
                </h1>

                {/* Sub-headline */}
                <p className="text-lg sm:text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto animate-slide-up">
                    Build professional forms effortlessly using AI. No coding required, just describe what you need.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up mb-16">
                    <Button
                        variant="primary"
                        className="min-w-[200px] text-base sm:text-lg px-8 py-4"
                        onClick={handleCreateForm}
                    >
                        <div className="flex items-center gap-2">
                            <span>{isAuthenticated ? 'Create Form with AI' : 'Get Started Free'}</span>
                            <ArrowRight className="w-5 h-5" />
                        </div>
                    </Button>

                    {!isAuthenticated && (
                        <Button
                            variant="outline"
                            className="min-w-[200px] text-base sm:text-lg px-8 py-4"
                            onClick={handleLogin}
                        >
                            Sign In
                        </Button>
                    )}
                </div>

                {/* Simple Visual Element */}
                {/* <div className="mt-12 animate-fade-in">
                    <div className="relative max-w-4xl mx-auto">
                        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-border shadow-lg">
                            <div className="space-y-4">
                                <div className="h-3 bg-gradient-to-r from-primary-200 to-primary-100 rounded-full w-3/4"></div>
                                <div className="h-3 bg-gradient-to-r from-secondary-200 to-secondary-100 rounded-full w-1/2"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                    <div className="h-12 bg-bg-secondary rounded-lg"></div>
                                    <div className="h-12 bg-bg-secondary rounded-lg"></div>
                                </div>
                                <div className="h-24 bg-bg-secondary rounded-lg"></div>
                                <div className="flex justify-end">
                                    <div className="h-10 w-32 bg-primary-500 rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}
            </div>
        </section>
    );
};

export default HeroSection;
