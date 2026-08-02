import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  ArrowUpRight,
  Scale,
  Gavel,
  ShieldCheck,
  Building2,
  Home as HomeIcon,
  Percent,
  Briefcase,
  Lightbulb,
  Lock,
  ShoppingBag,
  Plane,
  HeartHandshake,
  MessageCircleQuestion,
  Globe2,
  CalendarCheck2,
  BadgeCheck,
  FileCheck2,
} from 'lucide-react';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const TINTS = {
  brand: 'bg-brand-500/10 text-brand-600',
  gold: 'bg-gold-500/10 text-gold-600',
  coral: 'bg-coral-500/10 text-coral-500',
};

const PRACTICE_AREAS = [
  { name: 'Civil', icon: Scale, tint: 'brand' },
  { name: 'Criminal', icon: Gavel, tint: 'coral' },
  { name: 'Family', icon: HeartHandshake, tint: 'gold' },
  { name: 'Corporate', icon: Building2, tint: 'brand' },
  { name: 'Property & Real Estate', icon: HomeIcon, tint: 'gold' },
  { name: 'Tax', icon: Percent, tint: 'coral' },
  { name: 'Labour & Employment', icon: Briefcase, tint: 'brand' },
  { name: 'IP', icon: Lightbulb, tint: 'gold' },
  { name: 'Cyber Law', icon: Lock, tint: 'coral' },
  { name: 'Consumer', icon: ShoppingBag, tint: 'brand' },
  { name: 'Immigration', icon: Plane, tint: 'gold' },
];

const STEPS = [
  {
    n: '01',
    title: 'Describe your matter',
    body: 'Tell us what you need in plain language, or ask the community a legal question — no forms, no jargon required.',
  },
  {
    n: '02',
    title: 'Get matched, not marketed to',
    body: 'We surface Bar Council-verified advocates by practice area, city, and language. No pay-to-rank, no sponsored placements.',
  },
  {
    n: '03',
    title: 'Consult and track it end to end',
    body: 'Book by video, phone, or in person. Your advocate keeps your case timeline, documents, and next hearing in one place.',
  },
];

const TRUST_POINTS = [
  { icon: BadgeCheck, label: 'Bar Council verification required', body: 'Every advocate profile is reviewed against enrolment records before it goes live.' },
  { icon: FileCheck2, label: 'DPDP Act 2023 by design', body: 'Consent-first data handling, built in from day one — not bolted on later.' },
  { icon: ShieldCheck, label: 'No pay-to-rank listings', body: 'Advocates are never ranked or boosted by fee. Match quality only.' },
];

