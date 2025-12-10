'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-provider';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';

// Key must match auth-provider
const AUTH_HINT_KEY = 'rfq_auth_hint';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  
  // ✅ Check localStorage hint for instant decision
  const [hasHint, setHasHint] = useState(false);
  
  useEffect(() => {
    // Check hint on mount (instant, no network)
    try {
      setHasHint(localStorage.getItem(AUTH_HINT_KEY) === 'true');
    } catch {
      setHasHint(false);
    }
  }, []);

  // Redirect to login if not authenticated
  useEffect(() => {
    // Only redirect when we're sure there's no user
    // Don't redirect while still loading or if we have a hint
    if (!loading && !user && !hasHint) {
      router.replace('/login');
    }
    
    // If loading finished and no user but had hint, clear hint and redirect
    if (!loading && !user && hasHint) {
      try {
        localStorage.removeItem(AUTH_HINT_KEY);
      } catch {}
      router.replace('/login');
    }
  }, [user, loading, router, hasHint]);

  // ✅ Show layout immediately if we have hint OR user
  // This makes post-login feel instant
  const shouldRender = hasHint || user || loading;
  
  if (!shouldRender) {
    return null;
  }

  // ✅ No more loading skeleton! 
  // The dashboard page itself handles its own loading state
  // This makes the sidebar/header appear instantly

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <div className="hidden lg:block">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <MobileNav
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header onMenuClick={() => setIsMobileNavOpen(true)} />

        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 max-w-7xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
