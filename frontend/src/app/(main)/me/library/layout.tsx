'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const tabs = [
    { name: 'Your lists', href: '/me/library' },
    // { name: 'Saved lists', href: '/me/library/saved' }, // Skipped as per request
    // { name: 'Highlights', href: '/me/library/highlights' }, // Skipped
    { name: 'Reading history', href: '/me/library/reading-history' },
    { name: 'Responses', href: '/me/library/responses' },
  ];

  return (
    <div className="w-full max-w-[680px] px-6 py-12 mx-auto">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[42px] font-bold tracking-tight text-foreground font-serif">
          Your library
        </h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-8 border-b border-border mb-8 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`pb-4 text-sm font-medium transition-colors whitespace-nowrap border-b-2 -mb-px ${
                isActive
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted hover:text-foreground'
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>

      {/* Content */}
      <div className="animate-fade-in">
        {children}
      </div>
    </div>
  );
}
