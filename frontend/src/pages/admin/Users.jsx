import { useState } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Pagination from '../../components/Pagination.jsx';
import SearchPill from '../../components/SearchPill.jsx';
import { EmptyState, ErrorState } from '../../components/States.jsx';
import { useAuth } from '../../features/auth/AuthContext.jsx';
import UserDetailsDialog from '../../features/admin/UserDetailsDialog.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useDocumentTitle } from '../../hooks/useDocumentTitle.js';
import { useQueryParams } from '../../hooks/useQueryParams.js';
import { listUsers, setUserStatus } from '../../services/admin.js';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 15;
const ROLES = [
  { value: '', label: 'All roles' },
  { value: 'user', label: 'Users' },
  { value: 'admin', label: 'Admins' },
];
const STATUSES = [
  { value: '', label: 'Any status' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

export default function Users() {
  useDocumentTitle('Users');
  const { user: me } = useAuth();
  const { params, update } = useQueryParams();
  const q = params.get('q') ?? '';
  const role = ['user', 'admin'].includes(params.get('role')) ? params.get('role') : '';
  const accountStatus = ['active', 'suspended'].includes(params.get('status')) ? params.get('status') : '';
  const page = Math.max(1, parseInt(params.get('page'), 10) || 1);

  const { data, meta, loading, error, reload } = useApi((s) => listUsers({ q, role, accountStatus, page, limit: PAGE_SIZE }, s), [q, role, accountStatus, page]);
  const items = data ?? [];
  const [details, setDetails] = useState(null);
  const [target, setTarget] = useState(null); // { user, next }
  const [busy, setBusy] = useState(false);
  const [dialogError, setDialogError] = useState('');
  const [flash, setFlash] = useState('');

  const confirm = async () => {
    setBusy(true);
    setDialogError('');
    try {
      await setUserStatus(target.user._id, target.next);
      setFlash(`${target.user.fullName} was ${target.next === 'suspended' ? 'suspended' : 'reactivated'}.`);
      setTarget(null);
      reload();
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const pill = (active) => `chip ${active ? '!border-ink !bg-ink !text-white' : ''}`;
  const badge = (ok, text) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{text}</span>;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">Users</h2>
      <p className="mt-1 text-ink-muted">Suspended accounts are signed out immediately and can't log in.</p>

      {flash && (
        <p role="status" className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {flash}
        </p>
      )}

      <SearchPill key={q} initialValue={q} onSearch={(value) => (setFlash(''), update({ q: value }))} placeholder="Search by name or email" className="mt-6 max-w-xl" />
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
        <ul className="flex flex-wrap gap-2" aria-label="Filter by role">
          {ROLES.map((r) => (
            <li key={r.label}>
              <button type="button" onClick={() => update({ role: r.value })} aria-pressed={role === r.value} className={pill(role === r.value)}>
                {r.label}
              </button>
            </li>
          ))}
        </ul>
        <ul className="flex flex-wrap gap-2" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <li key={s.label}>
              <button type="button" onClick={() => update({ status: s.value })} aria-pressed={accountStatus === s.value} className={pill(accountStatus === s.value)}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-4 min-h-6 text-sm text-ink-muted" aria-live="polite">
        {!loading && !error && meta && `${meta.total} ${meta.total === 1 ? 'user' : 'users'}`}
      </div>

      <div className="mt-2">
        {loading && <div className="h-40 animate-pulse rounded-card bg-surface" aria-busy="true" />}
        {!loading && error && <ErrorState error={error} onRetry={reload} />}
        {!loading && !error && items.length === 0 && <EmptyState title="No users match" text="Try a different search or filter." />}
        {!loading && !error && items.length > 0 && (
          <>
            <ul className="divide-y divide-line rounded-card border border-line">
              {items.map((u) => {
                const isSelf = u._id === me?.id;
                const isAdmin = u.role === 'admin';
                const suspended = u.accountStatus === 'suspended';
                return (
                  <li key={u._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">
                        {u.fullName}
                        {isSelf && <span className="ml-2 text-xs font-normal text-ink-muted">(you)</span>}
                      </p>
                      <p className="truncate text-sm text-ink-muted">{u.email}</p>
                      <p className="mt-1 text-xs text-ink-muted">Joined {formatDate(u.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex rounded-full bg-surface px-2.5 py-1 text-xs font-semibold capitalize">{u.role}</span>
                      {badge(!suspended, suspended ? 'Suspended' : 'Active')}
                      <button type="button" onClick={() => setDetails(u._id)} className="btn-secondary !px-3 !py-1.5" aria-label={`Details for ${u.fullName}`}>
                        Details
                      </button>
                      {isAdmin || isSelf ? (
                        <span className="text-xs text-ink-muted">{isSelf ? 'Your account' : 'Protected'}</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => (setDialogError(''), setTarget({ user: u, next: suspended ? 'active' : 'suspended' }))}
                          className={`btn !px-3 !py-1.5 ${suspended ? 'btn-primary' : 'border border-red-200 text-red-700 hover:bg-red-50'}`}
                          aria-label={`${suspended ? 'Reactivate' : 'Suspend'} ${u.fullName}`}
                        >
                          {suspended ? 'Reactivate' : 'Suspend'}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Pagination page={meta?.page ?? page} totalPages={meta?.totalPages ?? 1} onChange={(p) => update({ page: p > 1 ? p : '' }, { keepPage: true })} />
          </>
        )}
      </div>

      {details && <UserDetailsDialog userId={details} onClose={() => setDetails(null)} />}
      {target && (
        <ConfirmDialog
          title={target.next === 'suspended' ? `Suspend ${target.user.fullName}?` : `Reactivate ${target.user.fullName}?`}
          message={target.next === 'suspended' ? 'They will be signed out immediately and will not be able to log in until reactivated.' : 'They will be able to log in again.'}
          confirmLabel={target.next === 'suspended' ? 'Suspend' : 'Reactivate'}
          busy={busy}
          error={dialogError}
          onConfirm={confirm}
          onCancel={() => setTarget(null)}
        />
      )}
    </div>
  );
}
