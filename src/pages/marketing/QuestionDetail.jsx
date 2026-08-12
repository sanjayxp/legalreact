import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ThumbsUp, Eye, Gavel, Send } from 'lucide-react';
import { getQuestionDetail, incrementQuestionViews, toggleAnswerVote, listMyVotedAnswerIds, submitAnswer, getAdvocateProfile, addAnswerComment } from '../../lib/cms';
import { useAuth } from '../../lib/auth';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import ShareButtons from '../../components/marketing/ShareButtons';
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
  const [votingId, setVotingId] = useState(null);
  const [advVerification, setAdvVerification] = useState(null);
  const [answerBody, setAnswerBody] = useState('');
  const [answering, setAnswering] = useState(false);
  const [answerMsg, setAnswerMsg] = useState('');
  const [commentDrafts, setCommentDrafts] = useState({});
  const [commentBusy, setCommentBusy] = useState(null);
  const [commentErr, setCommentErr] = useState({});
  const [voteMsg, setVoteMsg] = useState('');

  async function load() {
    setLoading(true);
    const d = await getQuestionDetail(id);
    setData(d);
    setLoading(false);
    if (d) incrementQuestionViews(id);
  }
  useEffect(() => { load(); }, [id]);

  // Which answers the signed-in visitor has already voted on — refetches
  // once a session becomes available (e.g. logging in from this page).
  useEffect(() => {
    if (!data || !session) { setVotedIds(new Set()); return; }
    listMyVotedAnswerIds(data.answers.map((a) => a.id)).then((ids) => setVotedIds(new Set(ids))).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.question?.id, session]);

  useEffect(() => {
    if (profile?.role === 'advocate' && user) {
      getAdvocateProfile(user.id).then((ap) => setAdvVerification(ap?.verification_status || null)).catch(() => {});
    }
  }, [profile, user]);

  async function handleToggleVote(answerId) {
    if (!session) { setVoteMsg('Log in to mark an answer helpful.'); return; }
    setVoteMsg('');
    setVotingId(answerId);
    try {
      const { voted, upvote_count } = await toggleAnswerVote(answerId);
      setVotedIds((prev) => {
        const next = new Set(prev);
        if (voted) next.add(answerId); else next.delete(answerId);
        return next;
      });
      setData((d) => ({ ...d, answers: d.answers.map((a) => (a.id === answerId ? { ...a, upvote_count } : a)) }));
    } catch (e) {
      setVoteMsg(e.message || 'Could not register your vote.');
    } finally {
      setVotingId(null);
    }
  }

  async function handlePostComment(answerId) {
    const body = (commentDrafts[answerId] || '').trim();
    if (!body) return;
    setCommentBusy(answerId);
    setCommentErr((m) => ({ ...m, [answerId]: '' }));
    try {
      const role = ['advocate', 'client'].includes(profile?.role) ? profile.role : 'anonymous';
      await addAnswerComment(answerId, role, session ? user.id : null, body);
      setCommentDrafts((m) => ({ ...m, [answerId]: '' }));
      await load();
    } catch (e) {
      setCommentErr((m) => ({ ...m, [answerId]: e.message || 'Could not post your reply.' }));
    } finally {
      setCommentBusy(null);
    }
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

  const { question, answers, comments = [] } = data;
  const canAnswer = session && profile?.role === 'advocate';
  const COMMENT_AUTHOR_LABEL = { advocate: 'Advocate', client: 'Client', anonymous: 'Anonymous' };

  return (
    <div className="bg-white">
      <PublicNav />
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <Link to="/qa" className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-500 hover:text-brand-600">
          <ArrowLeft size={14} /> All questions
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <Badge tone="blue">{question.topic}</Badge>
          <h1 className="mt-3 text-[27px] font-extrabold text-ink-900">{question.title}</h1>
          <div className="mt-2 flex items-center gap-3 text-[13px] text-ink-400">
            <span>{new Date(question.created_at).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span>
            <span className="flex items-center gap-1"><Eye size={13} /> {question.view_count ?? 0} views</span>
          </div>
          <p className="mt-5 whitespace-pre-line text-[15.5px] leading-relaxed text-ink-700">{question.body}</p>
          {question.budget && <div className="mt-3 text-[13.5px] font-semibold text-brand-600">Budget: ₹{question.budget}</div>}
          <ShareButtons title={question.title} className="mt-6 border-t border-ink-100 pt-5" />
        </motion.div>

        {canAnswer && (
          <Card className="mt-8">
            {advVerification === 'approved' ? (
              <>
                <h3 className="mb-2 text-[13.5px] font-bold text-ink-900">Post an answer</h3>
                <Textarea rows={4} value={answerBody} onChange={(e) => setAnswerBody(e.target.value)} placeholder="Share plain-language guidance. This is published publicly and is general information, not advice on this person's matter." />
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
          <h2 className="text-[17px] font-bold text-ink-900">{answers.length} {answers.length === 1 ? 'Answer' : 'Answers'}</h2>
          {voteMsg && <div className="mt-3"><Toast text={voteMsg} kind="err" /></div>}
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
                  onClick={() => handleToggleVote(a.id)}
                  disabled={votingId === a.id}
                  title={votedIds.has(a.id) ? 'Remove your vote' : 'Mark as helpful'}
                  className={`mt-3 flex items-center gap-1.5 text-[13px] font-semibold transition-colors disabled:opacity-60 ${votedIds.has(a.id) ? 'text-brand-600' : 'text-ink-400 hover:text-brand-600'}`}
                >
                  <ThumbsUp size={14} fill={votedIds.has(a.id) ? 'currentColor' : 'none'} /> {a.upvote_count || 0} helpful
                </button>

                <div className="mt-4 space-y-3 border-t border-ink-50 pt-4">
                  {comments.filter((c) => c.answer_id === a.id).map((c) => (
                    <div key={c.id} className="text-[13.5px]">
                      <span className="font-bold text-ink-800">{COMMENT_AUTHOR_LABEL[c.author_role] || 'Anonymous'}</span>{' '}
                      <span className="text-ink-600">{c.body}</span>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      value={commentDrafts[a.id] || ''}
                      onChange={(e) => setCommentDrafts((m) => ({ ...m, [a.id]: e.target.value }))}
                      onKeyDown={(e) => e.key === 'Enter' && handlePostComment(a.id)}
                      placeholder="Add a reply — no login needed"
                      className="flex-1 rounded-lg border border-ink-100 px-3 py-2 text-[13px] outline-none focus:border-brand-400"
                    />
                    <Button size="sm" variant="ghost" onClick={() => handlePostComment(a.id)} disabled={commentBusy === a.id}>
                      {commentBusy === a.id ? '…' : 'Reply'}
                    </Button>
                  </div>
                  {commentErr[a.id] && <div className="text-[12px] text-coral-500">{commentErr[a.id]}</div>}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
