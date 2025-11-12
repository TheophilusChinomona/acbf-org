import * as XLSX from 'xlsx';
import { format } from 'date-fns';

/**
 * Format a date value for Excel export
 * @param {Date|string|Object} date - Date value to format
 * @returns {string} Formatted date string
 */
function formatDateForExport(date) {
  if (!date) return 'N/A';
  
  try {
    // Handle Firestore Timestamp objects
    let dateObj;
    if (date instanceof Date) {
      dateObj = date;
    } else if (date.toDate && typeof date.toDate === 'function') {
      dateObj = date.toDate();
    } else if (typeof date === 'string') {
      dateObj = new Date(date);
    } else {
      return 'Invalid date';
    }
    
    // Format as readable date-time string
    return format(dateObj, 'yyyy-MM-dd HH:mm:ss');
  } catch (error) {
    return 'Invalid date';
  }
}

/**
 * Prepare contact submission data for Excel export
 * @param {Array} submissions - Array of contact submissions
 * @returns {Array} Array of formatted objects ready for Excel
 */
function prepareContactSubmissions(submissions) {
  return submissions.map((submission) => ({
    'ID': submission.id || '',
    'Name': submission.name || '',
    'Email': submission.email || '',
    'Subject': submission.subject || '',
    'Message': submission.message || '',
    'Status': submission.status || '',
    'Created At': formatDateForExport(submission.created_at),
  }));
}

/**
 * Prepare membership application data for Excel export
 * @param {Array} applications - Array of membership applications
 * @returns {Array} Array of formatted objects ready for Excel
 */
function prepareMembershipApplications(applications) {
  return applications.map((application) => ({
    'ID': application.id || '',
    'Name': application.name || '',
    'Email': application.email || '',
    'Phone': application.phone || '',
    'Business Name': application.business_name || '',
    'Business Type': application.business_type || '',
    'Message': application.message || '',
    'Status': application.status || '',
    'Created At': formatDateForExport(application.created_at),
  }));
}

/**
 * Export data to Excel file
 * @param {Array} data - Array of data objects to export
 * @param {string} filename - Name of the file (without extension)
 * @param {string} sheetName - Name of the Excel sheet
 */
export function exportToExcel(data, filename = 'export', sheetName = 'Data') {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data array to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const maxWidths = {};
    data.forEach((row) => {
      Object.keys(row).forEach((key) => {
        const value = String(row[key] || '');
        const currentMax = maxWidths[key] || 10;
        maxWidths[key] = Math.max(currentMax, Math.min(value.length, 50));
      });
    });

    worksheet['!cols'] = Object.keys(maxWidths).map((key) => ({
      wch: maxWidths[key] + 2, // Add padding
    }));

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${filename}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    throw error;
  }
}

/**
 * Export contact submissions to Excel
 * @param {Array} submissions - Array of contact submissions
 * @param {Object} options - Export options
 * @param {string} options.filename - Custom filename (default: 'contact-submissions')
 * @param {boolean} options.includeTimestamp - Include timestamp in filename (default: true)
 */
export function exportContactSubmissions(submissions, options = {}) {
  const {
    filename = 'contact-submissions',
    includeTimestamp = true,
  } = options;

  const preparedData = prepareContactSubmissions(submissions);
  
  const finalFilename = includeTimestamp
    ? `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
    : filename;

  exportToExcel(preparedData, finalFilename, 'Contact Submissions');
}

/**
 * Export membership applications to Excel
 * @param {Array} applications - Array of membership applications
 * @param {Object} options - Export options
 * @param {string} options.filename - Custom filename (default: 'membership-applications')
 * @param {boolean} options.includeTimestamp - Include timestamp in filename (default: true)
 */
export function exportMembershipApplications(applications, options = {}) {
  const {
    filename = 'membership-applications',
    includeTimestamp = true,
  } = options;

  const preparedData = prepareMembershipApplications(applications);
  
  const finalFilename = includeTimestamp
    ? `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
    : filename;

  exportToExcel(preparedData, finalFilename, 'Membership Applications');
}

/**
 * Export both contact submissions and membership applications to a single Excel file
 * with multiple sheets
 * @param {Array} contactSubmissions - Array of contact submissions
 * @param {Array} membershipApplications - Array of membership applications
 * @param {Object} options - Export options
 * @param {string} options.filename - Custom filename (default: 'all-submissions')
 * @param {boolean} options.includeTimestamp - Include timestamp in filename (default: true)
 */
export function exportAllSubmissions(contactSubmissions, membershipApplications, options = {}) {
  const {
    filename = 'all-submissions',
    includeTimestamp = true,
  } = options;

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Prepare and add contact submissions sheet
    if (contactSubmissions && contactSubmissions.length > 0) {
      const contactData = prepareContactSubmissions(contactSubmissions);
      const contactSheet = XLSX.utils.json_to_sheet(contactData);
      
      // Set column widths
      const contactMaxWidths = {};
      contactData.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const value = String(row[key] || '');
          const currentMax = contactMaxWidths[key] || 10;
          contactMaxWidths[key] = Math.max(currentMax, Math.min(value.length, 50));
        });
      });
      contactSheet['!cols'] = Object.keys(contactMaxWidths).map((key) => ({
        wch: contactMaxWidths[key] + 2,
      }));

      XLSX.utils.book_append_sheet(workbook, contactSheet, 'Contact Submissions');
    }

    // Prepare and add membership applications sheet
    if (membershipApplications && membershipApplications.length > 0) {
      const membershipData = prepareMembershipApplications(membershipApplications);
      const membershipSheet = XLSX.utils.json_to_sheet(membershipData);
      
      // Set column widths
      const membershipMaxWidths = {};
      membershipData.forEach((row) => {
        Object.keys(row).forEach((key) => {
          const value = String(row[key] || '');
          const currentMax = membershipMaxWidths[key] || 10;
          membershipMaxWidths[key] = Math.max(currentMax, Math.min(value.length, 50));
        });
      });
      membershipSheet['!cols'] = Object.keys(membershipMaxWidths).map((key) => ({
        wch: membershipMaxWidths[key] + 2,
      }));

      XLSX.utils.book_append_sheet(workbook, membershipSheet, 'Membership Applications');
    }

    // Generate filename
    const finalFilename = includeTimestamp
      ? `${filename}-${format(new Date(), 'yyyy-MM-dd-HHmmss')}`
      : filename;

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `${finalFilename}.xlsx`);

    return true;
  } catch (error) {
    console.error('Error exporting all submissions:', error);
    throw error;
  }
}

