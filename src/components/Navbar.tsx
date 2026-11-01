import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Plus } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <nav className="bg-white/90 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50"
         style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.06)' }}>
      <div className="max-w-4xl mx-auto px-4 h-15 flex items-center justify-between" style={{ height: 60 }}>
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <span className="text-lg">💸</span>
          </div>
          <span className="text-lg font-bold text-gray-900 tracking-tight">SplitKaro</span>
        </Link>

        <div className="flex items-center gap-2">
          {!isHome && (
            <Link
              to="/"
              className="p-2 rounded-xl text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors"
            >
              <Home size={20} />
            </Link>
          )}
          <Link
            to="/groups/new"
            className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl transition-all"
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              color: 'white',
              boxShadow: '0 2px 8px rgba(22,163,74,0.35)',
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Group
          </Link>
        </div>
      </div>
    </nav>
  );
};
