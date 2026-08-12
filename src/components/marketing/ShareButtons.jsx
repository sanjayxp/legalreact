import { useState } from 'react';
import { Check, Link2 } from 'lucide-react';
import { LinkedInIcon, InstagramIcon } from '../brand/SocialIcons';

// Sharing a page outward.
//
// LinkedIn has a share URL and behaves as you'd expect. Instagram does not —
// there is no supported way for a web page to hand it a link, by design. So
// that button does the best thing actually available: on a phone it opens the
// system share sheet, where Instagram is one of the choices; everywhere else
// it copies the link so it can be pasted into a bio or story.
export default function ShareButtons({ title, className = '' }) {
  const [copied, setCopied] = useState('');

  const url = typeof window !== 'undefined' ? window.location.href : '';
  const text = title || 'LegalConnects';

  function flash(which) {
    setCopied(which);
    setTimeout(() => setCopied(''), 2200);
  }

  async function copyLink(which) {
    // The async clipboard refuses whenever the document isn't focused, which
    // happens more often than you'd think. The textarea route has no such
    // condition, so it backs the modern call up rather than a blocking prompt.
    try {
      await navigator.clipboard.writeText(url);
      flash(which);
      return;
    } catch {
      /* fall through */
    }

    const scratch = document.createElement('textarea');
    scratch.value = url;
    scratch.setAttribute('readonly', '');
    scratch.style.position = 'fixed';
    scratch.style.opacity = '0';
    document.body.appendChild(scratch);
    scratch.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    document.body.removeChild(scratch);
    flash(ok ? which : 'failed');
  }

  function shareToLinkedIn() {
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer,width=600,height=640',
    );
  }

  async function shareToInstagram() {
    if (navigator.share) {
      try {
        await navigator.share({ title: text, url });
        return;
      } catch {
        // Cancelled, or the sheet refused — fall through to copying.
      }
    }
    copyLink('instagram');
  }

  const base =
    'inline-flex items-center gap-1.5 rounded-lg border border-ink-100 bg-white px-3 py-1.5 text-[12.5px] font-semibold text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-600';

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-[12px] font-semibold uppercase tracking-wide text-ink-400">Share</span>

      <button type="button" onClick={shareToLinkedIn} className={base} aria-label="Share on LinkedIn">
        <LinkedInIcon size={14} /> LinkedIn
      </button>

      <button type="button" onClick={shareToInstagram} className={base} aria-label="Share to Instagram">
        <InstagramIcon size={14} />
        {copied === 'instagram' ? 'Link copied — paste it in' : 'Instagram'}
      </button>

      <button type="button" onClick={() => copyLink('link')} className={base} aria-label="Copy link">
        {copied === 'link' ? <Check size={14} className="text-emerald-600" /> : <Link2 size={14} />}
        {copied === 'link' ? 'Copied' : copied === 'failed' ? 'Press Ctrl+C' : 'Copy link'}
      </button>
    </div>
  );
}
