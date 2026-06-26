import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  Network,
  BarChart3,
  LogOut,
  Menu,
  X,
  Settings
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/attendance", label: "Attendance", icon: CalendarCheck },
    { href: "/members", label: "Members", icon: Users },
    { href: "/classes", label: "Classes", icon: Network },
    { href: "/reports", label: "Reports", icon: BarChart3 },
  ];

  const initial = (user?.displayName || user?.username || "U")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex flex-col md:flex-row">
      {/* Mobile Header */}
      <div className="md:hidden bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-gray-700 p-4 flex items-center justify-between sticky top-0 z-20">
        <div className="font-display font-bold text-xl text-primary">Church Connect</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-700 dark:text-gray-200">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-10 w-64 bg-white dark:bg-gray-900 border-r border-slate-200 dark:border-gray-700 transform transition-transform duration-200 ease-in-out md:translate-x-0 md:static md:h-screen flex flex-col",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-100 dark:border-gray-800 hidden md:block">
          <h1 className="font-display font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              <Network className="w-5 h-5" />
            </div>
            Church Connect
          </h1>
        </div>

        {/* Mobile user info */}
        <div className="p-6 border-b border-slate-100 dark:border-gray-800 md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-lg font-bold text-primary">
              {initial}
            </div>
            <div>
              <p className="font-medium text-slate-900 dark:text-white">{user?.displayName || user?.username}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400">@{user?.username}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                  isActive
                    ? "bg-primary text-white shadow-lg shadow-primary/25 font-medium"
                    : "text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400 dark:text-gray-500")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user + settings + signout */}
        <div className="p-4 border-t border-slate-100 dark:border-gray-800">
          <div className="hidden md:flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center font-bold text-slate-600 dark:text-gray-300 text-xs">
              {initial}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{user?.displayName || user?.username}</p>
              <p className="text-xs text-slate-500 dark:text-gray-400 truncate">@{user?.username}</p>
            </div>
          </div>
          <Link
            href="/settings"
            onClick={() => setIsMobileMenuOpen(false)}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium mb-1",
              location === "/settings"
                ? "bg-primary text-white"
                : "text-slate-600 dark:text-gray-300 hover:bg-slate-50 dark:hover:bg-gray-800 hover:text-slate-900 dark:hover:text-white"
            )}
          >
            <Settings className={cn("w-5 h-5", location === "/settings" ? "text-white" : "text-slate-400 dark:text-gray-500")} />
            Settings
          </Link>
          <button
            onClick={() => logout()}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm font-medium"
            data-testid="button-signout"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
          {children}
        </div>
      </main>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-0 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </div>
  );
}
