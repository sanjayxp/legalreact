import { Input, Textarea, Select, Label } from '../ui/Field';

// Renders the questions a given matter type asks. Deliberately small: the
// types file describes the fields, this only knows how to draw four kinds.
export default function MatterFields({ type, details, onChange }) {
  if (!type?.fields?.length) return null;

  return (
    <>
      {type.fields.map((f) => {
        const value = details?.[f.name] ?? '';
        const set = (e) => onChange(f.name, e.target.value);

        const fieldId = `matter-field-${f.name}`;

        return (
          <div key={f.name}>
            <Label htmlFor={fieldId} hint={f.optional ? '(optional)' : undefined} required={!f.optional}>
              {f.label}
            </Label>

            {f.type === 'select' ? (
              <Select id={fieldId} value={value} onChange={set}>
                <option value="">Select…</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            ) : f.type === 'textarea' ? (
              <Textarea id={fieldId} rows={3} value={value} onChange={set} placeholder={f.placeholder} />
            ) : (
              <Input
                id={fieldId}
                type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                value={value}
                onChange={set}
                placeholder={f.placeholder}
              />
            )}
          </div>
        );
      })}
    </>
  );
}
