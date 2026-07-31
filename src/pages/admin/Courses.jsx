import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Users, GraduationCap } from 'lucide-react';
import { listCoursesAdmin, saveCourse, deleteCourse, countEnrollments, listCourseEnrollees, uploadPhoto } from '../../lib/cms';
import { colorFor } from '../../lib/colorFor';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Input, Textarea, Label, Select, FormRow } from '../../components/ui/Field';
import { EmptyState, Spinner } from '../../components/ui/Misc';

const EMPTY = { title: '', tag_type: 'Certificate Course', mode: 'Online', instructor: '', duration: '', schedule_text: '', price: '', cta_label: '', course_url: '', college_name: '', college_website: '', college_contact: '', status: 'active' };

export default function Courses() {
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [counts, setCounts] = useState({});
  const [editing, setEditing] = useState(null);
  const [enrolleesFor, setEnrolleesFor] = useState(null);
  const [enrollees, setEnrollees] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const rows = await listCoursesAdmin();
    setCourses(rows);
    const c = {};
    await Promise.all(rows.map(async (x) => { c[x.id] = await countEnrollments(x.id); }));
    setCounts(c);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleSave(course, imgFile) {
    const fields = { ...course };
    const price = parseFloat(fields.price);
    if (isNaN(price) || price <= 0) { fields.price = null; fields.is_free = true; } else { fields.price = price; fields.is_free = false; }
    fields.band_color = colorFor(fields.title);
    if (imgFile) fields.image_url = await uploadPhoto('course-images', `${Date.now()}-${imgFile.name}`, imgFile);
    await saveCourse(fields);
    setEditing(null);
    load();
  }
  async function handleDelete() {
    setDeleting(true);
    await deleteCourse(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    load();
  }
  async function openEnrollees(c) {
    setEnrolleesFor(c);
    setEnrollees(await listCourseEnrollees(c.id));
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-[18px] font-extrabold text-ink-900">Courses</h2>
          <p className="mt-1 text-[13.5px] text-ink-500">Courses &amp; webinars shown on the public Jobs &amp; Learning page.</p>
        </motion.div>
        <Button onClick={() => setEditing(EMPTY)}><Plus size={15} /> New course</Button>
      </div>

      <Card className="mt-5 overflow-x-auto !p-0">
        {courses.length === 0 ? (
          <EmptyState icon={<GraduationCap size={28} />} title="No courses yet" />
        ) : (
          <table className="w-full min-w-[800px] text-[13px]">
            <thead>
              <tr className="border-b border-ink-100 text-left text-[11.5px] font-bold uppercase text-ink-400">
                <th className="px-4 py-3">Title</th><th className="px-4 py-3">Instructor</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Enrollees</th><th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-ink-50 last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-bold text-ink-900">
                      {c.title}
                      {c.course_url && (
                        <a href={c.course_url} target="_blank" rel="noreferrer" className="ml-1.5 text-brand-500 hover:text-brand-700">↗</a>
                      )}
                    </div>
                    <div className="text-ink-400">{c.tag_type}</div>
                  </td>
                  <td className="px-4 py-3 text-ink-600">{c.instructor}</td>
                  <td className="px-4 py-3 text-ink-600">{c.is_free ? 'Free' : `₹${c.price}`}</td>
                  <td className="px-4 py-3"><Badge tone={c.status === 'active' ? 'green' : 'gray'}>{c.status}</Badge></td>
                  <td className="px-4 py-3"><button onClick={() => openEnrollees(c)} className="flex items-center gap-1 font-semibold text-brand-600"><Users size={13} /> {counts[c.id] ?? 0}</button></td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditing(c)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                      <button onClick={() => setDeleteTarget(c)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <CourseEditor course={editing} onClose={() => setEditing(null)} onSave={handleSave} />

      <Modal open={!!enrolleesFor} onClose={() => setEnrolleesFor(null)} title={`Enrollees — ${enrolleesFor?.title || ''}`}>
        <div className="max-h-96 space-y-2 overflow-y-auto scrollbar-thin">
          {enrollees.map((e) => (
            <div key={e.id} className="rounded-lg bg-ink-50 p-3 text-[13px]">
              <div className="font-bold text-ink-900">{e.full_name}</div>
              <div className="text-ink-500">{e.email} · {e.phone}</div>
            </div>
          ))}
          {enrollees.length === 0 && <div className="text-[13px] text-ink-400">No enrollees yet.</div>}
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete this course?"
        message={`This will permanently delete "${deleteTarget?.title}". This can't be undone.`}
      />
    </>
  );
}

function CourseEditor({ course, onClose, onSave }) {
  const [form, setForm] = useState(course || EMPTY);
  const [imgFile, setImgFile] = useState(null);
  useEffect(() => { setForm(course || EMPTY); setImgFile(null); }, [course]);
  if (!course) return null;

  return (
    <Modal open={!!course} onClose={onClose} title={course.id ? 'Edit course' : 'New course'} width="max-w-2xl">
      <Label required>Title</Label>
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Label>Image</Label>
      <input type="file" accept="image/*" onChange={(e) => setImgFile(e.target.files[0])} className="text-[13px]" />
      <FormRow>
        <div><Label>Type</Label><Select value={form.tag_type} onChange={(e) => setForm({ ...form, tag_type: e.target.value })}>
          {['Certificate Course', 'Webinar', 'Workshop'].map((o) => <option key={o}>{o}</option>)}
        </Select></div>
        <div><Label>Mode</Label><Select value={form.mode} onChange={(e) => setForm({ ...form, mode: e.target.value })}>
          {['Online', 'Live online', 'In-person'].map((o) => <option key={o}>{o}</option>)}
        </Select></div>
      </FormRow>
      <FormRow>
        <div><Label>Instructor</Label><Input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} /></div>
        <div><Label>Duration</Label><Input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
      </FormRow>
      <Label>Schedule text</Label>
      <Input value={form.schedule_text} onChange={(e) => setForm({ ...form, schedule_text: e.target.value })} />
      <FormRow>
        <div><Label>Price (₹, blank = free)</Label><Input type="number" value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
        <div><Label>CTA label</Label><Input value={form.cta_label} onChange={(e) => setForm({ ...form, cta_label: e.target.value })} /></div>
      </FormRow>
      <Label hint="(optional) — link to the course page if hosted elsewhere">Course URL</Label>
      <Input placeholder="https://…" value={form.course_url} onChange={(e) => setForm({ ...form, course_url: e.target.value })} />
      <FormRow cols={3}>
        <div><Label>College name</Label><Input value={form.college_name} onChange={(e) => setForm({ ...form, college_name: e.target.value })} /></div>
        <div><Label>College website</Label><Input value={form.college_website} onChange={(e) => setForm({ ...form, college_website: e.target.value })} /></div>
        <div><Label>College contact</Label><Input value={form.college_contact} onChange={(e) => setForm({ ...form, college_contact: e.target.value })} /></div>
      </FormRow>
      <Label>Status</Label>
      <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
        <option value="active">Active</option><option value="closed">Closed</option>
      </Select>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form, imgFile)} disabled={!form.title}>Save</Button>
      </div>
    </Modal>
  );
}
