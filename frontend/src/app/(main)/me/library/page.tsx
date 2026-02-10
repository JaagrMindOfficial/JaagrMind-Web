'use client';

import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';

export default function LibraryPage() {
  // const { user } = useAuth(); // Unused

  return (
    <div className="w-full max-w-4xl px-6 py-8">
      <div className="mb-8 border-b border-border pb-4">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-accent" />
          Your Library
        </h1>
        <p className="text-muted mt-2">Stories you&apos;ve saved for later.</p>
      </div>

      <div className="text-center py-20 bg-accent/5 rounded-lg border border-border/50">
        <BookOpen className="w-12 h-12 text-muted mx-auto mb-4" />
        <h3 className="text-xl font-medium mb-2">Your library is empty</h3>
        <p className="text-muted mb-6">Save stories to read them later.</p>
      </div>
    </div>
  );
}
