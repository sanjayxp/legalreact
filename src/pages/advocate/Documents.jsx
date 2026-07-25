import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Printer, FileText } from 'lucide-react';
import { DOC_TEMPLATES, getTemplate } from '../../lib/doc-templates';
import AdvocateShell from '../../components/layout/AdvocateShell';
import Card from '../../components/ui/Card';
import { Input, Textarea, Label } from '../../components/ui/Field';
import Button from '../../components/ui/Button';
import { Toast } from '../../components/ui/Misc';

export default function Documents() {
  const [templateKey, setTemplateKey] = useState(null);
  const [fields, setFields] = useState({});
  const [error, setError] = useState('');

  const template = templateKey ? getTemplate(templateKey) : null;

  const html = useMemo(() => {
    if (!template) return '';
    try {
      return template.render(fields);
    } catch {
      return '';
    }
  }, [template, fields]);

  function pickTemplate(key) {
    setTemplateKey(key);
    setFields({});
    setError('');
  }

  function handlePrint() {
    const missing = (template.fields || []).filter((f) => f.required && !String(fields[f.key] || '').trim());
    if (missing.length) {
      setError(`Please fill in: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }
    setError('');
    window.print();
  }

  if (!template) {
    return (
      <AdvocateShell>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-heading text-[26px] font-extrabold text-ink-900">Document generator</h1>
          <p className="mt-1 text-[14.5px] text-ink-500">Pick a starting-point draft — review and adapt before sending.</p>
        </motion.div>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOC_TEMPLATES.map((t, i) => (
            <motion.div key={t.key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card hover className="h-full cursor-pointer" onClick={() => pickTemplate(t.key)}>
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600"><FileText size={18} /></div>
                <h3 className="mt-3.5 text-[15px] font-bold text-ink-900">{t.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-500">{t.blurb}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </AdvocateShell>
    );
  }

  return (
    <AdvocateShell>
      <div className="print:hidden">
        <button onClick={() => setTemplateKey(null)} className="inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-ink-500 hover:text-brand-600">
          <ArrowLeft size={14} /> All templates
        </button>
        <h1 className="mt-2 font-heading text-[22px] font-extrabold text-ink-900">{template.title}</h1>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2 print:block">
        <Card className="print:hidden">
          {template.fields.map((f) => (
            <div key={f.key}>
              <Label required={f.required}>{f.label}</Label>
              {f.type === 'textarea' ? (
                <Textarea placeholder={f.placeholder} value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
              ) : (
                <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} placeholder={f.placeholder} value={fields[f.key] || ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
              )}
            </div>
          ))}
          {error && <div className="mt-3"><Toast text={error} kind="err" /></div>}
          <Button className="mt-5 w-full" onClick={handlePrint}><Printer size={15} /> Print / Save as PDF</Button>
        </Card>

        <div className="rounded-2xl border border-ink-100 bg-white p-8 text-[13.5px] leading-relaxed text-ink-800 shadow-[var(--shadow-card)] print:border-0 print:shadow-none" id="docsheet" dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    </AdvocateShell>
  );
}
