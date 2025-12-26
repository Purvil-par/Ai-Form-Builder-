import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Zap, LogIn } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../ui/Button';

/**
 * Hero Section Component
 * Features gradient background, animated headline, and dual CTAs
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
        <section className="relative min-h-screen flex items-center justify-center bg-dark-bg overflow-hidden">
            {/* Animated Background Elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-600 opacity-20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary-500 opacity-20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Top Right Auth Buttons */}
            {!isAuthenticated && (
                <div className="absolute top-6 right-6 z-20 flex items-center gap-3">
                    <Button
                        variant="ghost"
                        onClick={handleLogin}
                        className="text-text-primary hover:text-primary-600"
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
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                {/* Icon Badge */}
                <div className="inline-flex items-center gap-2 bg-primary-600/10 backdrop-blur-sm px-4 py-2 rounded-full mb-8 animate-fade-in border border-primary-600/30">
                    <Sparkles className="w-5 h-5 text-secondary-500" />
                    <span className="text-text-primary font-medium">AI-Powered Form Generation</span>
                </div>

                {/* Headline */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary mb-6 animate-fade-in leading-tight">
                    Build Smart Forms
                    <br />
                    <span className="bg-gradient-to-r from-primary-600 to-secondary-500 bg-clip-text text-transparent">
                        Instantly with AI
                    </span>
                </h1>

                {/* Sub-headline */}
                <p className="text-xl md:text-2xl text-text-secondary mb-12 max-w-3xl mx-auto animate-slide-up">
                    Create professional forms in seconds using AI — no coding required.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-slide-up">
                    <Button
                        variant="primary"
                        className="min-w-[200px]"
                        onClick={handleCreateForm}
                    >
                        <div className="flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            <span>{isAuthenticated ? 'Create Form with AI' : 'Get Started Free'}</span>
                        </div>
                    </Button>

                    {!isAuthenticated && (
                        <Button
                            variant="outline"
                            className="min-w-[200px]"
                            onClick={handleLogin}
                        >
                            Sign In
                        </Button>
                    )}
                </div>

                {/* Abstract AI Graphic Placeholder */}
                <div className="mt-16 animate-fade-in">
                    <div className="relative max-w-4xl mx-auto">
                        <div className="bg-dark-card/50 backdrop-blur-md rounded-3xl p-8 border border-primary-600/20 shadow-neon-glow">
                            <div className="grid grid-cols-3 gap-4">
                                {[...Array(6)].map((_, i) => (
                                    <div
                                        key={i}
                                        className="h-4 bg-gradient-to-r from-primary-600/30 to-secondary-500/30 rounded animate-pulse"
                                        style={{ animationDelay: `${i * 100}ms` }}
                                    ></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
