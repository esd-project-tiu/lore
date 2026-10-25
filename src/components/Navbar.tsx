import React from 'react';
import { useAuth } from '../context/AuthContext';
import { CartographicCompass } from './CartographicCompass';
import { LogOut, PlusCircle, Compass, Library } from 'lucide-react';

interface NavbarProps {
  currentView: 'landing' | 'dashboard' | 'add';
  onNavigate: (view: 'landing' | 'dashboard' | 'add') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, loading, signInWithGoogle, signOut, error, clearError } = useAuth();

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[#ead9b8]/95 border-b border-[#d4c29d] transition-all shadow-[0_2px_10px_rgba(43,33,24,0.06)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <button
          onClick={() => onNavigate(user ? 'dashboard' : 'landing')}
          className="flex items-center gap-3 group text-left cursor-pointer focus:outline-none shrink-0"
        >
          <CartographicCompass
            size={34}
            className="group-hover:rotate-45 transition-transform duration-500 text-[#5a4632]"
          />
          <div>
            <span className="font-heading text-2xl sm:text-3xl font-semibold tracking-wider text-[#2b2118] block leading-none">
              L O R E
            </span>
            <span className="text-[10px] sm:text-[11px] font-sc text-[#5a4632] tracking-widest uppercase block mt-1">
              Explorer's Atlas
            </span>
          </div>
        </button>

        {/* Zone 2: Clean Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNavigate('landing')}
            className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              currentView === 'landing'
                ? 'text-[#a2562b] font-semibold underline underline-offset-4 decoration-[#a2562b]'
                : 'text-[#5a4632] hover:text-[#2b2118]'
            }`}
          >
            <Compass size={15} />
            <span>Atlas Overview</span>
          </button>

          {user && (
            <>
              <button
                onClick={() => onNavigate('dashboard')}
                className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  currentView === 'dashboard'
                    ? 'text-[#a2562b] font-semibold underline underline-offset-4 decoration-[#a2562b]'
                    : 'text-[#5a4632] hover:text-[#2b2118]'
                }`}
              >
                <Library size={15} />
                <span>My Folio</span>
              </button>

              <button
                onClick={() => onNavigate('add')}
                className={`text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                  currentView === 'add'
                    ? 'text-[#a2562b] font-semibold underline underline-offset-4 decoration-[#a2562b]'
                    : 'text-[#5a4632] hover:text-[#2b2118]'
                }`}
              >
                <PlusCircle size={15} />
                <span>Chart Realm</span>
              </button>
            </>
          )}
        </nav>

        {/* Zone 3: Primary Action / User Auth */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-medium text-[#2b2118] max-w-[140px] truncate">
                  {user.displayName || 'Cartographer'}
                </span>
                <span className="text-[10px] text-[#78634d] max-w-[140px] truncate font-notes">
                  {user.email}
                </span>
              </div>

              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border-2 border-[#826a4c] object-cover shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#fbf4e4] border-2 border-[#826a4c] flex items-center justify-center text-xs font-heading font-bold text-[#2b2118] shadow-sm">
                  {(user.displayName || user.email || 'L')[0].toUpperCase()}
                </div>
              )}

              <button
                onClick={() => signOut()}
                title="Sign Out"
                className="p-2 rounded-lg text-[#5a4632] hover:text-[#2b2118] hover:bg-[#e4d3b1] border border-transparent hover:border-[#c5b28d] transition-all cursor-pointer"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              disabled={loading}
              className="btn-seal px-4 py-2 rounded-lg text-xs font-medium tracking-wide flex items-center gap-2 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.54 0 2.92.53 4.01 1.41l3-3C17.2 1.74 14.77 1 12 1 7.48 1 3.65 3.56 1.77 7.28l3.66 2.84C6.31 7.22 8.91 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.72-4.93 3.72-8.69z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.43 14.88c-.24-.72-.38-1.49-.38-2.38s.14-1.66.38-2.38L1.77 7.28C.64 9.53 0 12.02 0 14.88s.64 5.35 1.77 7.6l3.66-2.84c-.24-.76-.38-1.53-.38-2.38z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.72-2.45 1.16-4.23 1.16-3.09 0-5.69-2.22-6.57-5.12L1.77 16c1.88 3.72 5.71 6.28 10.23 6.28z"
                />
              </svg>
              <span>Sign in with Google</span>
            </button>
          )}
        </div>
      </div>

      {/* Global auth error banner */}
      {error && (
        <div className="bg-[#fcedeb] border-t border-b border-[#d98b8b] text-[#852525] text-xs px-4 py-2 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-[#852525] hover:text-[#521313] font-bold ml-4 cursor-pointer"
          >
            ×
          </button>
        </div>
      )}
    </header>
  );
};
