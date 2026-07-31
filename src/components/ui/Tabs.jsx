// Per-tab colour tones. `tone` is optional on each tab — anything without
// one falls back to brand blue, so existing callers keep working unchanged.
const TONES = {
  brand: {
    active: 'bg-brand-500 text-white',
    idle: 'text-ink-500 hover:bg-white hover:text-brand-600',
    countActive: 'bg-white/25 text-white',
    countIdle: 'bg-brand-100 text-brand-700',
  },
  gold: {
    active: 'bg-gold-500 text-white',
    idle: 'text-ink-500 hover:bg-white hover:text-gold-700',
    countActive: 'bg-white/25 text-white',
    countIdle: 'bg-gold-100 text-gold-700',
  },
  emerald: {
    active: 'bg-emerald-500 text-white',
    idle: 'text-ink-500 hover:bg-white hover:text-emerald-700',
    countActive: 'bg-white/25 text-white',
    countIdle: 'bg-emerald-100 text-emerald-700',
  },
  violet: {
    active: 'bg-violet-500 text-white',
    idle: 'text-ink-500 hover:bg-white hover:text-violet-700',
    countActive: 'bg-white/25 text-white',
    countIdle: 'bg-violet-100 text-violet-700',
  },
  rose: {
    active: 'bg-rose-500 text-white',
    idle: 'text-ink-500 hover:bg-white hover:text-rose-600',
    countActive: 'bg-white/25 text-white',
    countIdle: 'bg-rose-100 text-rose-700',
  },
  slate: {
    active: 'bg-ink-700 text-white',
    idle: 'text-ink-500 hover:bg-white hover:text-ink-800',
    countActive: 'bg-white/25 text-white',
    countIdle: 'bg-ink-100 text-ink-700',
  },
};

export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-100 bg-ink-50/60 p-1.5">
      {tabs.map((t) => {
        const tone = TONES[t.tone] || TONES.brand;
        const isActive = active === t.key;
        return (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-all duration-200 ${
              isActive ? `${tone.active} shadow-sm` : tone.idle
            }`}
          >
            {t.icon && <t.icon size={15} className="shrink-0" />}
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span
                className={`ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                  isActive ? tone.countActive : tone.countIdle
                }`}
              >
                {t.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
