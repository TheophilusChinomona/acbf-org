import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import {
  FiMail,
  FiLock,
  FiUser,
  FiAlertCircle,
  FiCheckCircle,
  FiInfo,
} from 'react-icons/fi';
import Button from '../common/Button';
import { db } from '../../lib/firebase';
import { useAuth } from '../../hooks/useAuth';
import { useUserManagement } from '../../hooks/useUserManagement';
import { USER_ROLES } from '../../utils/userRoles';

const defaultFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function MemberRegisterForm({ applicationId = null }) {
  const navigate = useNavigate();
  const { register: registerUser, error: authError } = useAuth();
  const { createUserProfile } = useUserManagement();

  const [application, setApplication] = useState(null);
  const [isLoadingApplication, setIsLoadingApplication] = useState(!!applicationId);
  const [applicationError, setApplicationError] = useState(null);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [accountAlreadyCreated, setAccountAlreadyCreated] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: defaultFormValues,
  });

  const passwordValue = watch('password');
  const confirmPasswordValue = watch('confirmPassword');

  const isPrefilled = useMemo(() => Boolean(applicationId), [applicationId]);

  useEffect(() => {
    if (!applicationId) {
      return undefined;
    }

    let isMounted = true;
    const fetchApplication = async () => {
      setIsLoadingApplication(true);
      setApplicationError(null);

      try {
        const applicationRef = doc(db, 'membership_applications', applicationId);
        const applicationSnapshot = await getDoc(applicationRef);

        if (!applicationSnapshot.exists()) {
          throw new Error('Membership application not found. Please make sure you used the correct link.');
        }

        const applicationData = {
          id: applicationSnapshot.id,
          ...applicationSnapshot.data(),
        };

        if (applicationData.account_created) {
          setAccountAlreadyCreated(true);
        }

        if (isMounted) {
          setApplication(applicationData);
          reset({
            ...defaultFormValues,
            name: applicationData.name || '',
            email: applicationData.email || '',
          });
        }
      } catch (error) {
        console.error('Error fetching application:', error);
        if (isMounted) {
          setApplicationError(error.message || 'Unable to load membership application.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingApplication(false);
        }
      }
    };

    fetchApplication();

    return () => {
      isMounted = false;
    };
  }, [applicationId, reset]);

  useEffect(() => {
    if (passwordValue && confirmPasswordValue) {
      if (passwordValue !== confirmPasswordValue) {
        setError('confirmPassword', {
          type: 'manual',
          message: 'Passwords do not match',
        });
      } else if (errors.confirmPassword?.type === 'manual') {
        clearErrors('confirmPassword');
      }
    }
  }, [passwordValue, confirmPasswordValue, setError, clearErrors, errors.confirmPassword]);

  const handleRegistration = async (formValues) => {
    if (formValues.password !== formValues.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: 'Passwords do not match',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);
    setSuccessMessage('');

    try {
      const trimmedEmail = formValues.email.trim();
      const trimmedName = formValues.name.trim();

      const user = await registerUser(trimmedEmail, formValues.password);

      await createUserProfile(user.uid, {
        email: trimmedEmail,
        name: trimmedName || trimmedEmail,
        role: USER_ROLES.MEMBER,
        status: 'pending',
        member_application_id: applicationId || null,
      });

      if (applicationId) {
        const applicationRef = doc(db, 'membership_applications', applicationId);
        try {
          await updateDoc(applicationRef, {
            user_id: user.uid,
            account_created: true,
            account_created_at: serverTimestamp(),
          });
        } catch (updateError) {
          console.error('Failed to update membership application with account details:', updateError);
        }
      }

      setSubmitStatus('success');
      setSuccessMessage(
        applicationId
          ? 'Account created! Your membership application is under review. You will receive an email once a decision is made.'
          : 'Account created! You can log in once your membership is approved.'
      );

      reset(defaultFormValues);
      setTimeout(() => {
        navigate('/member/pending', { replace: true });
      }, 2000);
    } catch (error) {
      console.error('Registration error:', error);

      let friendlyMessage = 'An error occurred while creating your account. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'An account with this email already exists. Try logging in instead.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'Password must be at least 6 characters.';
      } else if (error.message) {
        friendlyMessage = error.message;
      }

      setSubmitStatus('error');
      setApplicationError(friendlyMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingApplication) {
    return (
      <div className="w-full p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3 text-gray-700">
          <svg className="animate-spin h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Loading membership application...</span>
        </div>
      </div>
    );
  }

  if (accountAlreadyCreated) {
    return (
      <div className="w-full p-6 bg-accent border border-primary-light rounded-lg">
        <div className="flex items-start gap-3 text-primary-dark">
          <FiInfo className="text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-secondary-dark mb-1">Account Already Created</h3>
            <p className="text-sm">
              An account has already been created for this membership application. If you need help accessing your account,
              please try resetting your password or contact support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (applicationError && !submitStatus) {
    return (
      <div className="w-full p-6 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Unable to Continue</h3>
            <p className="text-sm text-red-700">
              {applicationError}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <FiCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Registration Successful!</h3>
            <p className="text-sm text-green-700">
              {successMessage}
            </p>
            <p className="text-xs text-green-700 mt-2">
              You will be redirected shortly. If nothing happens, please navigate to the member portal to check your status.
            </p>
          </div>
        </div>
      )}

      {(submitStatus === 'error' || authError) && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Registration Failed</h3>
            <p className="text-sm text-red-700">
              {applicationError || authError || 'Please double-check your details and try again.'}
            </p>
          </div>
        </div>
      )}

      {application && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
          <h3 className="font-semibold text-gray-900 mb-1">Application Details</h3>
          <p><span className="font-medium">Name:</span> {application.name || 'Not provided'}</p>
          <p><span className="font-medium">Email:</span> {application.email || 'Not provided'}</p>
          <p className="text-xs text-gray-600 mt-2">
            These details will be used for your member account.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit(handleRegistration)} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('name', {
                required: 'Full name is required',
                minLength: {
                  value: 2,
                  message: 'Name must be at least 2 characters',
                },
              })}
              type="text"
              id="name"
              placeholder="Your Full Name"
              autoComplete="name"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              } ${isPrefilled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              readOnly={isPrefilled}
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
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              type="email"
              id="email"
              placeholder="your.email@example.com"
              autoComplete="email"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } ${isPrefilled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              readOnly={isPrefilled}
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters',
                },
              })}
              type="password"
              id="password"
              placeholder="Create a password"
              autoComplete="new-password"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.password ? 'border-red-500' : 'border-gray-300'
              }`}
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('confirmPassword', {
                required: 'Please confirm your password',
              })}
              type="password"
              id="confirmPassword"
              placeholder="Re-enter your password"
              autoComplete="new-password"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            fullWidth
            disabled={isSubmitting}
            className="flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Creating Account...
              </>
            ) : (
              'Create Account'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

