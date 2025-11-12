# Coding Style Guide - ACBF RSA React

## Overview
This document outlines the coding standards and best practices for the ACBF RSA React project.

## JavaScript/React Standards

### File Naming
- React components: PascalCase (e.g., `Header.jsx`, `BlogPost.jsx`)
- Utilities and hooks: camelCase (e.g., `formatDate.js`, `useScroll.js`)
- Configuration files: kebab-case (e.g., `vite.config.js`, `tailwind.config.js`)

### Code Structure
- Use ES6+ features (arrow functions, destructuring, spread operators)
- Prefer functional components with hooks over class components
- Use named exports for utilities, default exports for components

### React Best Practices
- Use React 19+ JSX transform (no need to import React)
- Implement error boundaries for robust error handling
- Lazy load components where appropriate
- Use React.StrictMode in development

### Import Order
1. React and third-party libraries
2. Internal components and utilities
3. Styles and assets
4. Type definitions (if using TypeScript)

## CSS/Styling

### Tailwind CSS
- Use Tailwind utility classes for styling
- Follow mobile-first responsive design
- Use `@apply` sparingly for component-level styles
- Maintain custom classes in `index.css`

### Class Naming
- Use descriptive, semantic class names
- Follow BEM methodology for custom classes when needed

## Build Configuration

### Dependencies
- Keep dependencies up to date
- Document all required peer dependencies
- Use exact versions for critical dependencies
- Separate devDependencies from production dependencies

### Build Optimization
- Enable tree-shaking
- Split chunks appropriately for caching
- Minify production builds
- Remove console.log statements in production

## Code Quality

### Linting
- Follow ESLint rules defined in `eslint.config.js`
- Fix all errors before committing
- Address warnings when practical

### Performance
- Optimize images and assets
- Implement code splitting
- Use React.memo for expensive components
- Avoid unnecessary re-renders

## Documentation
- Document complex functions and components
- Keep README up to date
- Maintain migration and deployment guides
- Document breaking changes

