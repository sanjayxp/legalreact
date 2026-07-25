import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck2,
  Gavel,
  Users,
  FileText,
  MessageCircleQuestion,
  UploadCloud,
  ShieldCheck,
  Search,
} from 'lucide-react';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';

const FEATURES = [
  { icon: BadgeCheck, title: 'A verified public profile', body: 'Photo, headline, practice areas, and fee — visible to clients once your Bar Council enrolment is verified.' },
  { icon: CalendarCheck2, title: 'Real availability, real bookings', body: 'Set your weekly hours once. Clients book into actual open slots — no back-and-forth.' },
  { icon: Gavel, title: 'A case workspace', body: 'Timeline, labels, documents, and hearing dates for every matter, plus CNR lookup via eCourts.' },
  { icon: Users, title: 'A private client & billing register', body: 'Track clients, linked cases, and invoices — separate from the public platform.' },
  { icon: FileText, title: 'Document generator', body: 'Eight ready-made templates — notices, vakalatnama, NDAs, and more — filled and printed in minutes.' },
  { icon: MessageCircleQuestion, title: 'Answer public questions', body: 'Build visibility by answering Legal Q&A — free exposure to potential clients.' },
];

const STEPS = [
  { n: '01', icon: FileText, title: 'Create your account', body: "Sign up as an advocate — takes under a minute." },
  { n: '02', icon: UploadCloud, title: 'Submit your profile', body: 'Add your Bar Council enrolment number and upload your certificate for review.' },
  { n: '03', icon: ShieldCheck, title: 'Get verified', body: 'Our team checks your enrolment — usually within 2 working days.' },
  { n: '04', icon: Search, title: 'Go live', body: 'Your profile becomes visible to clients searching by practice area and city.' },
];

export default function ForAdvocates() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="relative overflow-hidden bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-16 sm:px-8 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
            <span className="inline-flex items-center gap-2 rounded-full bg-brand-100 px-4 py-1.5 text-[14px] font-bold text-brand-700">
              For practising advocates
            </span>
            <h1 className="mt-5 text-[42px] font-extrabold leading-[1.1] text-ink-900 sm:text-[52px]">
              Practice management,
              <br />
              <span className="text-brand-500">plus new clients.</span>
            </h1>
            <p className="mt-5 max-w-lg text-[18px] leading-relaxed text-ink-500">
              LegalConnects gives you a booking calendar, a case workspace, and a client register — and puts your verified profile in front of people searching for help, at no cost to list.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link to="/login#register">
                <Button size="lg">Join as an advocate <ArrowRight size={17} /></Button>
              </Link>
            </div>
            <div className="mt-9 flex flex-wrap gap-x-8 gap-y-2 text-[14.5px] font-semibold text-ink-400">
              <span>✓ Free to list</span>
              <span>✓ No pay-to-rank</span>
              <span>✓ Bar Council verified badge</span>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.15 }} className="relative mx-auto h-[360px] w-full max-w-md">
            <motion.div
              initial={{ opacity: 0, rotate: -8 }}
              animate={{ opacity: 1, rotate: -5 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="gradient-brand blob-shape absolute left-2 top-4 h-56 w-48 overflow-hidden shadow-xl"
            >
              <img src="https://images.unsplash.com/photo-1521791136064-7986c2920216?w=400&q=80" alt="Advocate at desk" className="h-full w-full object-cover" />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, rotate: 8 }}
              animate={{ opacity: 1, rotate: 5 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="gradient-sun blob-shape-2 absolute bottom-0 right-0 h-60 w-52 overflow-hidden shadow-xl"
            >
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80" alt="Advocate portrait" className="h-full w-full object-cover" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8">
        <div className="max-w-xl">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">What you get</span>
          <h2 className="mt-2 text-[34px] font-extrabold text-ink-900 sm:text-[42px]">Everything to run your practice, in one place</h2>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 6) * 0.05 }}>
              <Card hover className="h-full">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white"><f.icon size={19} /></div>
                <h3 className="mt-4 text-[16px] font-bold text-ink-900">{f.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{f.body}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-brand-50/50 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Verification</span>
            <h2 className="mt-2 text-[34px] font-extrabold text-ink-900 sm:text-[42px]">From sign-up to visible, in four steps</h2>
          </div>
          <div className="mt-14 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <motion.div key={s.n} initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}>
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-white text-brand-600 shadow-sm"><s.icon size={18} /></div>
                  <div className="text-[28px] font-extrabold text-brand-200">{s.n}</div>
                </div>
                <h3 className="mt-3 text-[16px] font-bold text-ink-900">{s.title}</h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-ink-100 py-20">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <h2 className="text-[32px] font-extrabold text-ink-900 sm:text-[40px]">Ready to take on new clients?</h2>
          <p className="mt-3 text-[16.5px] text-ink-500">Free to join. Verification usually takes 2 working days.</p>
          <Link to="/login#register" className="mt-7 inline-block">
            <Button size="lg">Join as an advocate <ArrowRight size={17} /></Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
