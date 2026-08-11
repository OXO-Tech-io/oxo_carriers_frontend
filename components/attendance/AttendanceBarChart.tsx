'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export interface BarDatum {
  label: string;
  value: number;
}

interface AttendanceBarChartProps {
  data: BarDatum[];
  /** Names the measure — the chart has one series, so it needs no legend box. */
  valueLabel: string;
  height?: number;
  /** Rendered in the tooltip and on the y-axis, e.g. `(v) => `${v}%``. */
  formatValue?: (value: number) => string;
  emptyMessage?: string;
  className?: string;
}

/**
 * Single-measure horizontal bar chart, used for department/employee comparisons
 * and as the secondary visual on report pages.
 *
 * One measure means one hue: bars encode magnitude by length, so colouring them
 * per category would imply an identity that is not there. Horizontal because
 * the category labels are names and departments, which do not fit under a
 * vertical axis.
 */
export function AttendanceBarChart({
  data,
  valueLabel,
  height = 280,
  formatValue = (value) => String(value),
  emptyMessage = 'Nothing to chart for this selection.',
  className = '',
}: AttendanceBarChartProps) {
  if (!data.length) {
    return (
      <div
        className={`flex items-center justify-center rounded-2xl border border-dashed border-[var(--gray-100)] ${className}`}
        style={{ height }}
      >
        <p className="text-xs font-semibold text-[var(--gray-400)]">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 24, bottom: 4, left: 8 }}
          barCategoryGap="28%"
        >
          <CartesianGrid horizontal={false} stroke="var(--chart-grid)" />
          <XAxis
            type="number"
            tickFormatter={formatValue}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            axisLine={{ stroke: 'var(--chart-grid)' }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tick={{ fill: 'var(--chart-axis)', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: 'var(--gray-50)' }}
            formatter={(value) => [
              formatValue(typeof value === 'number' ? value : 0),
              valueLabel,
            ]}
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
          <Bar
            dataKey="value"
            name={valueLabel}
            fill="var(--chart-series)"
            radius={[0, 4, 4, 0]}
            maxBarSize={18}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
