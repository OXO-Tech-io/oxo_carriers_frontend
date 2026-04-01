import SalarySlipDetailClient from '../[[...id]]/SalarySlipDetailClient';

// Required for static export with dynamic routes
// Changed from [[...id]] to [id] to avoid optional catch-all issues with static export
export const dynamicParams = false;

export async function generateStaticParams() {
  // For dynamic routes [id] with static export and dynamicParams: false:
  // We MUST return all possible IDs that will be accessed.
  // Since we can't fetch from API at build time (no authentication context),
  // we return a range of common IDs. Adjust this range based on your needs.
  
  // Generate IDs from 1 to 100 (adjust range as needed)
  const ids = Array.from({ length: 100 }, (_, i) => ({ id: String(i + 1) }));
  
  return ids;
  
  // Alternative: If you can fetch from API at build time, uncomment this:
  // try {
  //   const response = await fetch('https://backend.oxocareers.com/salary');
  //   const data = await response.json();
  //   return data.salaries.map((salary: any) => ({ id: String(salary.id) }));
  // } catch (error) {
  //   console.error('Failed to fetch salary IDs at build time:', error);
  //   return [{ id: '1' }];
  // }
}

export default function SalarySlipDetailPage() {
  return <SalarySlipDetailClient />;
}
