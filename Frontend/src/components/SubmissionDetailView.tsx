/**
 * Submission Detail View Component
 * Displays detailed information about a single form submission
 */

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { X, Copy, Trash2, Calendar, Globe, Monitor, Eye, Download, FileText } from 'lucide-react';
import type { Submission } from '../api/submissionsService';
import { getSubmissionId } from '../api/submissionsService';
import ConfirmDialog from './ui/ConfirmDialog';

interface SubmissionDetailViewProps {
  submission: Submission;
  formFields: any[];
  onClose: () => void;
  onDelete: (submissionId: string) => void;
}

export default function SubmissionDetailView({
  submission,
  formFields,
  onClose,
  onDelete
}: SubmissionDetailViewProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const handleCopy = () => {
    const text = JSON.stringify(submission.form_data, null, 2);
    navigator.clipboard.writeText(text);
    toast.success('Submission data copied to clipboard!');
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    const submissionId = getSubmissionId(submission);
    console.log('Deleting submission with ID:', submissionId);
    onDelete(submissionId);
  };

  const formatValue = (value: any): string => {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    // Don't format file objects as string
    if (typeof value === 'object' && value !== null && value.data) {
      return ''; // Will be handled by renderFileValue
    }
    return String(value || 'N/A');
  };

  // Render file value with View/Download options
  const renderFileValue = (value: any) => {
    // Check if it's a file object with data
    if (typeof value === 'object' && value !== null && value.data) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-gray-500" />
            <span className="text-gray-900">{value.name || 'Uploaded file'}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                const newWindow = window.open();
                if (newWindow) {
                  if (value.type?.startsWith('image/')) {
                    newWindow.document.write(`<img src="${value.data}" alt="${value.name}" style="max-width:100%;height:auto;" />`);
                  } else if (value.type === 'application/pdf') {
                    newWindow.document.write(`<iframe src="${value.data}" width="100%" height="100%" style="border:none;"></iframe>`);
                  } else {
                    newWindow.location.href = value.data;
                  }
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              <Eye className="w-4 h-4" />
              View
            </button>
            <a
              href={value.data}
              download={value.name}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </a>
          </div>
        </div>
      );
    }
    
    // If it's just a filename string (legacy)
    if (typeof value === 'string' && value) {
      return (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-gray-500" />
          <span className="text-gray-900">{value}</span>
          <span className="text-xs text-gray-500">(File data not available)</span>
        </div>
      );
    }
    
    return <span className="text-gray-500">N/A</span>;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Submission Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Metadata */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <h3 className="font-semibold text-gray-900 mb-3">Submission Information</h3>
            
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600">Submitted:</span>
              <span className="font-medium text-gray-900">
                {new Date(submission.submitted_at).toLocaleString()}
              </span>
            </div>

            {submission.ip_address && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="w-4 h-4 text-gray-500" />
                <span className="text-gray-600">IP Address:</span>
                <span className="font-mono text-gray-900">{submission.ip_address}</span>
              </div>
            )}

            {submission.user_agent && (
              <div className="flex items-start gap-2 text-sm">
                <Monitor className="w-4 h-4 text-gray-500 mt-0.5" />
                <span className="text-gray-600">User Agent:</span>
                <span className="text-gray-900 text-xs break-all">{submission.user_agent}</span>
              </div>
            )}
          </div>

          {/* Form Data */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Form Responses</h3>
            <div className="space-y-4">
              {formFields.map(field => {
                const value = submission.form_data[field.id];
                const isFileField = field.type === 'file' || 
                  (typeof value === 'object' && value !== null && (value.data || value.name));
                
                return (
                  <div key={field.id} className="border-b border-gray-200 pb-4 last:border-0">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    <div className="text-gray-900 bg-gray-50 rounded-lg p-3">
                      {isFileField ? renderFileValue(value) : formatValue(value)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Copy className="w-4 h-4" />
            Copy Data
          </button>
          
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Submission
          </button>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Submission"
        message="Are you sure you want to delete this submission? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}
