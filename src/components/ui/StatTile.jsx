import { motion } from 'framer-motion';

export default function StatTile({ label, value, icon, accent = 'brand', onClick, active = false }) {
  const accents = {
    brand: 'bg-brand-50 text-brand-600',
    sun: 'bg-amber-50 text-amber-600',
    coral: 'bg-rose-50 text-rose-600',
    green: 'bg-emerald-50 text-emerald-600',
  };
  const activeRing = {
    brand: 'border-brand-300 bg-brand-50/60',
    sun: 'border-amber-300 bg-amber-50/60',
    coral: 'border-rose-300 bg-rose-50/60',
    green: 'border-emerald-300 bg-emerald-50/60',
  };
  const interactive = !!onClick;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`rounded-2xl border p-5 shadow-[var(--shadow-card)] transition-all ${
        active ? activeRing[accent] : 'border-ink-100 bg-white'
      } ${interactive ? 'cursor-pointer hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]' : ''}`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-semibold text-ink-500">{label}</span>
        {icon && <span className={`grid h-8 w-8 place-items-center rounded-lg ${accents[accent]}`}>{icon}</span>}
      </div>
      <div className="mt-2 font-heading text-[28px] font-extrabold text-ink-900">{value}</div>
    </motion.div>
  );
}
