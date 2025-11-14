import { format } from 'date-fns';
import {
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiHelpCircle,
} from 'react-icons/fi';

const STATUS_CONFIG = {
  pending: {
    icon: FiClock,
    color: 'border-yellow-200 bg-yellow-50 text-yellow-800',
    title: 'Membership Under Review',
    message:
      "Thank you for registering! Your membership application is currently under review. We'll notify you via email once a decision has been made.",
  },
  approved: {
    icon: FiCheckCircle,
    color: 'border-green-200 bg-green-50 text-green-800',
    title: 'Membership Approved',
    message:
      'Congratulations! Your membership has been approved. You now have access to the member portal and exclusive resources.',
  },
  rejected: {
    icon: FiXCircle,
    color: 'border-red-200 bg-red-50 text-red-800',
    title: 'Membership Not Approved',
    message:
      'We’re sorry, but your membership application was not approved at this time. Please review any notes below or contact the admin team for more information.',
  },
};

function formatTimestamp(timestamp) {
  if (!timestamp) {
    return null;
  }

  try {
    if (timestamp instanceof Date) {
      return format(timestamp, 'PPPp');
    }

    if (typeof timestamp?.toDate === 'function') {
      return format(timestamp.toDate(), 'PPPp');
    }

    return format(new Date(timestamp), 'PPPp');
  } catch (error) {
    console.warn('Unable to format timestamp value:', timestamp, error);
    return null;
  }
}

export default function ApprovalStatus({
  status,
  updatedAt,
  rejectionReason,
  className = '',
}) {
  const normalizedStatus = (status || '').toLowerCase();
  const config = STATUS_CONFIG[normalizedStatus] ?? {
    icon: FiHelpCircle,
    color: 'border-gray-200 bg-gray-50 text-gray-700',
    title: 'Status Unknown',
    message:
      'We could not determine your current membership status. Please contact support for assistance.',
  };

  const Icon = config.icon;
  const formattedTimestamp = formatTimestamp(updatedAt);

  return (
    <div
      className={`border rounded-xl p-5 md:p-6 flex flex-col gap-3 transition-colors ${config.color} ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Icon className="h-6 w-6 md:h-7 md:w-7" />
        </div>
        <div>
          <h2 className="text-lg md:text-xl font-semibold">{config.title}</h2>
          <p className="mt-1 text-sm md:text-base leading-relaxed text-current/90">
            {config.message}
          </p>
        </div>
      </div>

      {formattedTimestamp && (
        <p className="text-xs md:text-sm text-current/80 pl-9">
          Last updated {formattedTimestamp}
        </p>
      )}

      {normalizedStatus === 'rejected' && rejectionReason && (
        <div className="mt-2 pl-9">
          <p className="text-xs font-medium uppercase tracking-wide text-current/90">
            Rejection Reason
          </p>
          <p className="text-sm md:text-base text-current/95 mt-1">
            {rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
}

