import { Briefcase } from 'lucide-react';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import { Placeholder } from '../../components/marketing/LegalPageLayout';

export default function Careers() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-20">
        <div className="mx-auto max-w-2xl px-5 text-center sm:px-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand-500 text-white">
            <Briefcase size={24} />
          </div>
          <h1 className="mt-5 text-[32px] font-extrabold text-ink-900 sm:text-[39px]">Careers at LegalConnects</h1>
          <p className="mt-3 text-[15.5px] leading-relaxed text-ink-500">
            No open roles are listed here yet. As the team grows, positions will be posted on this page.
          </p>
          <p className="mt-6 text-[14px] text-ink-500">
            In the meantime, reach out at <Placeholder>careers email</Placeholder> with a note about what you're looking for.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
