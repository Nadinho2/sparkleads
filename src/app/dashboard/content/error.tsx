'use client';

import { useEffect } from 'react';

export default function ContentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Content page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center space-y-4 max-w-md mx-auto p-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-semibold text-text">Content Generation Error</h2>
        <p className="text-sm text-muted">
          {error.message || 'Something went wrong while generating content.'}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/dashboard/content'}
            className="px-4 py-2 rounded-lg bg-surface2 text-text text-sm font-medium hover:bg-surface2/80 transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
