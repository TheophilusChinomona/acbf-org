import { motion } from 'framer-motion';
import { Container, Section, Button } from '../common';
import { openContactModal } from '../modals';
import { HiMail, HiLocationMarker, HiPhone } from 'react-icons/hi';

/**
 * Contact Section Component
 * Quick contact information and link to contact page
 */
export default function ContactSection() {
  const contactInfo = [
    {
      icon: HiMail,
      label: "Email",
      value: "info@acbf.org.za",
      link: "mailto:info@acbf.org.za"
    },
    {
      icon: HiPhone,
      label: "Phone",
      value: "+27 76 775 0044",
      link: "tel:+27767750044"
    },
    {
      icon: HiLocationMarker,
      label: "Address",
      value: "30 Premier St, Clayville, Olifantsfontein, 1666",
      link: null
    }
  ];

  return (
    <Section id="contact-section" padding="lg" bgColor="gray">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get In Touch
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Have questions or want to learn more? We're here to help.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {contactInfo.map((info, index) => {
            const Icon = info.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 text-primary mb-4">
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {info.label}
                </h3>
                {info.link ? (
                  <a
                    href={info.link}
                    className="text-gray-600 hover:text-primary transition-colors"
                  >
                    {info.value}
                  </a>
                ) : (
                  <p className="text-gray-600">{info.value}</p>
                )}
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <Button variant="primary" size="lg" onClick={openContactModal}>
            Send Us a Message
          </Button>
        </motion.div>
      </Container>
    </Section>
  );
}

