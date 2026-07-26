import { Mail, Phone, MapPin, ShieldCheck } from 'lucide-react';
import PublicNav from '../../components/marketing/PublicNav';
import Footer from '../../components/marketing/Footer';
import Card from '../../components/ui/Card';
import { Placeholder } from '../../components/marketing/LegalPageLayout';

export default function Contact() {
  return (
    <div className="bg-white">
      <PublicNav />

      <section className="border-b border-ink-100 bg-gradient-to-b from-brand-50 via-white to-white py-16">
        <div className="mx-auto max-w-3xl px-5 text-center sm:px-8">
          <span className="text-[13.5px] font-bold uppercase tracking-wide text-brand-500">Contact</span>
          <h1 className="mt-2 text-[35px] font-extrabold text-ink-900 sm:text-[43px]">We're here to help</h1>
          <p className="mt-3 text-[16px] text-ink-500">Reach out for support, partnership enquiries, or data requests — the details below are placeholders pending final setup.</p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-16 sm:px-8">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Card>
            <Mail size={20} className="text-brand-600" />
            <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">General support</h3>
            <p className="mt-1 text-[13.5px] text-ink-500"><Placeholder>support email</Placeholder></p>
            <p className="mt-1 text-[13px] text-ink-400">For account help, bookings, or general questions.</p>
          </Card>
          <Card>
            <Phone size={20} className="text-brand-600" />
            <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">Phone</h3>
            <p className="mt-1 text-[13.5px] text-ink-500"><Placeholder>support phone number</Placeholder></p>
            <p className="mt-1 text-[13px] text-ink-400"><Placeholder>hours, e.g. Mon–Fri, 10am–6pm IST</Placeholder></p>
          </Card>
          <Card>
            <MapPin size={20} className="text-brand-600" />
            <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">Registered address</h3>
            <p className="mt-1 text-[13.5px] text-ink-500"><Placeholder>registered business address</Placeholder></p>
          </Card>
          <Card>
            <ShieldCheck size={20} className="text-brand-600" />
            <h3 className="mt-3 text-[14.5px] font-bold text-ink-900">Grievance Officer</h3>
            <p className="mt-1 text-[13.5px] text-ink-500"><Placeholder>grievance officer name</Placeholder> · <Placeholder>grievance officer email</Placeholder></p>
            <p className="mt-1 text-[13px] text-ink-400">For data protection or platform grievances, per the DPDP Act and IT Rules. Responded to within <Placeholder>e.g. 30 days</Placeholder>.</p>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
