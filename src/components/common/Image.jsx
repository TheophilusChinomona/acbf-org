import { useState } from 'react';

/**
 * Optimized Image Component with lazy loading
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text (required)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.width - Image width
 * @param {string} props.height - Image height
 * @param {boolean} props.lazy - Enable lazy loading (default: true)
 * @param {string} props.placeholder - Placeholder image URL
 */
export default function Image({
  src,
  alt,
  className = '',
  width,
  height,
  lazy = true,
  placeholder,
  ...props
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = () => {
    setImageLoaded(true);
  };

  const handleError = () => {
    setImageError(true);
    setImageLoaded(true);
  };

  if (imageError && placeholder) {
    return (
      <img
        src={placeholder}
        alt={alt}
        className={className}
        width={width}
        height={height}
        {...props}
      />
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        className={`
          transition-opacity duration-300
          ${imageLoaded ? 'opacity-100' : 'opacity-0'}
          ${className}
        `.trim().replace(/\s+/g, ' ')}
        {...props}
      />
    </div>
  );
}