export default function Home() {
  return (
    <div className="bg-white">
      <PublicNav />

      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[1.15fr_1fr] lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-[14px] font-bold text-brand-700">
              Bar Council-verified advocates, pan-India
            </span>
            <h1 className="mt-5 text-[38px] font-extrabold leading-[1.08] text-ink-900 sm:text-[46px] lg:text-[48px]">
              Legal Help
              <br />
              <span className="text-brand-500">Beyond the Guesswork</span>
            </h1>
            <p className="mt-5 max-w-lg text-[18px] leading-relaxed text-ink-500">
              Ask a question, get matched with a verified advocate by practice area and city, and book a consultation — video, phone, or in person. Free to start.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/advocates">
                <Button size="lg">
                  Find an advocate <ArrowRight size={17} />
                </Button>
              </Link>
              <Link to="/login#register">
                <Button size="lg" variant="ghost">
                  I'm an advocate
                </Button>
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 text-[14.5px] font-semibold text-ink-400">
              <span>✓ Bar Council verified</span>
              <span>✓ Pan-India coverage</span>
              <span>✓ Free to ask a question</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="relative mx-auto h-[380px] w-full max-w-md"
          >
            <motion.div
              initial={{ opacity: 0, rotate: -8 }}
              animate={{ opacity: 1, rotate: -6 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="absolute left-0 top-2 h-56 w-48"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="gradient-coral blob-shape h-full w-full overflow-hidden shadow-xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1573497491208-6b1acb260507?w=500&q=80"
                  alt="Advocate reviewing documents"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, rotate: 8 }}
              animate={{ opacity: 1, rotate: 6 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="absolute bottom-2 right-0 h-64 w-52"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 5.6, ease: 'easeInOut', delay: 0.8 }}
                className="gradient-sun blob-shape-2 h-full w-full overflow-hidden shadow-xl"
              >
                <img
                  src="https://images.unsplash.com/photo-1556157382-97eda2d62296?w=500&q=80"
                  alt="Client consultation"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
              className="absolute left-16 top-44 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-lg"
            >
              <BadgeCheck size={16} className="text-brand-500" />
              <span className="text-[12.5px] font-bold text-ink-800">Bar Council Verified</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut', delay: 0.6 }}
              className="absolute left-2 -top-4 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-lg"
            >
              <Globe2 size={16} className="text-brand-500" />
              <span className="text-[12.5px] font-bold text-ink-800">Pan-India Coverage</span>
            </motion.div>
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut', delay: 1.2 }}
              className="absolute right-10 -bottom-4 flex items-center gap-2 rounded-xl bg-white px-3.5 py-2.5 shadow-lg"
            >
              <MessageCircleQuestion size={16} className="text-brand-500" />
              <span className="text-[12.5px] font-bold text-ink-800">Free to Ask</span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ---- Trust strip ---- */}
      <section className="border-b border-ink-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-5 py-14 sm:px-8 sm:grid-cols-3">
          {TRUST_POINTS.map((t, i) => (
            <motion.div key={t.label} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600">
                <t.icon size={18} />
              </div>
              <div>
                <div className="text-[15.5px] font-bold text-ink-900">{t.label}</div>
                <div className="mt-1 text-[14px] leading-relaxed text-ink-500">{t.body}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section id="how-it-works" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-xl">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">How it works</span>
          <h2 className="mt-2 text-[33px] font-extrabold text-ink-900 sm:text-[41px]">A simpler way to find legal help</h2>
          <p className="mt-3 text-[16.5px] text-ink-500">Three steps, no retainer required to start.</p>
        </div>
        <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <motion.div key={s.n} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
              <div className="text-[46px] font-extrabold text-brand-100">{s.n}</div>
              <h3 className="mt-1 text-[18px] font-bold text-ink-900">{s.title}</h3>
              <p className="mt-2.5 text-[15.5px] leading-relaxed text-ink-500">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ---- Practice areas ---- */}
      <section id="practice-areas" className="bg-brand-50/50 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Practice areas</span>
            <h2 className="mt-2 text-[33px] font-extrabold text-ink-900 sm:text-[41px]">Every practice area, one place to start</h2>
          </div>
          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {PRACTICE_AREAS.map((a, i) => (
              <motion.div
                key={a.name}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (i % 4) * 0.06, duration: 0.4 }}
              >
                <Link to={`/advocates?area=${encodeURIComponent(a.name)}`} className="group block h-full">
                  <Card
                    hover
                    whileHover={{ y: -4 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 20 }}
                    // Two across on a phone leaves ~120px inside the card —
                    // not enough for icon, label and arrow on one line, so
                    // they stack there and sit in a row from sm up.
                    className="flex h-full flex-col items-start gap-2.5 !p-5 hover:border-brand-200 sm:flex-row sm:items-center sm:gap-3.5"
                  >
                    <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${TINTS[a.tint]}`}>
                      <a.icon size={19} />
                    </div>
                    {/* min-w-0, or the label refuses to shrink and shoves the arrow out of the card. */}
                    <span className="min-w-0 flex-1 text-[15.5px] font-bold text-ink-900">{a.name}</span>
                    <ArrowUpRight
                      size={16}
                      className="hidden shrink-0 -translate-x-1 text-ink-200 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 group-hover:text-brand-500 sm:block"
                    />
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Client / Advocate split ---- */}
      <section id="for-advocates" className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 text-white">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" />
            <MessageCircleQuestion size={26} className="text-gold-300" />
            <h3 className="mt-5 text-[25px] font-extrabold text-white">Looking for legal help?</h3>
            <p className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-white/75">
              Post your matter or browse verified advocates by city and practice area. Ask the community a question for free, book a paid consultation when you're ready.
            </p>
            <Link to="/login#register" className="mt-7 inline-block">
              <Button variant="dark" className="!bg-white !text-brand-700 hover:!bg-brand-50">
                Get started as a client <ArrowRight size={16} />
              </Button>
            </Link>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-10">
            <CalendarCheck2 size={26} className="text-brand-600" />
            <h3 className="mt-5 text-[25px] font-extrabold text-ink-900">Practising and taking new clients?</h3>
            <p className="mt-3 max-w-sm text-[15.5px] leading-relaxed text-ink-500">
              Get a public profile, a booking calendar with real availability, a case workspace, and a private client &amp; billing register — after Bar Council verification.
            </p>
            <Link to="/login#register" className="mt-7 inline-block">
              <Button>
                Join as an advocate <ArrowRight size={16} />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ---- Final CTA ---- */}
      <section className="border-t border-ink-100 bg-brand-50/50 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="text-[31px] font-extrabold text-ink-900 sm:text-[39px]">
            Legal help shouldn't feel like a gamble.
          </h2>
          <p className="mt-3 text-[16.5px] text-ink-500">Start with a free question, or book a consultation when you're ready.</p>
          <Link to="/login#register" className="mt-7 inline-block">
            <Button size="lg">
              Create your free account <ArrowRight size={17} />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
