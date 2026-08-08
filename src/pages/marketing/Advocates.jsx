import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, MapPin, BadgeCheck, Gavel, X, Video, Phone, Building2, SlidersHorizontal } from 'lucide-react';
import { listApprovedAdvocatesPublic } from '../../lib/cms';
import { PRACTICE_AREAS } from '../../lib/practiceAreas';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import HeroBanner from '../../components/marketing/HeroBanner';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Select } from '../../components/ui/Field';
import { EmptyState, Spinner, Avatar } from '../../components/ui/Misc';

const MODE_META = {
  video: { icon: Video, label: 'Video call' },
  phone: { icon: Phone, label: 'Phone call' },
  inperson: { icon: Building2, label: 'In person' },
};

const EXPERIENCE_OPTIONS = [
  { value: '0', label: 'Any experience' },
  { value: '1', label: '1+ years' },
  { value: '3', label: '3+ years' },
  { value: '5', label: '5+ years' },
  { value: '10', label: '10+ years' },
];

function toggleInSet(set, value) {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

export default function Advocates() {
  const [loading, setLoading] = useState(true);
  const [advocates, setAdvocates] = useState([]);
  const [search, setSearch] = useState('');
  const [searchParams] = useSearchParams();

  const [areas, setAreas] = useState(() => {
    const fromUrl = searchParams.get('area');
    return fromUrl ? new Set([fromUrl]) : new Set();
  });
  const [city, setCity] = useState('all');
  const [state, setState] = useState('all');
  const [minExperience, setMinExperience] = useState('0');
  const [modes, setModes] = useState(new Set());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setAdvocates(await listApprovedAdvocatesPublic());
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const fromUrl = searchParams.get('area');
    if (fromUrl) setAreas(new Set([fromUrl]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const cities = useMemo(
    () => [...new Set(advocates.map((a) => a.city).filter(Boolean))].sort(),
    [advocates]
  );
  const states = useMemo(
    () => [...new Set(advocates.map((a) => a.state).filter(Boolean))].sort(),
    [advocates]
  );

  const filtered = useMemo(() => {
    return advocates.filter((a) => {
      if (areas.size && !(a.practice_areas || []).some((p) => areas.has(p))) return false;
      if (city !== 'all' && a.city !== city) return false;
      if (state !== 'all' && a.state !== state) return false;
      if (Number(minExperience) > 0 && (a.experience_years || 0) < Number(minExperience)) return false;
      if (modes.size && !(a.consultation_modes || []).some((m) => modes.has(m))) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [a.profiles?.full_name, a.headline, a.city, a.state, ...(a.practice_areas || [])].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [advocates, search, areas, city, state, minExperience, modes]);

  const activeFilterCount = areas.size + modes.size + (city !== 'all' ? 1 : 0) + (state !== 'all' ? 1 : 0) + (Number(minExperience) > 0 ? 1 : 0);

  function clearFilters() {
    setAreas(new Set());
    setCity('all');
    setState('all');
    setMinExperience('0');
    setModes(new Set());
    setMaxFee('any');
  }

  const filterFields = (
    <>
      <FilterGroup label="City">
        <Select value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="all">All cities</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
      </FilterGroup>

      <FilterGroup label="State">
        <Select value={state} onChange={(e) => setState(e.target.value)}>
          <option value="all">All states</option>
          {states.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
      </FilterGroup>

      <FilterGroup label="Experience">
        <Select value={minExperience} onChange={(e) => setMinExperience(e.target.value)}>
          {EXPERIENCE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </Select>
      </FilterGroup>

      <FilterGroup label="Consultation mode">
        <div className="space-y-2">
          {Object.entries(MODE_META).map(([key, meta]) => (
            <label key={key} className="flex items-center gap-2 text-[13.5px] text-ink-700">
              <input type="checkbox" className="accent-brand-500" checked={modes.has(key)} onChange={() => setModes((prev) => toggleInSet(prev, key))} />
              <meta.icon size={14} className="text-ink-400" /> {meta.label}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup label="Practice area">
        <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
          {PRACTICE_AREAS.map((p) => (
            <label key={p} className="flex items-center gap-2 text-[13.5px] text-ink-700">
              <input type="checkbox" className="accent-brand-500" checked={areas.has(p)} onChange={() => setAreas((prev) => toggleInSet(prev, p))} />
              {p}
            </label>
          ))}
        </div>
      </FilterGroup>
    </>
  );

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <HeroBanner colors={['gradient-coral', 'gradient-brand']} layout={1} />
        <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Directory</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Find a Verified Advocate</h1>
          <p className="mt-2 max-w-lg text-[16px] text-ink-500">Browse Bar Council-verified advocates by practice area and city — no account needed to look.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-6 flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300" />
            <Input className="pl-10" placeholder="Search by name, city, or headline…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-ink-100 px-4 text-[13.5px] font-semibold text-ink-700 hover:border-brand-300 hover:text-brand-600 lg:hidden"
          >
            <SlidersHorizontal size={15} />
            Filters
            {activeFilterCount > 0 && (
              <span className="grid h-4 w-4 place-items-center rounded-full bg-brand-500 text-[10px] font-bold text-white">{activeFilterCount}</span>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
            <Card className="!p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-[14px] font-bold text-ink-900">Filters</h3>
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="flex items-center gap-1 text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">
                    <X size={12} /> Clear ({activeFilterCount})
                  </button>
                )}
              </div>
              {filterFields}
            </Card>
          </aside>

          <div className="min-w-0">
            <div className="mb-4 text-[13.5px] text-ink-400">
              {!loading && `${filtered.length} advocate${filtered.length === 1 ? '' : 's'} found`}
            </div>

            {loading ? (
              <Spinner />
            ) : filtered.length === 0 ? (
              <EmptyState icon={<Gavel size={28} />} title="No advocates match your filters" sub="Try clearing a filter or broadening your search." />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
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
                          {a.city && <span className="text-[13px] text-ink-400">{a.city}</span>}
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <Modal open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)} title="Filters" width="max-w-md">
        <div className="max-h-[65vh] overflow-y-auto pr-1">
          {filterFields}
        </div>
        <div className="mt-5 flex gap-3">
          {activeFilterCount > 0 && (
            <Button variant="ghost" className="flex-1" onClick={clearFilters}>Clear ({activeFilterCount})</Button>
          )}
          <Button className="flex-1" onClick={() => setMobileFiltersOpen(false)}>
            Show {filtered.length} result{filtered.length === 1 ? '' : 's'}
          </Button>
        </div>
      </Modal>

      <Footer />
    </div>
  );
}

function FilterGroup({ label, children }) {
  return (
    <div className="mt-5 border-t border-ink-50 pt-4 first:mt-4 first:border-t-0 first:pt-0">
      <div className="mb-2 text-[12px] font-bold uppercase tracking-wide text-ink-400">{label}</div>
      {children}
    </div>
  );
}
