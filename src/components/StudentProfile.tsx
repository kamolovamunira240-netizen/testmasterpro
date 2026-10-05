import React from 'react';
import { User, Phone, Users, Award, TrendingUp, CheckCircle2, XCircle, Calendar, Clock } from 'lucide-react';
import type { User as UserType, Group } from '../types';

interface StudentProfileProps {
  user: UserType;
  groups: Group[];
  stats: {
    total_tests: number;
    passed_tests: number;
    failed_tests: number;
    avg_percentage: number;
  };
  history: {
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
  onViewResult: (attemptId: string) => void;
}

export const StudentProfile: React.FC<StudentProfileProps> = ({
  user,
  groups,
  stats,
  history,
  onViewResult,
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header Profile Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {user.first_name.charAt(0)}{user.last_name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
              {user.first_name} {user.last_name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1 font-mono">
                <Phone className="w-3.5 h-3.5 text-blue-600" />
                {user.phone}
              </span>
              <span aria-hidden="true">·</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {groups.map((g) => g.name).join(', ') || 'Guruhsiz'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick badge */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-bold text-xs">
            Telegram Tasdiqlangan ✓
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">Jami topshirilgan</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white font-mono mt-1 block">
            {stats.total_tests}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">Muvaffaqiyatli</span>
          <span className="text-2xl font-bold text-emerald-600 font-mono mt-1 block">
            {stats.passed_tests}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">O‘tolmagan</span>
          <span className="text-2xl font-bold text-red-500 font-mono mt-1 block">
            {stats.failed_tests}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs text-slate-500 block">O‘rtacha natija</span>
          <span className="text-2xl font-bold text-blue-600 font-mono mt-1 block">
            {stats.avg_percentage}%
          </span>
        </div>
      </div>

      {/* Performance Dynamic SVG Chart */}
      {history.length > 0 && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              Natijalar dinamikasi (Foiz o‘zgarishi)
            </h2>
            <span className="text-xs text-slate-500">So‘nggi testlar bo‘yicha</span>
          </div>

          <div className="h-44 w-full flex items-end gap-3 pt-6 px-2 border-b border-slate-100 dark:border-slate-800">
            {history.map((h, i) => {
              const heightPct = Math.max(10, h.percentage);
              return (
                <div key={h.attempt_id} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-1 rounded bg-slate-900 text-white text-[10px] font-mono whitespace-nowrap z-10 pointer-events-none">
                    {h.percentage}% ({h.score}/{h.max_score})
                  </div>

                  <div
                    className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                      h.passed ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-400 hover:bg-red-500'
                    }`}
                    style={{ height: `${heightPct}%` }}
                  />
                  <span className="text-[10px] font-mono text-slate-400 truncate max-w-[60px]">
                    T{i + 1}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Test Results History Table */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Barcha test natijalari
        </h2>

        {history.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500">Hali birorta test topshirilmagan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <tr>
                  <th className="py-3.5 px-4 font-semibold">Test nomi</th>
                  <th className="py-3.5 px-4 font-semibold">Sana</th>
                  <th className="py-3.5 px-4 font-semibold">Ball</th>
                  <th className="py-3.5 px-4 font-semibold">Foiz</th>
                  <th className="py-3.5 px-4 font-semibold">Holat</th>
                  <th className="py-3.5 px-4 font-semibold">Sarflangan vaqt</th>
                  <th className="py-3.5 px-4 font-semibold text-right">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {history.map((item) => (
                  <tr key={item.attempt_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-medium text-slate-900 dark:text-white max-w-xs truncate">
                      {item.test_title}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(item.submitted_at).toLocaleDateString('uz-UZ')}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium">
                      {item.score} / {item.max_score}
                    </td>
                    <td className="py-3.5 px-4 font-bold font-mono">
                      {item.percentage}%
                    </td>
                    <td className="py-3.5 px-4">
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
                    <td className="py-3.5 px-4 text-slate-500">
                      {Math.floor(item.time_spent / 60)} daq {item.time_spent % 60} son
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onViewResult(item.attempt_id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Natija
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
