import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/format.js';
import MediaThumb from './MediaThumb.jsx';
import StatusBadge from './StatusBadge.jsx';

export default function UploadRow({ item, onDelete }) {
  const editable = item.status !== 'approved';
  return (
    <li className="flex flex-col gap-3 rounded-card border border-line p-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <MediaThumb item={item} className="h-16 w-16 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <Link to={`/dashboard/uploads/${item._id}`} className="block truncate font-semibold hover:underline">
            {item.title}
          </Link>
          <p className="text-sm text-ink-muted">
            {item.mediaType === 'video' ? 'Video' : 'Photo'} · {formatDate(item.createdAt)}
            {item.category?.name ? ` · ${item.category.name}` : ''}
          </p>
          {item.status === 'rejected' && item.rejectionReason && <p className="mt-1 line-clamp-1 text-sm text-red-700">Reason: {item.rejectionReason}</p>}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <StatusBadge status={item.status} />
        {onDelete && (
          <>
            <Link to={`/dashboard/uploads/${item._id}`} className="btn-secondary !px-3 !py-1.5" aria-label={`View ${item.title}`}>
              View
            </Link>
            {editable && (
              <Link to={`/dashboard/uploads/${item._id}/edit`} className="btn-secondary !px-3 !py-1.5" aria-label={`Edit ${item.title}`}>
                Edit
              </Link>
            )}
            <button type="button" onClick={() => onDelete(item)} className="btn-ghost !px-3 !py-1.5 text-red-700" aria-label={`Delete ${item.title}`}>
              Delete
            </button>
          </>
        )}
      </div>
    </li>
  );
}
