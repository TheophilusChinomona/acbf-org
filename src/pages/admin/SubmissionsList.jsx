import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { FiMail, FiUser, FiCalendar, FiChevronRight, FiFileText, FiPhone, FiBriefcase, FiArchive, FiRotateCw, FiAward, FiChevronDown, FiChevronUp, FiTrash2, FiLoader, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';
import StatusBadge from '../../components/admin/StatusBadge';
import Button from '../../components/common/Button';
import toast from 'react-hot-toast';

/**
 * Submissions List Component
 * Displays a list of contact submissions, membership applications, or awards nominations
 *
 * @param {Object} props
 * @param {Array} props.submissions - Array of submissions/applications/nominations
 * @param {string} props.type - Type of submissions ('contact', 'membership', or 'awards')
 * @param {Function} props.onItemClick - Callback when an item is clicked
 * @param {boolean} props.showArchived - Whether currently showing archived items
 * @param {Function} props.onArchive - Callback to archive an item
 * @param {Function} props.onUnarchive - Callback to unarchive an item
 * @param {Function} props.onBatchDelete - Callback for batch delete
 */
export default function SubmissionsList({
  submissions,
  type = 'contact',
  onItemClick,
  showArchived = false,
  onArchive,
  onUnarchive,
  onBatchDelete,
}) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleItemClick = (item) => {
    if (onItemClick) {
      onItemClick(item);
    } else {
      // Default: navigate to detail view
      navigate(`/admin/submissions/${type}/${item.id}`);
    }
  };

  // Handle checkbox selection
  const handleSelectItem = (itemId, e) => {
    e.stopPropagation();
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  // Handle select all
  const handleSelectAll = (e) => {
    e.stopPropagation();
    if (selectedItems.length === submissions.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(submissions.map(item => item.id));
    }
  };

  // Handle batch delete
  const handleBatchDelete = async () => {
    if (!onBatchDelete || selectedItems.length === 0) return;

    setIsDeleting(true);
    try {
      const results = await onBatchDelete(selectedItems);

      if (results.success > 0) {
        toast.success(`Successfully deleted ${results.success} item${results.success > 1 ? 's' : ''}`);
      }

      if (results.failed > 0) {
        toast.error(`Failed to delete ${results.failed} item${results.failed > 1 ? 's' : ''}`);
      }

      setSelectedItems([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error batch deleting:', error);
      toast.error('Failed to delete items');
    } finally {
      setIsDeleting(false);
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

  // Check if item can be archived
  const canArchive = (item) => {
    if (type === 'contact') {
      return item.status === 'resolved' && !item.archived;
    } else if (type === 'membership' || type === 'awards') {
      return (item.status === 'approved' || item.status === 'rejected') && !item.archived;
    }
    return false;
  };

  // Check if item can be unarchived
  const canUnarchive = (item) => {
    return item.archived === true;
  };

  if (submissions.length === 0) {
    return (
      <div className="text-center py-12">
        {type === 'contact' ? (
          <>
            <FiMail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {showArchived ? 'No archived contact submissions' : 'No contact submissions yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {showArchived
                ? 'Archived contact submissions will appear here'
                : 'Contact form submissions will appear here'}
            </p>
          </>
        ) : type === 'membership' ? (
          <>
            <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {showArchived ? 'No archived membership applications' : 'No membership applications yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {showArchived
                ? 'Archived membership applications will appear here'
                : 'Membership applications will appear here'}
            </p>
          </>
        ) : (
          <>
            <FiAward className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">
              {showArchived ? 'No archived award nominations' : 'No award nominations yet'}
            </p>
            <p className="text-gray-500 text-sm mt-1">
              {showArchived
                ? 'Archived award nominations will appear here'
                : 'Award nominations will appear here'}
            </p>
          </>
        )}
      </div>
    );
  }

  return (
    <>
      {/* Batch Actions Header */}
      {onBatchDelete && submissions.length > 0 && (
        <div className="mb-4 flex items-center justify-between gap-4 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={selectedItems.length === submissions.length && submissions.length > 0}
              onChange={handleSelectAll}
              className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700">
              {selectedItems.length > 0
                ? `${selectedItems.length} selected`
                : `Select all (${submissions.length})`}
            </span>
          </div>
          {selectedItems.length > 0 && (
            <Button
              onClick={() => setShowDeleteConfirm(true)}
              size="sm"
              variant="outline"
              className="border-red-500 text-red-600 hover:bg-red-50"
            >
              <FiTrash2 className="mr-2" />
              Delete Selected ({selectedItems.length})
            </Button>
          )}
        </div>
      )}

      <div className="space-y-3">
        {submissions.map((item) => (
          <div
            key={item.id}
            className={`
              bg-white border rounded-lg p-3 md:p-4
              hover:border-blue-300 hover:shadow-md
              transition-all duration-200 cursor-pointer
              group min-h-[44px]
              ${selectedItems.includes(item.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
            `}
          >
            <div className="flex items-start justify-between gap-3 md:gap-4">
              {/* Checkbox */}
              {onBatchDelete && (
                <div className="flex-shrink-0 pt-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={(e) => handleSelectItem(item.id, e)}
                    className="w-4 h-4 text-primary focus:ring-primary border-gray-300 rounded cursor-pointer"
                  />
                </div>
              )}

              {/* Left side - Main info */}
              <div className="flex-1 min-w-0" onClick={() => handleItemClick(item)}>
              <div className="flex items-start gap-2 md:gap-3 mb-2">
                <div className={`flex-shrink-0 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                  type === 'contact' ? 'bg-blue-100' : type === 'membership' ? 'bg-green-100' : 'bg-yellow-100'
                }`}>
                  {type === 'contact' ? (
                    <FiMail className="w-4 h-4 md:w-5 md:h-5 text-primary" />
                  ) : type === 'membership' ? (
                    <FiFileText className="w-4 h-4 md:w-5 md:h-5 text-green-600" />
                  ) : (
                    <FiAward className="w-4 h-4 md:w-5 md:h-5 text-yellow-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                    <h3 className="font-semibold text-sm md:text-base text-gray-900 truncate">
                      {type === 'awards' ? (item.nominee?.organization || 'No company name') : (item.name || 'Unknown')}
                    </h3>
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-4 text-xs md:text-sm text-gray-600">
                    {type !== 'awards' && (
                      <span className="flex items-center gap-1">
                        <FiMail className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">
                          {item.email || 'No email'}
                        </span>
                      </span>
                    )}
                    {type === 'membership' && item.phone && (
                      <span className="flex items-center gap-1">
                        <FiPhone className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                        <span className="truncate">{item.phone}</span>
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <FiCalendar className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span>
                        {type === 'awards' ? formatDate(item.submittedAt) : formatDate(item.created_at)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Additional info */}
              {type === 'contact' && item.subject && (
                <div className="ml-0 sm:ml-[36px] md:ml-[52px] mt-2">
                  <p className="text-xs md:text-sm font-medium text-gray-700 mb-1">
                    {item.subject}
                  </p>
                  {item.message && (
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2">
                      {item.message}
                    </p>
                  )}
                </div>
              )}

              {type === 'membership' && (
                <div className="ml-0 sm:ml-[36px] md:ml-[52px] mt-2 space-y-1">
                  {item.business_name && (
                    <div className="flex items-center gap-1 text-xs md:text-sm text-gray-600">
                      <FiBriefcase className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" />
                      <span className="truncate">{item.business_name}</span>
                    </div>
                  )}
                  {item.business_type && (
                    <div className="text-xs md:text-sm text-gray-600">
                      <span className="font-medium">Type:</span> <span className="truncate">{item.business_type}</span>
                    </div>
                  )}
                  {item.message && (
                    <p className="text-xs md:text-sm text-gray-600 line-clamp-2 mt-1">
                      {item.message}
                    </p>
                  )}
                </div>
              )}

              {type === 'awards' && (
                <div className="ml-0 sm:ml-[36px] md:ml-[52px] mt-2 flex flex-wrap items-center gap-2">
                  {/* Category Badge */}
                  {item.category && (
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                      <FiAward className="w-3 h-3" />
                      {item.category}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right side - Actions & Arrow */}
            <div className="flex-shrink-0 flex items-center gap-2 min-h-[44px]">
              {/* Archive/Unarchive Button */}
              {canArchive(item) && onArchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive(item.id);
                  }}
                  className="hidden sm:flex"
                  title="Archive this item"
                >
                  <FiArchive className="w-4 h-4" />
                </Button>
              )}
              {canUnarchive(item) && onUnarchive && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUnarchive(item.id);
                  }}
                  className="hidden sm:flex"
                  title="Unarchive this item"
                >
                  <FiRotateCw className="w-4 h-4" />
                </Button>
              )}
              <FiChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>

    {/* Batch Delete Confirmation Modal */}
    {showDeleteConfirm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete Multiple Items</h3>
              <p className="text-sm text-gray-600">This action cannot be undone</p>
            </div>
          </div>

          <p className="text-gray-700 mb-6">
            Are you sure you want to delete <strong>{selectedItems.length}</strong> selected{' '}
            {type === 'contact'
              ? 'submission'
              : type === 'membership'
              ? 'application'
              : 'nomination'}
            {selectedItems.length > 1 ? 's' : ''}
            ? All associated data will be permanently removed.
          </p>

          <div className="flex gap-3 justify-end">
            <Button
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBatchDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? (
                <>
                  <FiLoader className="animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  <FiTrash2 className="mr-2" />
                  Delete {selectedItems.length} Item{selectedItems.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </>
  );
}

