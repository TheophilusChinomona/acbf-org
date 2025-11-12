import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay } from 'swiper/modules';
import { motion } from 'framer-motion';
import { Container, Section, Image } from '../common';

// Import Swiper styles
import 'swiper/css';

/**
 * Clients/Partners Section Component
 * Logo carousel showing partners, clients, or sponsors
 */
export default function ClientsPartners() {
  // Partner/client logos
  const partners = [
    {
      id: 1,
      name: "RPS Switchgear SA",
      logo: "/assets/images/members/logos/rps-switchgear-sa-logo.png"
    },
    {
      id: 2,
      name: "Greenfield Resources",
      logo: "/assets/images/members/logos/greenfield-resources-logo.png"
    },
    {
      id: 3,
      name: "Integrated Business Strategies",
      logo: "/assets/images/members/logos/integrated-business-strategies-logo.png"
    },
    {
      id: 4,
      name: "Timing Right Solutions",
      logo: "/assets/images/members/logos/RGB-Timing-Right-Solutions-Logo-2024-07.png"
    },
    {
      id: 5,
      name: "Peacesure",
      logo: "/assets/images/members/logos/Peacesure-Logo-Black.png"
    },
    {
      id: 6,
      name: "BS",
      logo: "/assets/images/members/logos/BS-Logo.png"
    }
  ];

  // If no partners, don't render
  if (!partners || partners.length === 0) {
    return null;
  }

  return (
    <Section id="clients-partners" padding="lg" bgColor="white">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Our Partners
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            We're proud to work with these amazing organizations
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Swiper
            modules={[Autoplay]}
            autoplay={{
              delay: 2000,
              disableOnInteraction: false,
            }}
            slidesPerView={2}
            spaceBetween={30}
            loop={true}
            breakpoints={{
              640: {
                slidesPerView: 3,
                spaceBetween: 40,
              },
              768: {
                slidesPerView: 4,
                spaceBetween: 50,
              },
              1024: {
                slidesPerView: 5,
                spaceBetween: 60,
              },
            }}
            className="py-8"
          >
            {partners.map((partner) => (
              <SwiperSlide key={partner.id}>
                <div className="flex items-center justify-center h-24 px-4">
                  <div className="grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100">
                    <Image
                      src={partner.logo}
                      alt={partner.name}
                      className="max-h-16 w-auto object-contain"
                    />
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </motion.div>
      </Container>
    </Section>
  );
}

