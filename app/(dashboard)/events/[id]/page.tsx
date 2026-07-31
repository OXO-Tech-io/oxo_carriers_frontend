import EventDetailClient from './EventDetailClient';
import { generateNumericStaticParams } from '@/lib/utils';

// Required for static export with dynamic routes
export const dynamicParams = false;

export async function generateStaticParams() {
  return generateNumericStaticParams();
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
