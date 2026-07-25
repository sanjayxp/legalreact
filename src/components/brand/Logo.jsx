export default function Logo({ dark = false, size = 'md' }) {
  const sizes = {
    sm: { mark: 30, text: 'text-[16px]', gap: 'gap-2' },
    md: { mark: 36, text: 'text-[19px]', gap: 'gap-2.5' },
    lg: { mark: 46, text: 'text-[24px]', gap: 'gap-3' },
  };
  const s = sizes[size];
  return (
    <span className={`inline-flex items-center ${s.gap}`}>
      <svg width={s.mark} height={s.mark} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" rx="10" fill="url(#lc-grad)" />
        <path d="M20 9v20M13 12h14M13 12l-4 8a4 4 0 0 0 8 0l-4-8ZM27 12l-4 8a4 4 0 0 0 8 0l-4-8Z" stroke="white" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="30.5" r="1.6" fill="white" />
        <defs>
          <linearGradient id="lc-grad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#5A89F7" />
            <stop offset="1" stopColor="#1E6DEB" />
          </linearGradient>
        </defs>
      </svg>
      <span className={`font-heading font-extrabold tracking-tight ${s.text} ${dark ? 'text-white' : 'text-ink-900'}`}>
        LegalConnects
      </span>
    </span>
  );
}
