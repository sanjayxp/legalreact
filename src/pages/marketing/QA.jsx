import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircleQuestion, Eye, MessageSquare, Plus } from 'lucide-react';
import { listQuestionsPublic, submitQuestion } from '../../lib/cms';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Label, Select } from '../../components/ui/Field';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';
import { PRACTICE_AREAS as TOPICS } from '../../lib/practiceAreas';

export default function QA() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [topic, setTopic] = useState('all');
  const [askOpen, setAskOpen] = useState(false);

  async function load(t) {
    setLoading(true);
    setQuestions(await listQuestionsPublic(t));
    setLoading(false);
  }
  useEffect(() => { load(topic); }, [topic]);

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Community</span>
              <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">Legal Q&amp;A</h1>
              <p className="mt-2 max-w-lg text-[16px] text-ink-500">Ask a legal question for free — verified advocates answer in plain language.</p>
            </div>
            <Button size="lg" onClick={() => setAskOpen(true)}><Plus size={17} /> Ask a question</Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setTopic('all')}
            className={`rounded-full border px-4 py-1.5 text-[14px] font-semibold ${topic === 'all' ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
          >
            All topics
          </button>
          {TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setTopic(t)}
              className={`rounded-full border px-4 py-1.5 text-[14px] font-semibold ${topic === t ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-ink-100 text-ink-500 hover:border-brand-200'}`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="mt-8 space-y-3">
          {loading ? (
            <Spinner />
          ) : questions.length === 0 ? (
            <EmptyState icon={<MessageCircleQuestion size={28} />} title="No questions yet" sub="Be the first to ask in this topic." />
          ) : (
            questions.map((q, i) => (
              <motion.div key={q.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i, 6) * 0.04 }}>
                <Link to={`/qa/${q.id}`}>
                  <Card hover className="!p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Badge tone="blue">{q.topic}</Badge>
                        <h3 className="mt-2 text-[15.5px] font-bold text-ink-900">{q.title}</h3>
                        <p className="mt-1 line-clamp-2 text-[14px] text-ink-500">{q.body}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1.5 text-[12.5px] text-ink-400">
                        <span className="flex items-center gap-1"><Eye size={13} /> {q.views ?? 0}</span>
                        <span className="flex items-center gap-1"><MessageSquare size={13} /> {q.answers?.[0]?.count ?? 0}</span>
                      </div>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </section>

      <AskQuestionModal open={askOpen} onClose={() => setAskOpen(false)} onAsked={(id) => { setAskOpen(false); load(topic); window.location.href = `/qa/${id}`; }} />

      <Footer />
    </div>
  );
}

function AskQuestionModal({ open, onClose, onAsked }) {
  const [form, setForm] = useState({ topic: 'Civil', title: '', body: '', budget: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function handleSubmit() {
    if (!form.title.trim() || !form.body.trim()) { setErr('Please fill in a title and details.'); return; }
    setBusy(true);
    setErr('');
    try {
      const q = await submitQuestion({ ...form, budget: form.budget ? Number(form.budget) : null });
      setForm({ topic: 'Civil', title: '', body: '', budget: '' });
      onAsked(q.id);
    } catch (e) {
      setErr(e.message || 'Could not post your question.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ask a legal question">
      <Label>Topic</Label>
      <Select value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
        {TOPICS.map((t) => <option key={t}>{t}</option>)}
      </Select>
      <Label required>Title</Label>
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summarize your question in one line" />
      <Label required>Details</Label>
      <Textarea rows={5} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Share the relevant facts — no personal identifying details needed." />
      <Label hint="(optional)">Budget for a paid consultation (₹)</Label>
      <Input type="number" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
      {err && <div className="mt-3"><Toast text={err} kind="err" /></div>}
      <Button className="mt-5 w-full" onClick={handleSubmit} disabled={busy}>{busy ? 'Posting…' : 'Post question'}</Button>
    </Modal>
  );
}
