import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="bg-white border-b border-green-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-2xl">💸</span>
          <span className="text-xl font-bold text-green-700">SplitKaro</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className={`p-2 rounded-lg transition-colors ${
              location.pathname === '/'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-500 hover:text-green-700 hover:bg-green-50'
            }`}
          >
            <Home size={20} />
          </Link>
          <Link
            to="/groups/new"
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            New Group
          </Link>
        </div>
      </div>
    </nav>
  );
};
