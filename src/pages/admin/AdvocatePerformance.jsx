import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Briefcase, Star } from 'lucide-react';
import { getAdvocatePerformance } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Input, Select } from '../../components/ui/Field';
import { Spinner } from '../../components/ui/Misc';

export default function AdvocatePerformance() {
  const [loading, setLoading] = useState(true);
  const [advocates, setAdvocates] = useState([]);
  const [sortBy, setSortBy] = useState('consultations');
  const [search, setSearch] = useState('');

  async function load() {
    try {
      const data = await getAdvocatePerformance();
      setAdvocates(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = advocates.filter((a) => {
      if (!search) return true;
      return a.full_name?.toLowerCase().includes(search.toLowerCase());
    });

    return result.sort((a, b) => {
      if (sortBy === 'consultations') return b.consultations - a.consultations;
      if (sortBy === 'cases') return b.cases - a.cases;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'views') return b.view_count - a.view_count;
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
        <p className="mt-1 text-[14.5px] text-ink-500">Track advocate activity, ratings, and engagement.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-[12px] uppercase tracking-wide text-ink-500">Total Advocates</div>
          <div className="mt-1 text-[24px] font-bold text-ink-900">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] uppercase tracking-wide text-ink-500">Verified</div>
          <div className="mt-1 text-[24px] font-bold text-emerald-600">{stats.approved}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] uppercase tracking-wide text-ink-500">Consultations</div>
          <div className="mt-1 text-[24px] font-bold text-brand-600">{stats.totalConsultations}</div>
        </Card>
        <Card className="p-4">
          <div className="text-[12px] uppercase tracking-wide text-ink-500">Cases Handled</div>
          <div className="mt-1 text-[24px] font-bold text-sun-600">{stats.totalCases}</div>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeading title="Rankings" sub="Sort by performance metrics." />

        <div className="mb-4 flex gap-3">
          <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-48">
            <option value="consultations">Consultations</option>
            <option value="cases">Cases Handled</option>
            <option value="rating">Rating</option>
            <option value="views">Profile Views</option>
          </Select>
        </div>

        <div className="space-y-2 border-t border-ink-100 pt-4">
          {filtered.map((a, i) => (
            <div key={a.id} className="flex items-center gap-4 rounded-lg border border-ink-100 p-4 hover:bg-ink-50">
              <div className="text-[18px] font-bold text-ink-400 w-8">{i + 1}</div>
              <div className="flex-1">
                <div className="font-semibold text-ink-900">{a.full_name}</div>
                <div className="mt-1 flex items-center gap-3 text-[12px] text-ink-500">
                  <Badge tone={a.verification_status === 'approved' ? 'green' : 'amber'}>
                    {a.verification_status}
                  </Badge>
                  <span>{a.view_count} profile views</span>
                </div>
              </div>
              <div className="flex gap-6 text-right">
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-ink-400">Consultations</div>
                  <div className="text-[18px] font-bold text-ink-900">{a.consultations}</div>
                </div>
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-ink-400">Cases</div>
                  <div className="text-[18px] font-bold text-ink-900">{a.cases}</div>
                </div>
                <div>
                  <div className="text-[12px] uppercase tracking-wide text-ink-400">Rating</div>
                  <div className="flex items-center gap-1">
                    <Star size={14} className="fill-sun-500 text-sun-500" />
                    <span className="text-[14px] font-bold">{a.rating?.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AdminShell>
  );
}
