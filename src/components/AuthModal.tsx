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
  KeyRound
} from 'lucide-react';
import { registerUser, loginUser, formatPhoneNumber } from '../lib/firebase';
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
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
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

  useEffect(() => {
    setMode(initialMode);
    setStep('form');
    setError(null);
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

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('אנא הזן מספר טלפון ישראלי תקין (לדוגמה: 0501234567)');
      return;
    }

    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    if (mode === 'register') {
      if (!fullName.trim()) {
        setError('אנא הזן שם מלא');
        return;
      }
      setLoading(true);
      try {
        const profile = await registerUser(
          fullName.trim(), 
          cleanPhone, 
          password,
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
    } else {
      // Login flow
      setLoading(true);
      try {
        const profile = await loginUser(cleanPhone, password);
        onSuccess(profile);
        onClose();
      } catch (err: any) {
        console.error('Login error:', err);
        setError(err.message || 'מספר הטלפון או הסיסמה שגויים');
      } finally {
        setLoading(false);
      }
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

  // Verify OTP and complete registration
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

    setLoading(true);
    try {
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      const profile = await registerUser(
        fullName.trim(), 
        cleanPhone, 
        password,
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
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-blue-600 p-6 sm:p-7 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
            {step === 'otp' ? <ShieldCheck className="w-7 h-7" /> : '⚡'}
          </div>
          <h2 className="text-2xl font-black heading-font">
            {step === 'otp'
              ? 'אימות מספר טלפון ב-SMS'
              : mode === 'register'
              ? 'הרשמה מהירה'
              : 'התחברות לחשבון'}
          </h2>
          <p className="text-blue-100 text-xs sm:text-sm mt-1">
            {step === 'otp'
              ? `הזן את קוד האימות שנשלח ל-${formatPhoneNumber(phoneNumber)}`
              : mode === 'register'
              ? 'הצטרף כדי לפרסם ולקחת עבודות בקליק'
              : 'הזן את הטלפון והסיסמה כדי להמשיך'}
          </p>
        </div>

        {/* Tab switcher (only in form step) */}
        {step === 'form' && (
          <div className="flex border-b border-slate-200 bg-slate-50">
            <button
              id="tab-switch-register"
              type="button"
              onClick={() => {
                setMode('register');
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === 'register'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              הרשמה חדשה + אימות
            </button>
            <button
              id="tab-switch-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
              }}
              className={`flex-1 py-3 text-sm font-bold transition-colors ${
                mode === 'login'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              כניסה לחשבון
            </button>
          </div>
        )}

        {/* STEP 1: Main Credentials Form */}
        {step === 'form' && (
          <form onSubmit={handleInitialSubmit} className="p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
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
                    className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                מספר טלפון
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
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono font-medium"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {mode === 'register' ? 'נשלח קוד אימות חד-פעמי (OTP) במסרון SMS' : 'הזן את המספר שאיתו נרשמת'}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                סיסמה
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-auth-password"
                  type="password"
                  required
                  placeholder="לפחות 6 תווים"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>

            {/* Looking for Job & Youth Group Selection (Registration Only) */}
            {mode === 'register' && (
              <div className="pt-1 pb-1 space-y-3">
                <label className="flex items-center gap-3 p-3 bg-teal-50/60 border border-teal-200/80 rounded-2xl cursor-pointer hover:bg-teal-50 transition-colors">
                  <input
                    id="checkbox-looking-for-job"
                    type="checkbox"
                    checked={isLookingForJob}
                    onChange={(e) => setIsLookingForJob(e.target.checked)}
                    className="w-4 h-4 text-teal-600 rounded-md border-slate-300 focus:ring-teal-500"
                  />
                  <div className="flex-1 text-right">
                    <span className="text-xs font-bold text-teal-950 block">
                      🙋‍♂️ אני מחפש/ת עבודה (נוער הקיבוץ)
                    </span>
                    <span className="text-[11px] text-teal-700 block">
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
                              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                              : 'bg-white text-slate-700 border-slate-200 hover:border-teal-300'
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
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm sm:text-base shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <span>{mode === 'register' ? 'הרשמה מהירה לחשבון' : 'התחבר עכשיו'}</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </>
              )}
            </button>
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
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                  <span>📱 הודעת SMS מ-QuickJobs</span>
                </span>
                <span className="text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full font-bold">
                  הודעה נשלחה
                </span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">
                קוד האימות שלך הוא: <strong className="font-mono text-base text-blue-950 font-black">{generatedOtp}</strong>
              </p>
              <button
                type="button"
                onClick={handleQuickFillOtp}
                className="mt-2 text-xs font-bold text-blue-700 hover:text-blue-900 underline flex items-center gap-1"
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
                    className="w-11 h-13 text-center text-xl font-mono font-black bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white rounded-xl focus:outline-none transition-all shadow-xs"
                  />
                ))}
              </div>
            </div>

            {/* Resend Timer & Actions */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="hover:text-blue-600 font-semibold"
              >
                ← ערוך מספר טלפון
              </button>

              {canResend ? (
                <button
                  type="button"
                  onClick={generateNewOtp}
                  className="text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
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
              className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm sm:text-base shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>אמת מספר והשלם הרשמה</span>
                </>
              )}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
