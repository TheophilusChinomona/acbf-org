import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import {
  FiSend,
  FiMail,
  FiUser,
  FiMessageSquare,
  FiAlertCircle,
  FiCheckCircle,
  FiBriefcase,
  FiPhone,
  FiGlobe,
  FiAward
} from 'react-icons/fi';
import Button from '../common/Button';
import awardCategories from '../../data/award-categories.json';

// Zod validation schema
const nominationSchema = z.object({
  // Award category
  category: z.string().min(1, 'Please select an award category'),

  // Nominee information
  nomineeName: z.string()
    .min(2, 'Nominee name must be at least 2 characters')
    .max(100, 'Nominee name must be less than 100 characters'),
  nomineeEmail: z.string()
    .email('Please enter a valid email address'),
  nomineeOrganization: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  nomineePhone: z.string().optional(),
  nomineeWebsite: z.string().url('Please enter a valid URL').optional().or(z.literal('')),

  // Nominator information
  nominatorName: z.string()
    .min(2, 'Your name must be at least 2 characters')
    .max(100, 'Your name must be less than 100 characters'),
  nominatorEmail: z.string()
    .email('Please enter a valid email address'),
  nominatorOrganization: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(100, 'Organization name must be less than 100 characters'),
  relationship: z.string().min(1, 'Please select your relationship'),

  // Nomination details
  supportingStatement: z.string()
    .min(100, 'Supporting statement must be at least 100 characters')
    .max(1000, 'Supporting statement must be less than 1000 characters'),
  achievements: z.string()
    .min(100, 'Key achievements must be at least 100 characters')
    .max(1000, 'Key achievements must be less than 1000 characters'),
});

