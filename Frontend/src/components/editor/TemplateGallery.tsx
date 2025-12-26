/**
 * Template Gallery Component
 * Pre-designed form templates for quick start
 */

import React from 'react';
import { X, Briefcase, UserPlus, MessageSquare, ClipboardList, Mail } from 'lucide-react';
import type { FormFieldData } from '../../types/editorTypes';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  schema: {
    title: string;
    description?: string;
    fields?: Partial<FormFieldData>[];
  };
}

const TEMPLATES: Template[] = [
  {
    id: 'job-application',
    name: 'Job Application',
    description: 'Professional job application form with resume upload',
    icon: <Briefcase size={24} />,
    schema: {
      title: 'Job Application Form',
      description: 'Please fill out the form below to apply for the position.',
      fields: [
        {
          id: 'full_name',
          type: 'text',
          label: 'Full Name',
          placeholder: 'Enter your full name',
          required: true,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          placeholder: 'your.email@example.com',
          required: true,
        },
        {
          id: 'phone',
          type: 'tel',
          label: 'Phone Number',
          placeholder: '+1 (555) 000-0000',
          required: true,
        },
        {
          id: 'resume',
          type: 'file',
          label: 'Resume/CV',
          required: true,
          accept: ['.pdf', '.doc', '.docx'],
        },
        {
          id: 'cover_letter',
          type: 'textarea',
          label: 'Cover Letter',
          placeholder: 'Tell us why you\'re a great fit...',
          required: false,
        },
      ],
    },
  },
  {
    id: 'contact',
    name: 'Contact Form',
    description: 'Simple contact form for inquiries',
    icon: <Mail size={24} />,
    schema: {
      title: 'Contact Us',
      description: 'We\'d love to hear from you!',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          placeholder: 'Your name',
          required: true,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'your@email.com',
          required: true,
        },
        {
          id: 'subject',
          type: 'text',
          label: 'Subject',
          placeholder: 'What is this about?',
          required: true,
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          placeholder: 'Your message here...',
          required: true,
        },
      ],
    },
  },
  {
    id: 'registration',
    name: 'Event Registration',
    description: 'Register attendees for events',
    icon: <UserPlus size={24} />,
    schema: {
      title: 'Event Registration',
      description: 'Register for our upcoming event',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Full Name',
          required: true,
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email Address',
          required: true,
        },
        {
          id: 'ticket_type',
          type: 'select',
          label: 'Ticket Type',
          required: true,
          options: ['General Admission', 'VIP', 'Student'],
        },
        {
          id: 'dietary',
          type: 'select',
          label: 'Dietary Requirements',
          required: false,
          options: ['None', 'Vegetarian', 'Vegan', 'Gluten-Free'],
        },
      ],
    },
  },
  {
    id: 'feedback',
    name: 'Feedback Survey',
    description: 'Collect user feedback and ratings',
    icon: <MessageSquare size={24} />,
    schema: {
      title: 'Feedback Survey',
      description: 'Help us improve by sharing your thoughts',
      fields: [
        {
          id: 'rating',
          type: 'number',
          label: 'Overall Rating (1-10)',
          required: true,
          min: 1,
          max: 10,
        },
        {
          id: 'experience',
          type: 'select',
          label: 'How was your experience?',
          required: true,
          options: ['Excellent', 'Good', 'Average', 'Poor'],
        },
        {
          id: 'comments',
          type: 'textarea',
          label: 'Additional Comments',
          placeholder: 'Share your thoughts...',
          required: false,
        },
      ],
    },
  },
  {
    id: 'survey',
    name: 'General Survey',
    description: 'Multi-purpose survey template',
    icon: <ClipboardList size={24} />,
    schema: {
      title: 'Survey',
      description: 'Your opinion matters to us',
      fields: [
        {
          id: 'age_group',
          type: 'select',
          label: 'Age Group',
          required: true,
          options: ['18-24', '25-34', '35-44', '45-54', '55+'],
        },
        {
          id: 'question1',
          type: 'radio',
          label: 'Question 1',
          required: true,
          options: ['Option A', 'Option B', 'Option C'],
        },
        {
          id: 'question2',
          type: 'checkbox',
          label: 'Question 2 (Select all that apply)',
          required: false,
          options: ['Choice 1', 'Choice 2', 'Choice 3', 'Choice 4'],
        },
      ],
    },
  },
];

interface TemplateGalleryProps {
  onSelectTemplate: (schema: { title: string; description?: string; fields?: Partial<FormFieldData>[] }) => void;
  onClose: () => void;
}

const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelectTemplate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
            <p className="text-sm text-gray-500 mt-1">Start with a pre-designed form and customize it</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => onSelectTemplate(template.schema)}
                className="template-card p-6 text-left"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {template.icon}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  {template.description}
                </p>
                <div className="text-xs text-gray-400">
                  {template.schema.fields?.length || 0} fields
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <p className="text-sm text-gray-600 text-center">
            💡 All templates are fully customizable after selection
          </p>
        </div>
      </div>
    </div>
  );
};

export default TemplateGallery;
