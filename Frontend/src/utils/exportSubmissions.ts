/**
 * Export Submissions Utility
 * Functions to export form submissions to CSV and JSON formats
 */

import type { Submission } from '../api/submissionsService';

/**
 * Export submissions to CSV format
 */
export function exportToCSV(submissions: Submission[], formFields: any[], formTitle: string): void {
  if (submissions.length === 0) {
    alert('No submissions to export');
    return;
  }

  // Create header row with field labels
  const headers = ['Submission ID', 'Submitted At', 'IP Address'];
  const fieldIds: string[] = [];

  // Add field labels to headers
  formFields.forEach(field => {
    headers.push(field.label);
    fieldIds.push(field.id);
  });

  // Create CSV rows
  const rows = submissions.map(submission => {
    const row = [
      submission.id,
      new Date(submission.submitted_at).toLocaleString(),
      submission.ip_address || 'N/A'
    ];

    // Add field values
    fieldIds.forEach(fieldId => {
      const value = submission.form_data[fieldId];
      // Handle arrays (checkbox fields)
      if (Array.isArray(value)) {
        row.push(value.join(', '));
      } else {
        row.push(value || '');
      }
    });

    return row;
  });

  // Combine headers and rows
  const csvContent = [
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  // Create and download file
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${formTitle.replace(/\s+/g, '_')}_submissions_${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export submissions to JSON format
 */
export function exportToJSON(submissions: Submission[], formTitle: string): void {
  if (submissions.length === 0) {
    alert('No submissions to export');
    return;
  }

  // Create formatted JSON with metadata
  const exportData = {
    form_title: formTitle,
    exported_at: new Date().toISOString(),
    total_submissions: submissions.length,
    submissions: submissions.map(sub => ({
      id: sub.id,
      submitted_at: sub.submitted_at,
      ip_address: sub.ip_address,
      user_agent: sub.user_agent,
      form_data: sub.form_data
    }))
  };

  // Create and download file
  const jsonContent = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${formTitle.replace(/\s+/g, '_')}_submissions_${Date.now()}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
