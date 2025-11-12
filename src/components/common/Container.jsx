/**
 * Container Component - Content container with max-width
 * @param {Object} props
 * @param {React.ReactNode} props.children - Container content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.fullWidth - Remove max-width constraint
 */
export default function Container({
  children,
  className = '',
  fullWidth = false,
  ...props
}) {
  const baseStyles = 'mx-auto px-4 sm:px-6 lg:px-8';
  const maxWidth = fullWidth ? '' : 'max-w-7xl';

  const classes = `
    ${baseStyles}
    ${maxWidth}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