export default function AwardsNominationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm({
    resolver: zodResolver(nominationSchema),
  });

  const selectedCategory = watch('category');

  const onSubmit = async (data) => {
    setIsSubmitting(true);

    try {
      // Prepare nomination data
      const nominationData = {
        // Metadata
        submittedAt: serverTimestamp(),
        nominationYear: new Date().getFullYear(),
        status: 'pending',

        // Award category
        category: data.category,

        // Nominee information
        nominee: {
          fullName: data.nomineeName,
          email: data.nomineeEmail,
          organization: data.nomineeOrganization,
          phone: data.nomineePhone || null,
          website: data.nomineeWebsite || null,
        },

        // Nominator information
        nominator: {
          fullName: data.nominatorName,
          email: data.nominatorEmail,
          organization: data.nominatorOrganization,
          relationship: data.relationship,
        },

        // Nomination details
        supportingStatement: data.supportingStatement,
        achievements: data.achievements,
      };

      // Submit to Firestore
      const docRef = await addDoc(collection(db, 'awards_nominations'), nominationData);

      if (docRef.id) {
        toast.success('Nomination submitted successfully! Thank you for your submission.');
        reset(); // Clear form
      }
    } catch (error) {
      console.error('Nomination submission error:', error);
      toast.error('Failed to submit nomination. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

        {/* Award Category Selection */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiAward className="text-primary" />
            Award Category
          </h3>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Select Award Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category')}
              id="category"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                errors.category ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="">-- Select an award category --</option>
              {awardCategories.map((category) => (
                <option key={category.id} value={category.name}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <FiAlertCircle className="flex-shrink-0" />
                {errors.category.message}
              </p>
            )}
            {selectedCategory && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  {awardCategories.find(cat => cat.name === selectedCategory)?.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Nominee Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="text-primary" />
            Nominee Information
          </h3>

          <div className="space-y-4">
            {/* Nominee Name */}
            <div>
              <label htmlFor="nomineeName" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('nomineeName')}
                  type="text"
                  id="nomineeName"
                  placeholder="Nominee's full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.nomineeName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nomineeName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.nomineeName.message}
                </p>
              )}
            </div>

            {/* Nominee Email */}
            <div>
              <label htmlFor="nomineeEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('nomineeEmail')}
                  type="email"
                  id="nomineeEmail"
                  placeholder="nominee@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.nomineeEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nomineeEmail && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.nomineeEmail.message}
                </p>
              )}
            </div>

            {/* Nominee Organization */}
            <div>
              <label htmlFor="nomineeOrganization" className="block text-sm font-medium text-gray-700 mb-2">
                Organization/Company <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('nomineeOrganization')}
                  type="text"
                  id="nomineeOrganization"
                  placeholder="Company or organization name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.nomineeOrganization ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nomineeOrganization && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.nomineeOrganization.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nominee Phone (Optional) */}
              <div>
                <label htmlFor="nomineePhone" className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('nomineePhone')}
                    type="tel"
                    id="nomineePhone"
                    placeholder="+27 12 345 6789"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                  />
                </div>
              </div>

              {/* Nominee Website (Optional) */}
              <div>
                <label htmlFor="nomineeWebsite" className="block text-sm font-medium text-gray-700 mb-2">
                  Website <span className="text-gray-500 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <FiGlobe className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    {...register('nomineeWebsite')}
                    type="url"
                    id="nomineeWebsite"
                    placeholder="https://example.com"
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                      errors.nomineeWebsite ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.nomineeWebsite && (
                  <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <FiAlertCircle className="flex-shrink-0" />
                    {errors.nomineeWebsite.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Nominator Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiUser className="text-primary" />
            Your Information (Nominator)
          </h3>

          <div className="space-y-4">
            {/* Nominator Name */}
            <div>
              <label htmlFor="nominatorName" className="block text-sm font-medium text-gray-700 mb-2">
                Your Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('nominatorName')}
                  type="text"
                  id="nominatorName"
                  placeholder="Your full name"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.nominatorName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nominatorName && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.nominatorName.message}
                </p>
              )}
            </div>

            {/* Nominator Email */}
            <div>
              <label htmlFor="nominatorEmail" className="block text-sm font-medium text-gray-700 mb-2">
                Your Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('nominatorEmail')}
                  type="email"
                  id="nominatorEmail"
                  placeholder="your@example.com"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.nominatorEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nominatorEmail && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.nominatorEmail.message}
                </p>
              )}
            </div>

            {/* Nominator Organization */}
            <div>
              <label htmlFor="nominatorOrganization" className="block text-sm font-medium text-gray-700 mb-2">
                Your Organization/Company <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FiBriefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  {...register('nominatorOrganization')}
                  type="text"
                  id="nominatorOrganization"
                  placeholder="Your company or organization"
                  className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                    errors.nominatorOrganization ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
              </div>
              {errors.nominatorOrganization && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.nominatorOrganization.message}
                </p>
              )}
            </div>

            {/* Relationship */}
            <div>
              <label htmlFor="relationship" className="block text-sm font-medium text-gray-700 mb-2">
                Your Relationship to Nominee <span className="text-red-500">*</span>
              </label>
              <select
                {...register('relationship')}
                id="relationship"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors ${
                  errors.relationship ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">-- Select relationship --</option>
                <option value="Colleague">Colleague</option>
                <option value="Client">Client</option>
                <option value="Business Partner">Business Partner</option>
                <option value="Peer">Peer</option>
                <option value="Industry Associate">Industry Associate</option>
                <option value="Other">Other</option>
              </select>
              {errors.relationship && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.relationship.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Nomination Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FiMessageSquare className="text-primary" />
            Nomination Details
          </h3>

          <div className="space-y-4">
            {/* Supporting Statement */}
            <div>
              <label htmlFor="supportingStatement" className="block text-sm font-medium text-gray-700 mb-2">
                Supporting Statement <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-2">
                Explain why this nominee deserves this award (100-1000 characters)
              </p>
              <textarea
                {...register('supportingStatement')}
                id="supportingStatement"
                rows="6"
                placeholder="Describe why you believe this nominee deserves recognition..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${
                  errors.supportingStatement ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.supportingStatement && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.supportingStatement.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {watch('supportingStatement')?.length || 0} / 1000 characters
              </p>
            </div>

            {/* Key Achievements */}
            <div>
              <label htmlFor="achievements" className="block text-sm font-medium text-gray-700 mb-2">
                Key Achievements <span className="text-red-500">*</span>
              </label>
              <p className="text-sm text-gray-600 mb-2">
                List the nominee's key achievements and contributions (100-1000 characters)
              </p>
              <textarea
                {...register('achievements')}
                id="achievements"
                rows="6"
                placeholder="Highlight specific achievements, projects, or contributions..."
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors resize-none ${
                  errors.achievements ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.achievements && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <FiAlertCircle className="flex-shrink-0" />
                  {errors.achievements.message}
                </p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {watch('achievements')?.length || 0} / 1000 characters
              </p>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            type="submit"
            size="lg"
            disabled={isSubmitting}
            className="min-w-[200px]"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                Submitting...
              </>
            ) : (
              <>
                <FiSend className="mr-2" />
                Submit Nomination
              </>
            )}
          </Button>
        </div>

        {/* Privacy Notice */}
        <div className="text-center text-sm text-gray-600">
          <p>
            By submitting this form, you agree to our{' '}
            <a href="/privacy-policy" className="text-primary hover:underline">
              Privacy Policy
            </a>{' '}
            and{' '}
            <a href="/terms-of-service" className="text-primary hover:underline">
              Terms of Service
            </a>
            .
          </p>
        </div>
      </form>
    </div>
  );
}
