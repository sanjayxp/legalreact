import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Eye, Gavel, Send } from 'lucide-react';
import { getQuestionDetail, incrementQuestionViews, upvoteAnswer, submitAnswer, getAdvocateProfile } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Textarea } from '../../components/ui/Field';
import { EmptyState, Spinner, Toast } from '../../components/ui/Misc';

export default function QuestionDetail() {
  const { id } = useParams();
  const { session, profile, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [votedIds, setVotedIds] = useState(new Set());
  const [advVerification, setAdvVerification] = useState(null);
  const [answerBody, setAnswerBody] = useState('');
  const [answering, setAnswering] = useState(false);
  const [answerMsg, setAnswerMsg] = useState('');

  async function load() {
    setLoading(true);
    const d = await getQuestionDetail(id);
    setData(d);
    setLoading(false);
    if (d) incrementQuestionViews(id);
  }
  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    if (profile?.role === 'advocate' && user) {
      getAdvocateProfile(user.id).then((ap) => setAdvVerification(ap?.verification_status || null)).catch(() => {});
    }
  }, [profile, user]);

  async function handleUpvote(answerId) {
    if (votedIds.has(answerId)) return;
    await upvoteAnswer(answerId);
    setVotedIds(new Set([...votedIds, answerId]));
    setData((d) => ({ ...d, answers: d.answers.map((a) => (a.id === answerId ? { ...a, upvote_count: (a.upvote_count || 0) + 1 } : a)) }));
  }

  async function handleAnswer() {
    if (!answerBody.trim()) { setAnswerMsg('Please write an answer.'); return; }
    setAnswering(true);
    setAnswerMsg('');
    try {
      await submitAnswer(id, user.id, answerBody.trim());
      setAnswerBody('');
      await load();
    } catch (e) {
      setAnswerMsg(e.message || 'Could not post your answer.');
    } finally {
      setAnswering(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white">
        <PublicNav />
        <Spinner className="min-h-[50vh]" />
        <Footer />
      </div>
    );
  }

  if (!data?.question) {
    return (
      <div className="bg-white">
        <PublicNav />
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <EmptyState title="Question not found" action={<Link to="/qa" className="text-brand-600 font-semibold">← Back to Q&amp;A</Link>} />
        </div>
        <Footer />
      </div>
    );
  }

  const { question, answers } = data;
  const canAnswer = session && profile?.role === 'advocate';

  return (
    <div className="bg-white">
      <PublicNav />
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Link to="/qa" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-500 hover:text-brand-600">
          <ArrowLeft size={14} /> All questions
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Badge tone="blue">{question.topic}</Badge>
          <h1 className="mt-3 text-[28px] font-extrabold text-ink-900">{question.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-[13px] text-ink-400">
            <span>{new Date(question.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {question.views ?? 0} views</span>
          </div>
          <p className="mt-5 whitespace-pre-line text-[15.5px] leading-relaxed text-ink-700">{question.body}</p>
          {question.budget && <div className="mt-3 text-[13.5px] font-semibold text-brand-600">Budget: ₹{question.budget}</div>}
        </motion.div>

        {canAnswer && (
          <Card className="mt-8">
            {advVerification === 'approved' ? (
              <>
                <h3 className="mb-2 text-[14.5px] font-bold text-ink-900">Post an answer</h3>
                <Textarea rows={4} value={answerBody} onChange={(e) => setAnswerBody(e.target.value)} placeholder="Share plain-language guidance — this is public and helps build your visibility." />
                {answerMsg && <div className="mt-2"><Toast text={answerMsg} kind="err" /></div>}
                <Button size="sm" className="mt-3" onClick={handleAnswer} disabled={answering}>
                  <Send size={14} /> {answering ? 'Posting…' : 'Post answer'}
                </Button>
              </>
            ) : (
              <div className="text-[13.5px] text-ink-500">
                Your profile needs to be Bar Council-verified before you can answer questions publicly.{' '}
                <Link to="/dashboard/advocate/profile" className="font-semibold text-brand-600">
                  {advVerification ? 'Check verification status' : 'Complete your profile'}
                </Link>
              </div>
            )}
          </Card>
        )}

        <div className="mt-10">
          <h2 className="text-[18px] font-bold text-ink-900">{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</h2>
          {answers.length === 0 && <div className="mt-4"><EmptyState icon={<Gavel size={26} />} title="No answers yet" sub="Verified advocates will answer here soon." /></div>}
          <div className="mt-4 space-y-4">
            {answers.map((a) => (
              <Card key={a.id}>
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-brand-50 font-bold text-brand-600">
                    {(a.profiles?.full_name || 'A').charAt(0)}
                  </div>
                  <div>
                    <div className="text-[14px] font-bold text-ink-900">{a.profiles?.full_name || 'Advocate'}</div>
                    {a.advocate_profiles?.headline && <div className="text-[12px] text-ink-400">{a.advocate_profiles.headline}</div>}
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-700">{a.body}</p>
                <button
                  onClick={() => handleUpvote(a.id)}
                  disabled={votedIds.has(a.id)}
                  className={`mt-3 flex items-center gap-1.5 text-[13px] font-semibold ${votedIds.has(a.id) ? 'text-brand-600' : 'text-ink-400 hover:text-brand-600'}`}
                >
                  <ThumbsUp size={14} /> {a.upvote_count || 0} helpful
                </button>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
