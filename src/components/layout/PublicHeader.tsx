'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Zap, Menu, X } from 'lucide-react';

export function PublicHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-bg/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-text">SparkLeads</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          <a href="#features" className="text-sm text-muted hover:text-text transition-colors">Features</a>
          <a href="#pricing" className="text-sm text-muted hover:text-text transition-colors">Pricing</a>
          <a href="#faq" className="text-sm text-muted hover:text-text transition-colors">FAQ</a>
          <Link href="/freetrial" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors">
            Get Started Free
          </Link>
        </nav>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2 rounded-lg text-muted hover:text-text hover:bg-surface2 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-surface">
          <div className="px-4 py-4 space-y-3">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-text py-2">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-text py-2">Pricing</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-sm text-muted hover:text-text py-2">FAQ</a>
            <Link href="/freetrial" className="block w-full text-center px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-medium">
              Get Started Free
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
