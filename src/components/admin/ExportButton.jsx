import { useState } from 'react';
import { FiDownload, FiLoader } from 'react-icons/fi';
import toast from 'react-hot-toast';
import {
  exportContactSubmissions,
  exportMembershipApplications,
  exportAwardsNominations,
} from '../../utils/exportData';

/**
 * Export Button Component
 * Provides Excel export functionality for submissions
 *
 * @param {Object} props
 * @param {Array} props.data - Array of submissions/applications to export
 * @param {string} props.type - Type of data ('contact', 'membership', or 'awards')
 * @param {string} props.className - Additional CSS classes
 * @param {Object} props.options - Export options (filename, includeTimestamp)
 */
export default function ExportButton({
  data = [],
  type = 'contact',
  className = '',
  options = {},
}) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (!data || data.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      setIsExporting(true);

      if (type === 'contact') {
        exportContactSubmissions(data, {
          filename: options.filename || 'contact-submissions',
          includeTimestamp: options.includeTimestamp !== false,
        });
        toast.success(`Exported ${data.length} contact submission${data.length !== 1 ? 's' : ''} to Excel`);
      } else if (type === 'membership') {
        exportMembershipApplications(data, {
          filename: options.filename || 'membership-applications',
          includeTimestamp: options.includeTimestamp !== false,
        });
        toast.success(`Exported ${data.length} membership application${data.length !== 1 ? 's' : ''} to Excel`);
      } else if (type === 'awards') {
        exportAwardsNominations(data, {
          filename: options.filename || 'awards-nominations',
          includeTimestamp: options.includeTimestamp !== false,
        });
        toast.success(`Exported ${data.length} award nomination${data.length !== 1 ? 's' : ''} to Excel`);
      } else {
        throw new Error('Invalid export type');
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || !data || data.length === 0}
      className={`
        inline-flex items-center justify-center gap-2 px-4 py-2.5 md:py-2
        bg-primary text-white font-medium rounded-lg text-sm md:text-base
        hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        min-h-[44px] md:min-h-0
        ${className}
      `}
      title={
        !data || data.length === 0
          ? 'No data to export'
          : `Export ${data.length} ${type === 'contact' ? 'submission' : type === 'awards' ? 'nomination' : 'application'}${data.length !== 1 ? 's' : ''} to Excel`
      }
    >
      {isExporting ? (
        <>
          <FiLoader className="w-4 h-4 animate-spin" />
          <span>Exporting...</span>
        </>
      ) : (
        <>
          <FiDownload className="w-4 h-4" />
          <span>Export to Excel</span>
        </>
      )}
    </button>
  );
}

