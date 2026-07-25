import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Gavel, UserCheck, Clock, Inbox, MessageCircleQuestion, Briefcase, GraduationCap, UsersRound, ShieldCheck, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { listPendingAdvocates } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Misc';

const CARDS = [
  { to: '/admin/leads', label: 'Leads', icon: Inbox, desc: 'Enquiries from bookings, posted cases & the case tracker.' },
  { to: '/admin/qa', label: 'Q&A moderation', icon: MessageCircleQuestion, desc: 'Moderate public questions and advocate answers.' },
  { to: '/admin/jobs', label: 'Jobs', icon: Briefcase, desc: 'Manage job postings and view applicants.' },
  { to: '/admin/courses', label: 'Courses', icon: GraduationCap, desc: 'Manage courses & webinars and view enrollees.' },
  { to: '/admin/team', label: 'Team', icon: UsersRound, desc: 'Team members shown on the public About page.' },
  { to: '/admin/verify-advocates', label: 'Advocates', icon: ShieldCheck, desc: 'Review and verify advocate profile submissions.' },
  { to: '/admin/clients', label: 'Clients', icon: Users, desc: 'All registered client accounts.' },
  { to: '/admin/admins', label: 'Admins', icon: UserCheck, desc: 'Manage admin accounts.' },
];

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, advocates: 0, clients: 0 });
  const [pending, setPending] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, pend] = await Promise.all([
        supabase.from('profiles').select('role'),
        listPendingAdvocates(),
      ]);
      const rows = profiles || [];
      setCounts({
        total: rows.length,
        advocates: rows.filter((r) => r.role === 'advocate').length,
        clients: rows.filter((r) => r.role === 'client').length,
      });
      setPending(pend);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell pendingCount={pending.length}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[26px] font-extrabold text-ink-900">Admin overview</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Manage the LegalConnects platform.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatTile label="Total users" value={counts.total} icon={<Users size={16} />} accent="brand" />
        <StatTile label="Advocates" value={counts.advocates} icon={<Gavel size={16} />} accent="coral" />
        <StatTile label="Clients" value={counts.clients} icon={<UserCheck size={16} />} accent="green" />
        <StatTile label="Pending verifications" value={pending.length} icon={<Clock size={16} />} accent="sun" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {CARDS.map((c, i) => (
          <motion.div key={c.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Link to={c.to}>
              <Card hover className="h-full">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><c.icon size={18} /></div>
                <h3 className="mt-3.5 flex items-center gap-1.5 text-[15px] font-bold text-ink-900">{c.label} <ArrowRight size={13} /></h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{c.desc}</p>
                {c.to === '/admin/verify-advocates' && pending.length > 0 && (
                  <Badge tone="amber" className="mt-3">{pending.length} waiting</Badge>
                )}
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </AdminShell>
  );
}
