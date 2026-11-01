import { formatDate } from '../../utils/format.js';
import MediaThumb from '../community/MediaThumb.jsx';
import StatusBadge from '../community/StatusBadge.jsx';

export default function ModerationCard({ item, busy, onPreview, onApprove, onReject, onDelete }) {
  const reviewed = item.reviewedAt ? `${item.status === 'approved' ? 'Approved' : 'Rejected'} by ${item.reviewedBy?.fullName ?? 'an administrator'} on ${formatDate(item.reviewedAt)}` : '';
  return (
    <li className="flex flex-col gap-4 rounded-card border border-line p-4 sm:flex-row">
      <button type="button" onClick={onPreview} className="shrink-0 self-start" aria-label={`Preview ${item.title}`}>
        <MediaThumb item={item} className="h-28 w-28 rounded-xl" />
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{item.title}</h3>
          <StatusBadge status={item.status} />
        </div>
        {item.description && <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{item.description}</p>}
        <p className="mt-2 text-sm text-ink-muted">
          {item.mediaType === 'video' ? 'Video' : 'Photo'}
          {item.category?.name ? ` · ${item.category.name}` : ''} · Submitted {formatDate(item.createdAt)}
        </p>
        <p className="text-sm">
          <span className="text-ink-muted">By </span>
          <span className="font-medium">{item.uploadedBy?.fullName ?? 'Deleted user'}</span>
          {item.uploadedBy?.email && <span className="text-ink-muted"> ({item.uploadedBy.email})</span>}
        </p>
        {reviewed && <p className="mt-1 text-sm text-ink-muted">{reviewed}</p>}
        {item.status === 'rejected' && item.rejectionReason && <p className="mt-1 text-sm text-red-700">Reason: {item.rejectionReason}</p>}

        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={onPreview} className="btn-secondary !px-3 !py-1.5">
            Preview
          </button>
          {item.status !== 'approved' && (
            <button type="button" onClick={onApprove} disabled={busy} className="btn-primary !px-3 !py-1.5">
              Approve
            </button>
          )}
          {item.status !== 'rejected' && (
            <button type="button" onClick={onReject} disabled={busy} className="btn-secondary !px-3 !py-1.5">
              {item.status === 'approved' ? 'Reject (unpublish)' : 'Reject'}
            </button>
          )}
          <button type="button" onClick={onDelete} disabled={busy} className="btn-ghost !px-3 !py-1.5 text-red-700" aria-label={`Delete ${item.title}`}>
            Delete
          </button>
        </div>
      </div>
    </li>
  );
}
