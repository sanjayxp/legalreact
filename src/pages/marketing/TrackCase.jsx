import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Gavel, Calendar, FileText, Landmark, LogIn, UserPlus } from 'lucide-react';
import { lookupCaseByCNR } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import HeroBanner from '../../components/marketing/HeroBanner';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Field';
import { Toast } from '../../components/ui/Misc';

export default function TrackCase() {
  const { session } = useAuth();
  const [cnr, setCnr] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);

  async function handleLookup() {
    if (!cnr.trim()) return;
    setBusy(true);
    setErr('');
    setResult(null);
    try {
      const data = await lookupCaseByCNR(cnr.trim().toUpperCase());
      setResult(data);
    } catch (e) {
      setErr(e.message || 'Could not look up that CNR. Please check the number and try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="relative overflow-hidden border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <HeroBanner colors={['gradient-brand', 'gradient-coral']} layout={2} />
        <div className="relative mx-auto max-w-3xl px-5 text-center sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">eCourts network</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Track Your Case</h1>
          <p className="mt-3 text-[16px] text-ink-500">Enter your case's CNR (Case Number Record) to pull the latest status directly from the official eCourts data network.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-14 sm:px-8">
        {!session ? (
          <Card className="text-center">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
              <LogIn size={22} />
            </div>
            <h2 className="mt-3 text-[17px] font-bold text-ink-900">Sign in to track your case</h2>
            <p className="mx-auto mt-1.5 max-w-sm text-[13.5px] text-ink-500">
              eCourts lookups run through a paid data connection, so we ask for a free account first — it also lets us notify you of hearing updates.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
              <Link to="/login"><Button><LogIn size={15} /> Log in</Button></Link>
              <Link to="/login#register"><Button variant="ghost"><UserPlus size={15} /> Create a free account</Button></Link>
            </div>
          </Card>
        ) : (
          <>
            <Card>
              <Label>CNR number</Label>
              <div className="flex gap-2">
                <Input
                  value={cnr}
                  onChange={(e) => setCnr(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. DLHC010001232024"
                  className="flex-1"
                />
                <Button onClick={handleLookup} disabled={busy}><Search size={16} /> {busy ? 'Looking up…' : 'Track'}</Button>
              </div>
              <p className="mt-2 text-[12.5px] text-ink-400">Find your 16-digit CNR on your case filing receipt or the eCourts portal.</p>
              {err && <div className="mt-4"><Toast text={err} kind="err" /></div>}
            </Card>

            {result && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
                <Card>
                  <h2 className="text-[18px] font-extrabold text-ink-900">{result.case_title}</h2>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Fact icon={Landmark} label="Court" value={result.court_name} />
                    <Fact icon={FileText} label="Case / CNR number" value={result.crn} />
                    <Fact icon={Gavel} label="Case type" value={result.case_type} />
                    <Fact icon={Calendar} label="Filed on" value={result.filed_date ? new Date(result.filed_date).toLocaleDateString('en-IN') : null} />
                    <Fact icon={Calendar} label="Next hearing" value={result.next_hearing_date ? new Date(result.next_hearing_date).toLocaleDateString('en-IN') : null} />
                    <Fact icon={FileText} label="Stage" value={result.stage} />
                  </div>
                  {result.last_order && (
                    <div className="mt-4 rounded-lg bg-brand-50 p-4 text-[13.5px] text-ink-700">
                      <div className="mb-1 font-bold text-brand-700">Last order</div>
                      {result.last_order}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600"><Icon size={16} /></div>
      <div>
        <div className="text-[12px] font-semibold uppercase text-ink-400">{label}</div>
        <div className="text-[14px] font-semibold text-ink-900">{value || '—'}</div>
      </div>
    </div>
  );
}
