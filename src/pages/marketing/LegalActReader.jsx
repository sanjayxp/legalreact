import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, AlertTriangle } from 'lucide-react';
import { getPublishedAct } from '../../lib/cms';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import ShareButtons from '../../components/marketing/ShareButtons';
import Badge from '../../components/ui/Badge';
import { EmptyState, Spinner } from '../../components/ui/Misc';

// Groups a flat, ordered section list into { label, sections[] } runs —
// a new part_label starts a new group; sections without one join the
// group currently open (or an unlabeled leading group).
function groupSections(sections) {
  const groups = [];
  let current = null;
  for (const s of sections) {
    if (s.part_label || !current) {
      current = { label: s.part_label || null, sections: [] };
      groups.push(current);
    }
    current.sections.push(s);
  }
  return groups;
}

export default function LegalActReader() {
  const { slug } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    setLoading(true);
    getPublishedAct(slug).then((d) => { setData(d); setLoading(false); });
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white">
        <PublicNav />
        <Spinner className="min-h-[50vh]" />
        <Footer />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white">
        <PublicNav />
        <div className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <EmptyState icon={<BookOpen size={28} />} title="Not found" sub="This act may not be published yet." action={<Link to="/jobs?tab=library" className="font-semibold text-brand-600">← Back to the library</Link>} />
        </div>
        <Footer />
      </div>
    );
  }

  const { act, sections } = data;
  const groups = groupSections(sections);

  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Link to="/jobs?tab=library" className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600">
            <ArrowLeft size={14} /> All acts
          </Link>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3">
            <Badge tone="blue">{act.category}</Badge>
            <h1 className="mt-2 text-[27px] font-extrabold text-ink-900 sm:text-[32px]">{act.title}</h1>
            {act.summary && <p className="mt-2 max-w-2xl text-[14.5px] leading-relaxed text-ink-500">{act.summary}</p>}
            <ShareButtons title={act.short_title || act.title} className="mt-5" />
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-8 flex gap-3 rounded-xl border border-gold-300/60 bg-gold-50 p-4 text-[13px] leading-relaxed text-ink-700">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-gold-600" />
          <p>
            Provided for study purposes. Cross-check against the official source (India Code / the relevant government gazette) before citing or relying on this text — amendments and corrections may not be reflected here.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[260px_1fr]">
          {sections.length > 0 && (
            <nav className="hidden lg:block">
              <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto scrollbar-thin pr-2">
                <div className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-400">Contents</div>
                <div className="space-y-4">
                  {groups.map((g, gi) => (
                    <div key={gi}>
                      {g.label && <div className="mb-1.5 text-[11.5px] font-bold text-ink-700">{g.label}</div>}
                      <div className="flex flex-col gap-1 border-l border-ink-100 pl-3">
                        {g.sections.map((s) => (
                          <a key={s.id} href={`#sec-${s.id}`} className="truncate text-[12.5px] text-ink-500 hover:text-brand-600">
                            {s.section_number ? `${s.section_number}. ` : ''}{s.heading}
                          </a>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </nav>
          )}

          <div className="min-w-0 max-w-3xl">
            {sections.length === 0 ? (
              <EmptyState icon={<BookOpen size={26} />} title="No sections added yet" sub="This act's text is being added — check back soon." />
            ) : (
              groups.map((g, gi) => (
                <div key={gi} className="mb-8">
                  {g.label && <h2 className="mb-4 text-[18px] font-bold text-ink-900">{g.label}</h2>}
                  <div className="space-y-7">
                    {g.sections.map((s) => (
                      <div key={s.id} id={`sec-${s.id}`} className="scroll-mt-24">
                        <h3 className="text-[15px] font-bold text-ink-900">
                          {s.section_number && <span className="text-brand-600">{s.section_number}. </span>}
                          {s.heading}
                        </h3>
                        <p className="mt-1.5 whitespace-pre-line text-[14.5px] leading-relaxed text-ink-600">{s.body}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
