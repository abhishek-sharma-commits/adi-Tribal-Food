import { Link } from 'react-router-dom';
import Logo from './Logo.jsx';

const LINKS = [
  { to: '/about', label: 'About' },
  { to: '/community-guidelines', label: 'Community Guidelines' },
  { to: '/contact', label: 'Contact' },
  { to: '/privacy', label: 'Privacy Policy' },
  { to: '/terms', label: 'Terms of Use' },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-line bg-surface">
      <div className="container-page flex flex-col gap-6 py-10 md:flex-row md:items-start md:justify-between">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-3 text-sm text-ink-muted">Preserving and sharing the traditional food culture of the Adi tribe of Arunachal Pradesh.</p>
        </div>
        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {LINKS.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="text-ink-muted underline-offset-4 hover:text-ink hover:underline">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-muted">© {new Date().getFullYear()} Adi Food</div>
    </footer>
  );
}
