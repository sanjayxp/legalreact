import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../lib/auth';
import { getAvailability, listTimeOff } from '../../lib/cms';
import AdvocateShell from '../../components/layout/AdvocateShell';
import { AvailabilityEditor } from '../../components/advocate/bookingUi';
import { Spinner, Toast } from '../../components/ui/Misc';

// Working hours and time off used to sit as a tab among daily worklists, which
// made them hard to find when wanted and in the way when not. They are settings:
// set once, revisited rarely.
export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [availability, setAvailabilityState] = useState([]);
  const [timeOff, setTimeOff] = useState([]);
  const [msg, setMsg] = useState('');
  const [msgKind, setMsgKind] = useState('ok');

  async function load() {
    const [av, to] = await Promise.all([getAvailability(user.id), listTimeOff(user.id)]);
    setAvailabilityState(av);
    setTimeOff(to);
    setLoading(false);
  }
  useEffect(() => { if (user) load(); }, [user]);

  if (loading) return <AdvocateShell><Spinner /></AdvocateShell>;

  return (
    <AdvocateShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Settings</h1>
        <p className="mt-1 text-[14.5px] text-ink-500">
          When you are available for consultations, and the days you are not.
        </p>
      </motion.div>

      {msg && <div className="mt-3"><Toast text={msg} kind={msgKind} /></div>}

      <div className="mt-5">
        <AvailabilityEditor
          advocateId={user.id}
          availability={availability}
          timeOff={timeOff}
          onSaved={load}
          setMsg={(t, kind = 'ok') => { setMsg(t); setMsgKind(kind); }}
        />
      </div>
    </AdvocateShell>
  );
}
