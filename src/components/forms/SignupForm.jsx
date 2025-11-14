import { db } from '../../lib/firebase'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { FiUser, FiMail, FiPhone, FiBriefcase, FiAlertCircle, FiCheckCircle, FiSend } from 'react-icons/fi';
import Button from '../common/Button';

/**
 * Signup Form Component for Membership Application
 * Uses React Hook Form for validation
 */
export default function SignupForm() {
  const [submitStatus, setSubmitStatus] = useState(null); // 'success', 'error', or null
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdApplicationId, setCreatedApplicationId] = useState(null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm();
  
  // Watch the businessType field to show/hide "Other" input
  const businessType = watch('businessType');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    setCreatedApplicationId(null);
  
    try {
      // Add document to Firestore
      const docRef = await addDoc(collection(db, 'membership_applications'), {
        name: data.name,
        email: data.email,
        phone: data.phone,
        business_name: data.businessName || null,
        business_type: data.businessType === 'other' ? data.otherBusinessType : data.businessType,
        message: data.message || null,
        status: 'pending',
        created_at: serverTimestamp(),
      });
  
      if (docRef.id) {
        setSubmitStatus('success');
        setCreatedApplicationId(docRef.id);
        reset(); // Clear form on success
      }
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
          <FiCheckCircle className="text-green-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900 mb-1">Application Submitted Successfully!</h3>
            <p className="text-sm text-green-700">
              Thank you for your interest in joining ACBF. We'll review your application and get back to you soon.
            </p>

            {createdApplicationId && (
              <div className="mt-4 space-y-3">
                <p className="text-sm text-green-800">
                  Create your member account now so you can track your approval status and access the portal once approved.
                </p>
                <Link to={`/register/${createdApplicationId}`} className="inline-block">
                  <Button variant="primary" size="md">
                    Create Account
                  </Button>
                </Link>
                <p className="text-xs text-green-700">
                  You can also create your account later using the link sent to your email.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <FiAlertCircle className="text-red-600 text-xl flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">Error Submitting Application</h3>
            <p className="text-sm text-red-700">
              There was an error submitting your application. Please try again later or contact us directly.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Name Field */}
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
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.name && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.name.message}
            </p>
          )}
        </div>

        {/* Email Field */}
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
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Phone Field */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('phone', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[\d\s\-\+\(\)]+$/,
                  message: 'Invalid phone number format',
                },
              })}
              type="tel"
              id="phone"
              placeholder="+27 12 345 6789"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.phone ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Business Name Field */}
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
            Business Name
          </label>
          <div className="relative">
            <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              {...register('businessName')}
              type="text"
              id="businessName"
              placeholder="Your Business Name (if applicable)"
              className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.businessName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
          </div>
          {errors.businessName && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.businessName.message}
            </p>
          )}
        </div>

        {/* Business Type Field */}
        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-2">
            Business Type / Profession <span className="text-red-500">*</span>
          </label>
          <select
            {...register('businessType', {
              required: 'Please select a business type or profession',
            })}
            id="businessType"
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
              errors.businessType ? 'border-red-500' : 'border-gray-300'
            }`}
          >
            <option value="">Select a category</option>
            <option value="agriculture-hunting-forestry-fishing">Agriculture, hunting, forestry and fishing</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="construction">Construction</option>
            <option value="mining-quarrying">Mining and quarrying</option>
            <option value="electricity-gas-water">Electricity, gas and water supply</option>
            <option value="wholesale-retail-trade">Wholesale and retail trade</option>
            <option value="automotive-engineering">Automotive engineering</option>
            <option value="transport-storage-communication">Transport, storage and communication</option>
            <option value="education-community-social-personal">Education, Community, social and personal services</option>
            <option value="catering-accommodation">Catering and accommodation</option>
            <option value="financial-intermediation-insurance-real-estate">Financial intermediation, insurance, real-estate and business services</option>
            <option value="professional-services">Professional services</option>
            <option value="other">Other</option>
          </select>
          {errors.businessType && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.businessType.message}
            </p>
          )}
          
          {/* Other Business Type Input - Shows when "Other" is selected */}
          {businessType === 'other' && (
            <div className="mt-4">
              <label htmlFor="otherBusinessType" className="block text-sm font-medium text-gray-700 mb-2">
                Please specify your business type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('otherBusinessType', {
                    required: businessType === 'other' ? 'Please specify your business type' : false,
                    minLength: {
                      value: 2,
                      message: 'Business type must be at least 2 characters',
                    },
                  })}
                  type="text"
                  id="otherBusinessType"
                  placeholder="Enter your business type or profession"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.otherBusinessType ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.otherBusinessType && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="text-xs" />
                  {errors.otherBusinessType.message}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Message Field */}
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
            Additional Information
          </label>
          <textarea
            {...register('message', {
              maxLength: {
                value: 500,
                message: 'Message must be less than 500 characters',
              },
            })}
            id="message"
            rows="4"
            placeholder="Tell us about yourself and why you'd like to join ACBF..."
            className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${
              errors.message ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
              <FiAlertCircle className="text-xs" />
              {errors.message.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
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
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              <>
                <FiSend />
                Submit Application
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

