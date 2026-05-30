import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

type BadgeStatus = 'new' | 'contacted' | 'interested' | 'closed' | 'not_interested';

interface BadgeProps {
  status: BadgeStatus;
  className?: string;
}

const statusStyles: Record<BadgeStatus, string> = {
  new: 'bg-muted/20 text-muted',
  contacted: 'bg-primary/20 text-primary',
  interested: 'bg-warning/20 text-warning',
  closed: 'bg-success/20 text-success',
  not_interested: 'bg-danger/20 text-danger',
};

const statusLabels: Record<BadgeStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  interested: 'Interested',
  closed: 'Closed',
  not_interested: 'Not Interested',
};

export function Badge({ status, className }: BadgeProps) {
  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          statusStyles[status],
          className
        )
      )}
    >
      {statusLabels[status]}
    </span>
  );
}
