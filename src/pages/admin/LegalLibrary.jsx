import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, BookOpen, ArrowLeft, GripVertical, ExternalLink } from 'lucide-react';
import {
  listActsAdmin,
  saveAct,
  deleteAct,
  listActSectionsAdmin,
  saveActSection,
  deleteActSection,
  LEGAL_LIBRARY_CATEGORIES,
} from '../../lib/cms';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Label, Select, FormRow } from '../../components/ui/Field';
import { EmptyState, Spinner } from '../../components/ui/Misc';

const EMPTY_ACT = { slug: '', title: '', short_title: '', category: LEGAL_LIBRARY_CATEGORIES[0], year: '', summary: '', status: 'draft', display_order: 0 };
const EMPTY_SECTION = { part_label: '', section_number: '', heading: '', body: '', order_index: 0 };

function slugify(s) {
  return String(s || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function LegalLibrary() {
  const [loading, setLoading] = useState(true);
  const [acts, setActs] = useState([]);
  const [editing, setEditing] = useState(null);
  const [managingSections, setManagingSections] = useState(null); // act row

  async function load() {
    setLoading(true);
    setActs(await listActsAdmin());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleSaveAct(fields) {
    await saveAct(fields);
    setEditing(null);
    load();
  }
  async function handleDeleteAct(id) {
    if (!window.confirm('Delete this act and all of its sections? This cannot be undone.')) return;
    await deleteAct(id);
    load();
  }

  if (loading) return <Spinner />;

  if (managingSections) {
    return <SectionsEditor act={managingSections} onBack={() => { setManagingSections(null); load(); }} />;
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-extrabold text-ink-900">Legal Library</h2>
          <p className="mt-1 text-[13.5px] text-ink-500">Bare acts and legal texts shown on the public Jobs &amp; Learning page.</p>
        </motion.div>
        <Button onClick={() => setEditing(EMPTY_ACT)}><Plus size={15} /> New act</Button>
      </div>

      <Card className="mt-5 overflow-x-auto !p-0">
        {acts.length === 0 ? (
          <EmptyState icon={<BookOpen size={28} />} title="No acts yet" sub="Add your first act, then add its sections." />
        ) : (
          <table className="w-full min-w-[800px] text-[13px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11.5px] font-bold uppercase text-ink-400">
                <th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {acts.map((a) => (
                <tr key={a.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-bold text-ink-900">
                      {a.title}
                      {a.status === 'published' && (
                        <a href={`/library/${a.slug}`} target="_blank" rel="noreferrer" className="ml-1.5 text-brand-500 hover:text-brand-700"><ExternalLink size={12} className="inline" /></a>
                      )}
                    </div>
                    <div className="text-ink-400">{a.short_title || a.slug}{a.year ? ` · ${a.year}` : ''}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{a.category}</td>
                  <td className="px-4 py-3"><Badge tone={a.status === 'published' ? 'green' : 'gray'}>{a.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3">
                      <button onClick={() => setManagingSections(a)} className="text-[12.5px] font-semibold text-brand-600 hover:text-brand-700">Sections</button>
                      <button onClick={() => setEditing(a)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => handleDeleteAct(a.id)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <ActEditor act={editing} onClose={() => setEditing(null)} onSave={handleSaveAct} />
    </>
  );
}

function ActEditor({ act, onClose, onSave }) {
  const [form, setForm] = useState(act || EMPTY_ACT);
  const [slugTouched, setSlugTouched] = useState(!!act?.id);
  useEffect(() => { setForm(act || EMPTY_ACT); setSlugTouched(!!act?.id); }, [act]);
  if (!act) return null;

  function updateTitle(title) {
    setForm((f) => ({ ...f, title, slug: slugTouched ? f.slug : slugify(title) }));
  }

  return (
    <Modal open={!!act} onClose={onClose} title={act.id ? 'Edit act' : 'New act'} width="max-w-2xl">
      <Label required>Title</Label>
      <Input placeholder="e.g. The Indian Contract Act, 1872" value={form.title} onChange={(e) => updateTitle(e.target.value)} />
      <FormRow>
        <div>
          <Label required hint="used in the URL — /library/[this]">Slug</Label>
          <Input value={form.slug} onChange={(e) => { setSlugTouched(true); setForm({ ...form, slug: slugify(e.target.value) }); }} />
        </div>
        <div><Label>Short title</Label><Input placeholder="e.g. Contract Act" value={form.short_title || ''} onChange={(e) => setForm({ ...form, short_title: e.target.value })} /></div>
      </FormRow>
      <FormRow>
        <div>
          <Label>Category</Label>
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {LEGAL_LIBRARY_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </div>
        <div><Label>Year enacted</Label><Input type="number" value={form.year || ''} onChange={(e) => setForm({ ...form, year: e.target.value ? Number(e.target.value) : null })} /></div>
      </FormRow>
      <Label>Summary</Label>
      <Textarea rows={3} placeholder="One or two lines describing what this act covers, shown on the library card." value={form.summary || ''} onChange={(e) => setForm({ ...form, summary: e.target.value })} />
      <FormRow>
        <div>
          <Label>Status</Label>
          <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="draft">Draft (hidden from students)</option>
            <option value="published">Published (visible on the public site)</option>
          </Select>
        </div>
        <div><Label>Display order</Label><Input type="number" value={form.display_order ?? 0} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
      </FormRow>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.title.trim() || !form.slug.trim()}>Save</Button>
      </div>
    </Modal>
  );
}

function SectionsEditor({ act, onBack }) {
  const [loading, setLoading] = useState(true);
  const [sections, setSections] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setSections(await listActSectionsAdmin(act.id));
    setLoading(false);
  }
  useEffect(() => { load(); }, [act.id]);

  function nextOrder() {
    return sections.length ? Math.max(...sections.map((s) => s.order_index)) + 1 : 1;
  }

  async function handleSave(fields) {
    await saveActSection({ ...fields, act_id: act.id });
    setEditing(null);
    load();
  }
  async function handleDelete(id) {
    if (!window.confirm('Delete this section?')) return;
    await deleteActSection(id);
    load();
  }

  return (
    <>
      <button onClick={onBack} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600">
        <ArrowLeft size={14} /> All acts
      </button>
      <div className="mt-2 flex items-center justify-between">
        <div>
          <h2 className="text-[18px] font-extrabold text-ink-900">{act.title}</h2>
          <p className="mt-1 text-[13.5px] text-ink-500">Sections render in order on the public reader page — a Part label starts a new group in the table of contents.</p>
        </div>
        <Button onClick={() => setEditing({ ...EMPTY_SECTION, order_index: nextOrder() })}><Plus size={15} /> New section</Button>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Card className="mt-5 !p-0">
          {sections.length === 0 ? (
            <EmptyState icon={<BookOpen size={26} />} title="No sections yet" sub="Add the Preamble, Article 1, Section 1 — whatever this act starts with." />
          ) : (
            <div className="divide-y divide-ink-50">
              {sections.map((s) => (
                <div key={s.id} className="flex items-start gap-3 p-4">
                  <GripVertical size={15} className="mt-1 shrink-0 text-ink-200" />
                  <div className="min-w-0 flex-1">
                    {s.part_label && <div className="text-[10.5px] font-bold uppercase tracking-wide text-brand-500">{s.part_label}</div>}
                    <div className="text-[13.5px] font-bold text-ink-900">{s.section_number ? `${s.section_number} — ` : ''}{s.heading}</div>
                    <p className="mt-1 line-clamp-2 text-[12.5px] text-ink-500">{s.body}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => setEditing(s)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                    <button onClick={() => handleDelete(s.id)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <SectionEditor section={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </>
  );
}

function SectionEditor({ section, onClose, onSave }) {
  const [form, setForm] = useState(section || EMPTY_SECTION);
  useEffect(() => { setForm(section || EMPTY_SECTION); }, [section]);
  if (!section) return null;

  return (
    <Modal open={!!section} onClose={onClose} title={section.id ? 'Edit section' : 'New section'} width="max-w-2xl">
      <Label hint="(optional) — e.g. 'PART III — FUNDAMENTAL RIGHTS'. Leave blank to keep the previous group.">Part / group label</Label>
      <Input value={form.part_label || ''} onChange={(e) => setForm({ ...form, part_label: e.target.value })} />
      <FormRow>
        <div><Label hint="(optional) — e.g. 'Article 14' or 'Section 10'">Section number</Label><Input value={form.section_number || ''} onChange={(e) => setForm({ ...form, section_number: e.target.value })} /></div>
        <div><Label>Order</Label><Input type="number" value={form.order_index ?? 0} onChange={(e) => setForm({ ...form, order_index: Number(e.target.value) })} /></div>
      </FormRow>
      <Label required>Heading</Label>
      <Input placeholder="e.g. Equality before law" value={form.heading} onChange={(e) => setForm({ ...form, heading: e.target.value })} />
      <Label required>Text</Label>
      <Textarea rows={8} placeholder="The full text of this section/article." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form)} disabled={!form.heading.trim() || !form.body.trim()}>Save</Button>
      </div>
    </Modal>
  );
}
