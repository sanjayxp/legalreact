import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
        active
          ? 'border-brand-400 bg-brand-50 text-brand-700'
          : 'border-ink-100 text-ink-500 hover:border-brand-200 hover:text-brand-600'
      }`}
    >
      {children}
    </button>
  );
}

export function Avatar({ src, name, size = 40 }) {
  const initial = (name || '?').charAt(0).toUpperCase();
  const style = { width: size, height: size };
  if (src) {
    return <img src={src} alt={name} style={style} className="rounded-full object-cover" />;
  }
  return (
    <div
      style={style}
      className="grid shrink-0 place-items-center rounded-full bg-brand-50 font-bold text-brand-600"
    >
      {initial}
    </div>
  );
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <Loader2 className="animate-spin text-brand-500" size={28} />
    </div>
  );
}

export function EmptyState({ icon, title, sub, action }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-ink-100 bg-ink-50/40 px-6 py-14 text-center"
    >
      {icon && <div className="mb-1 text-ink-300">{icon}</div>}
      <div className="text-[15px] font-bold text-ink-800">{title}</div>
      {sub && <div className="max-w-sm text-[13.5px] text-ink-500">{sub}</div>}
      {action}
    </motion.div>
  );
}

export function LiveBadge({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700 ${className}`}>
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live
    </span>
  );
}

export function Toast({ text, kind = 'err' }) {
  if (!text) return null;
  const tones = {
    err: 'bg-rose-50 text-rose-700 border-rose-200',
    ok: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border px-3.5 py-2.5 text-[13.5px] font-medium ${tones[kind]}`}
    >
      {text}
    </motion.div>
  );
}
