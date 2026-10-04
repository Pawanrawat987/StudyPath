import { Link } from 'react-router-dom';

const variants = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-white text-indigo-600 border border-indigo-600 hover:bg-indigo-50',
};

export default function Button({ to, variant = 'primary', children }) {
  return (
    <Link
      to={to}
      className={`inline-block rounded-lg px-6 py-3 font-semibold transition-colors ${variants[variant]}`}
    >
      {children}
    </Link>
  );
}
