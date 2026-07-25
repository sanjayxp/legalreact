import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, UsersRound } from 'lucide-react';
import { listTeamAdmin, saveTeamMember, deleteTeamMember, uploadPhoto } from '../../lib/cms';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Input, Textarea, Label, Select, FormRow } from '../../components/ui/Field';
import { EmptyState, Spinner } from '../../components/ui/Misc';

const EMPTY = { full_name: '', title: '', linkedin_url: '', bio: '', display_order: 0, status: 'active' };

export default function Team() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState([]);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    setTeam(await listTeamAdmin());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleSave(member, photoFile) {
    const fields = { ...member };
    if (photoFile) {
      const ext = photoFile.name.split('.').pop();
      fields.photo_url = await uploadPhoto('team-photos', `${crypto.randomUUID()}.${ext}`, photoFile);
    }
    await saveTeamMember(fields);
    setEditing(null);
    load();
  }
  async function handleDelete(id) {
    if (!window.confirm('Remove this team member?')) return;
    await deleteTeamMember(id);
    load();
  }

  if (loading) return <Spinner />;

  return (
    <>
      <div className="flex items-center justify-between">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-[24px] font-extrabold text-ink-900">Team</h1>
          <p className="mt-1 text-[14px] text-ink-500">Shown on the public About Us page.</p>
        </motion.div>
        <Button onClick={() => setEditing(EMPTY)}><Plus size={15} /> Add member</Button>
      </div>

      {team.length === 0 ? (
        <div className="mt-5"><EmptyState icon={<UsersRound size={28} />} title="No team members yet" /></div>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((m) => (
            <Card key={m.id}>
              {m.photo_url ? <img src={m.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-full bg-brand-50 text-xl font-bold text-brand-600">{m.full_name.charAt(0)}</div>}
              <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">{m.full_name}</h3>
              <div className="text-[12.5px] text-ink-500">{m.title}</div>
              {m.status === 'hidden' && <Badge tone="gray" className="mt-2">Hidden</Badge>}
              <div className="mt-3 flex gap-3">
                <button onClick={() => setEditing(m)} className="text-ink-400 hover:text-brand-600"><Pencil size={15} /></button>
                <button onClick={() => handleDelete(m.id)} className="text-ink-400 hover:text-coral-500"><Trash2 size={15} /></button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <TeamEditor member={editing} onClose={() => setEditing(null)} onSave={handleSave} />
    </>
  );
}

function TeamEditor({ member, onClose, onSave }) {
  const [form, setForm] = useState(member || EMPTY);
  const [photoFile, setPhotoFile] = useState(null);
  useEffect(() => { setForm(member || EMPTY); setPhotoFile(null); }, [member]);
  if (!member) return null;

  return (
    <Modal open={!!member} onClose={onClose} title={member.id ? 'Edit member' : 'Add team member'}>
      <Label>Photo</Label>
      <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} className="text-[13px]" />
      <Label required>Full name</Label>
      <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
      <Label>Title / role</Label>
      <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Label>LinkedIn URL</Label>
      <Input value={form.linkedin_url} onChange={(e) => setForm({ ...form, linkedin_url: e.target.value })} />
      <Label>Bio</Label>
      <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
      <FormRow>
        <div><Label>Display order</Label><Input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} /></div>
        <div><Label>Visibility</Label><Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          <option value="active">Active</option><option value="hidden">Hidden</option>
        </Select></div>
      </FormRow>
      <div className="mt-5 flex justify-end gap-2">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button onClick={() => onSave(form, photoFile)} disabled={!form.full_name}>Save</Button>
      </div>
    </Modal>
  );
}
