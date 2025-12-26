import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, Sparkles } from 'lucide-react';
import SingleQuestion from '../components/SingleQuestion';
import type { QuestionData } from '../components/SingleQuestion';
import FormPreview from '../components/FormPreview';
import BlankFormPrompt from '../components/BlankFormPrompt';
import CanvasFormEditor from '../components/CanvasFormEditor';
import { initFormCreation, submitAnswer, FormSchema } from '../api/formBuilder';
import * as formsService from '../api/formsService';


/**
 * AI Form Builder Page
 * Main page for AI-driven form creation with single-question Q&A flow
 */

type BuilderStage = 'initializing' | 'questions' | 'final_form' | 'editor' | 'error';

const AIFormBuilder: React.FC = () => {
    const { formType } = useParams<{ formType: string }>();
    const navigate = useNavigate();

    const [stage, setStage] = useState<BuilderStage>('initializing');
    const [sessionId, setSessionId] = useState<string>('');
    const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
    const [questionNumber, setQuestionNumber] = useState(0);
    const [formSchema, setFormSchema] = useState<FormSchema | null>(null);
    const [formId, setFormId] = useState<string | null>(null);
    const [error, setError] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    // Blank form specific state
    const [showPromptInput, setShowPromptInput] = useState(false);
    const [customPrompt, setCustomPrompt] = useState('');

    // Editor mode state
    const [showEditor, setShowEditor] = useState(false);

    // Initialize form creation on mount
    useEffect(() => {
        if (!formType) {
            navigate('/');
            return;
        }

        // Check if this is a blank form
        if (formType === 'blank') {
            setShowPromptInput(true);
            setStage('initializing');
        } else {
            initializeForm();
        }
    }, [formType]);

    const initializeForm = async (userPrompt?: string) => {
        try {
            setStage('initializing');
            setError('');

            const response = await initFormCreation(formType!, userPrompt);
            
            console.log('📥 RAW RESPONSE FROM BACKEND:', response);
            console.log('📥 Response keys:', Object.keys(response));
            console.log('📥 response.form_id:', response.form_id);
            console.log('📥 response.mode:', response.mode);
            
            setSessionId(response.session_id);

            if (response.mode === 'question' && response.question) {
                setCurrentQuestion(response.question);
                setQuestionNumber(response.question_number || 1);
                setStage('questions');
            } else if (response.mode === 'form_schema' && response.form) {
                console.log('=== AI FORM BUILDER - FORM SCHEMA RECEIVED ===');
                console.log('Form schema:', response.form);
                console.log('Fields count:', response.form?.fields?.length);
                console.log('Form ID from backend:', response.form_id);
                console.log('Form ID type:', typeof response.form_id);
                
                // CRITICAL: Set formId BEFORE setting other states
                // This ensures formId is available when editor renders
                if (response.form_id) {
                    console.log('✅ Setting formId in state:', response.form_id);
                    setFormId(response.form_id);
                } else {
                    console.warn('⚠️ No form_id received from backend!');
                }
                
                setFormSchema(response.form);
                
                // Wait for next tick to ensure formId state is updated
                setTimeout(() => {
                    setShowEditor(true);
                    setStage('editor');
                }, 0);
            } else if (response.mode === 'error') {
                setError(response.error || 'An error occurred');
                setStage('error');
            }
        } catch (err) {
            console.error('Failed to initialize form:', err);
            setError(err instanceof Error ? err.message : 'Failed to initialize form creation');
            setStage('error');
        }
    };

    const handleAnswerSubmit = async (questionId: string, answer: string | string[]) => {
        try {
            setIsLoading(true);
            setError('');

            const response = await submitAnswer(sessionId, questionId, answer);
            
            console.log('📥 RAW RESPONSE FROM submitAnswer:', response);
            console.log('📥 Response keys:', Object.keys(response));
            console.log('📥 response.form_id:', response.form_id);
            console.log('📥 response.mode:', response.mode);

            if (response.mode === 'question' && response.question) {
                setCurrentQuestion(response.question);
                setQuestionNumber(response.question_number || questionNumber + 1);
                setStage('questions');
            } else if (response.mode === 'form_schema' && response.form) {
                console.log('=== AI FORM BUILDER - FORM SCHEMA FROM ANSWER ===');
                console.log('Form schema:', response.form);
                console.log('Form ID from backend:', response.form_id);
                console.log('Form ID type:', typeof response.form_id);
                
                // CRITICAL: Set formId BEFORE setting other states
                if (response.form_id) {
                    console.log('✅ Setting formId in state:', response.form_id);
                    setFormId(response.form_id);
                } else {
                    console.warn('⚠️ No form_id received from backend!');
                }
                
                setFormSchema(response.form);
                
                // Wait for next tick to ensure formId state is updated
                setTimeout(() => {
                    setShowEditor(true);
                    setStage('editor');
                }, 0);
            } else if (response.mode === 'error') {
                setError(response.error || 'An error occurred');
                setStage('error');
            }
        } catch (err) {
            console.error('Failed to submit answer:', err);
            setError(err instanceof Error ? err.message : 'Failed to submit answer');
            setStage('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        // For now, just go back to home
        // In future, implement proper back navigation through Q&A
        navigate('/');
    };

    const handleEdit = () => {
        // Reset to questions stage
        setStage('questions');
    };

    const handleExport = () => {
        if (!formSchema) return;

        // Export as JSON file
        const dataStr = JSON.stringify(formSchema, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${formSchema.title.replace(/\s+/g, '_').toLowerCase()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    const handleBuild = () => {
        // Open visual editor
        setShowEditor(true);
        setStage('editor');
    };

    const handleCustomPromptSubmit = (prompt: string) => {
        setCustomPrompt(prompt);
        setShowPromptInput(false);
        setIsLoading(true);
        initializeForm(prompt).finally(() => setIsLoading(false));
    };

    const handleCustomPromptCancel = () => {
        navigate('/');
    };

    const getFormTypeTitle = (type: string) => {
        const titles: Record<string, string> = {
            'contact': 'Contact Form',
            'feedback': 'Feedback Form',
            'registration': 'Registration Form',
            'survey': 'Survey Form',
            'blank': 'Custom Form'
        };
        return titles[type] || 'Form Builder';
    };

    return (
        <>
            {/* Blank Form Prompt Modal */}
            {showPromptInput && (
                <BlankFormPrompt
                    onSubmit={handleCustomPromptSubmit}
                    onCancel={handleCustomPromptCancel}
                    isLoading={isLoading}
                />
            )}

            {/* Canvas Form Editor */}
            {(stage === 'editor' || showEditor) && formSchema && (
                <>
                {console.log('=== RENDERING CANVAS EDITOR ===')}
                {console.log('formId being passed to editor:', formId)}
                {console.log('formId type:', typeof formId)}
                <CanvasFormEditor
                    formId={formId ?? undefined}
                    initialFormData={{
                        title: formSchema.title || 'Untitled Form',
                        description: formSchema.description || '',
                        fields: (formSchema.fields || []).map((field: any) => ({
                            ...field,
                            style: field.style || {
                                fontFamily: 'Inter, system-ui, sans-serif',
                                fontSize: '14px',
                                fontWeight: '400',
                                lineHeight: '1.5',
                                letterSpacing: '0',
                                textAlign: 'left' as const,
                                color: '#1f2937',
                                backgroundColor: '#ffffff',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: '#d1d5db',
                                borderRadius: '6px',
                                paddingTop: '10px',
                                paddingRight: '12px',
                                paddingBottom: '10px',
                                paddingLeft: '12px',
                                marginBottom: '16px',
                            },
                            width: field.width || '100%',
                            order: field.order || 0,
                        })),
                        globalStyles: (formSchema as any).globalStyles || {
                            primaryColor: '#3b82f6',
                            secondaryColor: '#8b5cf6',
                            fontFamily: 'Inter, system-ui, sans-serif',
                            fontSize: '14px',
                            defaultSpacing: '16px',
                            defaultBorderRadius: '6px',
                            backgroundColor: '#ffffff',
                            textColor: '#1f2937',
                        },
                    }}
                    onSave={() => {}} // CanvasFormEditor handles saving internally
                    onClose={() => navigate('/dashboard')}
                />
                </>
            )}

            {!showEditor && (
                <div className="min-h-screen bg-dark-bg py-12 px-4">
                    <div className="max-w-5xl mx-auto">
                        {/* Header */}
                        <div className="text-center mb-12">
                            <div className="inline-flex items-center gap-2 bg-primary-600/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4 border border-primary-600/30">
                                <Sparkles className="w-5 h-5 text-secondary-500" />
                                <span className="text-text-primary font-medium">AI-Powered Form Builder</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-4">
                                {formType === 'blank' ? 'Custom Form' : getFormTypeTitle(formType || '')}
                            </h1>
                            {stage === 'questions' && currentQuestion && (
                                <p className="text-text-secondary text-lg">
                                    Question {questionNumber}
                                </p>
                            )}
                        </div>

                        {/* Content */}
                        <div className="bg-dark-card border border-dark-border rounded-2xl p-8 shadow-neon-glow">
                            {/* Initializing State */}
                            {stage === 'initializing' && !showPromptInput && (
                                <div className="text-center py-12">
                                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
                                    <p className="text-text-secondary text-lg">
                                        AI is analyzing your form requirements...
                                    </p>
                                </div>
                            )}

                            {/* Questions State */}
                            {stage === 'questions' && currentQuestion && (
                                <SingleQuestion
                                    question={currentQuestion}
                                    questionNumber={questionNumber}
                                    onAnswer={handleAnswerSubmit}
                                    onBack={questionNumber > 1 ? handleBack : undefined}
                                    isLoading={isLoading}
                                />
                            )}

                            {/* Final Form State */}
                            {stage === 'final_form' && formSchema && (
                                <FormPreview
                                    formSchema={formSchema}
                                    onEdit={handleEdit}
                                    onExport={handleExport}
                                    onBuild={handleBuild}
                                />
                            )}

                            {/* Error State */}
                            {stage === 'error' && (
                                <div className="text-center py-12">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 mb-4">
                                        <AlertCircle className="w-8 h-8 text-red-500" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-text-primary mb-2">
                                        Something went wrong
                                    </h3>
                                    <p className="text-text-secondary mb-6">
                                        {error}
                                    </p>
                                    <button
                                        onClick={() => initializeForm()}
                                        className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                                    >
                                        Try Again
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIFormBuilder;
