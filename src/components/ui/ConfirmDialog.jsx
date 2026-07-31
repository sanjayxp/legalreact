import Modal from './Modal';
import Button from './Button';

// Shared delete/destructive-action confirmation — replaces window.confirm()
// so every dashboard gets the same look, and so the caller can show a busy
// state while the delete is in flight instead of it firing instantly.
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  busy = false,
}) {
  const safeClose = () => { if (!busy) onClose?.(); };

  return (
    <Modal open={open} onClose={safeClose} title={title} width="max-w-sm">
      {message && <p className="text-[14px] leading-relaxed text-ink-600">{message}</p>}
      <div className="mt-5 flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={safeClose} disabled={busy}>Cancel</Button>
        <Button variant="danger" className="flex-1" onClick={onConfirm} disabled={busy}>
          {busy ? 'Deleting…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
