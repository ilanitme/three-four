import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Lock, 
  AlertCircle, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  KeyRound, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import { 
  registerUser, 
  loginUser, 
  resetUserPassword, 
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
  // Modes: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(initialMode);
  
  // Form fields
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLookingForJob, setIsLookingForJob] = useState(false);
  const [youthGroup, setYouthGroup] = useState<string>('שכבת י (כרם)');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMessage(null);
    setShowPassword(false);
    if (initialMode === 'register') {
      setIsLookingForJob(false);
      setYouthGroup('שכבת י (כרם)');
    }
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanPhone = phoneNumber.replace(/\D/g, '');
    if (cleanPhone.length < 9 || cleanPhone.length > 11) {
      setError('אנא הזן מספר טלפון ישראלי תקין (לדוגמה: 050-1234567)');
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
    } else if (mode === 'forgot') {
      if (!newPassword || newPassword.trim().length < 6) {
        setError('אנא הזן סיסמה חדשה בת 6 תווים לפחות');
        return;
      }
      setLoading(true);
      try {
        const profile = await resetUserPassword(cleanPhone, newPassword.trim(), fullName.trim());
        setSuccessMessage('הסיסמה עודכנה בהצלחה! מתחבר...');
        setTimeout(() => {
          onSuccess(profile);
          onClose();
        }, 800);
      } catch (err: any) {
        console.error('Reset password error:', err);
        setError(err.message || 'אירעה שגיאה באיפוס הסיסמה');
      } finally {
        setLoading(false);
      }
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
          className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10 cursor-pointer"
          aria-label="סגור חלון"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-emerald-700 p-6 sm:p-7 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-3 text-white text-2xl font-bold">
            {mode === 'forgot' ? <KeyRound className="w-7 h-7" /> : <ShieldCheck className="w-7 h-7" />}
          </div>
          <h2 className="text-2xl font-black heading-font">
            {mode === 'register'
              ? 'הרשמה מהירה לקהילה'
              : mode === 'forgot'
              ? 'איפוס סיסמה'
              : 'כניסה לחשבון'}
          </h2>
          <p className="text-emerald-100 text-xs sm:text-sm mt-1">
            {mode === 'register'
              ? 'הצטרף כדי לפרסם ולקחת עבודות בקיבוץ'
              : mode === 'forgot'
              ? 'הזן את הטלפון והשם שאיתם נרשמת כדי לעדכן סיסמה'
              : 'הזן את הטלפון והסיסמה כדי להמשיך'}
          </p>
        </div>

        {/* Tab switcher (Login vs Register) */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs sm:text-sm font-bold">
            <button
              id="tab-switch-login"
              type="button"
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 transition-colors cursor-pointer ${
                mode === 'login'
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
                setSuccessMessage(null);
              }}
              className={`flex-1 py-3 transition-colors cursor-pointer ${
                mode === 'register'
                  ? 'text-emerald-700 border-b-2 border-emerald-600 bg-white'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              הרשמה חדשה
            </button>
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold space-y-2">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
                <span className="leading-snug">{error}</span>
              </div>

              {/* Helpful quick action if password error occurred */}
              {mode === 'login' && (
                <div className="pt-2 border-t border-amber-200/70 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-amber-100 text-emerald-800 border border-emerald-600/40 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
                    <span>אפס סיסמה כעת</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {successMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Full Name field (in register mode, or in forgot mode for verification) */}
          {(mode === 'register' || mode === 'forgot') && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {mode === 'forgot' ? 'שם מלא (לאימות זהות)' : 'שם מלא'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="input-auth-fullname"
                  type="text"
                  required={mode === 'register'}
                  placeholder="לדוגמה: ישראל ישראלי"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pr-10 pl-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
              </div>
            </div>
          )}

          {/* Phone Number field */}
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

          {/* Password field in login and register modes */}
          {mode !== 'forgot' && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  סיסמה
                </label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setError(null);
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
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
                  placeholder={mode === 'register' ? 'בחר סיסמה בת 6 תווים לפחות' : 'הזן את סיסמתך'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password field in Forgot mode */}
          {mode === 'forgot' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                סיסמה חדשה (לפחות 6 תווים)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="input-auth-new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="הזן סיסמה חדשה בת 6 תווים לפחות"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pr-10 pl-10 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {/* Youth seeker checkbox & group selector in register mode */}
          {mode === 'register' && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 hover:bg-emerald-50 transition-colors">
                <input
                  id="checkbox-is-looking-for-job"
                  type="checkbox"
                  checked={isLookingForJob}
                  onChange={(e) => setIsLookingForJob(e.target.checked)}
                  className="w-4 h-4 mt-0.5 text-emerald-600 rounded-md border-slate-300 focus:ring-emerald-500"
                />
                <div className="flex-1 text-right">
                  <span className="text-xs font-bold text-emerald-950 block">
                    🙋‍♂️ אני מחפש/ת עבודה (נוער הקיבוץ)
                  </span>
                  <span className="text-[11px] text-emerald-700 block">
                    סמן אם ברצונך לקחת עבודות ולקבל פניות
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
                        className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
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

          {/* Submit Button */}
          <button
            id="btn-auth-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-black text-sm sm:text-base shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <span>
                  {mode === 'register' 
                    ? 'הרשמה מהירה לחשבון' 
                    : mode === 'forgot'
                    ? 'שמור סיסמה חדשה והתחבר'
                    : 'התחבר עכשיו'}
                </span>
                <ArrowRight className="w-4 h-4 rotate-180" />
              </>
            )}
          </button>

          {/* Back to Login link when in Forgot mode */}
          {mode === 'forgot' && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError(null);
                  setSuccessMessage(null);
                }}
                className="text-xs font-bold text-slate-600 hover:text-emerald-700 cursor-pointer"
              >
                ← חזרה לכניסה לחשבון
              </button>
            </div>
          )}
        </form>

      </div>
    </div>
  );
};
