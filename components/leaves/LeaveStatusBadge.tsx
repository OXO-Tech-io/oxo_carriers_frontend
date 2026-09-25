'use client';

import { Badge, type BadgeVariant } from '@/components/ui/Badge';

const STATUS_VARIANT: Record<string, BadgeVariant> = {
  pending: 'warning',
  team_leader_approved: 'info',
  hr_approved: 'success',
  rejected: 'error',
  cancelled: 'gray',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  team_leader_approved: 'TL Approved',
  hr_approved: 'Approved',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

// Uses the shared Badge component's vetted color tokens (instead of
// hand-picked Tailwind shades) so status pills keep guaranteed light/dark
// contrast wherever they're shown (OCD-507).
export function LeaveStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={STATUS_VARIANT[status] ?? 'gray'}>
      {STATUS_LABEL[status] ?? status}
    </Badge>
  );
}
