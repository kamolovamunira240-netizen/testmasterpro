import React from 'react';
import { Clock, Award, Users, Play, CheckCircle2, XCircle, AlertCircle, FileText, ArrowRight } from 'lucide-react';
import type { Group, Test, Attempt } from '../types';

interface StudentDashboardProps {
  groups: Group[];
  tests: Test[];
  recentAttempts: {
    attempt_id: string;
    test_id: string;
    test_title: string;
    score: number;
    max_score: number;
    percentage: number;
    passed: boolean;
    time_spent: number;
    tab_switch_count: number;
    submitted_at: string;
  }[];
  onStartTest: (testId: string) => void;
  onViewResult: (attemptId: string) => void;
  onNavigateToProfile: () => void;
  loading: boolean;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  groups,
  tests,
  recentAttempts,
  onStartTest,
  onViewResult,
  onNavigateToProfile,
  loading,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-slate-500 font-medium">Testlar yuklanmoqda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Groups summary */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-600" />
            Mening guruhlarim
          </h2>
          <span className="text-xs text-slate-500">{groups.length} ta guruh</span>
        </div>

        {groups.length === 0 ? (
          <div className="p-6 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">Siz hali birorta guruhga biriktirilmagansiz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((g) => (
              <div
                key={g.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">{g.name}</h3>
                  <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    Faol
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                  {g.description || 'Guruh tavsifi mavjud emas.'}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Available Tests */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Topshirish uchun ochiq testlar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Guruhlaringizga biriktirilgan va ayni paytda faol bo‘lgan sinovlar
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {tests.length} ta ochiq test
          </span>
        </div>

        {tests.length === 0 ? (
          <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-white dark:bg-slate-900">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Ayni paytda ochiq testlar mavjud emas
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              O‘qituvchi yangi testlarni guruhga ochganda, ular ushbu ro‘yxatda avtomatik ko‘rinadi.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tests.map((test) => {
              const attemptsUsed = test.attempts_count || 0;
              const hasAttemptsLeft = attemptsUsed < test.attempts_limit;

              return (
                <div
                  key={test.id}
                  className="flex flex-col justify-between p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {test.title}
                      </h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                        {test.question_count || 0} ta savol
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2">
                      {test.description || 'Tavsif kiritilmagan.'}
                    </p>

                    {/* Metadata with unboxed typographic dots */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {test.time_limit} daqiqa
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span className="flex items-center gap-1">
                        <Award className="w-3.5 h-3.5 text-amber-500" />
                        O‘tish: {test.passing_percentage}%
                      </span>
                      <span aria-hidden="true" className="text-slate-300">·</span>
                      <span>
                        Urinishlar: {attemptsUsed}/{test.attempts_limit}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 pt-3">
                    <button
                      onClick={() => onStartTest(test.id)}
                      disabled={!hasAttemptsLeft}
                      className={`w-full py-2.5 px-4 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
                        hasAttemptsLeft
                          ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:scale-[1.01]'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {hasAttemptsLeft ? 'Testni boshlash' : 'Urinishlar tugagan'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Recent Attempts History */}
      {recentAttempts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              So‘nggi topshirilgan natijalar
            </h2>
            <button
              onClick={onNavigateToProfile}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
            >
              Barcha natijalar <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Test</th>
                  <th className="py-3 px-4 font-semibold">Ball</th>
                  <th className="py-3 px-4 font-semibold">Foiz</th>
                  <th className="py-3 px-4 font-semibold">Holat</th>
                  <th className="py-3 px-4 font-semibold">Sarflangan vaqt</th>
                  <th className="py-3 px-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {recentAttempts.map((item) => (
                  <tr key={item.attempt_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                      {item.test_title}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {item.score} / {item.max_score}
                    </td>
                    <td className="py-3 px-4 font-bold font-mono">
                      {item.percentage}%
                    </td>
                    <td className="py-3 px-4">
                      {item.passed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> O‘TDI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-600 dark:text-red-400">
                          <XCircle className="w-3.5 h-3.5" /> O‘TMADI
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {Math.floor(item.time_spent / 60)} daq {item.time_spent % 60} son
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewResult(item.attempt_id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Ko‘rish
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};
