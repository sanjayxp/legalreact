import { useState } from 'react';
import { useAuth } from '../../lib/auth';
import { Input, Label } from '../ui/Field';

// Someone who is signed in has already told us their name, phone and email.
// Asking for it again on every booking and every posted matter is friction, so
// once the parent has prefilled the form we show what will be sent instead of
// three filled-in boxes — with a way out, because a person may well be booking
// on behalf of somebody else.
export default function IdentityFields({ form, onChange }) {
  const { session, profile } = useAuth();
  const [editing, setEditing] = useState(false);

  const canSummarise =
    !!session && !!profile && !editing && !!form.client_name?.trim() && !!form.phone?.trim();

  if (canSummarise) {
    return (
      <div className="mt-4 rounded-xl border border-brand-100 bg-brand-50/60 px-3.5 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[11.5px] font-bold uppercase tracking-wide text-brand-700">
              Sending as
            </div>
            <div className="mt-0.5 truncate text-[13.5px] font-bold text-ink-900">{form.client_name}</div>
            <div className="truncate text-[12.5px] text-ink-500">
              {[form.phone, form.email].filter(Boolean).join(' · ')}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="shrink-0 text-[12.5px] font-semibold text-brand-600 hover:underline"
          >
            Change
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Label required>Your name</Label>
      <Input
        value={form.client_name}
        onChange={(e) => onChange('client_name', e.target.value)}
        placeholder="Full name"
      />
      <Label required>Phone</Label>
      <Input
        value={form.phone}
        onChange={(e) => onChange('phone', e.target.value)}
        placeholder="10-digit mobile number"
      />
      <Label hint="(optional)">Email</Label>
      <Input
        type="email"
        value={form.email}
        onChange={(e) => onChange('email', e.target.value)}
        placeholder="you@example.com"
      />
    </>
  );
}
