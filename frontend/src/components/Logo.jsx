import { Link } from 'react-router-dom';
import logo from '../public/logo.jpeg';

export default function Logo({ className = '' }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`} aria-label="Adi Food home">
      {/* <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-bold text-white" aria-hidden="true">
        A
      </span> */}
      <img className='h-10 w-12 rounded-2xl bg-neutral-800 '  src={logo} alt="" />
      <span className="text-lg font-bold tracking-tight text-brand">Adi Tribe Food </span>
    </Link>
  );
}
