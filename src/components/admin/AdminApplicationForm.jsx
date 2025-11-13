import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiFileText, FiSend, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import toast from 'react-hot-toast';

/**
 * Admin Application Form Component
 * Allows users to apply for admin access
 * 
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback when application is submitted successfully
 */
export default function AdminApplicationForm({ onSuccess }) {
  const { applyForAdminAccess, getMyApplication, loading } = useAdminManagement();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const myApplication = getMyApplication();

  const onSubmit = async (data) => {
    try {
      setIsSubmitting(true);
      await applyForAdminAccess(data.name, data.reason);
      toast.success('Admin application submitted successfully! An admin will review your request.');
      reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error submitting admin application:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user already has an application, show status
  if (myApplication) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {myApplication.status === 'pending' && (
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiLoader className="w-6 h-6 text-yellow-600 animate-spin" />
              </div>
            )}
            {myApplication.status === 'approved' && (
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            )}
            {myApplication.status === 'denied' && (
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <FiFileText className="w-6 h-6 text-red-600" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {myApplication.status === 'pending' && 'Application Pending Review'}
              {myApplication.status === 'approved' && 'Application Approved'}
              {myApplication.status === 'denied' && 'Application Denied'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {myApplication.status === 'pending' &&
                'Your admin application is being reviewed. You will be notified once a decision is made.'}
              {myApplication.status === 'approved' &&
                'Congratulations! Your admin application has been approved. You now have admin access.'}
              {myApplication.status === 'denied' &&
                'Unfortunately, your admin application was not approved at this time.'}
            </p>
            {myApplication.reason && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm font-medium text-gray-700 mb-1">Your Application:</p>
                <p className="text-sm text-gray-600">{myApplication.reason}</p>
              </div>
            )}
            {myApplication.denial_reason && (
              <div className="bg-red-50 rounded-lg p-4">
                <p className="text-sm font-medium text-red-700 mb-1">Reason for Denial:</p>
                <p className="text-sm text-red-600">{myApplication.denial_reason}</p>
              </div>
            )}
            {myApplication.approved_by && (
              <p className="text-xs text-gray-500 mt-2">
                Approved by: {myApplication.approved_by}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for Admin Access</h2>
        <p className="text-gray-600">
          Request administrative access to manage submissions and applications. Your request will be reviewed by an existing administrator.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            <FiUser className="inline mr-1 w-4 h-4" />
            Full Name
          </label>
          <input
            id="name"
            type="text"
            {...register('name', {
              required: 'Name is required',
              minLength: {
                value: 2,
                message: 'Name must be at least 2 characters',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter your full name"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        {/* Reason Field */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            <FiFileText className="inline mr-1 w-4 h-4" />
            Reason for Request
          </label>
          <textarea
            id="reason"
            rows={6}
            {...register('reason', {
              required: 'Please provide a reason for requesting admin access',
              minLength: {
                value: 20,
                message: 'Reason must be at least 20 characters',
              },
              maxLength: {
                value: 1000,
                message: 'Reason must be less than 1000 characters',
              },
            })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Explain why you need admin access and how you will use it responsibly..."
          />
          {errors.reason && (
            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || loading}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSubmitting ? (
            <>
              <FiLoader className="w-5 h-5 animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <FiSend className="w-5 h-5" />
              <span>Submit Application</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}

