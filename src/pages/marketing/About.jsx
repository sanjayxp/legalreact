import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, ShieldCheck, Scale, Users } from 'lucide-react';
import { listTeamPublic } from '../../lib/cms';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import HeroBanner from '../../components/marketing/HeroBanner';
import { Spinner, EmptyState } from '../../components/ui/Misc';

const VALUES = [
  { icon: ShieldCheck, title: 'Verification first', body: 'Every advocate on the platform is checked against Bar Council enrolment records before their profile goes live.' },
  { icon: Scale, title: 'No pay-to-rank', body: 'Advocates are never boosted or ranked by fee. Matches are based on practice area, city, and availability only.' },
  { icon: Users, title: 'Plain language', body: 'Legal help shouldn’t require legal training to access. We keep the experience simple on both sides.' },
];

export default function About() {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listTeamPublic().then(setTeam).finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <HeroBanner colors={['gradient-brand', 'gradient-coral']} layout={2} />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">About us</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Legal help, minus the guesswork</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-500">
            LegalConnects connects people with Bar Council-verified advocates across India — by practice area, city, and language — and gives advocates the tools to manage bookings, cases, and clients in one place.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {VALUES.map((v, i) => (
            <motion.div key={v.title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="rounded-2xl border border-ink-100 p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-500 text-white"><v.icon size={19} /></div>
              <h3 className="mt-4 text-[15px] font-bold text-ink-900">{v.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-ink-500">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-brand-50/50 py-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="max-w-xl">
            <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">The team</span>
            <h2 className="mt-2 text-[32px] font-extrabold text-ink-900 sm:text-[40px]">People behind LegalConnects</h2>
          </div>

          {loading ? (
            <div className="mt-12"><Spinner /></div>
          ) : team.length === 0 ? (
            <div className="mt-12"><EmptyState icon={<Users size={28} />} title="Team profiles coming soon" sub="Check back shortly — we're setting up team profiles." /></div>
          ) : (
            <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {team.map((m, i) => (
                <motion.div key={m.id} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: (i % 4) * 0.06 }} className="rounded-2xl bg-white p-6 text-center shadow-sm">
                  {m.photo_url ? (
                    <img src={m.photo_url} alt={m.full_name} className="mx-auto h-36 w-36 rounded-full object-cover shadow-md" />
                  ) : (
                    <div className="mx-auto grid h-36 w-36 place-items-center rounded-full bg-brand-100 text-[36px] font-extrabold text-brand-600 shadow-md">
                      {m.full_name.charAt(0)}
                    </div>
                  )}
                  <h3 className="mt-5 text-[14.5px] font-bold text-ink-900">{m.full_name}</h3>
                  {m.title && <div className="mt-0.5 text-[12.5px] text-ink-500">{m.title}</div>}
                  {m.bio && <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-500">{m.bio}</p>}
                  {m.linkedin_url && (
                    <a href={m.linkedin_url} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                      <ExternalLink size={14} /> LinkedIn
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
