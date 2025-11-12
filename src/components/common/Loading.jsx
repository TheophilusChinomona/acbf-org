import { HiRefresh } from 'react-icons/hi';

/**
 * Loading Component - Loading spinner/skeleton
 * @param {Object} props
 * @param {string} props.size - Size of spinner (sm, md, lg)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.text - Loading text to display
 * @param {boolean} props.fullScreen - Full screen overlay
 */
export default function Loading({
  size = 'md',
  className = '',
  text = '',
  fullScreen = false,
  ...props
}) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  const spinnerClasses = `
    ${sizes[size] || sizes.md}
    animate-spin
    text-primary
  `.trim().replace(/\s+/g, ' ');

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
        <div className="text-center">
          <HiRefresh className={`${spinnerClasses} mx-auto`} />
          {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center ${className}`} {...props}>
      <div className="text-center">
        <HiRefresh className={spinnerClasses} />
        {text && <p className="mt-2 text-gray-600 text-sm">{text}</p>}
      </div>
    </div>
  );
}

