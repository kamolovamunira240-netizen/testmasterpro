import React from 'react';
import { Moon, Sun, LogOut, UserCircle2, GraduationCap, ShieldCheck } from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';
import type { User, UserRole } from '../types';

interface NavbarProps {
  currentUser: User | null;
  currentRole: UserRole | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenAuth: (role: 'student' | 'teacher') => void;
  onLogout: () => void;
  isDark: boolean;
  toggleDark: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRole,
  activeTab,
  setActiveTab,
  onOpenAuth,
  onLogout,
  isDark,
  toggleDark,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-sm shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <button
            onClick={() => setActiveTab(currentRole === 'teacher' ? 'dashboard' : 'tests')}
            className="text-left font-bold text-lg tracking-tight text-slate-900 dark:text-white hover:opacity-85 transition-opacity"
          >
            TestMaster<span className="text-blue-600">Pro</span>
          </button>
        </div>

        {/* Zone 2: Navigation Links (Clean text links with hover effect) */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
            {currentRole === 'student' ? (
              <>
                <button
                  onClick={() => setActiveTab('tests')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'tests' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Mening testlarim
                </button>
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'profile' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Natijalarim & Profil
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'dashboard' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Dashboard & Natijalar
                </button>
                <button
                  onClick={() => setActiveTab('unsubmitted')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'unsubmitted' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Topshirmaganlar
                </button>
                <button
                  onClick={() => setActiveTab('stats')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'stats' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Savol statistikasi
                </button>
                <button
                  onClick={() => setActiveTab('manage-tests')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'manage-tests' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Testlar
                </button>
                <button
                  onClick={() => setActiveTab('groups')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'groups' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Guruhlar
                </button>
                <button
                  onClick={() => setActiveTab('loadtest')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'loadtest' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Yuklama Sinovi
                </button>
                <button
                  onClick={() => setActiveTab('guide')}
                  className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors ${
                    activeTab === 'guide' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
                  }`}
                >
                  Qo‘llanma
                </button>
              </>
            )}
          </nav>
        )}

        {/* Zone 3: Actions (PWA install, Theme toggle, User badge / Login) */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton />

          {/* Theme switch */}
          <button
            onClick={toggleDark}
            aria-label="Rang rejimini almashtirish"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2 pl-1 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {currentUser.first_name} {currentUser.last_name}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  {currentRole === 'teacher' ? 'O‘qituvchi' : 'O‘quvchi'}
                </span>
              </div>
              <button
                onClick={onLogout}
                aria-label="Tizimdan chiqish"
                className="p-2 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                title="Chiqish"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('student')}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors whitespace-nowrap"
              >
                O‘quvchi kirish
              </button>
              <button
                onClick={() => onOpenAuth('teacher')}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                O‘qituvchi
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
