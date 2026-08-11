'use client';

import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatDurationShort } from '@/lib/attendance/format';

interface ActivityBreakdownChartProps {
  productiveSec: number;
  idleSec: number;
  unproductiveSec: number;
  className?: string;
}

interface Slice {
  name: string;
  value: number;
  /** Recharts reads `fill` straight off each datum, so no <Cell> is needed. */
  fill: string;
}

/**
 * Donut of how a logged day split.
 *
 * The backend's duration model defines `unproductiveSec = totalLoggedSec -
 * activeSec`, which is the same quantity as `idleSec`, and `productiveSec =
 * activeSec`. Rendering all three as slices would therefore double-count the
 * day and make the ring meaningless, so an unproductive figure equal to idle is
 * shown as a read-out beside the chart rather than as a third slice. If a future
 * app/URL classifier ever makes the two diverge, the extra slice appears on its
 * own.
 */
export function ActivityBreakdownChart({
  productiveSec,
  idleSec,
  unproductiveSec,
  className = '',
}: ActivityBreakdownChartProps) {
  const unproductiveDiffers = unproductiveSec !== idleSec;

  const slices: Slice[] = [
    { name: 'Productive', value: Math.max(0, productiveSec), fill: 'var(--chart-productive)' },
    { name: 'Idle', value: Math.max(0, idleSec), fill: 'var(--chart-idle)' },
  ];
  if (unproductiveDiffers) {
    slices.push({
      name: 'Unproductive',
      value: Math.max(0, unproductiveSec),
      fill: 'var(--chart-series)',
    });
  }

  const total = slices.reduce((sum, slice) => sum + slice.value, 0);
  const data = slices.filter((slice) => slice.value > 0);

  if (total === 0) {
    return (
      <div
        className={`flex h-56 items-center justify-center rounded-2xl border border-dashed border-[var(--gray-100)] ${className}`}
      >
        <p className="text-xs font-semibold text-[var(--gray-400)]">
          No tracked time yet today.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="58%"
              outerRadius="82%"
              // 2px of surface between fills so adjacent arcs never blend.
              paddingAngle={2}
              stroke="var(--card-bg)"
              strokeWidth={2}
              isAnimationActive={false}
            />
            <Tooltip
              formatter={(value, name) => {
                const seconds = typeof value === 'number' ? value : 0;
                return [
                  `${formatDurationShort(seconds)} (${((seconds / total) * 100).toFixed(1)}%)`,
                  String(name ?? ''),
                ];
              }}
              contentStyle={{
                background: 'var(--card-bg)',
                border: '1px solid var(--gray-100)',
                borderRadius: '12px',
                fontSize: '12px',
                color: 'var(--foreground)',
              }}
              itemStyle={{ color: 'var(--foreground)' }}
              labelStyle={{ color: 'var(--gray-400)' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Legend doubles as the table view: every slice is directly labelled with
          its duration and share, so nothing is encoded by colour alone. */}
      <ul className="mt-3 space-y-1.5">
        {slices.map((slice) => (
          <li key={slice.name} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex items-center gap-2 font-semibold text-[var(--gray-500)]">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: slice.fill }}
                aria-hidden
              />
              {slice.name}
            </span>
            <span className="font-bold text-[var(--foreground)]">
              {formatDurationShort(slice.value)}
              <span className="ml-1.5 font-semibold text-[var(--gray-400)]">
                {total ? `${((slice.value / total) * 100).toFixed(0)}%` : '0%'}
              </span>
            </span>
          </li>
        ))}
        {!unproductiveDiffers && (
          <li className="flex items-center justify-between gap-3 border-t border-[var(--gray-50)] pt-1.5 text-xs">
            <span className="font-semibold text-[var(--gray-400)]">Unproductive</span>
            <span className="font-bold text-[var(--foreground)]">
              {formatDurationShort(unproductiveSec)}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
}
