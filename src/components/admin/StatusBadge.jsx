/**
 * Status Badge Component
 * Displays submission/application status with color coding
 * 
 * @param {Object} props
 * @param {string} props.status - Status value (new, in-progress, resolved, pending, approved, rejected)
 * @param {string} props.className - Additional CSS classes
 */
export default function StatusBadge({ status, className = '' }) {
  const statusConfig = {
    // Contact submission statuses
    'new': {
      label: 'New',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      borderColor: 'border-blue-200',
    },
    'in-progress': {
      label: 'In Progress',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      borderColor: 'border-yellow-200',
    },
    'resolved': {
      label: 'Resolved',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    // Membership application statuses
    'pending': {
      label: 'Pending',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      borderColor: 'border-orange-200',
    },
    'approved': {
      label: 'Approved',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      borderColor: 'border-green-200',
    },
    'rejected': {
      label: 'Rejected',
      bgColor: 'bg-red-100',
      textColor: 'text-red-800',
      borderColor: 'border-red-200',
    },
  };

  const config = statusConfig[status] || {
    label: status || 'Unknown',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    borderColor: 'border-gray-200',
  };

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        border ${config.borderColor}
        ${config.bgColor} ${config.textColor}
        ${className}
      `.trim().replace(/\s+/g, ' ')}
    >
      {config.label}
    </span>
  );
}

