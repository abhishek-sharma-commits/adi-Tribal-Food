import { LogOut } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import { initials } from '../utils/format.js';

export default function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => !ref.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-sm font-semibold text-white hover:opacity-90"
      >
        {initials(user.fullName)}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 z-50 mt-2 w-64 rounded-card border border-line bg-white p-2 shadow-lift">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="truncate text-xs text-ink-muted">{user.email}</p>
            {user.role === 'admin' && <span className="mt-1 inline-block rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">Administrator</span>}
          </div>
          <hr className="my-1 border-line" />
          {[
            ...(user.role === 'admin' ? [['/admin', 'Admin dashboard']] : []),
            ['/dashboard', 'Dashboard'],
            ['/dashboard/profile', 'Profile'],
          ].map(([to, label]) => (
            <Link key={to} to={to} role="menuitem" onClick={() => setOpen(false)} className="block rounded-xl px-3 py-2 text-sm hover:bg-surface">
              {label}
            </Link>
          ))}
          <hr className="my-1 border-line" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-surface"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" /> Log out
          </button>
        </div>
      )}
    </div>
  );
}
