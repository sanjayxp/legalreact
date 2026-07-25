export default function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1.5 rounded-xl border border-ink-100 bg-ink-50/60 p-1.5">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`relative rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-colors ${
            active === t.key ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-500 hover:text-ink-800'
          }`}
        >
          {t.label}
          {typeof t.count === 'number' && t.count > 0 && (
            <span className="ml-1.5 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
