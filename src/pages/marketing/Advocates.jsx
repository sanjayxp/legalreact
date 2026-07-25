import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, BadgeCheck, Gavel, IndianRupee } from 'lucide-react';
import { listApprovedAdvocatesPublic } from '../../lib/cms';
import { PRACTICE_AREAS } from '../../lib/practiceAreas';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input } from '../../components/ui/Field';
import { EmptyState, Spinner, Avatar } from '../../components/ui/Misc';

export default function Advocates() {
  const [loading, setLoading] = useState(true);
  const [advocates, setAdvocates] = useState([]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();
  const [area, setArea] = useState(searchParams.get('area') || 'all');

  useEffect(() => {
    (async () => {
      setLoading(true);
      setAdvocates(await listApprovedAdvocatesPublic());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('area');
    if (fromUrl) setArea(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    return advocates.filter((a) => {
      if (area !== 'all' && !(a.practice_areas || []).includes(area)) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [a.profiles?.full_name, a.headline, a.city, a.state, ...(a.practice_areas || [])].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [advocates, search, area]);

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Directory</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Find a Verified Advocate</h1>
          <p className="mt-2 max-w-lg text-[16px] text-ink-500">Browse Bar Council-verified advocates by practice area and city — no account needed to look.</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
              <Input className="pl-10" placeholder="Search by name, city, or headline…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select value={area} onChange={(e) => setArea(e.target.value)} className="rounded-lg border border-ink-100 px-3.5 py-2.5 text-[14.5px] font-semibold text-ink-700 sm:w-64">
              <option value="all">All practice areas</option>
              {PRACTICE_AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        {loading ? (
          <Spinner />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Gavel size={28} />} title="No advocates match your search" sub="Try a different practice area or search term." />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 8) * 0.04 }}>
                <Link to={`/advocates/${a.id}`}>
                  <Card hover className="h-full">
                    <div className="flex items-center gap-3">
                      <Avatar src={a.photo_url} name={a.profiles?.full_name} size={52} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-[15.5px] font-bold text-ink-900">{a.profiles?.full_name}</span>
                          <BadgeCheck size={15} className="shrink-0 text-brand-500" />
                        </div>
                        <div className="truncate text-[13px] text-ink-500">{a.headline}</div>
                      </div>
                    </div>
                    {(a.city || a.state) && (
                      <div className="mt-3 flex items-center gap-1.5 text-[13px] text-ink-400">
                        <MapPin size={13} /> {[a.city, a.state].filter(Boolean).join(', ')}
                      </div>
                    )}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(a.practice_areas || []).slice(0, 3).map((p) => <Badge key={p} tone="blue">{p}</Badge>)}
                      {(a.practice_areas || []).length > 3 && <Badge tone="gray">+{a.practice_areas.length - 3}</Badge>}
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-ink-50 pt-3">
                      <span className="text-[13px] text-ink-400">{a.experience_years ? `${a.experience_years} yrs experience` : ' '}</span>
                      {a.consultation_fee && (
                        <span className="flex items-center gap-0.5 text-[14px] font-bold text-brand-600">
                          <IndianRupee size={13} />{a.consultation_fee}<span className="font-normal text-ink-400">/30min</span>
                        </span>
                      )}
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
