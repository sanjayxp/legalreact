import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scale, Users, ShieldCheck, UsersRound } from 'lucide-react';
import { listPendingAdvocates } from '../../lib/cms';
import { useAdminAccess } from '../../lib/auth';
import AdminShell from '../../components/layout/AdminShell';
import Tabs from '../../components/ui/Tabs';
import VerifyAdvocatesTab from './VerifyAdvocates';
import ClientsTab from './Clients';
import AdminsTab from './Admins';
import TeamTab from './Team';

export default function People() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isSuper } = useAdminAccess();
  const tab = searchParams.get('tab') || 'advocates';
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    listPendingAdvocates().then((rows) => setPendingCount(rows.length)).catch(() => {});
  }, []);

  // Managing admin accounts — including granting/revoking another admin's
  // section access — is a main-admin-only power, never delegable itself.
  const tabs = [
    { key: 'advocates', label: 'Advocates', count: pendingCount, tone: 'brand', icon: Scale },
    { key: 'clients', label: 'Clients', tone: 'emerald', icon: Users },
    ...(isSuper ? [{ key: 'admins', label: 'Admins', tone: 'rose', icon: ShieldCheck }] : []),
    { key: 'team', label: 'Team', tone: 'violet', icon: UsersRound },
  ];

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">People</h1>
        <p className="mt-1 text-[14px] text-ink-500">Everyone on the platform — advocates, clients, admins, and your internal team.</p>
      </motion.div>

      <div className="mt-5">
        <Tabs tabs={tabs} active={tab} onChange={(k) => setSearchParams({ tab: k })} />
      </div>

      <div className="mt-6">
        {tab === 'advocates' && <VerifyAdvocatesTab />}
        {tab === 'clients' && <ClientsTab />}
        {tab === 'admins' && isSuper && <AdminsTab />}
        {tab === 'team' && <TeamTab />}
      </div>
    </AdminShell>
  );
}
