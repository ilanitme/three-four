import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  RotateCcw,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  HelpCircle
} from 'lucide-react';
import { 
  registerUser, 
  loginUser, 
  resetUserPassword, 
  loginUserWithOtp, 
  checkIfUserExists, 
  formatPhoneNumber 
} from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userProfile: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'register',
}) => {
  // Modes: 'login' | 'register' | 'forgot' | 'otp_login'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot' | 'otp_login'>(initialMode);
  // Steps: 'form' | 'otp' | 'new_password'
  const [step, setStep] = useState<'form' | 'otp' | 'new_password'>('form');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLookingForJob, setIsLookingForJob] = useState(false);
  const [youthGroup, setYouthGroup] = useState<string>('שכבת י (כרם)');
  
  // OTP state
  const [generatedOtp, setGeneratedOtp] = useState<string>('');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timerSeconds, setTimerSeconds] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setStep('form');
    setError(null);
    setSuccessMessage(null);
    setShowPassword(false);
    if (initialMode === 'register') {
      setIsLookingForJob(false);
      setYouthGroup('שכבת י (כרם)');
    }
  }, [initialMode, isOpen]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let interval: any = null;
    if (step === 'otp' && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timerSeconds]);

  if (!isOpen) return null;

  // Generate 6 digit OTP
  const generateNewOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setOtpDigits(['', '', '', '', '', '']);
    setTimerSeconds(60);
    setCanResend(false);
    return code;
  };

  const startOtpFlow = (targetMode: 'forgot' | 'otp_login') => {
    setError(null);
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('אנא הזן מספר טלפון ישראלי תקין');
      return;
    }
    setMode(targetMode);
    generateNewOtp();
    setStep('otp');
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('אנא הזן מספר טלפון ישראלי תקין (לדוגמה: 0501234567)');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('אנא הזן שם מלא');
        return;
      }
      if (password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים');
        return;
      }
      setLoading(true);
      try {
        const profile = await registerUser(
          fullName.trim(), 
          cleanPhone, 
          password.trim(),
          {
            isLookingForJob,
            youthGroup: isLookingForJob ? youthGroup : undefined
          }
        );
        onSuccess(profile);
        onClose();
      } catch (err: any) {
        console.error('Registration error:', err);
        setError(err.message || 'אירעה שגיאה ברישום המשתמש');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'login') {
      if (!password) {
        setError('אנא הזן את סיסמתך');
        return;
      }
      setLoading(true);
      try {
        const profile = await loginUser(cleanPhone, password.trim());
        onSuccess(profile);
        onClose();
      } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'מספר הטלפון או הסיסמה שגויים');
      } finally {
        setLoading(false);
      }
    } else if (mode === 'forgot' || mode === 'otp_login') {
      startOtpFlow(mode);
    }
  };

  // Handle OTP digit input
  const handleOtpChange = (index: number, value: string) => {
    const char = value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = char;
    setOtpDigits(newDigits);

    // Auto move focus to next input
    if (char && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handlePasteOtp = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pastedData[i] || '';
      }
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
    }
  };

  const handleQuickFillOtp = () => {
    if (generatedOtp) {
      setOtpDigits(generatedOtp.split(''));
    }
  };

  // Verify OTP handler
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length !== 6) {
      setError('אנא הזן קוד אימות מלא בן 6 ספרות');
      return;
    }

    if (enteredOtp !== generatedOtp) {
      setError('קוד האימות שגוי. אנא נסה שוב או בקש קוד חדש');
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '');

    // If in forgot mode, go to step new_password
    if (mode === 'forgot') {
      setStep('new_password');
      return;
    }

    // If in otp_login mode, log in immediately!
    setLoading(true);
    try {
      const profile = await loginUserWithOtp(cleanPhone);
      onSuccess(profile);
      onClose();
    } catch (err: any) {
      console.error('OTP login error:', err);
      setError(err.message || 'אירעה שגיאה בכניסה עם קוד SMS');
    } finally {
      setLoading(false);
    }
  };

  // Handle password reset submission
  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.trim().length < 6) {
      setError('הסיסמה החדשה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const profile = await resetUserPassword(cleanPhone, newPassword.trim());
      setSuccessMessage('הסיסמה אופסה בהצלחה! מתחבר...');
      setTimeout(() => {
        onSuccess(profile);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Reset password error:', err);
      setError(err.message || 'אירעה שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          id="btn-close-auth-modal"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
          aria-label="סגור חלון"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-emerald-700 p-6 sm:p-7 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
            {step === 'otp' ? <ShieldCheck className="w-7 h-7" /> : step === 'new_password' ? <KeyRound className="w-7 h-7" /> : '🌾'}
          </div>
          <h2 className="text-2xl font-black heading-font">
            {step === 'otp'
              ? 'אימות ב-SMS'
              : step === 'new_password'
              ? 'קביעת סיסמה חדשה'
              : mode === 'register'
              ? 'הרשמה מהירה לקהילה'
              : mode === 'forgot'
              ? 'איפוס סיסמה'
              : mode === 'otp_login'
              ? 'כניסה עם קוד SMS'
              : 'כניסה לחשבון'}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            {step === 'otp'
              ? `הזן את קוד האימות שנשלח ל-${formatPhoneNumber(phoneNumber)}`
              : step === 'new_password'
              ? 'הזן סיסמה חדשה בת 6 תווים לפחות'
              : mode === 'register'
              ? 'הצטרף כדי לפרסם ולקחת עבודות בקליק'
              : mode === 'forgot'
              ? 'נאמת את מספר הטלפון שלך באמצעות קוד SMS'
              : mode === 'otp_login'
              ? 'כניסה מאובטחת ומהירה ללא צורך בסיסמה'
              : 'הזן את הטלפון והסיסמה כדי להמשיך'}
          </p>
        </div>

        {/* Tab switcher (only in form step) */}
        {step === 'form' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold">
            <button
              id="tab-switch-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 transition-colors ${
                mode === 'login' || mode === 'otp_login' || mode === 'forgot'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              כניסה לחשבון
            </button>
            <button
              id="tab-switch-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-3 transition-colors ${
                mode === 'register'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              הרשמה חדשה
            </button>
          </div>
        )}

        {/* STEP 1: Main Credentials Form */}
        {step === 'form' && (
          <form onSubmit={handleInitialSubmit} className="p-6 space-y-4">
            {error && (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                  <span className="leading-snug">{error}</span>
                </div>

                {/* Helpful quick actions if password error occurred */}
                {(error.includes('סיסמה') || mode === 'login') && (
                  <div className="pt-2 border-t border-amber-200/70 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => startOtpFlow('forgot')}
                      className="px-3 py-1.5 bg-white hover:bg-amber-100 text-emerald-800 border border-emerald-600/40 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                      <span>אפס סיסמה ב-SMS</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => startOtpFlow('otp_login')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>התחבר בקוד SMS מיידי</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  שם מלא
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-fullname"
                    type="text"
                    required
                    placeholder="לדוגמה: ישראל ישראלי"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                מספר טלפון נייד
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="input-auth-phone"
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="050-1234567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {mode === 'register' ? 'המספר ישמש לזיהוי וקבלת פניות' : 'הזן את מספר הטלפון שאיתו נרשמת'}
              </p>
            </div>

            {mode !== 'otp_login' && mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700">
                    סיסמה
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => startOtpFlow('forgot')}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold hover:underline"
                    >
                      שכחת סיסמה?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="לפחות 6 תווים"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                    aria-label={showPassword ? 'הסתר סיסמה' : 'הצג סיסמה'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Looking for Job & Youth Group Selection (Registration Only) */}
            {mode === 'register' && (
              <div className="pt-1 pb-1 space-y-3">
                <label className="flex items-center gap-3 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl cursor-pointer hover:bg-emerald-50 transition-colors">
                  <input
                    id="checkbox-looking-for-job"
                    type="checkbox"
                    checked={isLookingForJob}
                    onChange={(e) => setIsLookingForJob(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                  />
                  <div className="flex-1 text-right">
                    <span className="text-xs font-bold text-emerald-950 block">
                      🙋‍♂️ אני מחפש/ת עבודה (נוער הקיבוץ)
                    </span>
                    <span className="text-[11px] text-emerald-700 block">
                      סמן אם ברצונך לקחת עבודות ולקבל התראות
                    </span>
                  </div>
                </label>

                {/* Sub-selector for Youth Group if checked */}
                {isLookingForJob && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-right animate-in fade-in slide-in-from-top-1 duration-200">
                    <label className="block text-xs font-bold text-slate-800">
                      בחר שכבה / קבוצה בקיבוץ:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'group-y', label: 'שכבת י\' (כרם)', value: 'שכבת י (כרם)' },
                        { id: 'group-ya', label: 'שכבת י"א (לוטם)', value: 'שכבת יא (לוטם)' },
                        { id: 'group-yb', label: 'שכבת י"ב (יער)', value: 'שכבת יב (יער)' },
                      ].map((item) => (
                        <button
                          key={item.value}
                          id={item.id}
                          type="button"
                          onClick={() => setYouthGroup(item.value)}
                          className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center ${
                            youthGroup === item.value
                              ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>
                    {mode === 'register' 
                      ? 'הרשמה מהירה לחשבון' 
                      : mode === 'forgot'
                      ? 'שלח קוד לאיפוס סיסמה'
                      : mode === 'otp_login'
                      ? 'שלח קוד SMS לכניסה'
                      : 'התחבר עכשיו'}
                  </span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>

            {/* Alternative passwordless / SMS login helper in Login mode */}
            {mode === 'login' && (
              <div className="pt-2 text-center border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => startOtpFlow('otp_login')}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline inline-flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>מעדיף להתחבר בקוד SMS ללא סיסמה? לחץ כאן</span>
                </button>
              </div>
            )}
          </form>
        )}

        {/* STEP 2: SMS OTP Verification */}
        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="p-6 space-y-5">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Simulated SMS Notification Banner */}
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <span>📱 הודעת SMS מ-QuickJobs 3/4</span>
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  הודעה נשלחה
                </span>
              </div>
              <p className="text-xs text-emerald-900 leading-relaxed">
                קוד האימות שלך הוא: <strong className="font-mono text-base text-emerald-950 font-black">{generatedOtp}</strong>
              </p>
              <button
                type="button"
                onClick={handleQuickFillOtp}
                className="mt-2 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
              >
                <span>לחץ למילוי אוטומטי מהיר של הקוד</span>
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 6 Digit Input Boxes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                הזן את 6 ספרות הקוד:
              </label>
              <div className="flex items-center justify-center gap-2" dir="ltr">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputRefs.current[idx] = el)}
                    id={`input-otp-digit-${idx}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={idx === 0 ? handlePasteOtp : undefined}
                    className="w-11 h-13 text-center text-xl font-mono font-black bg-slate-50 border-2 border-slate-200 focus:border-emerald-600 focus:bg-white rounded-xl focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>
            </div>

            {/* Resend Timer & Actions */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setMode('login');
                }}
                className="hover:text-emerald-700 font-semibold"
              >
                ← חזרה למסך כניסה
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={generateNewOtp}
                  className="text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>שלח קוד חדש</span>
                </button>
              ) : (
                <span className="font-mono text-slate-400">
                  שליחה חוזרת בעוד {timerSeconds} שניות
                </span>
              )}
            </div>

            {/* Verify Button */}
            <button
              id="btn-verify-otp-submit"
              type="submit"
              disabled={loading || otpDigits.join('').length !== 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{mode === 'forgot' ? 'המשך לקביעת סיסמה חדשה' : 'אמת קוד והתחבר'}</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 3: Set New Password after OTP verification */}
        {step === 'new_password' && (
          <form onSubmit={handleResetPasswordSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMessage && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{successMessage}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                סיסמה חדשה
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="לפחות 6 תווים"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 hover:text-slate-700 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                הסיסמה תישמר בחשבונך ותשמש להתחברות עתידית
              </p>
            </div>

            <button
              id="btn-save-new-password"
              type="submit"
              disabled={loading || newPassword.trim().length < 6}
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>שמור סיסמה חדשה והתחבר</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
