import React, { useEffect } from 'react';
import { Award, Clock, ShieldAlert, CheckCircle2, XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import type { Attempt, Test, ClientQuestion } from '../types';

interface TestResultViewProps {
  result: Attempt & {
    explanations?: Record<string, string>;
    correct_answers?: Record<string, string>;
  };
  test: Test;
  questions?: ClientQuestion[];
  onBackToDashboard: () => void;
}

export const TestResultView: React.FC<TestResultViewProps> = ({
  result,
  test,
  questions,
  onBackToDashboard,
}) => {
  useEffect(() => {
    if (result.passed) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [result.passed]);

  const mins = Math.floor(result.time_spent / 60);
  const secs = result.time_spent % 60;
  const timeFormatted = mins > 0 ? `${mins} daqiqa ${secs} soniya` : `${secs} soniya`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Result Hero Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md text-center space-y-5">
        <div className="inline-flex p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
          <Award className="w-10 h-10" />
        </div>

        <div>
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Sinov yakunlandi
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {test.title}
          </h1>
        </div>

        {/* Score & Passed Badge */}
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <div className="text-5xl sm:text-6xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
            {result.percentage}%
          </div>
          <span className="text-xs text-slate-500 font-mono">
            To‘plangan ball: <strong className="text-slate-900 dark:text-white font-bold">{result.score}</strong> / {result.max_score}
          </span>

          <div className="mt-3">
            {result.passed ? (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4" /> TESTDAN O‘TDI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold text-sm">
                <XCircle className="w-4 h-4" /> TESTDAN O‘TMADI
              </span>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 text-left">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[11px] text-slate-500 block">Sarflangan vaqt:</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              {timeFormatted}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
            <span className="text-[11px] text-slate-500 block">O‘tish foizi:</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 block font-mono">
              {test.passing_percentage}%
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 col-span-2 sm:col-span-1">
            <span className="text-[11px] text-slate-500 block">Oynadan chiqishlar:</span>
            <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
              {result.tab_switch_count} marta
            </span>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={onBackToDashboard}
            className="w-full sm:w-auto py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md transition-all inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Bosh sahifaga qaytish
          </button>
        </div>
      </div>

      {/* Explanations & Review if allowed */}
      {result.explanations && questions && questions.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Savollar tahlili va to‘g‘ri javoblar
          </h2>

          <div className="space-y-3">
            {questions.map((q, idx) => {
              const explanation = result.explanations?.[q.id];
              const correctAnsId = result.correct_answers?.[q.id];

              return (
                <div
                  key={q.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {idx + 1}. {q.question_text}
                    </span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                      {q.points} ball
                    </span>
                  </div>

                  <div className="space-y-2 pt-1">
                    {q.answers.map((ans, optIdx) => {
                      const letter = String.fromCharCode(65 + optIdx);
                      const isCorrect = correctAnsId === ans.id;

                      return (
                        <div
                          key={ans.id}
                          className={`p-2.5 rounded-xl border text-xs sm:text-sm font-medium flex items-center justify-between gap-2 ${
                            isCorrect
                              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                              {letter}
                            </span>
                            <span>{ans.answer_text}</span>
                          </div>
                          {isCorrect && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                              To‘g‘ri javob ✓
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {explanation && (
                    <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-300">
                      <strong>Izoh:</strong> {explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
