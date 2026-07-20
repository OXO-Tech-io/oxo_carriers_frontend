'use client';

import { Clock, GraduationCap, Briefcase, Award } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { useExperienceSummaryQuery } from '@/hooks/queries/use-experience-summary-query';

function formatYears(value: number) {
  return `${value.toFixed(1)} yrs`;
}

interface StatTileProps {
  icon: React.ElementType;
  label: string;
  value: string;
}

function StatTile({ icon: Icon, label, value }: StatTileProps) {
  return (
    <div className="p-4 bg-[var(--gray-25)] border border-[var(--gray-100)] rounded-2xl">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-[var(--primary-light)] text-[var(--primary)] rounded-lg">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <p className="text-[10px] font-bold text-[var(--gray-400)] uppercase tracking-wider">{label}</p>
      </div>
      <p className="text-xl font-extrabold text-[var(--foreground)]">{value}</p>
    </div>
  );
}

interface ExperienceSummaryCardProps {
  userId?: number;
}

export function ExperienceSummaryCard({ userId }: ExperienceSummaryCardProps) {
  const { data: summary, isLoading } = useExperienceSummaryQuery(userId);

  if (isLoading || !summary) return null;

  const postDegreeValue = (value: number) => (summary.hasDegreeDate ? formatYears(value) : 'N/A');

  return (
    <Card className="shadow-sm border-[var(--gray-100)] p-6">
      <h4 className="text-sm font-bold text-[var(--foreground)] mb-4">Experience Summary</h4>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile icon={Clock} label="Total Experience" value={formatYears(summary.totalExperienceYears)} />
        <StatTile
          icon={Briefcase}
          label="Excl. Internship"
          value={formatYears(summary.totalExperienceExclInternshipYears)}
        />
        <StatTile
          icon={GraduationCap}
          label="Post-Degree Experience"
          value={postDegreeValue(summary.postDegreeExperienceYears)}
        />
        <StatTile
          icon={Award}
          label="Post-Degree Excl. Internship"
          value={postDegreeValue(summary.postDegreeExperienceExclInternshipYears)}
        />
      </div>
      {!summary.hasDegreeDate && (
        <p className="text-[11px] text-[var(--gray-400)] font-medium mt-3">
          Post-degree figures require an Undergraduate Degree Completion Date - add it from the Education tab.
        </p>
      )}
    </Card>
  );
}
