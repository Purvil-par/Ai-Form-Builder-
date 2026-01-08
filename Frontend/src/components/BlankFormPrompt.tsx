import React, { useState, useRef } from 'react';
import { Sparkles, X, Lightbulb, Paperclip, Trash2, FileText, Image } from 'lucide-react';

/**
 * Blank Form Prompt Component
 * Captures user's custom prompt for AI-driven form generation
 */

interface BlankFormPromptProps {
    onSubmit: (prompt: string, fileContent?: string, imageData?: string) => void;
    onCancel: () => void;
    isLoading?: boolean;
}

const BlankFormPrompt: React.FC<BlankFormPromptProps> = ({ onSubmit, onCancel, isLoading = false }) => {
    const [prompt, setPrompt] = useState('');
    const [error, setError] = useState('');
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');
    const [fileError, setFileError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Image upload state
    const [uploadedImage, setUploadedImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string>('');
    const [imageError, setImageError] = useState('');
    const imageInputRef = useRef<HTMLInputElement>(null);

    // Supported file types - expanded to support more document formats
    const SUPPORTED_EXTENSIONS = [
        // Text files
        '.txt', '.csv', '.json', '.md', '.rtf',
        // Document files
        '.pdf', '.doc', '.docx',
        // Spreadsheet files
        '.xls', '.xlsx',
        // Code/Data files
        '.xml', '.yaml', '.yml', '.html', '.htm'
    ];
    const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB limit (increased for PDFs)
    const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB limit for images

    const examplePrompts = [
        "Create a job application form with resume upload, cover letter, and 3 professional references",
        "I need a customer feedback form with star ratings, comments section, and Net Promoter Score",
        "Build an event registration form with attendee details, meal preferences, and emergency contact",
        "Make a contact form for my website with name, email, phone, subject, and message fields"
    ];

    const handleSubmit = () => {
        const trimmedPrompt = prompt.trim();

        // Validation
        if (trimmedPrompt.length < 10) {
            setError('Please provide a more detailed description (at least 10 characters)');
            return;
        }

        setError('');
        // Pass prompt, file content, and image data to parent
        onSubmit(trimmedPrompt, fileContent || undefined, imagePreview || undefined);
    };

    // Handle file selection
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileError('');

        // Check file extension
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(extension)) {
            setFileError(`Unsupported file type. Please upload: ${SUPPORTED_EXTENSIONS.join(', ')}`);
            return;
        }

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            setFileError(`File too large. Maximum size: ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        // Binary file extensions that need special handling
        const binaryExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
        const isBinaryFile = binaryExtensions.includes(extension);

        // Read file content
        try {
            if (isBinaryFile) {
                // For binary files, read as Base64 and include file info
                const base64Content = await readFileAsBase64(file);
                const fileInfo = `[BINARY FILE: ${file.name}]\n[TYPE: ${file.type}]\n[SIZE: ${(file.size / 1024).toFixed(2)}KB]\n[BASE64_CONTENT_START]\n${base64Content}\n[BASE64_CONTENT_END]`;
                setUploadedFile(file);
                setFileContent(fileInfo);
            } else {
                // For text files, read as plain text
                const content = await readFileAsText(file);
                setUploadedFile(file);
                setFileContent(content);
            }
        } catch (err) {
            setFileError('Failed to read file. Please try again.');
        }
    };

    // Read file as text
    const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    };

    // Read file as Base64 (for binary files like PDF, DOCX)
    const readFileAsBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const result = e.target?.result as string;
                // Remove data URL prefix to get pure Base64
                const base64 = result.split(',')[1] || result;
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Remove uploaded file
    const handleRemoveFile = () => {
        setUploadedFile(null);
        setFileContent('');
        setFileError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle image selection
    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImageError('');

        // Check image type
        if (!SUPPORTED_IMAGE_TYPES.includes(file.type)) {
            setImageError('Unsupported image type. Please upload: JPEG, PNG, GIF, or WebP');
            return;
        }

        // Check file size
        if (file.size > MAX_IMAGE_SIZE) {
            setImageError(`Image too large. Maximum size: ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`);
            return;
        }

        // Create preview and Base64
        try {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
            setUploadedImage(file);
        } catch (err) {
            setImageError('Failed to read image. Please try again.');
        }
    };

    // Remove uploaded image
    const handleRemoveImage = () => {
        setUploadedImage(null);
        setImagePreview('');
        setImageError('');
        if (imageInputRef.current) {
            imageInputRef.current.value = '';
        }
    };

    const handleExampleClick = (example: string) => {
        setPrompt(example);
        setError('');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Submit on Ctrl+Enter or Cmd+Enter
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            handleSubmit();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-border rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-border p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-text-primary">Describe Your Form</h2>
                            <p className="text-sm text-text-secondary">Tell the AI what kind of form you need</p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="p-2 hover:bg-bg-secondary rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5 text-text-muted" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Textarea with integrated file upload */}
                    <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                            Form Description
                        </label>
                        
                        {/* Textarea Container with File Button Inside */}
                        <div className="relative">
                            <textarea
                                value={prompt}
                                onChange={(e) => {
                                    setPrompt(e.target.value);
                                    setError('');
                                }}
                                onKeyDown={handleKeyDown}
                                placeholder="Example: I need a customer survey form with satisfaction ratings, multiple choice questions about our services, and an optional comments section..."
                                className="w-full h-44 px-4 py-3 pb-14 bg-white border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                                disabled={isLoading}
                                autoFocus
                            />
                            
                            {/* Hidden File Input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".txt,.csv,.json,.md"
                                onChange={handleFileSelect}
                                disabled={isLoading}
                                className="hidden"
                                id="file-upload"
                            />
                            
                            {/* Add File Button - Bottom Left of Textarea */}
                            <div className="absolute bottom-3 left-3 flex items-center gap-2">
                                {/* Add File Button */}
                                {!uploadedFile ? (
                                    <label
                                        htmlFor="file-upload"
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary hover:bg-gray-200 border border-border rounded-md cursor-pointer transition-colors text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Upload file (.txt, .csv, .json, .md)"
                                    >
                                        <Paperclip className="w-4 h-4 text-text-muted" />
                                        <span className="text-text-secondary">Add File</span>
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-primary-50 border border-primary-200 rounded-md">
                                        <FileText className="w-4 h-4 text-primary-600" />
                                        <span className="text-sm text-primary-700 font-medium max-w-[100px] truncate">
                                            {uploadedFile.name}
                                        </span>
                                        <button
                                            onClick={handleRemoveFile}
                                            disabled={isLoading}
                                            className="p-0.5 text-red-500 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                            title="Remove file"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                                
                                {/* Hidden Image Input */}
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={handleImageSelect}
                                    disabled={isLoading}
                                    className="hidden"
                                    id="image-upload"
                                />
                                
                                {/* Add Image Button */}
                                {!uploadedImage ? (
                                    <label
                                        htmlFor="image-upload"
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-bg-secondary hover:bg-gray-200 border border-border rounded-md cursor-pointer transition-colors text-sm ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Upload image (JPEG, PNG, GIF, WebP)"
                                    >
                                        <Image className="w-4 h-4 text-text-muted" />
                                        <span className="text-text-secondary">Add Image</span>
                                    </label>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-md">
                                        <img 
                                            src={imagePreview} 
                                            alt="Preview" 
                                            className="w-6 h-6 object-cover rounded"
                                        />
                                        <span className="text-sm text-green-700 font-medium max-w-[100px] truncate">
                                            {uploadedImage.name}
                                        </span>
                                        <button
                                            onClick={handleRemoveImage}
                                            disabled={isLoading}
                                            className="p-0.5 text-red-500 hover:bg-red-100 rounded transition-colors disabled:opacity-50"
                                            title="Remove image"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                )}
                            </div>
                            
                            {/* Character Count - Bottom Right */}
                            <div className="absolute bottom-3 right-3">
                                <span className={`text-xs ${prompt.length < 10 ? 'text-red-500' : 'text-text-muted'}`}>
                                    {prompt.length} characters
                                </span>
                            </div>
                        </div>
                        
                        {/* Tip and Errors */}
                        <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-text-muted">
                                Tip: Press <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded text-xs">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 bg-bg-secondary border border-border rounded text-xs">Enter</kbd> to submit
                            </p>
                            {uploadedFile && (
                                <span className="text-xs text-primary-500">
                                    📎 File attached
                                </span>
                            )}
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 mt-2">{error}</p>
                        )}
                        {fileError && (
                            <p className="text-sm text-red-500 mt-1">{fileError}</p>
                        )}
                        {imageError && (
                            <p className="text-sm text-red-500 mt-1">{imageError}</p>
                        )}
                    </div>

                    {/* Example Prompts */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <Lightbulb className="w-4 h-4 text-primary-500" />
                            <h3 className="text-sm font-medium text-text-primary">Example Prompts</h3>
                        </div>
                        <div className="grid gap-2">
                            {examplePrompts.map((example, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleExampleClick(example)}
                                    disabled={isLoading}
                                    className="text-left p-3 bg-bg-secondary hover:bg-accent-purple border border-border hover:border-primary-300 rounded-lg transition-all text-sm text-text-secondary hover:text-text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {example}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Helper Text */}
                    <div className="bg-accent-purple border border-border rounded-lg p-4">
                        <h4 className="text-sm font-medium text-text-primary mb-2">💡 Tips for better results:</h4>
                        <ul className="text-sm text-text-secondary space-y-1 list-disc list-inside">
                            <li>Be specific about what information you need to collect</li>
                            <li>Mention if certain fields should be required or optional</li>
                            <li>Specify if you need file uploads, dropdowns, or special field types</li>
                            <li>Include any validation requirements (email format, phone numbers, etc.)</li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-white border-t border-border p-6 flex items-center justify-end gap-3">
                    <button
                        onClick={onCancel}
                        disabled={isLoading}
                        className="px-6 py-3 bg-bg-secondary hover:bg-bg-tertiary text-text-primary rounded-lg transition-colors disabled:opacity-50 border border-border"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || prompt.trim().length < 10}
                        className="px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
                    >
                        {isLoading ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Processing...</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                <span>Generate Form</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BlankFormPrompt;
