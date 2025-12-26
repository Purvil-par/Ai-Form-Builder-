import React from 'react';
import {
    FileText,
    ClipboardList,
    UserPlus,
    MessageSquare,
    GraduationCap,
    BarChart3,
    FileCheck,
    ShoppingCart,
    AlertCircle,
    Mail,
    Star
} from 'lucide-react';
import Card from '../ui/Card';
import SectionWrapper from '../ui/SectionWrapper';

/**
 * Form Cards Section Component
 * Displays 11 form type cards with icons and descriptions
 */
const FormCardsSection = () => {
    const formTypes = [
        {
            id: 'blank',
            icon: FileText,
            title: 'Blank Form',
            description: 'Describe your custom form and let AI build it',
            popular: true,
        },
        {
            id: 'application',
            icon: ClipboardList,
            title: 'Application Forms',
            description: 'Job applications, membership forms, and more',
        },
        {
            id: 'registration',
            icon: UserPlus,
            title: 'Registration Forms',
            description: 'Event registration, sign-ups, enrollments',
        },
        {
            id: 'feedback',
            icon: MessageSquare,
            title: 'Feedback Forms',
            description: 'Collect customer feedback and reviews',
        },
        {
            id: 'admission',
            icon: GraduationCap,
            title: 'Admission Forms',
            description: 'School, college, and course admissions',
        },
        {
            id: 'survey',
            icon: BarChart3,
            title: 'Survey Forms',
            description: 'Market research and opinion polls',
        },
        {
            id: 'consent',
            icon: FileCheck,
            title: 'Consent Forms',
            description: 'Legal consent and agreement forms',
        },
        {
            id: 'order',
            icon: ShoppingCart,
            title: 'Order Forms',
            description: 'Product orders and service bookings',
        },
        {
            id: 'complaint',
            icon: AlertCircle,
            title: 'Complaint Forms',
            description: 'Customer complaints and issue reporting',
        },
        {
            id: 'request',
            icon: Mail,
            title: 'Request Forms',
            description: 'Service requests and inquiries',
        },
        {
            id: 'evaluation',
            icon: Star,
            title: 'Evaluation / Assessment Forms',
            description: 'Performance reviews and assessments',
        },

    ];

    const handleCardClick = (formType) => {
        // All forms (including blank) navigate to AI builder
        window.location.href = `/builder/ai/${formType.id}`;
    };

    return (
        <SectionWrapper background="darker">
            {/* Section Header */}
            <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                    Choose Your Form Type
                </h2>
                <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Select from our pre-built templates or start with a blank canvas
                </p>
            </div>

            {/* Form Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {formTypes.map((formType) => {
                    const Icon = formType.icon;

                    return (
                        <Card
                            key={formType.id}
                            onClick={() => handleCardClick(formType)}
                            className="relative group"
                        >
                            {/* Popular Badge */}
                            {formType.popular && (
                                <div className="absolute -top-3 -right-3 bg-gradient-to-r from-primary-600 to-secondary-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-neon-pink">
                                    Most Used
                                </div>
                            )}

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 group-hover:scale-110 ${formType.popular
                                ? 'bg-gradient-to-br from-primary-500 to-secondary-500'
                                : 'bg-dark-bg border border-dark-border'
                                }`}>
                                <Icon className={`w-7 h-7 ${formType.popular ? 'text-white' : 'text-primary-600'}`} />
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-text-primary mb-2 group-hover:text-secondary-500 transition-colors">
                                {formType.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-text-muted">
                                {formType.description}
                            </p>
                        </Card>
                    );
                })}
            </div>
        </SectionWrapper>
    );
};

export default FormCardsSection;
