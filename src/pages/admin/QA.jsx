import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, MessageCircleQuestion, ThumbsUp } from 'lucide-react';
import { listQuestionsForModeration, deleteAnswer, deleteQuestion } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { EmptyState, Spinner } from '../../components/ui/Misc';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

export default function QA() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'question' | 'answer', id, label }
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    setQuestions(await listQuestionsForModeration());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleConfirmDelete() {
    setDeleting(true);
    if (deleteTarget.type === 'answer') await deleteAnswer(deleteTarget.id);
    else await deleteQuestion(deleteTarget.id);
    await load();
    setDeleting(false);
    setDeleteTarget(null);
  }

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-heading text-[23px] font-extrabold text-ink-900">Q&amp;A moderation</h1>
        <p className="mt-1 text-[14px] text-ink-500">Moderate public forum questions and advocate answers.</p>
      </motion.div>

      <div className="mt-5 space-y-4">
        {questions.length === 0 && <EmptyState icon={<MessageCircleQuestion size={28} />} title="No questions yet" />}
        {questions.map((q) => (
          <Card key={q.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <Badge tone="blue">{q.topic}</Badge>
                <h3 className="mt-1.5 text-[14px] font-bold text-ink-900">{q.title}</h3>
                <div className="mt-0.5 text-[12px] text-ink-400">
                  {new Date(q.created_at).toLocaleDateString('en-IN')} · {q.views ?? 0} views · {q.answers?.length ?? 0} answers
                </div>
              </div>
              <button onClick={() => setDeleteTarget({ type: 'question', id: q.id, label: q.title })} className="shrink-0 text-ink-300 hover:text-coral-500"><Trash2 size={15} /></button>
            </div>
            {q.answers?.length > 0 && (
              <div className="mt-3 space-y-2 border-t border-ink-50 pt-3">
                {q.answers.map((a) => (
                  <div key={a.id} className="flex items-start justify-between gap-3 rounded-lg bg-ink-50 p-3">
                    <div>
                      <div className="text-[12.5px] font-bold text-ink-800">{a.profiles?.full_name || 'Advocate'}</div>
                      <div className="mt-0.5 text-[13px] text-ink-600">{a.body}</div>
                      <div className="mt-1 flex items-center gap-1 text-[11.5px] text-ink-400"><ThumbsUp size={11} /> {a.upvote_count ?? 0}</div>
                    </div>
                    <button onClick={() => setDeleteTarget({ type: 'answer', id: a.id, label: 'this answer' })} className="shrink-0 text-ink-300 hover:text-coral-500"><Trash2 size={14} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        busy={deleting}
        title={deleteTarget?.type === 'question' ? 'Delete this question?' : 'Delete this answer?'}
        message={
          deleteTarget?.type === 'question'
            ? `This will permanently delete "${deleteTarget?.label}" and all of its answers. This can't be undone.`
            : `This will permanently delete ${deleteTarget?.label}. This can't be undone.`
        }
      />
    </AdminShell>
  );
}
