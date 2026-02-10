import { Suspense } from 'react';
import { MediaLibrary } from '@/components/MediaLibrary';

export default function MediaPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Media Library</h1>
      </div>

      <div className="bg-card rounded-lg shadow-sm border border-border p-6">
        <p className="text-muted text-sm mb-4">
          Manage your images and files. Uploaded images can be used in your posts and pages.
        </p>
        <Suspense fallback={<div>Loading media...</div>}>
          <MediaLibrary />
        </Suspense>
      </div>
    </div>
  );
}
