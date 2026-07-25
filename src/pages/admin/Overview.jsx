import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  Gavel,
  UserCheck,
  Clock,
  Inbox,
  MessageCircleQuestion,
  Briefcase,
  Users2,
  ArrowRight,
  UserPlus,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { listPendingAdvocates, listRecentActivity, listLeads } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import StatTile from '../../components/ui/StatTile';
import Badge from '../../components/ui/Badge';
import { EmptyState, Spinner } from '../../components/ui/Misc';

const CARDS = [
  { to: '/admin/leads', label: 'Leads', icon: Inbox, desc: 'Enquiries from bookings, posted cases & the case tracker.' },
  { to: '/admin/qa', label: 'Q&A moderation', icon: MessageCircleQuestion, desc: 'Moderate public questions and advocate answers.' },
  { to: '/admin/jobs', label: 'Jobs & Learning', icon: Briefcase, desc: 'Postings, courses, applicants and enrollees.' },
  { to: '/admin/people', label: 'People', icon: Users2, desc: 'Advocates to verify, clients, admins, and your team.' },
];

const ACTIVITY_ICON = { signup: UserPlus, lead: Inbox, question: MessageCircleQuestion, submission: ShieldCheck };

export default function Overview() {
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({ total: 0, advocates: 0, clients: 0 });
  const [pending, setPending] = useState([]);
  const [newLeads, setNewLeads] = useState(0);
  const [activity, setActivity] = useState([]);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, pend, leads, feed] = await Promise.all([
        supabase.from('profiles').select('role'),
        listPendingAdvocates(),
        listLeads(),
        listRecentActivity(15),
      ]);
      const rows = profiles || [];
      setCounts({
        total: rows.length,
        advocates: rows.filter((r) => r.role === 'advocate').length,
        clients: rows.filter((r) => r.role === 'client').length,
      });
      setPending(pend);
      setNewLeads(leads.filter((l) => l.status === 'new').length);
      setActivity(feed);
      setLoading(false);
    })();
  }, []);

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[26px] font-extrabold text-ink-900">Admin overview</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">The full pulse of the platform, in one place.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatTile label="Total users" value={counts.total} icon={<Users size={16} />} accent="brand" />
        <StatTile label="Advocates" value={counts.advocates} icon={<Gavel size={16} />} accent="coral" />
        <StatTile label="Clients" value={counts.clients} icon={<UserCheck size={16} />} accent="green" />
        <StatTile label="New leads" value={newLeads} icon={<Inbox size={16} />} accent="sun" />
        <StatTile label="Pending verifications" value={pending.length} icon={<Clock size={16} />} accent="sun" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div>
          <h2 className="text-[16px] font-bold text-ink-900">Manage</h2>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {CARDS.map((c, i) => (
              <motion.div key={c.to} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Link to={c.to}>
                  <Card hover className="h-full">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><c.icon size={18} /></div>
                    <h3 className="mt-3.5 flex items-center gap-1.5 text-[15px] font-bold text-ink-900">{c.label} <ArrowRight size={13} /></h3>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{c.desc}</p>
                    {c.to === '/admin/people' && pending.length > 0 && (
                      <Badge tone="amber" className="mt-3">{pending.length} advocate{pending.length === 1 ? '' : 's'} waiting</Badge>
                    )}
                    {c.to === '/admin/leads' && newLeads > 0 && (
                      <Badge tone="blue" className="mt-3">{newLeads} new</Badge>
                    )}
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <Card className="h-fit">
          <CardHeading title="Recent activity" sub="Everything happening across the platform." />
          {activity.length === 0 ? (
            <EmptyState icon={<FileText size={24} />} title="Nothing yet" />
          ) : (
            <div className="max-h-[520px] space-y-1 overflow-y-auto scrollbar-thin">
              {activity.map((e) => {
                const Icon = ACTIVITY_ICON[e.type] || FileText;
                return (
                  <Link key={`${e.type}-${e.id}`} to={e.href} className="flex items-start gap-2.5 rounded-lg px-2 py-2 hover:bg-ink-50">
                    <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-50 text-brand-600"><Icon size={13} /></div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-semibold text-ink-800">{e.title}</div>
                      <div className="text-[11.5px] text-ink-400">{new Date(e.at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </AdminShell>
  );
}
