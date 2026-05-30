import { Zap } from 'lucide-react';

export default function Loading() {
  return (
    <main className="min-h-screen bg-background text-text flex items-center justify-center p-4">
      <div className="text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Zap className="w-8 h-8 text-primary" />
        </div>
        <p className="text-muted">Loading...</p>
      </div>
    </main>
  );
}
