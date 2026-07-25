import { motion } from 'framer-motion';

export default function StatTile({ label, value, icon, accent = 'brand' }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    sun: 'bg-amber-50 text-amber-600',
    coral: 'bg-rose-50 text-rose-600',
    green: 'bg-emerald-50 text-emerald-600',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-ink-100 bg-white p-5 shadow-[var(--shadow-card)]"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-500">{label}</span>
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-lg ${accents[accent]}`}>{icon}</span>}
      </div>
      <div className="mt-2 font-heading text-[28px] font-extrabold text-ink-900">{value}</div>
    </motion.div>
  );
}
