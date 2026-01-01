/**
 * Submissions Modal Component
 * Displays all submissions for a specific form with pagination and export options
 */

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { X, Download, FileJson, FileSpreadsheet, Loader2, Eye, Trash2, AlertCircle } from 'lucide-react';
import * as submissionsService from '../api/submissionsService';
import type { Submission } from '../api/submissionsService';
import { getSubmissionId } from '../api/submissionsService';
import SubmissionDetailView from './SubmissionDetailView';
import { exportToCSV, exportToJSON } from '../utils/exportSubmissions';

interface SubmissionsModalProps {
  formId: string;
  formTitle: string;
  formFields: any[];
  isOpen: boolean;
  onClose: () => void;
  onDataChange?: () => void; // Called when submissions are deleted (to update counts)
}

export default function SubmissionsModal({
  formId,
  formTitle,
  formFields,
  isOpen,
  onClose,
  onDataChange
}: SubmissionsModalProps) {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 100;

  useEffect(() => {
    if (isOpen) {
      loadSubmissions();
    }
  }, [isOpen, formId, currentPage]);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      setError('');
      const data = await submissionsService.getFormSubmissions(
        formId,
        currentPage * itemsPerPage,
        itemsPerPage
      );
      setSubmissions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (submissionId: string) => {
    try {
      await submissionsService.deleteSubmission(submissionId);
      // Reload submissions after deletion
      await loadSubmissions();
      setSelectedSubmission(null);
      // Notify parent to update submission counts
      onDataChange?.();
    } catch (err) {
      toast.error('Failed to delete submission: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleExportCSV = () => {
    exportToCSV(submissions, formFields, formTitle);
  };

  const handleExportJSON = () => {
    exportToJSON(submissions, formTitle);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Form Submissions</h2>
              <p className="text-sm text-gray-600 mt-1">{formTitle}</p>
            </div>
            <div className="flex items-center gap-2">
              {submissions.length > 0 && (
                <>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    title="Export to CSV"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={handleExportJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    title="Export to JSON"
                  >
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <p className="text-red-600 mb-4">{error}</p>
                <button
                  onClick={loadSubmissions}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileSpreadsheet className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
                <p className="text-gray-600">
                  This form hasn't received any submissions yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((submission) => {
                  const submissionId = getSubmissionId(submission);
                  return (
                  <div
                    key={submissionId}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-primary-500 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(submission.submitted_at).toLocaleString()}
                          </span>
                          {submission.ip_address && (
                            <span className="text-xs text-gray-500 font-mono">
                              {submission.ip_address}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {formFields.slice(0, 3).map(field => {
                            const value = submission.form_data[field.id];
                            if (!value) return null;
                            return (
                              <span key={field.id} className="mr-4">
                                <span className="font-medium">{field.label}:</span>{' '}
                                {Array.isArray(value) ? value.join(', ') : String(value).substring(0, 50)}
                                {String(value).length > 50 ? '...' : ''}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedSubmission(submission)}
                          className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            console.log('Deleting submission with ID:', submissionId);
                            handleDelete(submissionId);
                          }}
                          className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer - Pagination */}
          {submissions.length === itemsPerPage && (
            <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage + 1}
              </span>
              <button
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={submissions.length < itemsPerPage}
                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <SubmissionDetailView
          submission={selectedSubmission}
          formFields={formFields}
          onClose={() => setSelectedSubmission(null)}
          onDelete={handleDelete}
        />
      )}
    </>
  );
}
