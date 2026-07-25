import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Find an advocate', href: '#practice-areas' },
      { label: 'Legal Q&A', href: '#' },
      { label: 'How it works', href: '#how-it-works' },
    ],
  },
  {
    title: 'For advocates',
    links: [
      { label: 'Join as an advocate', href: '/login#register' },
      { label: 'Verification process', href: '#for-advocates' },
      { label: 'Advocate console', href: '/login' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Contact', href: '#' },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-ink-900/[0.08] bg-ink-900 text-white/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-5">
          <div className="col-span-2">
            <Logo dark />
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/50">
              Connecting people with Bar Council-verified advocates across India — plain-language legal help, without the guesswork.
            </p>
          </div>
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[12px] font-bold uppercase tracking-wide text-white/40">{col.title}</div>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {col.links.map((l) => (
                  <a key={l.label} href={l.href} className="text-[13.5px] text-white/70 hover:text-gold-300">
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} LegalConnects. All rights reserved.</span>
          <span>Legal pages are placeholders pending counsel review · DPDP Act 2023 compliant by design</span>
        </div>
      </div>
    </footer>
  );
}
