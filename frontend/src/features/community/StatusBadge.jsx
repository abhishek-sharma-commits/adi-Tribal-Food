import { CheckCircle2, Clock, XCircle } from 'lucide-react';

const STATUS = {
  pending: { label: 'Pending review', className: 'bg-amber-50 text-amber-800', Icon: Clock },
  approved: { label: 'Approved', className: 'bg-green-50 text-green-800', Icon: CheckCircle2 },
  rejected: { label: 'Rejected', className: 'bg-red-50 text-red-700', Icon: XCircle },
};

export default function StatusBadge({ status }) {
  const { label, className, Icon } = STATUS[status] ?? STATUS.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </span>
  );
}
