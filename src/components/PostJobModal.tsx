import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Coins, 
  User, 
  Phone, 
  Sparkles, 
  AlertCircle, 
  FileText, 
  CheckCircle2, 
  Share2, 
  Users,
  Home,
  Check
} from 'lucide-react';
import { UserProfile, Job, JobCoordinates, KibbutzJobCategory } from '../types';
import { createJob, updateJob } from '../lib/firebase';
import { KIBBUTZ_CATEGORIES, KIBBUTZ_LOCATIONS, CategoryInfo } from '../constants/kibbutz';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  editingJob?: Job | null;
  onJobSaved: (jobId: string, isNew: boolean, createdJob?: Job) => void;
}

const QUICK_PAYMENTS = [
  { label: '50 ₪', value: 50 },
  { label: '80 ₪', value: 80 },
  { label: '120 ₪', value: 120 },
  { label: '180 ₪', value: 180 },
  { label: '250 ₪', value: 250 },
  { label: 'גמיש', value: 'גמיש' },
];

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  user,
  editingJob,
  onJobSaved,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<KibbutzJobCategory>('בייביסיטר');
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [location, setLocation] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [payment, setPayment] = useState<number | string>(50);
  const [customPayment, setCustomPayment] = useState('50');
  const [isCustomPayment, setIsCustomPayment] = useState(false);
  const [workersNeeded, setWorkersNeeded] = useState<number>(1);
  const [coordinates, setCoordinates] = useState<JobCoordinates | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingJob) {
      const cat = (editingJob.category as KibbutzJobCategory) || 'משהו אחר';
      setSelectedCategory(cat);
      setTitle(editingJob.title || '');
      setDetails(editingJob.details || '');
      setLocation(editingJob.location || '');
      setCoordinates(editingJob.coordinates || null);
      setWorkersNeeded(editingJob.workersNeeded || 1);
      if (typeof editingJob.payment === 'number') {
        setPayment(editingJob.payment);
        setCustomPayment(String(editingJob.payment));
      } else {
        setPayment(editingJob.payment || 'גמיש');
        setCustomPayment(String(editingJob.payment));
      }
    } else {
      // Default to first category
      const firstCat = KIBBUTZ_CATEGORIES[0];
      setSelectedCategory(firstCat.id);
      setTitle(firstCat.label);
      setDetails('');
      setLocation('שכונת הרחבה חדשה');
      setHouseNumber('');
      setCoordinates(null);
      setPayment(firstCat.defaultPay);
      setCustomPayment(String(firstCat.defaultPay));
      setIsCustomPayment(false);
      setWorkersNeeded(1);
      setGpsError(null);
      setError(null);
    }
  }, [editingJob, isOpen]);

  if (!isOpen) return null;

  const handleSelectCategory = (cat: CategoryInfo) => {
    setSelectedCategory(cat.id);
    if (!editingJob) {
      if (cat.id === 'משהו אחר') {
        setTitle('');
      } else {
        setTitle(cat.label);
      }
      setPayment(cat.defaultPay);
      setCustomPayment(String(cat.defaultPay));
    }
  };

  const handleSelectKibbutzLocation = (locName: string) => {
    if (houseNumber.trim()) {
      setLocation(`${locName}, בית ${houseNumber.trim()}`);
    } else {
      setLocation(locName);
    }
  };

  const handleHouseNumberChange = (num: string) => {
    setHouseNumber(num);
    const baseLoc = location.split(', בית')[0] || location;
    if (num.trim()) {
      setLocation(`${baseLoc}, בית ${num.trim()}`);
    } else {
      setLocation(baseLoc);
    }
  };

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('שירות המיקום אינו נתמך במכשיר זה');
      return;
    }

    setLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`
          );
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || '';
            const village = data.address?.village || data.address?.suburb || '';
            if (!location) {
              setLocation(road && village ? `${village}, ${road}` : (road || 'מיקום בקיבוץ זוהה'));
            }
          }
        } catch (e) {
          // Keep coordinates
        } finally {
          setLocatingGps(false);
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setLocatingGps(false);
        setGpsError('לא הצלחנו לזהות את המיקום. אנא בחר שכונה בקיבוץ מהרשימה');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('אנא כתוב מה צריך לעשות (כותרת העבודה)');
      return;
    }

    if (!location.trim()) {
      setError('אנא בחר מיקום / שכונה בקיבוץ');
      return;
    }

    const finalPayment = isCustomPayment 
      ? (isNaN(Number(customPayment)) ? customPayment : Number(customPayment))
      : payment;

    setLoading(true);

    try {
      if (editingJob) {
        await updateJob(editingJob.id, user.uid, {
          title: title.trim(),
          category: selectedCategory,
          details: details.trim(),
          location: location.trim(),
          coordinates,
          payment: finalPayment,
          workersNeeded: Math.max(1, workersNeeded),
        });
        const updatedJobObj: Job = {
          ...editingJob,
          title: title.trim(),
          category: selectedCategory,
          details: details.trim(),
          location: location.trim(),
          coordinates,
          payment: finalPayment,
          workersNeeded: Math.max(1, workersNeeded),
        };
        onJobSaved(editingJob.id, false, updatedJobObj);
      } else {
        const newJobPayload = {
          title: title.trim(),
          category: selectedCategory,
          details: details.trim(),
          location: location.trim(),
          coordinates,
          payment: finalPayment,
          workersNeeded: Math.max(1, workersNeeded),
          creatorId: user.uid,
          creatorName: user.fullName,
          creatorPhone: user.phoneNumber,
        };
        const newJobId = await createJob(newJobPayload);
        const createdJobObj: Job = {
          id: newJobId,
          ...newJobPayload,
          registeredWorkers: [],
          registeredWorkerIds: [],
          status: 'new',
          createdAt: { seconds: Math.floor(Date.now() / 1000) } as any,
          updatedAt: { seconds: Math.floor(Date.now() / 1000) } as any,
        } as Job;
        onJobSaved(newJobId, true, createdJobObj);
      }
      onClose();
    } catch (err: any) {
      console.error('Job save error:', err);
      setError(err.message || 'שגיאה בשמירת העבודה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto overscroll-contain"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] sm:max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-right font-['Assistant',sans-serif]"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          id="btn-close-post-job-modal"
          onClick={onClose}
          aria-label="סגור חלון"
          className="absolute top-3 sm:top-4 left-3 sm:left-4 p-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/30 rounded-full transition-colors z-20 backdrop-blur-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Header - Fixed at top of modal */}
        <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-emerald-600 p-4 sm:p-6 text-white relative shrink-0">
          <div className="flex items-center gap-3 relative z-10 pl-10">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-2xs shrink-0">
              🏡
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-black font-['Rubik',sans-serif] drop-shadow-xs leading-tight">
                {editingJob ? 'עריכת מודעת עבודה בקיבוץ' : 'פרסום בקשת עבודה בקיבוץ ✨'}
              </h2>
              <p className="text-cyan-100 text-xs sm:text-sm mt-0.5 font-medium">
                בחר סוג עבודה ושכונה, וקבל מענה מהיר מהנעורים!
              </p>
            </div>
          </div>
          <div className="absolute -left-6 -bottom-6 w-28 h-28 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
        </div>

        {/* Form - Scrollable container */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selection Grid (10 Kibbutz options) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
              <span>בחר סוג עבודה מבוקשת:</span>
              <span className="text-[11px] text-teal-700 font-semibold">10 אפשרויות עבודה בקיבוץ</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KIBBUTZ_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`p-2.5 rounded-2xl border text-right transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? 'bg-teal-50/90 border-teal-600 text-teal-950 ring-2 ring-teal-500/20 shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/90 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xl shrink-0">{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold block truncate leading-tight">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        {cat.defaultPay} ₪ מומלץ
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-teal-700 shrink-0 mr-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Job Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              כותרת העבודה *
            </label>
            <input
              id="input-job-title"
              type="text"
              required
              placeholder="לדוגמה: בייביסיטר לשני ילדים / טיול יומי עם הכלב"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium"
            />
          </div>

          {/* 3. Detailed description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              פירוט והסבר (שעות מבוקשות, גילאי הילדים, ציוד נדרש...)
            </label>
            <textarea
              id="input-job-details"
              rows={2}
              placeholder="פרט מה בדיוק נדרש, שעות מועדפות, האם צריך להביא ציוד מיוחד..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all font-medium resize-none"
            />
          </div>

          {/* 4. Kibbutz Location & Neighborhood Selection */}
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-teal-700" />
                <span>שכונה / אזור בקיבוץ: *</span>
              </label>
              <button
                type="button"
                onClick={handleGetGpsLocation}
                disabled={locatingGps}
                className="flex items-center gap-1 text-[11px] text-teal-700 hover:text-teal-900 font-bold transition-colors disabled:opacity-50"
              >
                <Navigation className={`w-3 h-3 ${locatingGps ? 'animate-spin' : ''}`} />
                <span>{locatingGps ? 'מזהה GPS...' : 'זהה GPS'}</span>
              </button>
            </div>

            {/* Quick Kibbutz Neighborhood Pills */}
            <div className="flex flex-wrap gap-1.5">
              {KIBBUTZ_LOCATIONS.map((locName) => {
                const isSelected = location.startsWith(locName);
                return (
                  <button
                    key={locName}
                    type="button"
                    onClick={() => handleSelectKibbutzLocation(locName)}
                    className={`px-2.5 py-1 text-xs rounded-xl font-medium transition-all ${
                      isSelected
                        ? 'bg-teal-700 text-white font-bold shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {locName}
                  </button>
                );
              })}
            </div>

            {/* Location input + House Number Input */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div className="sm:col-span-2 relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                  <MapPin className="w-3.5 h-3.5" />
                </div>
                <input
                  id="input-job-location"
                  type="text"
                  required
                  placeholder="לדוגמה: שכונת הרחבה חדשה, בית 112"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pr-8 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
                />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="מספר בית / דירה"
                  value={houseNumber}
                  onChange={(e) => handleHouseNumberChange(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-center"
                />
              </div>
            </div>

            {coordinates && (
              <div className="flex items-center gap-1.5 text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-700" />
                <span>מיקום מדויק בקיבוץ הוצמד בהצלחה</span>
              </div>
            )}

            {gpsError && (
              <p className="text-[11px] text-amber-600">
                {gpsError}
              </p>
            )}
          </div>

          {/* 5. Number of workers needed */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700">
                כמה עובדים נדרשים לביצוע? *
              </label>
              <span className="text-[11px] text-teal-700 font-bold flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>{workersNeeded === 1 ? '1 עובד' : `${workersNeeded} עובדים`}</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 mb-2">
              {[1, 2, 3, 4].map((num) => {
                const isSelected = workersNeeded === num;
                return (
                  <button
                    key={num}
                    type="button"
                    id={`btn-workers-needed-${num}`}
                    onClick={() => setWorkersNeeded(num)}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>{num === 1 ? '1 עובד' : `${num} עובדים`}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl">
              <div className="text-right">
                <span className="text-xs font-bold text-slate-800 block">
                  מספר עובדים מותאם:
                </span>
                <span className="text-[11px] text-slate-400">
                  כל עובד יוכל להירשם עד שכל המקומות יתמלאו
                </span>
              </div>
              <div className="flex items-center gap-2" dir="ltr">
                <button
                  type="button"
                  id="btn-decrement-workers"
                  onClick={() => setWorkersNeeded(Math.max(1, workersNeeded - 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-base"
                >
                  -
                </button>
                <span className="w-8 text-center font-bold text-sm text-slate-900">
                  {workersNeeded}
                </span>
                <button
                  type="button"
                  id="btn-increment-workers"
                  onClick={() => setWorkersNeeded(Math.min(20, workersNeeded + 1))}
                  className="w-8 h-8 rounded-xl bg-white border border-slate-300 font-bold text-slate-700 hover:bg-slate-100 flex items-center justify-center text-base"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* 6. Payment Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              כמה מוכנים לשלם לעובד? (תשלום ב-₪) *
            </label>
            
            <div className="grid grid-cols-6 gap-1.5 mb-2">
              {QUICK_PAYMENTS.map((p) => {
                const isSelected = !isCustomPayment && payment === p.value;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => {
                      setIsCustomPayment(false);
                      setPayment(p.value);
                    }}
                    className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsCustomPayment(true)}
                className={`text-xs px-3.5 py-2 rounded-xl font-bold border transition-colors ${
                  isCustomPayment
                    ? 'bg-teal-50 text-teal-800 border-teal-300'
                    : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                }`}
              >
                סכום מותאם:
              </button>

              <div className="relative flex-1">
                <input
                  id="input-job-custom-payment"
                  type="text"
                  placeholder="הזן סכום (לדוגמה: 75)"
                  value={customPayment}
                  onFocus={() => setIsCustomPayment(true)}
                  onChange={(e) => {
                    setIsCustomPayment(true);
                    setCustomPayment(e.target.value);
                  }}
                  className={`w-full px-3.5 py-2 bg-slate-50 border rounded-xl text-sm font-bold transition-all ${
                    isCustomPayment
                      ? 'border-teal-500 ring-2 ring-teal-500/20 bg-white'
                      : 'border-slate-200'
                  }`}
                />
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  ₪
                </span>
              </div>
            </div>
          </div>

          {/* 7. Contact Details */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              פרטי קשר שישותפו עם מי שיירשם לעבודה בקיבוץ:
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                <User className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="font-bold text-slate-800 truncate">{user.fullName}</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                <Phone className="w-4 h-4 text-teal-700 shrink-0" />
                <span className="font-bold text-slate-800 font-mono">{user.phoneNumber}</span>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-job"
              type="submit"
              disabled={loading}
              className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                  <span>{editingJob ? 'שמור שינויים' : 'פרסם עבודה בקיבוץ עכשיו 🚀'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
