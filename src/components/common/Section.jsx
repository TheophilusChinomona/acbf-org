/**
 * Section Component - Page section wrapper
 * @param {Object} props
 * @param {React.ReactNode} props.children - Section content
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.bgColor - Background color (white, gray, primary, secondary)
 * @param {string} props.padding - Padding size (sm, md, lg, xl)
 * @param {string} props.id - Section ID for anchor links
 */
export default function Section({
  children,
  className = '',
  bgColor = 'white',
  padding = 'lg',
  id,
  ...props
}) {
  const bgColors = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    primary: 'bg-primary text-white',
    secondary: 'bg-secondary text-white',
  };

  const paddings = {
    sm: 'py-4 md:py-8',
    md: 'py-6 md:py-12',
    lg: 'py-8 md:py-16',
    xl: 'py-12 md:py-24',
  };

  const classes = `
    ${bgColors[bgColor] || bgColors.white}
    ${paddings[padding] || paddings.lg}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <section id={id} className={classes} {...props}>
      {children}
    </section>
  );
}

