'use client';

import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Award, Briefcase, Clock, GraduationCap, Info, Target } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { SearchableSelect } from '@/components/ui/SearchableSelect';
import { useExperienceSummaryQuery } from '@/hooks/queries/use-experience-summary-query';
import {
  CAREER_PATH_OPTIONS,
  careerPathLabel,
  type CareerPath,
  type ExperienceDuration,
} from '@/types/profile';

// Always years, months and days - "3 yrs 10 mos 10 days" / "1 yr 0 mos 0 days" / "None".
// The backend counts anniversaries inclusively (start date = day 1), so 15 May 2025 -> 14 May 2026 is exactly 1 yr.
export function formatDuration(d: ExperienceDuration): string {
  if (d.totalDays <= 0) return 'None';
  return [
    `${d.years} ${d.years === 1 ? 'yr' : 'yrs'}`,
    `${d.months} ${d.months === 1 ? 'mo' : 'mos'}`,
    `${d.days} ${d.days === 1 ? 'day' : 'days'}`,
  ].join(' ');
}

function formatMonthYear(ymd: string): string {
  const [y, m] = ymd.split('-').map(Number);
  return format(new Date(y, m - 1, 1), 'MMM yyyy');
}

interface MetricTileProps {
  icon: React.ElementType;
  label: string;
  help: string;
  duration: ExperienceDuration | null;
  unavailableHint?: string;
}

function MetricTile({ icon: Icon, label, help, duration, unavailableHint }: MetricTileProps) {
  return (
    <div className="p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl" title={help}>
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider leading-tight">{label}</p>
      </div>
      {duration ? (
        <>
          <p className="text-xl font-extrabold text-[var(--foreground)]">{formatDuration(duration)}</p>
          <p className="text-[11px] font-medium text-[var(--gray-400)] mt-1">{duration.totalDays.toLocaleString()} days in total</p>
        </>
      ) : (
        <>
          <p className="text-xl font-extrabold text-[var(--gray-300)]">N/A</p>
          <p className="text-[11px] font-medium text-[var(--gray-400)] mt-1">{unavailableHint}</p>
        </>
      )}
    </div>
  );
}

interface ExperienceSummaryCardProps {
  userId?: number;
}

