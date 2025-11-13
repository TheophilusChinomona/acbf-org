import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
  FiMail,
  FiUser,
  FiClock,
  FiClipboard,
  FiCheckCircle,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import Button from '../common/Button';

const DEFAULT_TTL_HOURS = 24 * 7;

const ttlOptions = [
  { label: '24 hours', value: 24 },
  { label: '3 days', value: 24 * 3 },
  { label: '7 days', value: DEFAULT_TTL_HOURS },
  { label: '14 days', value: 24 * 14 },
];

const defaultValues = {
  email: '',
  name: '',
  note: '',
  ttlHours: DEFAULT_TTL_HOURS,
};

export default function AdminInviteForm({
  onCreateInvitation,
  onInvitationCreated,
  defaultTtlHours = DEFAULT_TTL_HOURS,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      ...defaultValues,
      ttlHours: defaultTtlHours,
    },
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [createdInvitation, setCreatedInvitation] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const invitationLink = useMemo(() => {
    if (!createdInvitation?.token) {
      return null;
    }
    if (typeof window === 'undefined') {
      return `/invite/${createdInvitation.token}`;
    }
    const baseUrl = window.location?.origin || '';
    return `${baseUrl}/invite/${createdInvitation.token}`;
  }, [createdInvitation]);

  const handleCopyLink = async () => {
    if (!invitationLink) return;

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(invitationLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = invitationLink;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    } catch (error) {
      console.error('Failed to copy invitation link:', error);
      setCopySuccess(false);
    }
  };

  const onSubmit = async (values) => {
    if (!onCreateInvitation) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setCopySuccess(false);

    try {
      const invitation = await onCreateInvitation({
        email: values.email,
        name: values.name,
        note: values.note,
        ttlHours: Number(values.ttlHours),
      });
      setCreatedInvitation(invitation);
      if (onInvitationCreated) {
        onInvitationCreated(invitation);
      }
      reset({
        ...defaultValues,
        ttlHours: values.ttlHours,
      });
    } catch (error) {
      console.error('Failed to create admin invitation:', error);
      setSubmitError(error.message || 'Unable to create invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Invite a New Admin</h2>
        <p className="text-sm text-gray-600">
          Send an invitation email to grant administrative access. Invitations include a secure link that expires after a set period.
        </p>
      </div>

      {submitError && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <FiAlertCircle className="text-lg flex-shrink-0" />
          <div>
            <p className="font-medium text-red-900">Invitation Failed</p>
            <p>{submitError}</p>
          </div>
        </div>
      )}

      {createdInvitation && (
        <div className="space-y-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-green-900">Invitation Created</p>
              <p className="text-sm text-green-700">
                Share the invitation link with the invitee or let them know to check their email.
              </p>
            </div>
          </div>

          <div className="bg-white border border-green-200 rounded-lg p-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Invitation Link</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <code className="flex-1 text-sm text-gray-800 break-all">{invitationLink}</code>
              <Button
                type="button"
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FiClipboard />
                {copySuccess ? 'Copied!' : 'Copy Link'}
              </Button>
            </div>
          </div>

          <div className="text-xs text-gray-600 flex items-start gap-2">
            <FiInfo className="flex-shrink-0 mt-0.5" />
            <span>
              Invitation expires{' '}
              {createdInvitation.expires_at
                ? new Date(createdInvitation.expires_at).toLocaleString()
                : 'soon'}.
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="invite-email" className="block text-sm font-medium text-gray-700 mb-2">
            Admin Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="invite-email"
              type="email"
              autoComplete="email"
              placeholder="admin@example.com"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              {...register('email', {
                required: 'Email address is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.email.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="invite-name" className="block text-sm font-medium text-gray-700 mb-2">
            Invitee Name <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              id="invite-name"
              type="text"
              autoComplete="name"
              placeholder="Full name of invitee"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              {...register('name', {
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
          <label htmlFor="invite-note" className="block text-sm font-medium text-gray-700 mb-2">
            Personal Message <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            id="invite-note"
            rows={3}
            placeholder="Add a short note for the invitee (visible in the invitation email)."
            className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors text-sm"
            {...register('note', {
              maxLength: {
                value: 500,
                message: 'Note must be 500 characters or fewer',
              },
            })}
          />
          {errors.note && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.note.message}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="invite-ttl" className="block text-sm font-medium text-gray-700 mb-2">
            Invitation Expiration
          </label>
          <div className="relative">
            <FiClock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              id="invite-ttl"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              {...register('ttlHours', {
                required: true,
                valueAsNumber: true,
                validate: (value) => value > 0 || 'Expiration must be greater than zero',
              })}
            >
              {ttlOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full sm:w-auto flex items-center justify-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending Invitation...' : 'Send Invitation'}
          </Button>
        </div>
      </form>
    </div>
  );
}


