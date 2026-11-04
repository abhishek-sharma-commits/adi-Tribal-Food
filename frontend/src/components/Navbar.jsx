import { Menu, Search, X } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext.jsx';
import Logo from './Logo.jsx';
import SearchPill from './SearchPill.jsx';
import UserMenu from './UserMenu.jsx';


const LINKS = [
  { to: '/recipes', label: 'Explore Recipes' },
  // Community gallery and stories will be re-enabled when those features launch.
  // { to: '/community', label: 'Community Gallery' },
  // { to: '/blogs', label: 'Stories' },
  { to: '/about', label: 'About' },
];

const linkClass = ({ isActive }) =>
  `rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-surface ${isActive ? 'text-ink' : 'text-ink-muted'}`;

export default function Navbar() {
  const { user, status } = useAuth();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const search = (q) => {
    setSearchOpen(false);
    setMenuOpen(false);
    navigate(q ? `/recipes?q=${encodeURIComponent(q)}` : '/recipes');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSearchOpen((o) => !o)} className="btn-ghost h-10 w-10 !p-0" aria-label="Search" aria-expanded={searchOpen}>
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>

          {status === 'ready' && !user && (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn-ghost">
                Log in
              </Link>
              <Link to="/register" className="btn-primary">
                Sign up
              </Link>
            </div>
          )}
          {status === 'ready' && user && <UserMenu />}

          <button type="button" onClick={() => setMenuOpen((o) => !o)} className="btn-ghost h-10 w-10 !p-0 lg:hidden" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen}>
            {menuOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="container-page pb-4">
          <SearchPill onSearch={search} autoFocus />
        </div>
      )}

      {menuOpen && (
        <nav className="container-page border-t border-line py-3 lg:hidden" aria-label="Mobile">
          <ul className="flex flex-col">
            {LINKS.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} onClick={() => setMenuOpen(false)} className="block rounded-xl px-3 py-3 text-base font-medium hover:bg-surface">
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          {status === 'ready' && !user && (
            <div className="mt-3 flex gap-2 sm:hidden">
              <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-secondary flex-1">
                Log in
              </Link>
              <Link to="/register" onClick={() => setMenuOpen(false)} className="btn-primary flex-1">
                Sign up
              </Link>
            </div>
          )}
        </nav>
      )}
    </header>
  );
}
