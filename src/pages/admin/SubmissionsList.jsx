import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiMail, FiUser, FiCalendar, FiChevronRight, FiFileText, FiPhone, FiBriefcase } from 'react-icons/fi';
import StatusBadge from '../../components/admin/StatusBadge';

/**
 * Submissions List Component
 * Displays a list of contact submissions or membership applications
 * 
 * @param {Object} props
 * @param {Array} props.submissions - Array of submissions/applications
 * @param {string} props.type - Type of submissions ('contact' or 'membership')
 * @param {Function} props.onItemClick - Callback when an item is clicked
 */
export default function SubmissionsList({ submissions, type = 'contact', onItemClick }) {
  const navigate = useNavigate();

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      // Default: navigate to detail view
      navigate(`/admin/submissions/${type}/${item.id}`);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Handle both Date objects and Firestore Timestamps
      const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : date.toDate ? date.toDate() : new Date(date);
      return format(dateObj, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        {type === 'contact' ? (
          <>
            <FiMail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No contact submissions yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Contact form submissions will appear here
            </p>
          </>
        ) : (
          <>
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">No membership applications yet</p>
            <p className="text-gray-500 text-sm mt-1">
              Membership applications will appear here
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {submissions.map((item) => (
        <div
          key={item.id}
          onClick={() => handleItemClick(item)}
          className="
            bg-white border border-gray-200 rounded-lg p-4
            hover:border-blue-300 hover:shadow-md
            transition-all duration-200 cursor-pointer
            group
          "
        >
          <div className="flex items-start justify-between gap-4">
            {/* Left side - Main info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-3 mb-2">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  {type === 'contact' ? (
                    <FiMail className="w-5 h-5 text-blue-600" />
                  ) : (
                    <FiFileText className="w-5 h-5 text-green-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900 truncate">
                      {item.name || 'Unknown'}
                    </h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <FiMail className="w-4 h-4" />
                      <span className="truncate">{item.email || 'No email'}</span>
                    </span>
                    {type === 'membership' && item.phone && (
                      <span className="flex items-center gap-1">
                        <FiPhone className="w-4 h-4" />
                        <span>{item.phone}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-4 h-4" />
                      <span>{formatDate(item.created_at)}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional info */}
              {type === 'contact' && item.subject && (
                <div className="ml-[52px] mt-2">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {item.subject}
                  </p>
                  {item.message && (
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {item.message}
                    </p>
                  )}
                </div>
              )}

              {type === 'membership' && (
                <div className="ml-[52px] mt-2 space-y-1">
                  {item.business_name && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <FiBriefcase className="w-4 h-4" />
                      <span>{item.business_name}</span>
                    </div>
                  )}
                  {item.business_type && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Type:</span> {item.business_type}
                    </div>
                  )}
                  {item.message && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {item.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Arrow */}
            <div className="flex-shrink-0">
              <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

