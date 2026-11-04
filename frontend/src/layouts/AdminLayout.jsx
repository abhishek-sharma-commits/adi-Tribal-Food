import { Images, LayoutDashboard, Tags, UtensilsCrossed, Users } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';

const NAV = [
  { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
  { to: '/admin/recipes', label: 'Recipes', icon: UtensilsCrossed },
  // { to: '/admin/blogs', label: 'Stories', icon: BookOpen },
  { to: '/admin/media', label: 'Official media', icon: Images },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  // { to: '/admin/moderation', label: 'Moderation', icon: ShieldCheck },
  { to: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout() {
  return (
    <div className="container-page py-8 sm:py-10">
      <p className="text-sm font-semibold text-brand">Administrator</p>
      <h1 className="text-3xl font-bold tracking-tight">Admin dashboard</h1>

      <div className="mt-6 grid gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <nav aria-label="Admin" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition-colors lg:rounded-xl ${isActive ? 'bg-ink text-white' : 'text-ink hover:bg-surface'}`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
