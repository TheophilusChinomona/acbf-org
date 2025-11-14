import { useParams, Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiPhone, FiGlobe, FiMapPin, FiCalendar, FiDownload, FiExternalLink } from 'react-icons/fi';
import { Container, Section, SEO } from '../components/common';
import { motion } from 'framer-motion';
import {
  useMember,
  useMembers,
  useMembersBySector,
} from '../hooks/useMembers';
import { formatDate } from '../utils/formatDate';
import { MemberCard } from '../components/members';
import Button from '../components/common/Button';
import NotFound from './NotFound';

export default function MemberItem() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const member = useMember(slug);
  const allMembers = useMembers();
  const relatedMembers = member ? useMembersBySector(member.sector).filter(m => m.id !== member.id).slice(0, 3) : [];

  if (!member) {
    return <NotFound />;
  }

  // Get previous and next members
  const sortedMembers = [...allMembers].sort(
    (a, b) => new Date(b.memberSince || 0) - new Date(a.memberSince || 0)
  );
  const currentIndex = sortedMembers.findIndex((m) => m.id === member.id);
  const prevMember = currentIndex > 0 ? sortedMembers[currentIndex - 1] : null;
  const nextMember =
    currentIndex < sortedMembers.length - 1
      ? sortedMembers[currentIndex + 1]
      : null;

  // SEO description
  const description = member.description
    ? member.description.substring(0, 160)
    : `Learn more about ${member.businessName || member.name}, a member of ACBF RSA.`;

  return (
    <>
      <SEO
        title={member.businessName || member.name}
        description={description}
        image={member.logo || member.featuredImage}
        url={typeof window !== 'undefined' ? window.location.href : ''}
      />
      
      {/* Hero Section with Gradient Background */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-secondary-dark via-secondary to-secondary-light py-12 md:py-16 lg:py-20">
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
        </div>

        <Container>
          <div className="relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center max-w-4xl mx-auto"
            >
              {/* Back Button */}
              <div className="mb-6">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/members')}
                  className="flex items-center gap-2 mx-auto bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <FiArrowLeft />
                  Back to Members
                </Button>
              </div>

              {/* Sector Badge */}
              {member.sector && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="flex flex-wrap gap-2 justify-center mb-6"
                >
                  <span className="px-3 py-1 text-sm font-medium bg-white/20 backdrop-blur-sm text-white rounded-full border border-white/30">
                    {member.sector}
                  </span>
                </motion.div>
              )}

              {/* Logo */}
              {member.logo && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="inline-flex items-center justify-center mb-8"
                >
                  <img
                    src={member.logo}
                    alt={member.businessName || member.name}
                    className="max-w-[200px] max-h-[200px] object-contain bg-white/10 backdrop-blur-sm rounded-lg p-4 border-2 border-white/30"
                  />
                </motion.div>
              )}

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight"
              >
                {member.businessName || member.name}
              </motion.h1>

              {/* Tagline */}
              {member.tagline && (
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="text-xl text-white/90 mb-6 italic"
                >
                  {member.tagline}
                </motion.p>
              )}

              {/* Meta Information */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="flex flex-wrap items-center justify-center gap-6 text-white/90"
              >
                {member.location && (
                  <div className="flex items-center gap-2">
                    <FiMapPin className="w-5 h-5" />
                    <span className="font-medium">{member.location}</span>
                  </div>
                )}
                {member.memberSince && (
                  <div className="flex items-center gap-2">
                    <FiCalendar className="w-5 h-5" />
                    <time dateTime={member.memberSince}>
                      Member since {formatDate(member.memberSince, 'MMMM yyyy')}
                    </time>
                  </div>
                )}
              </motion.div>
            </motion.div>
          </div>
        </Container>

        {/* Bottom Wave Decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-12 text-white" viewBox="0 0 1200 120" preserveAspectRatio="none" fill="none">
            <path d="M0,0 C300,120 900,0 1200,120 L1200,120 L0,120 Z" fill="white"></path>
          </svg>
        </div>
      </section>

      <Section className="py-12">
      <Container>
        <article className="max-w-6xl mx-auto">
          {/* Description */}
          {member.description && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                About
              </h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {member.description}
              </p>
            </div>
          )}

          {/* Company Details */}
          <div className="mb-12 p-6 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Company Details
            </h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.businessName && (
                <>
                  <dt className="font-semibold text-gray-700">Company Name</dt>
                  <dd className="text-gray-600">{member.businessName}</dd>
                </>
              )}
              {member.established && (
                <>
                  <dt className="font-semibold text-gray-700">Established</dt>
                  <dd className="text-gray-600">{member.established}</dd>
                </>
              )}
              {member.sector && (
                <>
                  <dt className="font-semibold text-gray-700">Sector</dt>
                  <dd className="text-gray-600">{member.sector}</dd>
                </>
              )}
              {member.location && (
                <>
                  <dt className="font-semibold text-gray-700">Location</dt>
                  <dd className="text-gray-600">{member.location}</dd>
                </>
              )}
              {member.memberSince && (
                <>
                  <dt className="font-semibold text-gray-700">Member Since</dt>
                  <dd className="text-gray-600">
                    {formatDate(member.memberSince, 'MMMM dd, yyyy')}
                  </dd>
                </>
              )}
              {member.certifications && member.certifications.length > 0 && (
                <>
                  <dt className="font-semibold text-gray-700">Certifications</dt>
                  <dd className="text-gray-600">
                    <div className="flex flex-wrap gap-2">
                      {member.certifications.map((cert, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                        >
                          {cert}
                        </span>
                      ))}
                    </div>
                  </dd>
                </>
              )}
              {member.operatingRegions && member.operatingRegions.length > 0 && (
                <>
                  <dt className="font-semibold text-gray-700">Operating Regions</dt>
                  <dd className="text-gray-600">
                    {member.operatingRegions.join(', ')}
                  </dd>
                </>
              )}
            </dl>
          </div>

          {/* Mission, Purpose, Strategic Intent */}
          {(member.mission || member.purpose || member.strategicIntent) && (
            <div className="mb-12 space-y-6">
              {member.mission && (
                <div className="p-6 bg-accent rounded-lg border border-primary-light">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Our Mission
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {member.mission}
                  </p>
                </div>
              )}
              {member.purpose && (
                <div className="p-6 bg-green-50 rounded-lg border border-green-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Our Purpose
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {member.purpose}
                  </p>
                </div>
              )}
              {member.strategicIntent && (
                <div className="p-6 bg-purple-50 rounded-lg border border-purple-200">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    Our Strategic Intent
                  </h3>
                  <p className="text-gray-700 leading-relaxed">
                    {member.strategicIntent}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Core Values */}
          {member.coreValues && member.coreValues.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Core Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {member.coreValues.map((value, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <h3 className="text-lg font-bold text-primary mb-3">
                      {value.name}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Statistics */}
          {member.statistics && member.statistics.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Key Statistics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {member.statistics.map((stat, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-primary-light text-center"
                  >
                    <div className="text-3xl font-bold text-primary mb-2">
                      {stat.value}
                    </div>
                    <div className="text-gray-700 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* What Guides Us */}
          {member.whatGuidesUs && member.whatGuidesUs.length > 0 && (
            <div className="mb-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                What Guides Us
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {member.whatGuidesUs.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Values */}
          {member.values && member.values.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Our Values
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {member.values.map((value, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <h3 className="text-lg font-bold text-primary mb-3">
                      {value.name}
                    </h3>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Process */}
          {member.process && member.process.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Our Process
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {member.process.map((step, idx) => (
                  <div
                    key={idx}
                    className="p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20 relative"
                  >
                    <div className="absolute top-4 right-4 text-4xl font-bold text-primary/20">
                      {step.step}
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">
                      {step.title}
                    </h3>
                    <p className="text-gray-700 leading-relaxed relative z-10">
                      {step.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Services */}
          {member.services && member.services.length > 0 && (
            <div className="mb-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Services
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {member.services.map((service, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-gray-700"
                  >
                    <span className="text-primary mt-1">•</span>
                    <span>{service}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Information */}
          {(member.email || member.phone || member.website) && (
            <div className="mb-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {member.email && (
                  <div className="flex items-center gap-3">
                    <FiMail className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <a
                      href={`mailto:${member.email}`}
                      className="text-primary hover:underline"
                    >
                      {member.email}
                    </a>
                  </div>
                )}
                {member.phone && (
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <a
                      href={`tel:${member.phone.replace(/\s/g, '')}`}
                      className="text-primary hover:underline"
                    >
                      {member.phone}
                    </a>
                  </div>
                )}
                {member.website && (
                  <div className="flex items-center gap-3">
                    <FiGlobe className="w-5 h-5 text-gray-600 flex-shrink-0" />
                    <a
                      href={member.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-2"
                    >
                      {member.website.replace(/^https?:\/\//, '')}
                      <FiExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Company Profile PDF */}
          {member.companyProfile && (
            <div className="mb-12 p-6 bg-accent rounded-lg border border-primary-light">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                Company Profile
              </h3>
              <p className="text-gray-700 mb-4">
                Download or view the complete company profile document.
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href={member.companyProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 transition-colors"
                >
                  <FiDownload className="w-5 h-5" />
                  Download PDF
                </a>
                <a
                  href={member.companyProfile}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  <FiExternalLink className="w-5 h-5" />
                  View PDF
                </a>
              </div>
            </div>
          )}

          {/* Previous/Next Navigation */}
          {(prevMember || nextMember) && (
            <div className="mb-12 pb-8 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prevMember && (
                  <Link
                    to={`/members/${prevMember.slug}`}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      Previous Member
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {prevMember.businessName || prevMember.name}
                    </h3>
                  </Link>
                )}
                {nextMember && (
                  <Link
                    to={`/members/${nextMember.slug}`}
                    className="group p-4 border border-gray-200 rounded-lg hover:border-primary hover:shadow-md transition-all md:text-right"
                  >
                    <div className="text-sm text-gray-500 mb-2">
                      Next Member
                    </div>
                    <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                      {nextMember.businessName || nextMember.name}
                    </h3>
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Related Members */}
          {relatedMembers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Members
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {relatedMembers.map((relatedMember) => (
                  <MemberCard key={relatedMember.id} member={relatedMember} />
                ))}
              </div>
            </div>
          )}

          {/* View More Members CTA */}
          <div className="text-center pt-8">
            <Link to="/members">
              <Button variant="outline" size="lg">
                View All Members
              </Button>
            </Link>
          </div>
        </article>
      </Container>
    </Section>
    </>
  );
}

