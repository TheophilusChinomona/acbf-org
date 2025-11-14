import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FiUser, FiMail, FiFileText, FiSend, FiLoader, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { useAdminManagement } from '../../hooks/useAdminManagement';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

/**
 * Admin Application Form Component
 * @deprecated Admin applications are no longer accepted. Use invitation system instead.
 * This component is kept for displaying existing application status only.
 *
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback when application is submitted successfully
 */
export default function AdminApplicationForm({ onSuccess }) {
  const { getMyApplication, loading } = useAdminManagement();
  const myApplication = getMyApplication();

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

  // Show deprecation notice - applications no longer accepted
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-start gap-4 mb-6">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
            <FiAlertCircle className="w-6 h-6 text-amber-600" />
          </div>
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Admin Applications No Longer Accepted
          </h2>
          <p className="text-gray-600">
            Admin access is now granted via invitation only for improved security.
          </p>
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
          <FiMail className="w-5 h-5" />
          How to Get Admin Access
        </h3>
        <p className="text-blue-800 mb-4">
          To become an administrator, you must be invited by an existing administrator.
          Please contact an existing admin to request an invitation.
        </p>
        <div className="bg-white rounded-lg p-4">
          <p className="font-medium text-blue-900 mb-2">Steps:</p>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Contact an existing administrator</li>
            <li>Explain why you need admin access</li>
            <li>Wait for the invitation link via email</li>
            <li>Complete your registration using the invitation link</li>
          </ol>
        </div>
      </div>

      <Link
        to="/contact"
        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
      >
        <FiMail className="w-5 h-5" />
        <span>Contact Us</span>
      </Link>
    </div>
  );
}

