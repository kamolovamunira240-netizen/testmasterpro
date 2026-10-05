import React, { useState } from 'react';
import { X, Send, Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import type { User, UserRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole: 'student' | 'teacher';
  onLoginSuccess: (user: User, role: UserRole, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole,
  onLoginSuccess,
}) => {
  const [role, setRole] = useState<'student' | 'teacher'>(defaultRole);

  // Student Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+998');
  const [otpStep, setOtpStep] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [copied, setCopied] = useState(false);

  // Teacher Form State
  const [password, setPassword] = useState('');

  // UI status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Phone input formatter (+998 XX XXX XX XX)
  const handlePhoneChange = (val: string) => {
    let clean = val.replace(/[^\d+]/g, '');
    if (!clean.startsWith('+998')) {
      clean = '+998' + clean.replace('+998', '').replace('+', '');
    }
    if (clean.length > 13) clean = clean.slice(0, 13);
    setPhone(clean);
  };

  // Step 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError('Ism va familiyangizni to‘liq kiriting.');
      return;
    }

    if (phone.length < 13) {
      setError('Telefon raqamingizni to‘liq formatda kiriting: +998XXXXXXXXX');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, firstName, lastName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Kod yuborilmadi');

      setDeepLink(data.deepLink);
      setDebugOtp(data.debugCode || '');
      setOtpStep(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!otpCode || otpCode.length !== 6) {
      setError('6 xonali tasdiqlash kodini to‘liq kiriting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          code: otpCode,
          firstName,
          lastName,
          telegramId: `tg_${phone.replace('+', '')}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Tasdiqlash kodi xato');

      localStorage.setItem('tm_auth_token', data.token);
      onLoginSuccess(data.user, 'student', data.token);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  // Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Parolni kiriting.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/teacher-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Parol noto‘g‘ri');

      localStorage.setItem('tm_auth_token', data.token);
      onLoginSuccess(data.user, 'teacher', data.token);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (!debugOtp) return;
    navigator.clipboard.writeText(debugOtp);
    setOtpCode(debugOtp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 my-8 transition-colors">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Role Segmented Switch */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setRole('student');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              role === 'student'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            O‘quvchi kirish
          </button>
          <button
            type="button"
            onClick={() => {
              setRole('teacher');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors ${
              role === 'teacher'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            O‘qituvchi / Admin
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {role === 'student' ? (
          <div>
            {!otpStep ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">O‘quvchi kabineti</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    SMS ishlatilmaydi. Tasdiqlash bir martalik Telegram bot orqali xavfsiz amalga oshiriladi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Ism
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Sardor"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Familiya
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Rahimov"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Telefon raqam
                  </label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Format: +998901234567
                  </span>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Yuborilmoqda...' : 'Telegram orqali kod olish'}
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">Kodni tasdiqlash</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <strong className="text-slate-900 dark:text-white">{phone}</strong> raqamiga Telegram bot orqali kod tayyorlandi.
                  </p>
                </div>

                {/* Telegram Bot Direct Link */}
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-blue-900 dark:text-blue-300">Telegram Bot:</span>
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 underline flex items-center gap-1"
                    >
                      Botni ochish <ArrowRight className="w-3 h-3" />
                    </a>
                  </div>
                  {debugOtp && (
                    <div className="flex items-center justify-between pt-1 border-t border-blue-200 dark:border-blue-900/50">
                      <span className="text-[11px] text-blue-700 dark:text-blue-400 font-medium">
                        Sinov kodi (Tezkor kiritish):
                      </span>
                      <button
                        type="button"
                        onClick={copyCode}
                        className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200 flex items-center gap-1 hover:bg-blue-300 transition-colors"
                      >
                        {debugOtp}
                        {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    6 xonali tasdiqlash kodi
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="123456"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full text-center tracking-widest text-2xl font-mono py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                    Kod bir martalik va 5 daqiqa davomida amal qiladi.
                  </span>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? 'Tekshirilmoqda...' : 'Kirishni tasdiqlash'}
                    <ShieldCheck className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep(false);
                      setOtpCode('');
                    }}
                    className="w-full py-2 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                  >
                    Raqamni o‘zgartirish
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">O‘qituvchi / Admin</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Guruhlar, testlar, Word import va statistikani boshqarish uchun maxsus parol bilan kiring.
              </p>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Admin paroli
              </label>
              <input
                type="password"
                required
                placeholder="Parolingizni kiriting"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                Standart parol: <code className="text-blue-600 dark:text-blue-400">admin_testmaster_2026</code>
              </span>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? 'Kirilmoqda...' : 'Admin paneliga kirish'}
                <Lock className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            30 kunlik xavfsiz sessiya kafolatlanadi
          </span>
        </div>
      </div>
    </div>
  );
};
