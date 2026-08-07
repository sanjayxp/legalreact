import Modal from './Modal';
import Button from './Button';

// Shared confirmation for anything worth a second look — replaces
// window.confirm() so every dashboard gets the same look, and so the caller
// can show a busy state instead of the action firing instantly.
//
// Destructive by default, since that is most of its use. Actions that merely
// commit to something (taking a matter on, accepting a client) pass
// danger={false} so they do not read as a warning.
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  busyLabel = 'Working…',
  busy = false,
  danger = true,
}) {
  const safeClose = () => { if (!busy) onClose?.(); };

  return (
    <Modal open={open} onClose={safeClose} title={title} width="max-w-sm">
      {message && <p className="text-[14px] leading-relaxed text-ink-600">{message}</p>}
      <div className="mt-5 flex gap-3">
        <Button variant="ghost" className="flex-1" onClick={safeClose} disabled={busy}>Cancel</Button>
        <Button variant={danger ? 'danger' : 'primary'} className="flex-1" onClick={onConfirm} disabled={busy}>
          {busy ? busyLabel : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
