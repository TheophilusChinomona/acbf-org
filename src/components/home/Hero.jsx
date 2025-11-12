import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectFade } from 'swiper/modules';
import { Link } from 'react-router-dom';
import { HiChevronDown } from 'react-icons/hi';
import { motion } from 'framer-motion';
import { Button, Container, Image } from '../common';
import { openContactModal } from '../modals';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-fade';

/**
 * Hero Section Component with Swiper.js slider
 * Replaces Revolution Slider from WordPress
 */
export default function Hero() {
  // Hero slides data - can be moved to JSON later
  // Supports both video and image backgrounds (video takes priority if both provided)
  const heroVideo = "/assets/videos/hero-background.mp4";
  
  const slides = [
    {
      id: 1,
      title: "Welcome to ACBF RSA",
      subtitle: "Building a Better Future Together",
      description: "Join us in our mission to create positive change and impact in our community.",
      video: heroVideo,
      image: "/assets/images/hero-1.jpg", // Fallback if video not available
      cta: { text: "Learn More", link: "/about" },
      ctaSecondary: { text: "Get Involved", link: "/contact" }
    },
    {
      id: 2,
      title: "Empowering Communities",
      subtitle: "Making a Difference",
      description: "Together we can achieve more. Discover our programs and initiatives.",
      video: heroVideo,
      image: "/assets/images/hero-2.jpg", // Fallback if video not available
      cta: { text: "Our Members", link: "/members" },
      ctaSecondary: { text: "Contact Us", link: "/contact" }
    },
    {
      id: 3,
      title: "Stay Connected",
      subtitle: "Latest News & Updates",
      description: "Read our latest blog posts and stay informed about our activities.",
      video: heroVideo,
      image: "/assets/images/hero-3.jpg", // Fallback if video not available
      cta: { text: "Read Blog", link: "/blog" },
      ctaSecondary: { text: "About Us", link: "/about" }
    }
  ];

  const scrollToContent = () => {
    window.scrollTo({
      top: window.innerHeight,
      behavior: 'smooth'
    });
  };

  return (
    <section className="relative h-screen w-full overflow-hidden">
      <Swiper
        modules={[Autoplay, Pagination, EffectFade]}
        autoplay={{
          delay: 5000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          bulletClass: 'swiper-pagination-bullet !bg-white/50 !w-3 !h-3 !mx-1',
          bulletActiveClass: 'swiper-pagination-bullet-active !bg-white !w-8',
        }}
        effect="fade"
        fadeEffect={{
          crossFade: true
        }}
        speed={1000}
        loop={true}
        className="h-full w-full"
      >
        {slides.map((slide) => (
          <SwiperSlide key={slide.id}>
            <div className="relative h-screen w-full">
              {/* Background Video or Image */}
              <div className="absolute inset-0 z-0">
                {slide.video ? (
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                    poster={slide.image} // Fallback image while video loads
                  >
                    <source src={slide.video} type="video/mp4" />
                    {/* Fallback to image if video fails to load */}
                    <Image
                      src={slide.image}
                      alt={slide.title}
                      className="w-full h-full object-cover"
                      lazy={false}
                    />
                  </video>
                ) : (
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                    lazy={false}
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/50" />
              </div>

              {/* Content */}
              <div className="relative z-10 h-full flex items-center justify-center">
                <Container>
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    className="text-center text-white max-w-4xl mx-auto px-4"
                  >
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className="text-lg md:text-xl font-medium mb-4 text-white/90"
                    >
                      {slide.subtitle}
                    </motion.p>
                    
                    <motion.h1
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                      className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                    >
                      {slide.title}
                    </motion.h1>
                    
                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.6 }}
                      className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl mx-auto"
                    >
                      {slide.description}
                    </motion.p>
                    
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8, duration: 0.6 }}
                      className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                      <Link to={slide.cta.link}>
                        <Button variant="ghost" size="lg" className="!bg-white !text-gray-900 hover:!bg-gray-100">
                          {slide.cta.text}
                        </Button>
                      </Link>
                      {slide.ctaSecondary && (
                        slide.ctaSecondary.link === '/contact' ? (
                          <Button 
                            variant="ghost" 
                            size="lg" 
                            className="!border-2 !border-white !text-white hover:!bg-white hover:!text-gray-900"
                            onClick={openContactModal}
                          >
                            {slide.ctaSecondary.text}
                          </Button>
                        ) : (
                          <Link to={slide.ctaSecondary.link}>
                            <Button variant="ghost" size="lg" className="!border-2 !border-white !text-white hover:!bg-white hover:!text-gray-900">
                              {slide.ctaSecondary.text}
                            </Button>
                          </Link>
                        )
                      )}
                    </motion.div>
                  </motion.div>
                </Container>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Scroll Down Indicator */}
      <motion.button
        onClick={scrollToContent}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 text-white hover:text-white/80 transition-colors"
        aria-label="Scroll to content"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.6 }}
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          <HiChevronDown className="w-8 h-8" />
        </motion.div>
      </motion.button>
    </section>
  );
}

