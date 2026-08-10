import { useState } from 'react';
import { MdMenu, MdOutlineDarkMode, MdOutlineLightMode, MdLogout } from 'react-icons/md';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick, dark, onToggleDark }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/40 bg-white/70 px-4 py-3 backdrop-blur-xs dark:border-white/5 dark:bg-ink-900/70 sm:px-6">
      <button onClick={onMenuClick} className="rounded-lg p-2 hover:bg-brand-50 dark:hover:bg-white/5 lg:hidden">
        <MdMenu className="text-xl" />
      </button>
      <div className="hidden font-display text-base font-medium text-ink-900 dark:text-white lg:block">
        Welcome back{user ? `, ${user.full_name?.split(' ')[0]}` : ''}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onToggleDark}
          className="rounded-full p-2 text-ink-800 hover:bg-brand-50 dark:text-ink-50 dark:hover:bg-white/5"
          aria-label="Toggle dark mode"
        >
          {dark ? <MdOutlineLightMode className="text-lg" /> : <MdOutlineDarkMode className="text-lg" />}
        </button>

        <div className="relative">
          <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-full pl-1 pr-3 py-1 hover:bg-brand-50 dark:hover:bg-white/5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 text-sm font-semibold text-white">
              {user?.full_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <span className="hidden text-sm font-medium sm:block">{user?.full_name}</span>
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-44 rounded-xl border border-white/40 bg-white p-1 shadow-glass dark:border-white/5 dark:bg-ink-800">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
              >
                <MdLogout /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
