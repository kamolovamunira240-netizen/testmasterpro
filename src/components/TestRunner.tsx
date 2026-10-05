import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Clock, AlertTriangle, ChevronLeft, ChevronRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Test, Attempt, ClientQuestion } from '../types';

interface TestRunnerProps {
  test: Test;
  attempt: Attempt;
  questions: ClientQuestion[];
  initialAnswers: { question_id: string; selected_answer_id?: string }[];
  initialRemainingSeconds: number;
  onComplete: (result: Record<string, unknown>) => void;
  onExit: () => void;
}

export const TestRunner: React.FC<TestRunnerProps> = ({
  test,
  attempt,
  questions,
  initialAnswers,
  initialRemainingSeconds,
  onComplete,
  onExit,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    // Load from initial server answers
    initialAnswers.forEach((a) => {
      if (a.selected_answer_id) {
        map[a.question_id] = a.selected_answer_id;
      }
    });

    // Check localStorage backup
    try {
      const cached = localStorage.getItem(`tm_attempt_${attempt.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        Object.assign(map, parsed);
      }
    } catch (e) {
      // Ignore
    }

    return map;
  });

  const [remainingSeconds, setRemainingSeconds] = useState(initialRemainingSeconds);
  const [tabSwitchCount, setTabSwitchCount] = useState(attempt.tab_switch_count || 0);
  const [showCheatWarning, setShowCheatWarning] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sync to local device storage immediately
  const persistLocally = useCallback((newAnswers: Record<string, string>) => {
    try {
      localStorage.setItem(`tm_attempt_${attempt.id}`, JSON.stringify(newAnswers));
    } catch (e) {
      console.warn('LocalStorage error', e);
    }
  }, [attempt.id]);

  // Submit test to server
  const submitTest = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('tm_auth_token');
      const res = await fetch(`/api/student/attempts/${attempt.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Natijani hisoblab bo‘lmadi');

      // Clear local backup
      localStorage.removeItem(`tm_attempt_${attempt.id}`);
      onComplete(data.result);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Xatolik yuz berdi');
      setSubmitting(false);
    }
  }, [attempt.id, onComplete, submitting]);

  // Synchronized Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitTest]);

  // Anti-Cheat Tab Switch & Window Blur Detection
  useEffect(() => {
    let warningTimeout: NodeJS.Timeout;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Increment and report
        try {
          const token = localStorage.getItem('tm_auth_token');
          const res = await fetch(`/api/student/attempts/${attempt.id}/tab-event`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ eventType: 'tab_switch' }),
          });
          const data = await res.json();
          if (data.tab_switch_count !== undefined) {
            setTabSwitchCount(data.tab_switch_count);
          } else {
            setTabSwitchCount((c) => c + 1);
          }
        } catch (e) {
          setTabSwitchCount((c) => c + 1);
        }

        setShowCheatWarning(true);
        clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => setShowCheatWarning(false), 6000);
      }
    };

    const handleWindowBlur = async () => {
      try {
        const token = localStorage.getItem('tm_auth_token');
        await fetch(`/api/student/attempts/${attempt.id}/tab-event`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ eventType: 'window_blur' }),
        });
      } catch (e) {
        // Ignore
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      clearTimeout(warningTimeout);
    };
  }, [attempt.id]);

  // Handle Answer Selection
  const handleSelectAnswer = async (questionId: string, answerId: string) => {
    const updated = { ...answers, [questionId]: answerId };
    setAnswers(updated);
    persistLocally(updated);

    // Sync to server in background
    try {
      const token = localStorage.getItem('tm_auth_token');
      await fetch(`/api/student/attempts/${attempt.id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ questionId, selectedAnswerId: answerId }),
      });
    } catch (e) {
      console.warn('Network offline: answer saved locally, will sync when reconnected.');
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progressPercent = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
  const isUrgent = remainingSeconds <= 120; // less than 2 minutes

  if (!currentQ) {
    return (
      <div className="p-10 text-center">
        <p className="text-sm text-slate-500">Savollar topilmadi.</p>
        <button onClick={onExit} className="mt-4 px-4 py-2 text-xs font-semibold bg-slate-200 rounded-lg">
          Orqaga
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-20">
      {/* Sticky Mobile Header (Aggregated < 15% mobile viewport) */}
      <div className="sticky top-16 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
              {test.title}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              <span>Savol: <strong className="text-slate-900 dark:text-white font-mono">{currentIndex + 1}</strong> / {questions.length}</span>
              <span aria-hidden="true">·</span>
              <span>Javob berildi: <strong className="text-blue-600 font-mono">{answeredCount}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Timer Badge */}
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold transition-colors ${
                isUrgent
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition-all"
            >
              Yakunlash
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden mt-3">
          <div
            className="h-full bg-blue-600 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Anti-Cheat Toast Banner */}
      {showCheatWarning && (
        <div className="p-3 rounded-xl bg-amber-500 text-white flex items-center justify-between text-xs sm:text-sm font-semibold shadow-lg animate-bounce">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>
              DIQQAT! Boshqa oynaga yoki tabga o‘tish qayd etildi. Chiqishlar soni: <strong>{tabSwitchCount}</strong> ta.
            </span>
          </div>
          <button onClick={() => setShowCheatWarning(false)} className="text-white/80 hover:text-white text-xs font-bold underline ml-2">
            Yopish
          </button>
        </div>
      )}

      {/* Main Question Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {currentQ.type === 'true_false' ? 'To‘g‘ri / Noto‘g‘ri' : 'Bitta to‘g‘ri javob'}
          </span>
          <span className="text-xs font-semibold text-slate-500">
            Ball: <strong className="text-slate-900 dark:text-white font-mono">{currentQ.points}</strong>
          </span>
        </div>

        {/* Question Text */}
        <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed whitespace-pre-line">
          {currentIndex + 1}. {currentQ.question_text}
        </div>

        {/* Option Selection Hitboxes (≥ 48px) */}
        <div className="space-y-3 pt-2">
          {currentQ.answers.map((ans, optIdx) => {
            const letter = String.fromCharCode(65 + optIdx);
            const isSelected = answers[currentQ.id] === ans.id;

            return (
              <button
                key={ans.id}
                onClick={() => handleSelectAnswer(currentQ.id, ans.id)}
                className={`w-full text-left p-4 sm:p-4.5 rounded-xl border transition-all flex items-start gap-3.5 min-h-[52px] group ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 text-blue-950 dark:text-blue-200 shadow-xs ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-950'
                  }`}
                >
                  {letter}
                </span>
                <span className="text-sm sm:text-base font-medium pt-0.5 leading-snug flex-1">
                  {ans.answer_text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Prev / Next Navigation Buttons (Natural Thumb Reach) */}
      <div className="flex items-center justify-between gap-3 pt-2">
        <button
          onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
          className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-semibold text-xs sm:text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4" />
          Oldingi
        </button>

        {isLast ? (
          <button
            onClick={() => setShowSubmitConfirm(true)}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            Testni yakunlash
          </button>
        ) : (
          <button
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
            className="flex-1 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5"
          >
            Keyingi
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Mobile Question Grid Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-3">
          Savollar xaritasi:
        </span>
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
          {questions.map((q, idx) => {
            const isAnswered = !!answers[q.id];
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={`h-9 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center ${
                  isCurrent
                    ? 'ring-2 ring-blue-600 bg-blue-600 text-white shadow-xs'
                    : isAnswered
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>
      </div>

      {/* Finish Test Confirmation Modal */}
      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Testni yakunlaysizmi?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Jami <strong className="text-slate-900 dark:text-white font-mono">{questions.length}</strong> ta savoldan{' '}
              <strong className="text-blue-600 font-mono">{answeredCount}</strong> tasiga javob berildi.{' '}
              {answeredCount < questions.length && (
                <span className="text-red-600 font-semibold block mt-1">
                  Diqqat: {questions.length - answeredCount} ta savol javobsiz qolgan!
                </span>
              )}
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setShowSubmitConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Davom etish
              </button>
              <button
                onClick={submitTest}
                disabled={submitting}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-xs font-semibold text-white shadow-md disabled:opacity-50"
              >
                {submitting ? 'Hisoblanmoqda...' : 'Tasdiqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
