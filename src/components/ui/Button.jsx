import { motion } from 'framer-motion';

const variants = {
  primary: 'bg-brand-500 text-white hover:bg-brand-600 shadow-sm hover:shadow-md',
  ghost: 'bg-white text-ink-700 border border-ink-100 hover:border-brand-300 hover:text-brand-600',
  dark: 'bg-ink-900 text-white hover:bg-ink-800',
  danger: 'bg-white text-coral-500 border border-coral-400/40 hover:bg-coral-500 hover:text-white',
  subtle: 'bg-brand-50 text-brand-600 hover:bg-brand-100',
};

const sizes = {
  sm: 'px-3 py-1.5 text-[13px]',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-7 py-3.5 text-base',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  disabled,
  ...props
}) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function LinkButton({ variant = 'primary', size = 'md', className = '', children, ...props }) {
  return (
    <motion.a
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors duration-150 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </motion.a>
  );
}
