import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiAlertCircle,
  FiCheckCircle,
  FiLock,
  FiMail,
  FiUser,
  FiInfo,
} from 'react-icons/fi';
import Button from '../common/Button';
import { useAdminInvitations } from '../../hooks/useAdminInvitations';

const defaultValues = {
  name: '',
  password: '',
  confirmPassword: '',
};

export default function AdminInviteAcceptanceForm({ token, invitation, onAccepted }) {
  const { acceptInvitation } = useAdminInvitations();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues,
  });

  const [submitError, setSubmitError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  useEffect(() => {
    if (!invitation) {
      return;
    }

    reset({
      ...defaultValues,
      name: invitation.invitee_name || '',
    });
  }, [invitation, reset]);

  useEffect(() => {
    if (!passwordValue || !confirmPasswordValue) {
      return;
    }

    if (passwordValue !== confirmPasswordValue) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
    } else if (errors.confirmPassword?.type === 'manual') {
      clearErrors('confirmPassword');
    }
  }, [passwordValue, confirmPasswordValue, setError, clearErrors, errors.confirmPassword]);

  const onSubmit = async (values) => {
    if (!token) {
      setSubmitError('Invitation token is missing or invalid.');
      return;
    }

    if (values.password !== values.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitStatus(null);

    try {
      await acceptInvitation({
        token,
        password: values.password,
        name: values.name,
      });

      setSubmitStatus('success');
      if (onAccepted) {
        onAccepted();
      }
    } catch (error) {
      console.error('Failed to accept admin invitation:', error);
      setSubmitError(error.message || 'Failed to accept invitation. Please try again or request a new invite.');
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const expiresLabel = invitation?.expires_at
    ? new Date(invitation.expires_at).toLocaleString()
    : null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accept Admin Invitation</h1>
        <p className="text-sm text-gray-600">
          Complete the form below to create your administrator account using the invitation details provided.
        </p>
      </div>

      {invitation && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <FiMail className="text-gray-500" />
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">Invitation Email</p>
              <p className="text-sm font-medium text-gray-900">{invitation.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <FiUser className="text-gray-500" />
            <div>
              <p className="text-xs uppercase text-gray-500 tracking-wide">Invited By</p>
              <p className="text-sm font-medium text-gray-900">
                {invitation.invited_by_name || invitation.invited_by || 'Admin'}
              </p>
            </div>
          </div>

          {expiresLabel && (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <FiInfo />
              <span>Invitation expires on {expiresLabel}.</span>
            </div>
          )}

          {invitation.note && (
            <div className="text-sm">
              <p className="text-xs font-semibold uppercase text-gray-500 tracking-wide mb-1">Message</p>
              <p className="bg-white border border-gray-200 rounded-md p-3 text-gray-700 whitespace-pre-wrap">
                {invitation.note}
              </p>
            </div>
          )}
        </div>
      )}

      {submitStatus === 'success' && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <FiCheckCircle className="text-lg flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Invitation Accepted</p>
            <p>
              Your administrator account has been created successfully. You can proceed to the admin dashboard.
            </p>
          </div>
        </div>
      )}

      {submitError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <FiAlertCircle className="text-lg flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900">Unable to complete registration</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="invite-name"
              type="text"
              placeholder="Your full name"
              autoComplete="name"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('name', {
                required: 'Please provide your name',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters long',
                },
                maxLength: {
                  value: 120,
                  message: 'Name must be 120 characters or fewer',
                },
              })}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.name.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="invite-password" className="block text-sm font-medium text-gray-700 mb-2">
            Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="invite-password"
              type="password"
              placeholder="Create a password"
              autoComplete="new-password"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters long',
                },
              })}
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.password.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="invite-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="invite-confirm-password"
              type="password"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('confirmPassword', {
                required: 'Please confirm your password',
              })}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full sm:w-auto flex items-center justify-center gap-2"
          disabled={isSubmitting || submitStatus === 'success'}
        >
          {isSubmitting ? 'Creating Account...' : 'Create Admin Account'}
        </Button>
      </form>
    </div>
  );
}


