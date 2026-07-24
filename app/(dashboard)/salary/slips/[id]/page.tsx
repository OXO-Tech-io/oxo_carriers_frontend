import SalarySlipDetailClient from '../[[...id]]/SalarySlipDetailClient';

// Required for static export with dynamic routes
export const dynamicParams = false;

export async function generateStaticParams() {
  const ids = Array.from({ length: 500 }, (_, i) => ({ id: String(i + 1) }));
  return ids;
}

export default function SalarySlipDetailPage() {
  return <SalarySlipDetailClient />;
}
