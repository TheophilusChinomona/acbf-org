/**
 * Reusable Card Component
 * @param {Object} props
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.hover - Add hover effect
 * @param {boolean} props.shadow - Add shadow
 */
export default function Card({
  children,
  className = '',
  hover = false,
  shadow = true,
  ...props
}) {
  const baseStyles = 'bg-white rounded-lg overflow-hidden';
  const shadowStyle = shadow ? 'shadow-md' : '';
  const hoverStyle = hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-1' : '';

  const classes = `
    ${baseStyles}
    ${shadowStyle}
    ${hoverStyle}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
}

