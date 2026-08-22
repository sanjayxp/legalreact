import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, Briefcase, CalendarCheck, Eye } from 'lucide-react';
import { getAdvocatePerformance } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/Misc';

export default function AdvocatePerformance() {
  const [loading, setLoading] = useState(true);
  const [advocates, setAdvocates] = useState([]);
  const [sortBy, setSortBy] = useState('consultations');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  async function load() {
    try {
      setError('');
      const data = await getAdvocatePerformance();
      setAdvocates(data || []);
    } catch (e) {
      console.error('Error loading advocate performance:', e);
      setError(e.message || 'Failed to load advocate data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const result = advocates.filter((a) => {
      if (!search) return true;
      return a.full_name?.toLowerCase().includes(search.toLowerCase());
    });

    return [...result].sort((a, b) => {
      if (sortBy === 'consultations') return b.consultations - a.consultations;
      if (sortBy === 'cases') return b.cases - a.cases;
      if (sortBy === 'views') return b.view_count - a.view_count;
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
      return 0;
    });
  }, [advocates, search, sortBy]);

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  const stats = {
    total: advocates.length,
    approved: advocates.filter((a) => a.verification_status === 'approved').length,
    totalConsultations: advocates.reduce((sum, a) => sum + (a.consultations || 0), 0),
    totalCases: advocates.reduce((sum, a) => sum + (a.cases || 0), 0),
  };

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Advocate Performance</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Track advocate activity and engagement across the platform.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total advocates" value={stats.total} icon={<Users size={16} />} accent="brand" />
        <StatTile label="Verified" value={stats.approved} icon={<CalendarCheck size={16} />} accent="green" />
        <StatTile label="Consultations" value={stats.totalConsultations} icon={<Eye size={16} />} accent="sun" />
        <StatTile label="Cases handled" value={stats.totalCases} icon={<Briefcase size={16} />} accent="coral" />
      </div>

      <Card className="mt-6">
        <CardHeading title="Advocates" sub="Sorted by the metric you pick." />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full sm:w-48">
            <option value="consultations">Most consultations</option>
            <option value="cases">Most cases handled</option>
            <option value="views">Most profile views</option>
            <option value="newest">Newest first</option>
          </Select>
        </div>

        <div className="space-y-2 border-t border-ink-100 pt-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-[13px] text-rose-700">
              <strong>Error:</strong> {error}
            </div>
          )}
          {!error && advocates.length === 0 && (
            <div className="py-10 text-center">
              <Users size={28} className="mx-auto text-ink-300" />
              <div className="mt-3 text-[14px] font-semibold text-ink-900">No advocates yet</div>
              <div className="mt-1 text-[12.5px] text-ink-500">
                Advocates appear here once they sign up and create their profile.
              </div>
            </div>
          )}
          {!error && advocates.length > 0 && filtered.length === 0 && (
            <div className="py-6 text-center text-[13px] text-ink-400">No advocates match your search.</div>
          )}
          {filtered.map((a) => (
            <div key={a.id} className="flex flex-col gap-3 rounded-lg border border-ink-100 p-4 transition-colors hover:bg-ink-50 sm:flex-row sm:items-center sm:gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink-900">{a.full_name}</span>
                  <Badge tone={a.verification_status === 'approved' ? 'green' : a.verification_status === 'rejected' ? 'red' : 'amber'}>
                    {a.verification_status}
                  </Badge>
                </div>
                <div className="mt-1 text-[12px] text-ink-500">
                  Joined {new Date(a.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                </div>
              </div>
              <div className="flex shrink-0 gap-6 text-right">
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-400">Consultations</div>
                  <div className="text-[18px] font-bold text-ink-900">{a.consultations}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-400">Cases</div>
                  <div className="text-[18px] font-bold text-ink-900">{a.cases}</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-400">Views</div>
                  <div className="text-[18px] font-bold text-ink-900">{a.view_count}</div>
                </div>
              </div>
            </div>
          ))}
          {filtered.length > 0 && (
            <div className="pt-2 text-center text-[12px] text-ink-400">
              Showing {filtered.length} of {advocates.length} advocates
            </div>
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
