import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Thumbs, Zoom, FreeMode } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';
import 'swiper/css/thumbs';
import 'swiper/css/zoom';
import 'swiper/css/free-mode';
import Image from '../common/Image';

/**
 * Portfolio Gallery Component
 * @param {Object} props
 * @param {Array} props.images - Array of image URLs
 */
export default function PortfolioGallery({ images = [] }) {
  const [thumbsSwiper, setThumbsSwiper] = useState(null);

  if (!images || images.length === 0) {
    return null;
  }

  // If only one image, show it without swiper
  if (images.length === 1) {
    return (
      <div className="rounded-lg overflow-hidden">
        <Image
          src={images[0]}
          alt="Portfolio image"
          className="w-full h-auto"
          lazy={false}
        />
      </div>
    );
  }

  return (
    <div className="portfolio-gallery">
      {/* Main Swiper */}
      <Swiper
        modules={[Navigation, Pagination, Thumbs, Zoom]}
        spaceBetween={10}
        navigation={true}
        pagination={{ clickable: true }}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        zoom={{
          maxRatio: 3,
          minRatio: 1,
        }}
        className="mb-4 rounded-lg overflow-hidden"
      >
        {images.map((image, index) => (
          <SwiperSlide key={index}>
            <div className="swiper-zoom-container">
              <Image
                src={image}
                alt={`Portfolio image ${index + 1}`}
                className="w-full h-auto"
                lazy={false}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails Swiper */}
      {images.length > 1 && (
        <Swiper
          onSwiper={setThumbsSwiper}
          modules={[FreeMode, Navigation, Thumbs]}
          spaceBetween={10}
          slidesPerView={4}
          freeMode={true}
          watchSlidesProgress={true}
          breakpoints={{
            640: {
              slidesPerView: 5,
            },
            1024: {
              slidesPerView: 6,
            },
          }}
          className="portfolio-thumbs"
        >
          {images.map((image, index) => (
            <SwiperSlide key={index}>
              <div className="relative aspect-square overflow-hidden rounded cursor-pointer opacity-60 hover:opacity-100 transition-opacity">
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  lazy={true}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
}

