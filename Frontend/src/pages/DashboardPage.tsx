/**
 * Dashboard Page
 * User's form management dashboard
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import * as formsService from '../api/formsService';
import type { Form } from '../api/formsService';
import SubmissionsModal from '../components/SubmissionsModal';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import {
  Plus,
  FileText,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Loader2,
  LogOut,
  User,
  Sparkles,
  Calendar,
  BarChart3,
  Copy,
  Check,
  Inbox,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [forms, setForms] = useState<Form[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [selectedFormForSubmissions, setSelectedFormForSubmissions] = useState<Form | null>(null);
  
  // Confirmation dialog states
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; formId: string; formTitle: string }>({ isOpen: false, formId: '', formTitle: '' });
  const [publishConfirm, setPublishConfirm] = useState<{ isOpen: boolean; formId: string }>({ isOpen: false, formId: '' });

  useEffect(() => {
    loadForms();
  }, []);

  const loadForms = async () => {
    try {
      setIsLoading(true);
      console.log('Loading forms...');
      const data = await formsService.getUserForms();
      console.log('Received forms from API:', data);
      console.log('Total forms received:', data.length);
      
      // Filter out forms with undefined IDs and log them
      const validForms = data.filter(form => {
        const hasId = !!form.id;
        if (!hasId) {
          console.warn('Form with undefined ID found:', form);
        }
        console.log(`Form "${form.title}" - ID: ${form.id}, Valid: ${hasId}`);
        return hasId;
      });
      
      console.log('Valid forms after filtering:', validForms.length);
      
      if (validForms.length !== data.length) {
        console.warn(`Filtered out ${data.length - validForms.length} forms with undefined IDs`);
      }
      
      setForms(validForms);
      console.log('Forms set in state:', validForms);
    } catch (err) {
      console.error('Error loading forms:', err);
      setError(err instanceof Error ? err.message : 'Failed to load forms');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleDeleteForm = async (formId: string, formTitle: string) => {
    setDeleteConfirm({ isOpen: true, formId, formTitle });
  };

  const confirmDeleteForm = async () => {
    try {
      await formsService.deleteForm(deleteConfirm.formId, true); // Permanent delete
      await loadForms();
      toast.success('Form deleted successfully!');
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete form');
    }
  };

  const handlePublishForm = async (formId: string) => {
    setPublishConfirm({ isOpen: true, formId });
  };

  const confirmPublishForm = async () => {
    try {
      await formsService.publishForm(publishConfirm.formId);
      await loadForms();
      toast.success('Form published successfully!');
    } catch (err) {
      toast.error('Failed to publish form: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const copyPublicUrl = async (slug: string) => {
    const frontendUrl = (import.meta as any).env.VITE_FRONTEND_URL || window.location.origin;
    const url = `${frontendUrl}/forms/${slug}`;
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiedSlug(slug);
        setTimeout(() => setCopiedSlug(null), 2000);
      }
    } catch (err) {
      console.error('Failed to copy URL:', err);
      toast.error(`Failed to copy. URL: ${url}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-accent-purple px-3 py-1.5 rounded-lg">
                <Sparkles className="w-5 h-5 text-primary-500" />
                <span className="text-text-primary font-semibold">AI Form Builder</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2 bg-bg-secondary rounded-lg border border-border">
                <User className="w-5 h-5 text-text-muted" />
                <div className="text-sm">
                  <p className="text-text-primary font-medium">{user?.full_name || user?.email}</p>
                  <p className="text-text-muted text-xs">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-2">My Forms</h1>
          <p className="text-text-secondary">Create, manage, and share your AI-generated forms</p>
        </div>

        {/* Create New Form Button */}
        <div className="mb-8">
          <Link
            to="/ai-form-builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            Create New Form
          </Link>
        </div>

        {/* Forms Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <p className="text-red-500">{error}</p>
            <button
              onClick={loadForms}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Try Again
            </button>
          </div>
        ) : forms.length === 0 ? (
          <div className="text-center py-20 bg-white border border-border rounded-xl shadow-card">
            <FileText className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-text-primary mb-2">No forms yet</h3>
            <p className="text-text-secondary mb-6">
              Create your first AI-powered form to get started
            </p>
            <Link
              to="/ai-form-builder"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 transition-all shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Create Your First Form
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {forms.map((form) => {
              // Skip forms without valid IDs
              if (!form.id) {
                console.warn('Skipping form without ID:', form);
                return null;
              }
              
              return (
              <div
                key={form.id}
                className="bg-white border border-border rounded-xl p-6 hover:border-primary-300 hover:shadow-card-hover transition-all group"
              >
                {/* Form Header */}
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-500 transition-colors line-clamp-2">
                      {form.title}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        form.status === 'published'
                          ? 'bg-green-50 text-green-600 border border-green-200'
                          : 'bg-yellow-50 text-yellow-600 border border-yellow-200'
                      }`}
                    >
                      {form.status}
                    </span>
                  </div>
                  {form.description && (
                    <p className="text-sm text-text-secondary line-clamp-2">
                      {form.description}
                    </p>
                  )}
                </div>

                {/* Form Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-text-muted">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(form.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    <span>{form.submission_count || 0} responses</span>
                  </div>
                </div>

                {/* Public URL Display */}
                {form.status === 'published' && form.slug && (
                  <div className="mb-4 p-3 bg-accent-purple rounded-lg border border-border">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-text-muted mb-1">Public URL:</p>
                        <p className="text-sm text-primary-500 truncate font-mono">
                          {(import.meta as any).env.VITE_FRONTEND_URL || window.location.origin}/forms/{form.slug}
                        </p>
                      </div>
                      <button
                        onClick={() => copyPublicUrl(form.slug)}
                        className="flex-shrink-0 p-2 bg-white hover:bg-primary-50 text-primary-500 rounded-lg transition-all border border-border"
                        title="Copy link"
                      >
                        {copiedSlug === form.slug ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  <Link
                    to={`/editor/${form.id}`}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all text-sm font-medium shadow-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Link>
                  
                  {/* Publish Button for Draft Forms */}
                  {form.status === 'draft' && (
                    <button
                      onClick={() => handlePublishForm(form.id)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all text-sm font-medium shadow-sm"
                      title="Publish form"
                    >
                      Publish
                    </button>
                  )}
                  
                  {form.status === 'published' && (
                    <button
                      onClick={() => copyPublicUrl(form.slug)}
                      className="p-2 bg-bg-secondary hover:bg-primary-50 text-text-muted hover:text-primary-500 rounded-lg transition-all border border-border"
                      title="Copy public link"
                    >
                      {copiedSlug === form.slug ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  )}

                  {/* Preview Button - Only for published forms */}
                  {form.status === 'published' && form.slug && (
                    <>
                      <a
                        href={`/forms/${form.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-bg-secondary hover:bg-primary-50 text-text-muted hover:text-primary-500 rounded-lg transition-all border border-border"
                        title="Preview form"
                      >
                        <Eye className="w-4 h-4" />
                      </a>
                      
                      {/* View Submissions Button */}
                      <button
                        onClick={() => setSelectedFormForSubmissions(form)}
                        className="p-2 bg-bg-secondary hover:bg-primary-50 text-text-muted hover:text-primary-500 rounded-lg transition-all border border-border"
                        title="View submissions"
                      >
                        <Inbox className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => handleDeleteForm(form.id, form.title)}
                    className="p-2 bg-bg-secondary hover:bg-red-50 text-text-muted hover:text-red-600 rounded-lg transition-all border border-border"
                    title="Delete form"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Submissions Modal */}
      {selectedFormForSubmissions && (
        <SubmissionsModal
          formId={selectedFormForSubmissions.id}
          formTitle={selectedFormForSubmissions.title}
          formFields={selectedFormForSubmissions.fields}
          isOpen={!!selectedFormForSubmissions}
          onClose={() => setSelectedFormForSubmissions(null)}
          onDataChange={loadForms} // Only called when submissions are deleted
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Form"
        message={`Are you sure you want to delete "${deleteConfirm.formTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDeleteForm}
        onCancel={() => setDeleteConfirm({ isOpen: false, formId: '', formTitle: '' })}
      />

      {/* Publish Confirmation Dialog */}
      <ConfirmDialog
        isOpen={publishConfirm.isOpen}
        title="Publish Form"
        message="Publish this form? It will be publicly accessible to anyone with the link."
        confirmText="Publish"
        cancelText="Cancel"
        type="info"
        onConfirm={confirmPublishForm}
        onCancel={() => setPublishConfirm({ isOpen: false, formId: '' })}
      />
    </div>
  );
}
