import { useState } from 'react';
import Modal from '../../components/Modal.jsx';

/** Asks the admin for a rejection reason (required, 3-500 characters). */
export default function ReasonDialog({ title, description, confirmLabel = 'Reject', busy, error, onSubmit, onCancel }) {
  const [reason, setReason] = useState('');
  const [problem, setProblem] = useState('');

  const submit = (e) => {
    e.preventDefault();
    const value = reason.trim();
    if (value.length < 3) return setProblem('Give a short reason so the contributor knows what to change.');
    if (value.length > 500) return setProblem('Keep the reason under 500 characters.');
    setProblem('');
    onSubmit(value);
  };

  return (
    <Modal title={title} onClose={onCancel} locked={busy}>
      <form onSubmit={submit} noValidate>
        {description && <p className="text-sm text-ink-muted">{description}</p>}
        <label htmlFor="reject-reason" className="label mt-4">
          Reason (shown to the contributor)
        </label>
        <textarea id="reject-reason" rows={4} value={reason} onChange={(e) => setReason(e.target.value)} disabled={busy} className={`input ${problem ? 'input-error' : ''}`} aria-invalid={Boolean(problem)} />
        {problem && (
          <p className="field-error" role="alert">
            {problem}
          </p>
        )}
        {error && (
          <p className="field-error" role="alert">
            {error}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={onCancel} disabled={busy} className="btn-secondary">
            Cancel
          </button>
          <button type="submit" disabled={busy} className="btn bg-red-600 text-white hover:bg-red-700">
            {busy ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
