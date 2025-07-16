'use client';

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  BarChart3, 
  Send, 
  Users, 
  FileText, 
  PieChart, 
  Link2, 
  ShoppingBag,
  MessageSquare,
  User,
  Settings
} from "lucide-react";
import { useRef, useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from '@shared/supabase';

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Campaigns", href: "/campaigns", icon: Send },
  { name: "Contacts", href: "/contacts", icon: Users },
  { name: "Templates", href: "/templates", icon: FileText },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Short Links", href: "/short-links", icon: Link2 },
  { name: "Shopify Sync", href: "/shopify", icon: ShoppingBag },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export default function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user, userFullName } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    if (showMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-slate-200 flex flex-col">
      {/* Logo Section */}
      <div className="p-6 border-b border-slate-200">
        <Link href="/dashboard">
          <div className="flex items-center space-x-3 cursor-pointer hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="GSend Logo" className="max-h-20 w-32 object-contain" />
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link 
              key={item.name} 
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg font-medium transition-colors",
                isActive
                  ? "bg-emerald-50 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
              onClick={onNavigate}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Account Section */}
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3 px-3 py-2 relative">
          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">{userFullName}</p>
            <p className="text-xs text-slate-500">Premium Plan</p>
          </div>
          <button className="text-slate-400 hover:text-slate-600 relative" onClick={() => setShowMenu((v) => !v)}>
            <Settings className="h-4 w-4" />
          </button>
          {showMenu && (
            <div ref={menuRef} className="absolute right-0 top-10 z-10 bg-white border border-slate-200 rounded-md shadow-lg py-1 w-32">
              <button
                onClick={handleSignOut}
                className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
