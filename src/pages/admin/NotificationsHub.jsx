import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, Briefcase, CheckCheck, Gavel, LifeBuoy, ShieldCheck, UserPlus } from 'lucide-react';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Field';
import { Spinner, Toast } from '../../components/ui/Misc';

const TYPE_META = {
  matter_posted: { label: 'Matter posted', icon: Briefcase, tone: 'blue' },
  client_created: { label: 'New client', icon: UserPlus, tone: 'gray' },
  advocate_created: { label: 'New advocate', icon: Gavel, tone: 'green' },
  advocate_submitted: { label: 'Advocate submitted', icon: ShieldCheck, tone: 'amber' },
  support_ticket: { label: 'Support ticket', icon: LifeBuoy, tone: 'red' },
};

// Static class sets so Tailwind actually generates them (dynamic
// template-string class names are invisible to the compiler).
const TILES = [
  { key: '', label: 'Total', valueClass: 'text-ink-900', activeClass: 'border-brand-300 bg-brand-50' },
  { key: 'unread', label: 'Unread', valueClass: 'text-rose-600', activeClass: 'border-rose-300 bg-rose-50' },
];

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

export default function NotificationsHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [readFilter, setReadFilter] = useState(''); // '' | 'unread'
  const [typeFilter, setTypeFilter] = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try {
      setNotifications(await listNotifications());
    } catch (e) {
      console.error(e);
      setMsg(e.message || 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 20000);
    return () => clearInterval(interval);
  }, []);

  // Derived from the same list the rows show, so tiles never drift out of sync.
  const stats = useMemo(() => ({
    total: notifications.length,
    unread: notifications.filter((n) => !n.read).length,
  }), [notifications]);

  const filtered = useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === 'unread' && n.read) return false;
      if (typeFilter && n.type !== typeFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const hay = [n.title, n.body, n.actor_name].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(s)) return false;
      }
      return true;
    });
  }, [notifications, readFilter, typeFilter, search]);

  function notifyBadgeUpdate() {
    window.dispatchEvent(new Event('lc-notifications-updated'));
  }

  async function handleOpen(n) {
    if (!n.read) {
      try {
        await markNotificationRead(n.id);
        setNotifications((rows) => rows.map((r) => (r.id === n.id ? { ...r, read: true } : r)));
        notifyBadgeUpdate();
      } catch (e) {
        setMsg(e.message || 'Could not update notification.');
        return;
      }
    }
    if (n.link) navigate(n.link);
  }

  async function handleMarkRead(e, n) {
    e.stopPropagation();
    try {
      await markNotificationRead(n.id);
      setNotifications((rows) => rows.map((r) => (r.id === n.id ? { ...r, read: true } : r)));
      notifyBadgeUpdate();
    } catch (e2) {
      setMsg(e2.message || 'Could not update notification.');
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
      setNotifications((rows) => rows.map((r) => ({ ...r, read: true })));
      notifyBadgeUpdate();
      setMsg('All notifications marked as read.');
    } catch (e) {
      setMsg(e.message || 'Could not mark all as read.');
    }
  }

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Notifications</h1>
          <p className="mt-1 text-[14.5px] text-ink-500">Every matter posted, account created, and platform event, refreshed every 20 seconds.</p>
        </div>
        {stats.unread > 0 && (
          <Button size="sm" variant="ghost" onClick={handleMarkAllRead} className="shrink-0">
            <CheckCheck size={14} /> Mark all read
          </Button>
        )}
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msg.includes('Could not') ? 'err' : 'ok'} /></div>}

      {/* Total / Unread tiles double as filters */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:w-80">
        {TILES.map((t) => {
          const active = readFilter === t.key;
          const count = t.key === '' ? stats.total : stats.unread;
          return (
            <button
              key={t.label}
              onClick={() => setReadFilter(t.key)}
              className={`rounded-2xl border p-3 text-center transition-all ${
                active
                  ? `${t.activeClass} shadow-[var(--shadow-card-hover)]`
                  : 'border-ink-100 bg-white hover:border-ink-200 hover:shadow-[var(--shadow-card-hover)]'
              }`}
            >
              <div className="text-[11px] font-semibold text-ink-500">{t.label}</div>
              <div className={`mt-1 text-[24px] font-bold ${t.valueClass}`}>{count}</div>
            </button>
          );
        })}
      </div>

      {/* Filters & list */}
      <Card className="mt-6">
        <CardHeading
          title="All notifications"
          sub={readFilter === 'unread' ? `Showing ${filtered.length} unread.` : `Showing ${filtered.length} of ${stats.total}.`}
        />

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Search by title, detail, or name…" value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="w-full sm:w-52">
            <option value="">All types</option>
            {Object.entries(TYPE_META).map(([key, meta]) => (
              <option key={key} value={key}>{meta.label}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 border-t border-ink-100 pt-4">
          {filtered.map((n) => {
            const meta = TYPE_META[n.type] || { label: n.type, icon: Bell, tone: 'gray' };
            const Icon = meta.icon;
            return (
              <div
                key={n.id}
                onClick={() => handleOpen(n)}
                className={`cursor-pointer rounded-lg border p-4 transition-all hover:border-brand-300 hover:bg-brand-50/50 ${
                  n.read ? 'border-ink-100' : 'border-brand-200 bg-brand-50/30'
                }`}
              >
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {!n.read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-rose-500" />}
                    <div className={`shrink-0 rounded-lg p-2 ${n.read ? 'bg-ink-50 text-ink-400' : 'bg-brand-50 text-brand-600'}`}>
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={meta.tone}>{meta.label}</Badge>
                        <span className={`font-bold ${n.read ? 'text-ink-700' : 'text-ink-900'}`}>{n.title}</span>
                      </div>
                      {n.body && <div className="mt-1 line-clamp-2 text-[13px] text-ink-600">{n.body}</div>}
                      <div className="mt-1 text-[12px] text-ink-500">
                        {n.actor_name ? `${n.actor_name} · ` : ''}{timeAgo(n.created_at)}
                      </div>
                    </div>
                  </div>
                  {!n.read && (
                    <Button size="sm" variant="ghost" onClick={(e) => handleMarkRead(e, n)} className="shrink-0">
                      Mark as read
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="py-10 text-center">
              <Bell size={28} className="mx-auto text-ink-300" />
              <div className="mt-3 text-[14px] font-semibold text-ink-900">No notifications</div>
              <div className="mt-1 text-[12.5px] text-ink-500">
                {stats.total === 0
                  ? 'Notifications appear here the moment a matter is posted, an account is created, or anything else happens on the platform.'
                  : 'Try clearing the filters or search.'}
              </div>
            </div>
          )}
        </div>
      </Card>
    </AdminShell>
  );
}
