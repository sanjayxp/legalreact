import { AlertTriangle } from 'lucide-react';
import PublicNav from './PublicNav';
import Footer from './Footer';

export default function LegalPageLayout({ eyebrow, title, updated, intro, children }) {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-14">
        <div className="mx-auto max-w-3xl px-5 sm:px-8">
          {eyebrow && <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">{eyebrow}</span>}
          <h1 className="mt-2 text-[32px] font-extrabold text-ink-900 sm:text-[39px]">{title}</h1>
          {updated && <p className="mt-2 text-[13px] text-ink-400">Last updated: {updated}</p>}
          {intro && <p className="mt-4 text-[15.5px] leading-relaxed text-ink-500">{intro}</p>}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
        <div className="mb-10 flex gap-3 rounded-xl border border-gold-300/60 bg-gold-50 p-4 text-[13px] leading-relaxed text-ink-700">
          <AlertTriangle size={17} className="mt-0.5 shrink-0 text-gold-600" />
          <p>
            This page is a working draft to fill an otherwise-empty legal page — it is <strong>not</strong> a substitute for advice from a qualified advocate. Have it reviewed by counsel before relying on it, and replace bracketed placeholders <span className="font-mono text-[12px]">[like this]</span> with your actual details.
          </p>
        </div>
        <div className="flex flex-col gap-8">{children}</div>
      </section>

      <Footer />
    </div>
  );
}

export function LegalSection({ title, children }) {
  return (
    <div>
      <h2 className="text-[19px] font-bold text-ink-900">{title}</h2>
      <div className="mt-2.5 space-y-3 text-[14.5px] leading-relaxed text-ink-600">{children}</div>
    </div>
  );
}

export function LegalList({ items }) {
  return (
    <ul className="ml-5 list-disc space-y-1.5">
      {items.map((it, i) => <li key={i}>{it}</li>)}
    </ul>
  );
}

export function Placeholder({ children }) {
  return <span className="rounded bg-gold-50 px-1 py-0.5 font-mono text-[13px] text-brand-700">[{children}]</span>;
}
