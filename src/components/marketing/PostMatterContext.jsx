import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PostMatterModal from './PostMatterModal';

const PostMatterCtx = createContext(null);

const AUTO_POPUP_DELAY_MS = 8000;
// Don't interrupt logged-in dashboards or the auth flow with the marketing popup.
const SKIP_PREFIXES = ['/dashboard', '/admin', '/login'];

export function PostMatterProvider({ children }) {
  const [open, setOpen] = useState(false);
  // Lets the homepage tiles open the modal already on the details step.
  const [preselect, setPreselect] = useState('');
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // Started once per page load (not per route change) so navigating around
  // the site doesn't keep pushing the popup back — a hard refresh is what
  // resets it, since this is in-memory state, not persisted storage.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (SKIP_PREFIXES.some((p) => pathRef.current.startsWith(p))) return;
      setOpen(true);
    }, AUTO_POPUP_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <PostMatterCtx.Provider
      value={{
        openPostMatter: (slug) => { setPreselect(typeof slug === 'string' ? slug : ''); setOpen(true); },
      }}
    >
      {children}
      <PostMatterModal
        open={open}
        preselect={preselect}
        onClose={() => { setOpen(false); setPreselect(''); }}
      />
    </PostMatterCtx.Provider>
  );
}

export function usePostMatter() {
  const ctx = useContext(PostMatterCtx);
  if (!ctx) throw new Error('usePostMatter must be used within PostMatterProvider');
  return ctx;
}
