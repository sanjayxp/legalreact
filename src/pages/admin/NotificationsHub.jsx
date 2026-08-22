import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Clock, Inbox, UserPlus } from 'lucide-react';
import { getAdminAlerts, listPendingAdvocates, listSupportTickets } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Misc';
import { Link } from 'react-router-dom';

export default function NotificationsHub() {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState({});
  const [pendingAdvocates, setPendingAdvocates] = useState([]);
  const [tickets, setTickets] = useState([]);

  async function load() {
    try {
      const [a, p, t] = await Promise.all([
        getAdminAlerts(),
        listPendingAdvocates(),
        listSupportTickets({ status: 'open' }),
      ]);
      setAlerts(a);
      setPendingAdvocates(p || []);
      setTickets(t || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  const alertItems = [
    {
      icon: UserPlus,
      tone: 'brand',
      title: 'New Account Signups (24h)',
      count: alerts.newAccounts || 0,
      action: 'View',
      link: '/admin/people?tab=clients',
    },
    {
      icon: AlertCircle,
      tone: 'coral',
      title: 'Pending Advocate Approvals',
      count: alerts.pendingAdvocates || 0,
      action: 'Review',
      link: '/admin/people?tab=advocates',
    },
    {
      icon: Clock,
      tone: 'sun',
      title: 'Overdue Leads (24h+)',
      count: alerts.overdueLeads || 0,
      action: 'Assign',
      link: '/admin/leads',
    },
    {
      icon: Inbox,
      tone: 'brand',
      title: 'Open Support Tickets',
      count: alerts.openTickets || 0,
      action: 'Resolve',
      link: '/admin/support',
    },
  ];

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Notifications Hub</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Critical alerts and action items requiring your attention.</p>
      </motion.div>

      {/* Alert Cards */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {alertItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="border-l-4" style={{ borderLeftColor: `var(--color-${item.tone}-500)` }}>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg bg-${item.tone}-50 p-2`}>
                    <Icon size={18} className={`text-${item.tone}-600`} />
                  </div>
                  <div>
                    <div className="text-[12px] uppercase tracking-wide text-ink-500">{item.title}</div>
                    <div className="mt-2 text-[32px] font-bold text-ink-900">{item.count}</div>
                  </div>
                </div>
              </div>
              <Link to={item.link}>
                <Button size="sm" className="mt-4 w-full">{item.action}</Button>
              </Link>
            </Card>
          );
        })}
      </div>

      {/* Pending Advocates */}
      {pendingAdvocates.length > 0 && (
        <Card className="mt-6">
          <CardHeading title="Pending Advocate Approvals" sub={`${pendingAdvocates.length} waiting for verification`} />
          <div className="space-y-2">
            {pendingAdvocates.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-ink-50 p-3">
                <div>
                  <div className="font-semibold text-ink-900">{a.full_name}</div>
                  <div className="text-[12px] text-ink-500">Applied {new Date(a.created_at).toLocaleDateString()}</div>
                </div>
                <Link to="/admin/people?tab=advocates">
                  <Button size="sm" variant="primary">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open Tickets */}
      {tickets.length > 0 && (
        <Card className="mt-6">
          <CardHeading title="Open Support Tickets" sub={`${tickets.length} requiring resolution`} />
          <div className="space-y-2">
            {tickets.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.priority === 'urgent' ? 'coral' : t.priority === 'high' ? 'sun' : 'gray'}>
                      {t.priority}
                    </Badge>
                    <span className="font-semibold text-ink-900">{t.title}</span>
                  </div>
                  <div className="mt-1 text-[12px] text-ink-500">{t.user_name} · {t.category}</div>
                </div>
                <Link to="/admin/support">
                  <Button size="sm" variant="ghost">Resolve</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {alerts.pendingAdvocates === 0 && alerts.openTickets === 0 && pendingAdvocates.length === 0 && (
        <Card className="mt-6 border-dashed">
          <div className="text-center py-8">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <div className="mt-3 font-semibold text-ink-900">All clear!</div>
            <div className="text-[13px] text-ink-500">No urgent actions needed at the moment.</div>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