export function ExperienceSummaryCard({ userId }: ExperienceSummaryCardProps) {
  const { data: summary, isLoading, isError } = useExperienceSummaryQuery(userId);
  // null = "use the employee's current career path" (the default).
  const [picked, setPicked] = useState<CareerPath | null>(null);

  const options = useMemo(
    () =>
      CAREER_PATH_OPTIONS.map((o) => ({
        value: o.value,
        label: o.label,
        meta: summary && summary.byCareerPath[o.value].totalDays > 0 ? formatDuration(summary.byCareerPath[o.value]) : undefined,
      })),
    [summary],
  );

  if (isLoading) {
    return (
      <Card className="shadow-sm border-[var(--gray-100)] p-6">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </Card>
    );
  }
  if (isError || !summary) return null;

  const selectedPath: CareerPath | null = picked ?? summary.currentCareerPath ?? null;
  const related = selectedPath ? summary.byCareerPath[selectedPath] : null;
  const sharePct =
    related && summary.total.totalDays > 0 ? Math.round((related.totalDays / summary.total.totalDays) * 100) : 0;
  const isDefault = picked === null || picked === summary.currentCareerPath;
  const noDegreeHint = 'Add a Bachelor’s degree under Education';

  return (
    <Card className="shadow-sm border-[var(--gray-100)] p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h4 className="text-sm font-bold text-[var(--foreground)]">Work History Summary</h4>
          <p className="text-[11px] font-medium text-[var(--gray-400)] mt-1">
            Auto-calculated from your work history as of {format(new Date(summary.asOf + 'T00:00:00'), 'd MMM yyyy')}.
            Both the start and end dates count as days worked, so a role is a full year on the day before its anniversary. Overlapping roles are counted once and career breaks are never counted.
          </p>
        </div>
        <SearchableSelect
          className="sm:w-72 shrink-0"
          label="Career Path"
          value={selectedPath}
          options={options}
          onChange={(v) => setPicked(v as CareerPath)}
          placeholder="Select a career path"
          searchPlaceholder="Search career paths..."
        />
      </div>

      {/* Hero: experience in the selected career path */}
      <div className="rounded-2xl border border-[var(--primary-light)] bg-[var(--primary-light)]/40 p-5 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1.5 bg-[var(--primary)] text-white rounded-lg">
            <Target className="h-3.5 w-3.5" />
          </div>
          <p className="text-[10px] font-bold text-[var(--gray-500)] uppercase tracking-wider">
            Total Experience in Related Field
          </p>
          {selectedPath && (
            <span className="ml-auto rounded-full bg-[var(--card-bg)] px-2.5 py-0.5 text-[10px] font-bold text-[var(--primary)]">
              {careerPathLabel(selectedPath)}
              {isDefault && summary.currentCareerPath ? ' · current designation' : ''}
            </span>
          )}
        </div>
        {selectedPath && related ? (
          <>
            <p className="text-3xl font-extrabold text-[var(--foreground)]">{formatDuration(related)}</p>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--card-bg)]" role="presentation">
              <div className="h-full rounded-full bg-[var(--primary)] transition-all duration-500" style={{ width: `${sharePct}%` }} />
            </div>
            <p className="text-[11px] font-medium text-[var(--gray-500)] mt-1.5">
              {related.totalDays > 0
                ? `${sharePct}% of your total work experience`
                : 'No work history entries are tagged with this career path yet.'}
            </p>
          </>
        ) : (
          <p className="text-sm font-semibold text-[var(--gray-500)]">
            No career path is set for your current designation - pick one above to see related experience.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricTile
          icon={Clock}
          label="Total Work Experience"
          help="All work experience, including internships and experience gained before degree completion."
          duration={summary.total}
        />
        <MetricTile
          icon={Briefcase}
          label="Total Without Internship"
          help="Total work experience excluding all internship periods."
          duration={summary.totalExclInternship}
        />
        <MetricTile
          icon={GraduationCap}
          label="Post-Degree Experience"
          help="Work experience from the first-degree completion date onwards, excluding career breaks."
          duration={summary.hasDegreeDate ? summary.postDegree : null}
          unavailableHint={noDegreeHint}
        />
        <MetricTile
          icon={Award}
          label="Post-Degree Without Internship"
          help="Post-degree work experience excluding internship periods served after degree completion."
          duration={summary.hasDegreeDate ? summary.postDegreeExclInternship : null}
          unavailableHint={noDegreeHint}
        />
      </div>

      <div className="mt-4 space-y-1.5">
        {summary.hasDegreeDate && summary.degreeCompletionDate && (
          <p className="flex items-start gap-1.5 text-[11px] font-medium text-[var(--gray-400)]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
            Post-degree figures count from {formatMonthYear(summary.degreeCompletionDate)}, your first degree&rsquo;s graduation
            month
            {summary.degreeDateSource === 'profile' ? ' (from your profile’s degree completion date)' : ''}.
          </p>
        )}
        {!summary.hasDegreeDate && (
          <p className="flex items-start gap-1.5 text-[11px] font-medium text-[var(--gray-400)]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
            Post-degree figures need the graduation month and year of your Bachelor&rsquo;s degree in the Education tab.
          </p>
        )}
        {summary.uncategorizedEntryCount > 0 && (
          <p className="flex items-start gap-1.5 text-[11px] font-medium text-[var(--gray-400)]">
            <Info className="h-3.5 w-3.5 shrink-0 mt-px" />
            {summary.uncategorizedEntryCount} of {summary.entryCount} work history{' '}
            {summary.entryCount === 1 ? 'entry has' : 'entries have'} no career path, so{' '}
            {summary.uncategorizedEntryCount === 1 ? 'it is' : 'they are'} not counted in related-field experience.
          </p>
        )}
      </div>
    </Card>
  );
}
