import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Plus, Pencil, Trash2 } from 'lucide-react';
import { listEmailTemplates, saveEmailTemplate, deleteEmailTemplate } from '../../lib/cms';
import AdminShell from '../../components/layout/AdminShell';
import Card, { CardHeading } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import { Label, Input, Textarea } from '../../components/ui/Field';
import { Spinner, Toast, EmptyState } from '../../components/ui/Misc';

const BLANK = { name: '', subject: '', body: '', variables: '' };

export default function EmailTemplates() {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [msg, setMsg] = useState('');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, {...} = edit
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function load() {
    try {
      const data = await listEmailTemplates();
      setTemplates(data);
    } catch (e) {
      setMsg(e.message || 'Failed to load templates.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing({ ...BLANK });
  }

  function openEdit(t) {
    setEditing({ ...t, variables: (t.variables || []).join(', ') });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const variables = editing.variables
        ? editing.variables.split(',').map((v) => v.trim()).filter(Boolean)
        : [];
      await saveEmailTemplate({ ...editing, variables });
      setMsg('Template saved.');
      setEditing(null);
      await load();
    } catch (e) {
      setMsg(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteEmailTemplate(deleteTarget.id);
      setTemplates((ts) => ts.filter((t) => t.id !== deleteTarget.id));
      setMsg('Template deleted.');
    } catch (e) {
      setMsg(e.message || 'Delete failed.');
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  }

  if (loading) return <AdminShell><Spinner /></AdminShell>;

  return (
    <AdminShell>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[25px] font-extrabold text-ink-900">Email Templates</h1>
          <p className="mt-1 text-[14.5px] text-ink-500">Reusable content for transactional and campaign emails.</p>
        </div>
        <Button onClick={openNew}><Plus size={16} /> New template</Button>
      </motion.div>

      {msg && <div className="mt-4"><Toast text={msg} kind={msg.includes('failed') ? 'err' : 'ok'} /></div>}

      <Card className="mt-6">
        <CardHeading title="Templates" sub={`${templates.length} saved`} />
        {templates.length === 0 ? (
          <EmptyState icon={<Mail size={22} />} title="No templates yet" sub="Create one to reuse across emails." />
        ) : (
          <div className="space-y-2 border-t border-ink-100 pt-4">
            {templates.map((t) => (
              <div key={t.id} className="flex items-start justify-between rounded-lg border border-ink-100 p-3 hover:bg-ink-50">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink-900">{t.name}</div>
                  <div className="mt-0.5 truncate text-[13px] text-ink-600">{t.subject}</div>
                  {t.variables?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {t.variables.map((v) => (
                        <span key={v} className="rounded bg-brand-50 px-1.5 py-0.5 text-[10.5px] font-mono text-brand-600">
                          {'{{' + v + '}}'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-4 flex shrink-0 gap-2">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteTarget(t)}><Trash2 size={14} /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={!!editing} onClose={() => !saving && setEditing(null)} title={editing?.id ? 'Edit template' : 'New template'}>
        {editing && (
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} placeholder="e.g. Advocate approved" />
            </div>
            <div>
              <Label>Subject</Label>
              <Input value={editing.subject} onChange={(e) => setEditing({ ...editing, subject: e.target.value })} placeholder="e.g. You're verified on LegalConnects" />
            </div>
            <div>
              <Label hint="Comma-separated, e.g. full_name, city">Variables</Label>
              <Input value={editing.variables} onChange={(e) => setEditing({ ...editing, variables: e.target.value })} placeholder="full_name, city" />
            </div>
            <div>
              <Label>Body</Label>
              <Textarea rows={8} value={editing.body} onChange={(e) => setEditing({ ...editing, body: e.target.value })} placeholder="Hi {{full_name}}, ..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="ghost" className="flex-1" onClick={() => setEditing(null)} disabled={saving}>Cancel</Button>
              <Button className="flex-1" onClick={handleSave} disabled={saving || !editing.name || !editing.subject}>
                {saving ? 'Saving…' : 'Save template'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        busy={deleting}
        title="Delete template?"
        message={`"${deleteTarget?.name}" will be permanently removed.`}
        confirmLabel="Delete"
      />
    </AdminShell>
  );
}
