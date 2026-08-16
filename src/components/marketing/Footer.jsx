import { Link } from 'react-router-dom';
import Logo from '../brand/Logo';
import { LinkedInIcon, InstagramIcon } from '../brand/SocialIcons';
import { orgField } from '../../lib/orgDetails';
import { usePostMatter } from './PostMatterContext';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Find an advocate', to: '/advocates' },
      { label: 'Legal Q&A', to: '/qa' },
      { label: 'How it works', to: '/#how-it-works' },
    ],
  },
  {
    title: 'For advocates',
    links: [
      { label: 'Join as an advocate', to: '/login#register' },
      { label: 'Verification process', to: '/for-advocates#verification' },
      { label: 'Jobs & Learning', to: '/jobs' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About us', to: '/about' },
      { label: 'Careers', to: '/careers' },
      { label: 'Contact', to: '/contact' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
      { label: 'Disclaimer', to: '/disclaimer' },
      { label: 'Refund Policy', to: '/refund-policy' },
    ],
  },
];

export default function Footer() {
  const { openPostMatter } = usePostMatter();

  // Only render a profile we actually have. An icon that leads nowhere, or to
  // a page that isn't ours, is worse than leaving it out.
  const socials = [
    { key: 'linkedinUrl', label: 'LinkedIn', icon: LinkedInIcon },
    { key: 'instagramUrl', label: 'Instagram', icon: InstagramIcon },
  ]
    .map((s) => ({ ...s, href: orgField(s.key) }))
    .filter((s) => s.href);

  return (
    <footer className="border-t border-ink-900/[0.08] bg-ink-900 text-white/70">
      <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:grid-cols-6">
          <div className="col-span-2">
            <Link to="/"><Logo dark /></Link>
            <p className="mt-4 max-w-xs text-[13.5px] leading-relaxed text-white/50">
              Connecting people with Bar Council-verified advocates across India — plain-language legal help, without the guesswork.
            </p>

            {socials.length > 0 && (
              <div className="mt-5 flex items-center gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.key}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`LegalConnects on ${s.label}`}
                    title={`LegalConnects on ${s.label}`}
                    className="grid h-9 w-9 place-items-center rounded-lg border border-white/15 text-white/60 transition-colors hover:border-gold-300 hover:text-gold-300"
                  >
                    <s.icon size={17} />
                  </a>
                ))}
              </div>
            )}
          </div>
          {COLUMNS.map((col, i) => (
            <div key={col.title}>
              <div className="text-[12px] font-bold uppercase tracking-wide text-white/40">{col.title}</div>
              <div className="mt-3.5 flex flex-col gap-2.5">
                {i === 0 && (
                  <button onClick={openPostMatter} className="text-left text-[13.5px] font-semibold text-gold-300 hover:text-gold-200">
                    Post your matter
                  </button>
                )}
                {col.links.map((l) => (
                  <Link key={l.label} to={l.to} className="text-[13.5px] text-white/70 hover:text-gold-300">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-6 text-[12px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} LegalConnects. All rights reserved.</span>
          <span>Legal pages are drafts pending counsel review · DPDP Act 2023 compliant by design</span>
        </div>
      </div>
    </footer>
  );
}
