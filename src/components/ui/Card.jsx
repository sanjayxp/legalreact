import { motion } from 'framer-motion';

export default function Card({ className = '', children, hover = false, ...props }) {
  return (
    <motion.div
      className={`rounded-2xl border border-ink-100 bg-white p-6 shadow-[var(--shadow-card)] ${
        hover ? 'transition-shadow hover:shadow-[var(--shadow-card-hover)]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeading({ title, sub }) {
  return (
    <div className="mb-4">
      <h2 className="text-[15px] font-bold text-ink-900">{title}</h2>
      {sub && <p className="mt-0.5 text-[13px] text-ink-500">{sub}</p>}
    </div>
  );
}
