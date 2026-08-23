import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, FileWarning, Clock, UserX, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getComplianceSnapshot } from '../../lib/cms';
import { useLiveRefresh } from '../../lib/realtime';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { Spinner, EmptyState } from '../../components/ui/Misc';

function daysAgo(dateStr) {
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / (24 * 3600 * 1000));
}

const COUNT_CLASSES = {
  amber: 'text-amber-600',
  red: 'text-rose-600',
  gray: 'text-ink-500',
};

export default function Compliance() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  function load() {
    getComplianceSnapshot()
      .then(setData)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  // Without this, approving an advocate without a bar certificate (or any
  // other compliance-relevant change) on another tab/page wouldn't show up
  // here until the page was manually reloaded — the snapshot was fetched
  // once on mount and never touched again.
  useLiveRefresh('admin-compliance-live', [
    { table: 'advocate_profiles' },
    { table: 'support_tickets' },
    { table: 'audit_log' },
    { table: 'profiles' },
  ], load);

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  const sections = [
    {
      key: 'stalePendingReview',
      icon: Clock,
      tone: 'amber',
      title: 'Verification review overdue',
      sub: 'Advocate applications pending more than 7 days.',
      items: data.stalePendingReview,
      render: (r) => (
        <>
          <div className="font-semibold text-ink-900">{r.profiles?.full_name || 'Unnamed'}</div>
          <div className="text-[12px] text-ink-500">{r.profiles?.email} · waiting {daysAgo(r.submitted_at)} days</div>
        </>
      ),
      link: '/admin/people?tab=advocates',
    },
    {
      key: 'missingBarCertificate',
      icon: FileWarning,
      tone: 'red',
      title: 'Approved without bar certificate',
      sub: 'Verified advocates with no bar certificate on file — a KYC gap.',
      items: data.missingBarCertificate,
      render: (r) => (
        <>
          <div className="font-semibold text-ink-900">{r.profiles?.full_name || 'Unnamed'}</div>
          <div className="text-[12px] text-ink-500">{r.profiles?.email}</div>
        </>
      ),
      link: '/admin/people?tab=advocates',
    },
    {
      key: 'ticketSlaBreaches',
      icon: Clock,
      tone: 'amber',
      title: 'Support ticket SLA breaches',
      sub: 'Open or in-progress tickets older than 48 hours.',
      items: data.ticketSlaBreaches,
      render: (r) => (
        <>
          <div className="font-semibold text-ink-900">{r.title}</div>
          <div className="text-[12px] text-ink-500">{r.user_name} · {daysAgo(r.created_at)} days old</div>
        </>
      ),
      link: '/admin/support',
    },
    {
      key: 'incompleteSignups',
      icon: UserX,
      tone: 'gray',
      title: 'Incomplete advocate signups',
      sub: 'Registered as advocate but never started verification.',
      items: data.incompleteSignups,
      render: (r) => (
        <>
          <div className="font-semibold text-ink-900">{r.full_name || 'Unnamed'}</div>
          <div className="text-[12px] text-ink-500">{r.email} · joined {daysAgo(r.created_at)} days ago</div>
        </>
      ),
      link: '/admin/people?tab=advocates',
    },
  ];

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Compliance</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">DPDP Act 2023 obligations and operational gaps that need attention.</p>
      </motion.div>

      <div className="mt-6 grid grid-cols-4 gap-4">
        {sections.map((s) => (
          <Card key={s.key} className="p-4">
            <div className="text-[12px] uppercase tracking-wide text-ink-500">{s.title}</div>
            <div className={`mt-1 text-[24px] font-bold ${COUNT_CLASSES[s.tone]}`}>
              {s.items.length}
            </div>
          </Card>
        ))}
      </div>

      {sections.map((s) => {
        const Icon = s.icon;
        return (
          <Card key={s.key} className="mt-6">
            <div className="mb-4 flex items-center gap-2">
              <Icon size={16} className="text-ink-500" />
              <CardHeading title={s.title} sub={s.sub} />
            </div>
            {s.items.length === 0 ? (
              <div className="border-t border-ink-100 pt-4 text-[13px] text-ink-500">Nothing to flag.</div>
            ) : (
              <div className="space-y-2 border-t border-ink-100 pt-4">
                {s.items.slice(0, 8).map((item) => (
                  <Link
                    key={item.id}
                    to={s.link}
                    className="block rounded-lg border border-ink-100 p-3 hover:bg-ink-50"
                  >
                    {s.render(item)}
                  </Link>
                ))}
                {s.items.length > 8 && (
                  <div className="pt-1 text-[12px] text-ink-500">+{s.items.length - 8} more</div>
                )}
              </div>
            )}
          </Card>
        );
      })}

      <Card className="mt-6">
        <div className="mb-4 flex items-center gap-2">
          <Trash2 size={16} className="text-ink-500" />
          <CardHeading title="Right to erasure log" sub="Account deletions, self-service and admin-initiated (DPDP Act, Section 12)." />
        </div>
        {data.erasureRequests.length === 0 ? (
          <div className="border-t border-ink-100 pt-4 text-[13px] text-ink-500">No deletions recorded yet.</div>
        ) : (
          <div className="space-y-2 border-t border-ink-100 pt-4">
            {data.erasureRequests.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.action === 'self_account_deletion' ? 'blue' : 'gray'}>
                      {r.action === 'self_account_deletion' ? 'Self-requested' : 'Admin-initiated'}
                    </Badge>
                    <span className="text-[12px] text-ink-600">{r.admin_email}</span>
                  </div>
                  {r.notes && <div className="mt-1 text-[12px] text-ink-500">{r.notes}</div>}
                </div>
                <div className="text-[11px] text-ink-400">{new Date(r.created_at).toLocaleString()}</div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </AdminShell>
  );
}
