import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Inbox, UserPlus, X as XIcon, MapPin, IndianRupee, Globe2, Phone, Mail } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { listMyLeads, acceptLead, declineLead, listOpenLeads, claimLead } from '../../lib/cms';
import { findMatterType } from '../../lib/matterTypes';
import AdvocateShell from '../../components/layout/AdvocateShell';
import { ENQUIRY_STATUS_TONE } from '../../components/advocate/bookingUi';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

// Open matters and Enquiries used to be separate tabs, and the difference —
// whether a matter had been claimed yet — is ours, not the advocate's. They are
// one list now, ordered so the ones already theirs come first.
const FILTERS = [
  { key: 'all', label: 'Everything' },
  { key: 'mine', label: 'Mine' },
  { key: 'open', label: 'Open to all' },
];

export default function Enquiries() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [mine, setMine] = useState([]);
  const [open, setOpen] = useState([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('ok');
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  function say(text, kind = 'ok') { setMsg(text); setMsgKind(kind); }

  async function load() {
    const [ml, ol] = await Promise.all([
      listMyLeads(user.id),
      listOpenLeads().catch(() => []),
    ]);
    setMine(ml.filter((l) => l.status === 'new' || l.status === 'contacted'));
    setOpen(ol);
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user]);

  // One list, each row carrying whether it is already this advocate's.
  const rows = useMemo(() => {
    const claimed = mine.map((l) => ({ ...l, kind: 'mine' }));
    const unclaimed = open.map((l) => ({ ...l, kind: 'open' }));
    const all = [...claimed, ...unclaimed].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === 'mine' ? -1 : 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });
    return filter === 'all' ? all : all.filter((r) => r.kind === filter);
  }, [mine, open, filter]);

  const COPY = {
    claim: { title: 'Take this on?', body: (l) => `${l} becomes yours alone and leaves every other advocate's list. You get the client's contact details.`, cta: 'Take it on', danger: false },
    accept: { title: 'Add as a client?', body: (l) => `${l} joins your client register and the enquiry is marked converted.`, cta: 'Add client', danger: false },
    decline: { title: 'Pass on this?', body: (l) => `${l} goes back to the open list for another advocate. You can still take it again while nobody has.`, cta: 'Pass on it', danger: true },
  };

  async function run() {
    if (!confirm) return;
    setBusy(true);
    try {
      if (confirm.kind === 'claim') { await claimLead(confirm.id); say('Taken on — their details are below.'); }
      else if (confirm.kind === 'accept') { await acceptLead(confirm.id); say('Added to your clients.'); }
      else { await declineLead(confirm.id); say('Passed on.'); }
      setConfirm(null);
      await load();
    } catch (e) {
      say(e.message, 'err');
      await load();
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  const mineCount = mine.length;

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Enquiries</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">
          People who want an advocate. Ones you have taken on are first; the rest are open to every
          verified advocate until someone takes them.
        </p>
      </motion.div>

      {msg && <div className="mt-3"><Toast text={msg} kind={msgKind} /></div>}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const n = f.key === 'all' ? mine.length + open.length : f.key === 'mine' ? mineCount : open.length;
          const active = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                active
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : 'border-ink-100 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-600'
              }`}
            >
              {f.label} <span className={active ? 'text-white/70' : 'text-ink-400'}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 space-y-3">
        {rows.length === 0 && (
          <EmptyState
            icon={<Inbox size={28} />}
            title="Nothing here right now"
            sub="New enquiries from clients appear here — yours first, then the ones open to everyone."
          />
        )}

        {rows.map((l) => {
          const type = findMatterType(l.matter_type);
          const isMine = l.kind === 'mine';
          return (
            <Card key={l.id} className="!p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                    {type && <Badge tone="blue">{type.label}</Badge>}
                    {isMine ? (
                      <Badge tone={ENQUIRY_STATUS_TONE[l.status] || 'gray'}>Yours</Badge>
                    ) : (
                      <Badge tone="gray"><Globe2 size={11} className="mr-1 inline" />Open to all</Badge>
                    )}
                  </div>

                  <div className="text-[14.5px] font-bold text-ink-900">{l.matter || 'Legal matter'}</div>

                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-ink-500">
                    <span>{isMine ? (l.client_name || 'Client') : l.display_name}</span>
                    {l.city && <span className="flex items-center gap-1"><MapPin size={12} /> {l.city}</span>}
                    {l.budget && <span className="flex items-center gap-1"><IndianRupee size={12} /> {l.budget}</span>}
                    <span>{new Date(l.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>

                  {/* Contact details exist only once it is theirs. */}
                  {isMine ? (
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px]">
                      {l.phone && (
                        <a href={`tel:${l.phone}`} className="flex items-center gap-1.5 font-semibold text-brand-600 hover:underline">
                          <Phone size={12} /> {l.phone}
                        </a>
                      )}
                      {l.email && (
                        <a href={`mailto:${l.email}`} className="flex items-center gap-1.5 text-ink-500 hover:text-brand-600">
                          <Mail size={12} /> {l.email}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1.5 text-[12px] text-ink-400">
                      Contact details are shared once you take this on.
                    </div>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap gap-2">
                  {isMine ? (
                    <>
                      <Button size="sm" onClick={() => setConfirm({ kind: 'accept', id: l.id, label: l.client_name || 'This enquiry' })}>
                        <UserPlus size={14} /> Add as client
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setConfirm({ kind: 'decline', id: l.id, label: l.matter || 'This enquiry' })}>
                        <XIcon size={14} /> Pass
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={() => setConfirm({ kind: 'claim', id: l.id, label: l.matter || 'This matter' })}>
                      <UserPlus size={14} /> Take this on
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={run}
        busy={busy}
        busyLabel="Working…"
        danger={COPY[confirm?.kind]?.danger}
        confirmLabel={COPY[confirm?.kind]?.cta}
        title={COPY[confirm?.kind]?.title || 'Are you sure?'}
        message={COPY[confirm?.kind]?.body?.(confirm?.label || 'This enquiry') || ''}
      />
    </AdvocateShell>
  );
}
