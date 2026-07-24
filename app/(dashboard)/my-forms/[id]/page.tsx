import FillFormClient from './FillFormClient';

// Required for static export with dynamic routes - same pattern as
// app/(dashboard)/salary/slips/[id]/page.tsx.
export const dynamicParams = false;

export async function generateStaticParams() {
  const ids = Array.from({ length: 500 }, (_, i) => ({ id: String(i + 1) }));
  return ids;
}

export default function FillFormPage() {
  return <FillFormClient />;
}
