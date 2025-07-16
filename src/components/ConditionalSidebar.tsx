'use client';

import { useAuth } from "@/contexts/AuthContext";
import { usePathname } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Sidebar from "@/components/Sidebar";

// Pages that should NOT have the sidebar (public pages)
const PUBLIC_PAGES = [
  '/',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
];

export default function ConditionalSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Check if current page should show sidebar
  const shouldShowSidebar = user && !loading && !PUBLIC_PAGES.includes(pathname);

  // Close sidebar on click outside (mobile only)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    }
    if (sidebarOpen && shouldShowSidebar) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen, shouldShowSidebar]);

  // If it's a public page or user is not authenticated, just render children
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  // Helper to render sidebar with hamburger for mobile
  function SidebarWithHamburger() {
    return (
      <>
        {/* Sticky top bar for mobile */}
        <div className="md:hidden fixed top-0 left-0 w-full z-50 bg-white shadow flex items-center px-4 h-14">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="ml-2 text-lg font-bold text-slate-800">GSend</span>
          </div>
          <div className="flex-grow" />
          <button
            className="flex items-center justify-center w-10 h-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            <span className="relative w-6 h-6 block">
              {/* Hamburger to X animation */}
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '24px',
                  height: '3px',
                  background: '#374151',
                  borderRadius: '2px',
                  top: sidebarOpen ? '12px' : '6px',
                  transform: sidebarOpen ? 'rotate(45deg)' : 'none',
                  transition: 'all 1.25s cubic-bezier(.4,2,.6,1)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '24px',
                  height: '3px',
                  background: '#374151',
                  borderRadius: '2px',
                  top: '12px',
                  opacity: sidebarOpen ? 0 : 1,
                  transition: 'all 1.25s cubic-bezier(.4,2,.6,1)',
                }}
              />
              <span
                style={{
                  position: 'absolute',
                  left: 0,
                  width: '24px',
                  height: '3px',
                  background: '#374151',
                  borderRadius: '2px',
                  top: sidebarOpen ? '12px' : '18px',
                  transform: sidebarOpen ? 'rotate(-45deg)' : 'none',
                  transition: 'all 1.25s cubic-bezier(.4,2,.6,1)',
                }}
              />
            </span>
          </button>
        </div>
        {/* Sidebar overlay for mobile */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 md:hidden">
            {/* Overlay */}
            <div
              className="absolute inset-0 bg-black bg-opacity-40 transition-opacity duration-300 pointer-events-auto"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Sidebar */}
            <div
              ref={sidebarRef}
              className="absolute left-0 top-0 w-64 h-full bg-white shadow-lg flex flex-col transform transition-transform duration-500 ease-in-out translate-x-0 pointer-events-auto"
            >
              <Sidebar onNavigate={() => setSidebarOpen(false)} />
            </div>
          </div>
        )}
        {/* Sidebar for desktop */}
        <div className="hidden md:flex h-full">
          <Sidebar />
        </div>
      </>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <SidebarWithHamburger />
      <main className="flex-1 overflow-auto pt-14 md:pt-0">
        {children}
      </main>
    </div>
  );
} 