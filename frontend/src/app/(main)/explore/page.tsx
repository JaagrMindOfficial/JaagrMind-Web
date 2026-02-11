import { Compass } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-6">
        <Compass className="w-8 h-8 text-accent" />
      </div>
      <h1 className="text-3xl font-bold font-serif mb-4">Explore</h1>
      <div className="p-8 border border-dashed border-border rounded-lg bg-accent/5 max-w-md w-full">
        <p className="text-lg font-medium mb-2">This page is under development</p>
        <p className="text-sm text-muted">We&apos;re building something great here. Check back soon!</p>
      </div>
    </div>
  );
}
