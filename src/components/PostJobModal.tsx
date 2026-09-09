import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Navigation, 
  Coins, 
  Sparkles, 
  AlertCircle, 
  Home, 
  Check, 
  Plus, 
  Minus,
  Crosshair,
  CheckCircle2
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
  { label: '100 ₪', value: 100 },
  { label: '150 ₪', value: 150 },
  { label: '200 ₪', value: 200 },
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
  
  // Location states
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>('');
  const [manualLocation, setManualLocation] = useState<string>('');
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [coordinates, setCoordinates] = useState<JobCoordinates | null>(null);
  const [locatingGps, setLocatingGps] = useState(false);
  const [gpsSuccess, setGpsSuccess] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Payment states
  const [payment, setPayment] = useState<number | string>(50);
  const [customPaymentInput, setCustomPaymentInput] = useState<string>('50');
  const [workersNeeded, setWorkersNeeded] = useState<number>(1);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingJob) {
      const cat = (editingJob.category as KibbutzJobCategory) || 'משהו אחר';
      setSelectedCategory(cat);
      setTitle(editingJob.title || '');
      setDetails(editingJob.details || '');
      
      // Parse existing location
      const existingLoc = editingJob.location || '';
      const matchedNeighborhood = KIBBUTZ_LOCATIONS.find(loc => existingLoc.includes(loc));
      if (matchedNeighborhood) {
        setSelectedNeighborhood(matchedNeighborhood);
        const rem = existingLoc.replace(matchedNeighborhood, '').replace(/^[,\s-]+/, '').trim();
        setManualLocation(rem);
      } else {
        setSelectedNeighborhood('');
        setManualLocation(existingLoc);
      }
      
      setCoordinates(editingJob.coordinates || null);
      if (editingJob.coordinates) {
        setGpsSuccess(true);
      }
      setWorkersNeeded(editingJob.workersNeeded || 1);
      
      const p = editingJob.payment;
      setPayment(p);
      setCustomPaymentInput(typeof p === 'number' ? String(p) : (p || '50'));
    } else {
      const firstCat = KIBBUTZ_CATEGORIES[0];
      setSelectedCategory(firstCat.id);
      setTitle(firstCat.label);
      setDetails('');
      setSelectedNeighborhood('');
      setManualLocation('');
      setHouseNumber('');
      setCoordinates(null);
      setGpsSuccess(false);
      setPayment(firstCat.defaultPay);
      setCustomPaymentInput(String(firstCat.defaultPay));
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
      setCustomPaymentInput(String(cat.defaultPay));
    }
  };

  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('שירות המיקום (GPS) אינו נתמך במכשיר זה');
      return;
    }

    setLocatingGps(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCoordinates({ lat, lng });
        setGpsSuccess(true);

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=he`
          );
          if (res.ok) {
            const data = await res.json();
            const road = data.address?.road || '';
            const village = data.address?.village || data.address?.suburb || '';
            if (!manualLocation && !selectedNeighborhood) {
              setManualLocation(road && village ? `${village}, ${road}` : (road || 'מיקום נוכחי בקיבוץ'));
            }
          }
        } catch (e) {
          // Keep coordinates
        } finally {
          setLocatingGps(false);
        }
      },
      (err) => {
        console.warn('GPS error:', err);
        setGpsError('לא ניתן לקבל מיקום GPS. ודא שהרשאות המיקום מאושרות בדפדפן');
        setLocatingGps(false);
      },
      { timeout: 12000, enableHighAccuracy: true }
    );
  };

  const handleClearGps = () => {
    setCoordinates(null);
    setGpsSuccess(false);
    setGpsError(null);
  };

  // Quick payment selection
  const handleSelectQuickPayment = (val: number | string) => {
    setPayment(val);
    setCustomPaymentInput(String(val));
  };

  // Custom payment input typing
  const handleCustomPaymentChange = (val: string) => {
    setCustomPaymentInput(val);
    const trimmed = val.trim();
    if (trimmed === 'גמיש' || trimmed === 'בהתאם' || trimmed === 'לפי שעה') {
      setPayment(trimmed);
    } else {
      const parsed = parseFloat(trimmed);
      if (!isNaN(parsed) && parsed > 0) {
        setPayment(parsed);
      } else {
        setPayment(trimmed || 50);
      }
    }
  };

  // Adjust payment by step
  const handleAdjustPayment = (delta: number) => {
    const currentVal = typeof payment === 'number' ? payment : (parseFloat(customPaymentInput) || 50);
    const nextVal = Math.max(10, currentVal + delta);
    setPayment(nextVal);
    setCustomPaymentInput(String(nextVal));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('אנא הזן כותרת לעבודה');
      return;
    }

    // Build final location string (optional)
    let finalLocation = '';
    const parts = [];
    if (selectedNeighborhood.trim()) parts.push(selectedNeighborhood.trim());
    if (houseNumber.trim()) parts.push(`בית ${houseNumber.trim()}`);
    if (manualLocation.trim()) parts.push(manualLocation.trim());

    if (parts.length > 0) {
      finalLocation = parts.join(', ');
    } else if (coordinates) {
      finalLocation = 'מיקום GPS מדויק בקיבוץ';
    } else {
      finalLocation = 'ברחבי הקיבוץ';
    }

    // Determine final payment
    let finalPayment: number | string = payment;
    const trimmedInput = customPaymentInput.trim();
    if (trimmedInput === 'גמיש' || trimmedInput === 'התנדבות' || trimmedInput === 'לפי שעה') {
      finalPayment = trimmedInput;
    } else {
      const parsed = parseFloat(trimmedInput);
      if (!isNaN(parsed) && parsed > 0) {
        finalPayment = parsed;
      } else if (trimmedInput) {
        finalPayment = trimmedInput;
      } else {
        finalPayment = 50;
      }
    }

    setLoading(true);

    try {
      if (editingJob) {
        await updateJob(editingJob.id, user.uid, {
          title: title.trim(),
          category: selectedCategory,
          details: details.trim(),
          location: finalLocation,
          payment: finalPayment,
          workersNeeded: Math.max(1, workersNeeded),
          ...(coordinates ? { coordinates } : {}),
        });
        onJobSaved(editingJob.id, false);
      } else {
        const newJobId = await createJob({
          title: title.trim(),
          category: selectedCategory,
          details: details.trim(),
          location: finalLocation,
          payment: finalPayment,
          creatorId: user.uid,
          creatorName: user.fullName,
          creatorPhone: user.phoneNumber,
          creatorRating: user.ratingAverage,
          workersNeeded: Math.max(1, workersNeeded),
          ...(coordinates ? { coordinates } : {}),
        });
        onJobSaved(newJobId, true);
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 text-right font-['Assistant',sans-serif]"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          id="btn-close-post-job-modal"
          onClick={onClose}
          aria-label="סגור חלון"
          className="absolute top-4 left-4 p-2 text-white bg-black/25 hover:bg-black/40 rounded-full transition-colors z-20 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-emerald-800 p-5 sm:p-6 text-white relative shrink-0">
          <div className="flex items-center gap-3.5 pl-10">
            <div className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-bold shrink-0">
              🏡
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black font-['Rubik',sans-serif] leading-tight">
                {editingJob ? 'עריכת מודעת עבודה בקיבוץ' : 'פרסום עבודה חדשה בקיבוץ 🌾'}
              </h2>
              <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
                בחר סוג עבודה, מיקום בקיבוץ וסכום תשלום
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 1. Category Selection */}
          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-2">
              1. סוג העבודה:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {KIBBUTZ_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`p-3 rounded-2xl border text-right transition-all flex items-center gap-2.5 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 ring-2 ring-emerald-500/20 shadow-2xs font-extrabold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="text-2xl shrink-0">{cat.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <span className="text-xs sm:text-sm block truncate leading-tight">
                        {cat.label}
                      </span>
                    </div>
                    {isSelected && (
                      <Check className="w-4 h-4 text-emerald-700 shrink-0 mr-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Title & Details */}
          <div>
            <label className="block text-sm font-extrabold text-slate-900 mb-1.5">
              2. כותרת ותיאור העבודה: *
            </label>
            <input
              id="input-job-title"
              type="text"
              required
              placeholder="לדוגמה: בייביסיטר לשני ילדים / גיזום ועשבים בגינה"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium mb-2.5"
            />
            <textarea
              id="input-job-details"
              rows={2}
              placeholder="פרטים נוספים (לא חובה): שעות מבוקשות, ציוד נדרש..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all font-medium resize-none"
            />
          </div>

          {/* 3. Location in Kibbutz (List Selection + Highlighting GPS + Optional Manual) */}
          <div className="p-4 sm:p-5 bg-slate-50 rounded-3xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-extrabold text-slate-900 flex items-center gap-2">
                <Home className="w-4 h-4 text-emerald-700" />
                <span>3. מיקום בקיבוץ (לא חובה)</span>
              </label>
              <span className="text-xs text-slate-500 font-medium">
                רשימה / GPS / ידני
              </span>
            </div>

            {/* 🔥 HIGH EMPHASIS: GPS Location Button */}
            <div className="p-3.5 bg-emerald-50/80 border-2 border-emerald-600/40 rounded-2xl shadow-2xs">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Crosshair className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-black text-emerald-950 flex items-center gap-1.5">
                      <span>מיקום GPS מדויק</span>
                      {gpsSuccess && (
                        <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                          <CheckCircle2 className="w-3 h-3 text-emerald-800" />
                          <span>זוהה בהצלחה!</span>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-emerald-800 leading-tight mt-0.5">
                      מאפשר ניווט Waze / מפות ישירות למיקום העבודה
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    id="btn-add-gps-location"
                    type="button"
                    onClick={handleGetGpsLocation}
                    disabled={locatingGps}
                    className={`flex-1 sm:flex-none px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs ${
                      gpsSuccess
                        ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    <Navigation className={`w-3.5 h-3.5 ${locatingGps ? 'animate-spin' : ''}`} />
                    <span>{locatingGps ? 'מאתר GPS...' : gpsSuccess ? 'עדכן מיקום GPS' : '📍 הוסף מיקום GPS בלחיצה'}</span>
                  </button>

                  {gpsSuccess && (
                    <button
                      type="button"
                      onClick={handleClearGps}
                      className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors"
                      title="הסר מיקום GPS"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {gpsError && (
                <p className="text-xs text-red-600 mt-2 font-medium">
                  ⚠️ {gpsError}
                </p>
              )}
            </div>

            {/* List Selection: Dropdown / Select List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                בחר שכונה / אזור מהרשימה:
              </label>
              <div className="relative">
                <select
                  id="select-kibbutz-neighborhood"
                  value={selectedNeighborhood}
                  onChange={(e) => setSelectedNeighborhood(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer"
                >
                  <option value="">-- בחר שכונה או אזור בקיבוץ (לא חובה) --</option>
                  {KIBBUTZ_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      📍 {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Manual Entry & House Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-600">
                  עריכה ידנית או מספר בית (לא חובה):
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2 relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    id="input-job-manual-location"
                    type="text"
                    placeholder="פירוט חופשי (למשל: ליד המועדון, גינה אחורית)"
                    value={manualLocation}
                    onChange={(e) => setManualLocation(e.target.value)}
                    className="w-full pr-9 pl-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium"
                  />
                </div>

                <div>
                  <input
                    id="input-job-house-number"
                    type="text"
                    placeholder="מספר בית"
                    value={houseNumber}
                    onChange={(e) => setHouseNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 font-medium text-center"
                  />
                </div>
              </div>
            </div>

          </div>

          {/* 4. Payment & Workers Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Number of workers */}
            <div>
              <label className="block text-sm font-extrabold text-slate-900 mb-1.5">
                כמה עובדים דרושים?
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 2, 3, 4].map((num) => {
                  const isSelected = workersNeeded === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setWorkersNeeded(num)}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {num} {num === 1 ? 'עובד' : 'עובדים'}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Editable Payment Box with Custom Entry */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-extrabold text-slate-900 flex items-center gap-1">
                  <Coins className="w-4 h-4 text-amber-600" />
                  <span>עריכת תשלום:</span>
                </label>
                <span className="text-[11px] text-slate-500 font-medium">
                  ניתן להקליד כל סכום
                </span>
              </div>

              {/* Direct Custom Amount Input + Quick Steppers */}
              <div className="flex items-center gap-1.5 mb-2">
                <div className="relative flex-1">
                  <input
                    id="input-custom-payment"
                    type="text"
                    required
                    placeholder="סכום (למשל: 60)"
                    value={customPaymentInput}
                    onChange={(e) => handleCustomPaymentChange(e.target.value)}
                    className="w-full pr-3 pl-8 py-2 bg-emerald-50/50 border-2 border-emerald-600/40 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white text-right"
                  />
                  <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-xs font-bold text-emerald-800 pointer-events-none">
                    ₪
                  </span>
                </div>

                {/* +10 / -10 Quick Adjusters */}
                <button
                  type="button"
                  onClick={() => handleAdjustPayment(-10)}
                  className="w-8 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors cursor-pointer"
                  title="הורד 10 ₪"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleAdjustPayment(10)}
                  className="w-8 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold transition-colors cursor-pointer"
                  title="הוסף 10 ₪"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Select Presets */}
              <div className="grid grid-cols-6 gap-1">
                {QUICK_PAYMENTS.map((p) => {
                  const isSelected = String(payment) === String(p.value) || customPaymentInput === String(p.value);
                  return (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSelectQuickPayment(p.value)}
                      className={`py-1.5 px-0.5 text-center rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-700 text-white border-emerald-700 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              id="btn-submit-job"
              type="submit"
              disabled={loading}
              className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-200" />
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
