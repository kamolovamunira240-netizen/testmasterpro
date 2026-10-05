import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { OfflineBanner } from './components/OfflineBanner';
import { AuthModal } from './components/AuthModal';
import { StudentDashboard } from './components/StudentDashboard';
import { TestRunner } from './components/TestRunner';
import { TestResultView } from './components/TestResultView';
import { StudentProfile } from './components/StudentProfile';
import { TeacherDashboard } from './components/TeacherDashboard';
import type { User, UserRole, Test, Attempt, ClientQuestion, Group } from './types';

export default function App() {
  // Theme state
  const [isDark, setIsDark] = useState<boolean>(() => {
    return (
      localStorage.getItem('tm_theme') === 'dark' ||
      (!('tm_theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)
    );
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('tm_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('tm_theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark((prev) => !prev);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [defaultAuthRole, setDefaultAuthRole] = useState<'student' | 'teacher'>('student');

  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('tests');

  // Student Test Taking State
  const [activeTakingTest, setActiveTakingTest] = useState<{
    test: Test;
    attempt: Attempt;
    questions: ClientQuestion[];
    remainingSeconds: number;
    initialAnswers: { question_id: string; selected_answer_id?: string }[];
  } | null>(null);

  // Result Viewing State
  const [viewingResult, setViewingResult] = useState<{
    result: Attempt & {
      explanations?: Record<string, string>;
      correct_answers?: Record<string, string>;
    };
    test: Test;
    questions?: ClientQuestion[];
  } | null>(null);

  // Student Data State
  const [studentGroups, setStudentGroups] = useState<Group[]>([]);
  const [studentTests, setStudentTests] = useState<Test[]>([]);
  const [studentRecentAttempts, setStudentRecentAttempts] = useState<any[]>([]);
  const [studentProfileData, setStudentProfileData] = useState<any>(null);
  const [studentLoading, setStudentLoading] = useState(false);

  // Verify Session on initial load
  const verifySession = useCallback(async () => {
    const token = localStorage.getItem('tm_auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/auth/session', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.authenticated) {
        setCurrentUser(data.user);
        setCurrentRole(data.role);
        setActiveTab(data.role === 'teacher' ? 'dashboard' : 'tests');

        // Check for active unfinished test attempt (Resume Capability!)
        if (data.role === 'student') {
          checkActiveAttempt(token);
        }
      } else {
        localStorage.removeItem('tm_auth_token');
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const checkActiveAttempt = async (authToken?: string) => {
    const token = authToken || localStorage.getItem('tm_auth_token');
    if (!token) return;

    try {
      const res = await fetch('/api/student/active-attempt', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.hasActive) {
        setActiveTakingTest({
          test: data.test,
          attempt: data.attempt,
          questions: data.questions,
          remainingSeconds: data.remainingSeconds,
          initialAnswers: data.savedAnswers || [],
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudentDashboard = useCallback(async () => {
    const token = localStorage.getItem('tm_auth_token');
    if (!token || currentRole !== 'student') return;

    setStudentLoading(true);
    try {
      const res = await fetch('/api/student/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStudentGroups(data.groups || []);
        setStudentTests(data.tests || []);
        setStudentRecentAttempts(data.recentAttempts || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setStudentLoading(false);
    }
  }, [currentRole]);

  const fetchStudentProfile = useCallback(async () => {
    const token = localStorage.getItem('tm_auth_token');
    if (!token || currentRole !== 'student') return;

    try {
      const res = await fetch('/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setStudentProfileData(data);
      }
    } catch (e) {
      console.error(e);
    }
  }, [currentRole]);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  useEffect(() => {
    if (currentUser && currentRole === 'student') {
      fetchStudentDashboard();
      fetchStudentProfile();
    }
  }, [currentUser, currentRole, fetchStudentDashboard, fetchStudentProfile]);

  // Start Test Handler
  const handleStartTest = async (testId: string) => {
    const token = localStorage.getItem('tm_auth_token');
    if (!token) {
      setDefaultAuthRole('student');
      setAuthModalOpen(true);
      return;
    }

    try {
      const res = await fetch(`/api/student/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Testni boshlab bo‘lmadi');

      setActiveTakingTest({
        test: data.test,
        attempt: data.attempt,
        questions: data.questions,
        remainingSeconds: data.remainingSeconds,
        initialAnswers: data.savedAnswers || [],
      });
      setViewingResult(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xatolik');
    }
  };

  // Test Completed Callback
  const handleTestComplete = (resultPayload: any) => {
    if (!activeTakingTest) return;

    setViewingResult({
      result: resultPayload,
      test: activeTakingTest.test,
      questions: activeTakingTest.questions,
    });
    setActiveTakingTest(null);

    // Refresh student dashboard and profile
    fetchStudentDashboard();
    fetchStudentProfile();
  };

  const handleLogout = () => {
    localStorage.removeItem('tm_auth_token');
    setCurrentUser(null);
    setCurrentRole(null);
    setActiveTakingTest(null);
    setViewingResult(null);
    setActiveTab('tests');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <OfflineBanner />

      <Navbar
        currentUser={currentUser}
        currentRole={currentRole}
        activeTab={activeTab}
        setActiveTab={(t) => {
          setActiveTab(t);
          setViewingResult(null);
        }}
        onOpenAuth={(role) => {
          setDefaultAuthRole(role);
          setAuthModalOpen(true);
        }}
        onLogout={handleLogout}
        isDark={isDark}
        toggleDark={toggleDark}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Active Test Taking View */}
        {activeTakingTest ? (
          <TestRunner
            test={activeTakingTest.test}
            attempt={activeTakingTest.attempt}
            questions={activeTakingTest.questions}
            initialAnswers={activeTakingTest.initialAnswers}
            initialRemainingSeconds={activeTakingTest.remainingSeconds}
            onComplete={handleTestComplete}
            onExit={() => {
              if (window.confirm('Test sahifasidan chiqmoqchimisiz? Taymer to‘xtamaydi va test davom etadi.')) {
                setActiveTakingTest(null);
              }
            }}
          />
        ) : viewingResult ? (
          /* Test Result View */
          <TestResultView
            result={viewingResult.result}
            test={viewingResult.test}
            questions={viewingResult.questions}
            onBackToDashboard={() => {
              setViewingResult(null);
              setActiveTab('tests');
            }}
          />
        ) : currentRole === 'teacher' ? (
          /* Teacher / Admin Workspace */
          <TeacherDashboard
            activeSubTab={activeTab}
            setActiveSubTab={setActiveTab}
          />
        ) : currentUser ? (
          /* Student Views */
          activeTab === 'profile' && studentProfileData ? (
            <StudentProfile
              user={studentProfileData.user}
              groups={studentProfileData.groups}
              stats={studentProfileData.stats}
              history={studentProfileData.history}
              onViewResult={(attemptId) => {
                const item = studentProfileData.history.find((h: any) => h.attempt_id === attemptId);
                const testObj = studentTests.find((t) => t.id === item?.test_id);
                if (item && testObj) {
                  setViewingResult({
                    result: item,
                    test: testObj,
                  });
                }
              }}
            />
          ) : (
            <StudentDashboard
              groups={studentGroups}
              tests={studentTests}
              recentAttempts={studentRecentAttempts}
              onStartTest={handleStartTest}
              onViewResult={(attemptId) => {
                const item = studentRecentAttempts.find((r) => r.attempt_id === attemptId);
                const testObj = studentTests.find((t) => t.id === item?.test_id);
                if (item && testObj) {
                  setViewingResult({
                    result: item,
                    test: testObj,
                  });
                }
              }}
              onNavigateToProfile={() => setActiveTab('profile')}
              loading={studentLoading}
            />
          )
        ) : (
          /* Guest / Public Welcome Landing with Quick Access */
          <div className="max-w-3xl mx-auto py-12 text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
              500+ Bir vaqtda virtual foydalanuvchi quvvatiga ega
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
              Professional Onlayn Test va Nazorat Platformasi
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
              O‘quvchilar uchun Telegram orqali xavfsiz tasdiqlash, Word (.docx) formatidan savollarni avtomatik import qilish, oynadan chiqishlarni real-time nazorat qilish va Excel eksport imkoniyati.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={() => {
                  setDefaultAuthRole('student');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto py-3.5 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/25 hover:scale-[1.02] transition-all"
              >
                O‘quvchi sifatida kirish
              </button>

              <button
                onClick={() => {
                  setDefaultAuthRole('teacher');
                  setAuthModalOpen(true);
                }}
                className="w-full sm:w-auto py-3.5 px-6 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-sm transition-all"
              >
                O‘qituvchi / Admin kabineti
              </button>
            </div>

            {/* Feature highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-sm font-bold text-slate-900 dark:text-white block mb-1">
                  Telegram OTP
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  SMS xizmatlarisiz, Telegram bot orqali bir martalik 6 xonali xavfsiz kod va 30 kunlik sessiya.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-sm font-bold text-slate-900 dark:text-white block mb-1">
                  Word (.docx) Import
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Savollarni Word faylidan bir zumda yuklash, format xatolarini tekshirish va Preview oynasi.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
                <span className="text-sm font-bold text-slate-900 dark:text-white block mb-1">
                  Oflayn Chidamlilik
                </span>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Internet uzilsa ham test davom etadi, javoblar lokal saqlanib internet qaytganda avtomatik sinxronlanadi.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultRole={defaultAuthRole}
        onLoginSuccess={(user, role) => {
          setCurrentUser(user);
          setCurrentRole(role);
          setActiveTab(role === 'teacher' ? 'dashboard' : 'tests');
          if (role === 'student') {
            checkActiveAttempt();
          }
        }}
      />
    </div>
  );
}
