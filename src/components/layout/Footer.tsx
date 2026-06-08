export function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted">
            © {new Date().getFullYear()} SparkLeads. All rights reserved.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <a href="/legal/privacy" className="text-muted hover:text-primary transition-colors">Privacy</a>
            <a href="/legal/terms" className="text-muted hover:text-primary transition-colors">Terms</a>
            <a href="/legal/cookies" className="text-muted hover:text-primary transition-colors">Cookies</a>
            <a href="/legal/acceptable-use" className="text-muted hover:text-primary transition-colors">Acceptable Use</a>
            <a href="/legal/refund" className="text-muted hover:text-primary transition-colors">Refunds</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
