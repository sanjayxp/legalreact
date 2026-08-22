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

// Static class sets so Tailwind actually generates them (template-string
// class names like `bg-${tone}-50` are invisible to the compiler).
const CARD_STYLES = {
  brand: { icon: 'bg-brand-50 text-brand-600', border: 'var(--color-brand-500)' },
  coral: { icon: 'bg-rose-50 text-rose-600', border: 'var(--color-coral-500)' },
  sun: { icon: 'bg-amber-50 text-amber-600', border: 'var(--color-sun-500)' },
};

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
      title: 'New signups (24h)',
      count: alerts.newAccounts || 0,
      action: 'View',
      link: '/admin/people?tab=clients',
    },
    {
      icon: AlertCircle,
      tone: 'coral',
      title: 'Pending advocate approvals',
      count: alerts.pendingAdvocates || 0,
      action: 'Review',
      link: '/admin/people?tab=advocates',
    },
    {
      icon: Clock,
      tone: 'sun',
      title: 'Overdue leads (24h+)',
      count: alerts.overdueLeads || 0,
      action: 'Assign',
      link: '/admin/leads',
    },
    {
      icon: Inbox,
      tone: 'brand',
      title: 'Open support tickets',
      count: alerts.openTickets || 0,
      action: 'Resolve',
      link: '/admin/support',
    },
  ];

  const totalAlerts = alertItems.reduce((sum, i) => sum + i.count, 0);

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Alerts</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">Everything that needs your attention, refreshed every 30 seconds.</p>
      </motion.div>

      {/* Alert cards — the whole card is clickable */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {alertItems.map((item) => {
          const Icon = item.icon;
          const style = CARD_STYLES[item.tone];
          return (
            <Link key={item.title} to={item.link}>
              <Card
                className="h-full cursor-pointer border-l-4 transition-all hover:shadow-[var(--shadow-card-hover)]"
                style={{ borderLeftColor: style.border }}
              >
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg p-2 ${style.icon}`}>
                    <Icon size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">{item.title}</div>
                    <div className="mt-1.5 text-[30px] font-bold leading-none text-ink-900">{item.count}</div>
                  </div>
                </div>
                <Button size="sm" className="mt-4 w-full">{item.action}</Button>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Pending advocates */}
      {pendingAdvocates.length > 0 && (
        <Card className="mt-6">
          <CardHeading title="Pending advocate approvals" sub={`${pendingAdvocates.length} waiting for verification`} />
          <div className="space-y-2">
            {pendingAdvocates.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg bg-ink-50 p-3">
                <div>
                  <div className="font-semibold text-ink-900">{a.profiles?.full_name || a.full_name || 'Advocate'}</div>
                  <div className="text-[12px] text-ink-500">Applied {new Date(a.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</div>
                </div>
                <Link to="/admin/people?tab=advocates">
                  <Button size="sm" variant="primary">Review</Button>
                </Link>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Open tickets */}
      {tickets.length > 0 && (
        <Card className="mt-6">
          <CardHeading title="Open support tickets" sub={`${tickets.length} requiring resolution`} />
          <div className="space-y-2">
            {tickets.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={t.priority === 'urgent' ? 'red' : t.priority === 'high' ? 'amber' : 'gray'}>
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

      {/* All clear */}
      {totalAlerts === 0 && (
        <Card className="mt-6 border-dashed">
          <div className="py-8 text-center">
            <CheckCircle2 size={32} className="mx-auto text-emerald-600" />
            <div className="mt-3 font-semibold text-ink-900">All clear!</div>
            <div className="text-[13px] text-ink-500">No urgent actions needed at the moment.</div>
          </div>
        </Card>
      )}
    </AdminShell>
  );
}
