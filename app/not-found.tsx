import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FCFCFD]">
      <div className="text-center px-4">
        <h1 className="text-2xl font-bold text-[#101828]">Page not found</h1>
        <p className="mt-2 text-[#475467]">The page you are looking for does not exist or has been moved.</p>
        <Link
          href="/"
          className="inline-block mt-6 px-4 py-2.5 bg-[#465FFF] text-white rounded-lg font-semibold hover:bg-[#3641F5] transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
