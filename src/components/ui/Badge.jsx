const tones = {
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  red: 'bg-rose-50 text-rose-600 border-rose-200',
  blue: 'bg-brand-50 text-brand-600 border-brand-200',
  gray: 'bg-ink-50 text-ink-500 border-ink-100',
};

export default function Badge({ tone = 'gray', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] font-bold ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
