import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  List,
  Settings,
  Menu,
  X,
} from 'lucide-react';
import { APP_VERSION } from '../version';

/**
 * App shell — fixed dark sidebar (desktop) + hamburger overlay (mobile).
 *
 * Design tokens (match these across all components):
 *   Sidebar bg:    slate-900
 *   Sidebar hover: slate-700/60
 *   Active accent: violet-600 (pill highlight)
 *   Page bg:       slate-50
 *   Cards:         white
 */

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/items', label: 'Items', icon: List },
  // ⚠️  Add nav items here when you add new pages
];

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = () => setMobileOpen(false);

  const nav = (
    <nav className="flex flex-col gap-1 flex-1">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          onClick={closeMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}
    </nav>
  );

  const sidebar = (
    <div className="flex flex-col h-full px-3 py-4">
      {/* App name / logo */}
      <div className="px-3 mb-6">
        {/* ⚠️  Change 'My App' to your app name */}
        <span className="text-white font-bold text-lg tracking-tight">My App</span>
      </div>

      {nav}

      {/* Bottom actions */}
      <div className="border-t border-slate-700 pt-3 mt-3 flex flex-col gap-1">
        <NavLink
          to="/settings"
          onClick={closeMobile}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
              isActive
                ? 'bg-violet-600 text-white'
                : 'text-slate-400 hover:bg-slate-700/60 hover:text-white'
            }`
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>

        <p className="text-xs text-slate-600 px-3 pt-2">{APP_VERSION}</p>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Desktop sidebar ─────────────────────────────────────────────────── */}
      <aside className="hidden md:flex w-56 bg-slate-900 flex-col shrink-0">
        {sidebar}
      </aside>

      {/* ── Mobile hamburger button ─────────────────────────────────────────── */}
      <button
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-slate-900 rounded-lg text-white"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ── Mobile sidebar overlay ──────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={closeMobile}
          />
          <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 z-50 md:hidden flex flex-col">
            {sidebar}
          </aside>
        </>
      )}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
