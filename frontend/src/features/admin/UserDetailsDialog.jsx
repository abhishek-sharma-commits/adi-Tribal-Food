import Modal from '../../components/Modal.jsx';
import { ErrorState } from '../../components/States.jsx';
import { useApi } from '../../hooks/useApi.js';
import { getUser } from '../../services/admin.js';
import { formatDate } from '../../utils/format.js';

export default function UserDetailsDialog({ userId, onClose }) {
  const { data: user, loading, error, reload } = useApi((s) => getUser(userId, s), [userId]);
  return (
    <Modal title="User details" onClose={onClose}>
      {loading && <div className="h-32 animate-pulse rounded-card bg-surface" aria-busy="true" />}
      {!loading && error && <ErrorState error={error} onRetry={reload} />}
      {!loading && user && (
        <dl className="grid grid-cols-[110px_1fr] gap-x-4 gap-y-3 text-sm">
          <dt className="text-ink-muted">Name</dt>
          <dd className="font-medium">{user.fullName}</dd>
          <dt className="text-ink-muted">Email</dt>
          <dd className="break-all font-medium">{user.email}</dd>
          <dt className="text-ink-muted">Role</dt>
          <dd className="font-medium capitalize">{user.role}</dd>
          <dt className="text-ink-muted">Status</dt>
          <dd className="font-medium capitalize">{user.accountStatus}</dd>
          <dt className="text-ink-muted">Joined</dt>
          <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          <dt className="text-ink-muted">Last updated</dt>
          <dd className="font-medium">{formatDate(user.updatedAt)}</dd>
          <dt className="text-ink-muted">User ID</dt>
          <dd className="break-all font-mono text-xs">{user._id}</dd>
        </dl>
      )}
    </Modal>
  );
}
