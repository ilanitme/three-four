import React, { useState, useMemo } from 'react';
import { 
  Search, 
  SlidersHorizontal, 
  PlusCircle, 
  MapPin, 
  Sparkles, 
  Briefcase, 
  RefreshCw,
  Coins,
  Home,
  X,
  ShieldCheck,
  UserCheck,
  Building2,
  ArrowRightLeft,
  Phone,
  PhoneCall
} from 'lucide-react';
import { Job, UserProfile, KibbutzJobCategory } from '../types';
import { JobCard } from './JobCard';
import { ThreeFourLogo } from './ThreeFourLogo';
import { KIBBUTZ_CATEGORIES, KIBBUTZ_LOCATIONS, getCategoryMeta } from '../constants/kibbutz';
import { isUserAdmin, updateUserProfile } from '../lib/firebase';
import { PWAInstallButton } from './PWAInstallButton';

interface AvailableJobsFeedProps {
  jobs: Job[];
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenPostJob: () => void;
  onOpenShare: (job: Job) => void;
  onOpenDetails: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onClaimSuccess?: (job: Job) => void;
}

export const AvailableJobsFeed: React.FC<AvailableJobsFeedProps> = ({
  jobs,
  currentUser,
  onOpenAuth,
  onOpenPostJob,
  onOpenShare,
  onOpenDetails,
  onEditJob,
  onClaimSuccess,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceFilter, setPriceFilter] = useState<'all' | 'under100' | '100to200' | 'above200'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'highest_pay'>('newest');
  const [switchingRole, setSwitchingRole] = useState(false);

  const isAdmin = isUserAdmin(currentUser);
  const isJobSeeker = currentUser?.isLookingForJob === true && !isAdmin;
  const isEmployer = currentUser && !currentUser.isLookingForJob && !isAdmin;
  const canPublish = !currentUser || (!isJobSeeker || isAdmin);

  const handleToggleRole = async () => {
    if (!currentUser) return;
    setSwitchingRole(true);
    try {
      await updateUserProfile(currentUser.uid, {
        isLookingForJob: !currentUser.isLookingForJob
      });
      window.location.reload();
    } catch (err) {
      console.error('Error toggling role:', err);
    } finally {
      setSwitchingRole(false);
    }
  };

  // Filter and sort jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      // If user is Employer (Not looking for a job and not admin): only show their own jobs
      if (isEmployer) {
        if (job.creatorId !== currentUser?.uid) return false;
      } else {
        // Otherwise only show jobs that are new / available
        if (job.status !== 'new') return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        const catMeta = getCategoryMeta(job.category, job.title, job.details);
        if (catMeta.id !== selectedCategory) return false;
      }

      // Kibbutz Location filter
      if (selectedLocation !== 'all') {
        if (!job.location || !job.location.includes(selectedLocation)) return false;
      }

      // Text search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const inTitle = job.title?.toLowerCase().includes(query);
        const inDetails = job.details?.toLowerCase().includes(query);
        const inLocation = job.location?.toLowerCase().includes(query);
        const inCategory = job.category?.toLowerCase().includes(query);
        if (!inTitle && !inDetails && !inLocation && !inCategory) return false;
      }

      // Price filter
      const numPayment = typeof job.payment === 'number' ? job.payment : parseFloat(String(job.payment));
      if (!isNaN(numPayment)) {
        if (priceFilter === 'under100' && numPayment > 100) return false;
        if (priceFilter === '100to200' && (numPayment < 100 || numPayment > 200)) return false;
        if (priceFilter === 'above200' && numPayment < 200) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'highest_pay') {
        const payA = typeof a.payment === 'number' ? a.payment : (parseFloat(String(a.payment)) || 0);
        const payB = typeof b.payment === 'number' ? b.payment : (parseFloat(String(b.payment)) || 0);
        return payB - payA;
      }
      // Default newest
      const timeA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });
  }, [jobs, searchTerm, selectedCategory, selectedLocation, priceFilter, sortBy, isEmployer, currentUser?.uid]);

  const hasActiveFilters = selectedCategory !== 'all' || selectedLocation !== 'all' || priceFilter !== 'all' || searchTerm.trim() !== '';

  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedLocation('all');
    setPriceFilter('all');
    setSortBy('newest');
  };

  return (
    <div className="space-y-5" dir="rtl">
      
      {/* Employer Banner Notification if in Employer mode */}
      {isEmployer && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-900 flex items-center justify-center text-xl shrink-0 font-bold">
              🏡
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-amber-950">
                מצב מפרסם עבודות (מעסיק בקיבוץ)
              </h3>
              <p className="text-xs text-amber-900/80">
                מוצגות רק העבודות שפרסמת. באפשרותך לערוך או להסיר אותן בכל עת.
              </p>
            </div>
          </div>
          <button
            onClick={handleToggleRole}
            disabled={switchingRole}
            className="px-3.5 py-2 bg-white hover:bg-amber-100 text-amber-900 text-xs font-bold rounded-xl border border-amber-300 transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-amber-700" />
            <span>מעבר למצב מחפש עבודה</span>
          </button>
        </div>
      )}

      {/* Hero / Kibbutz Mutual Aid Banner - Fresh, Youthful, Inviting */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-700 via-cyan-700 to-emerald-600 text-white p-5 sm:p-8 shadow-xl shadow-cyan-900/15 border border-white/20">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 sm:gap-6">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-black text-amber-200 mb-2.5 sm:mb-3 border border-white/25 shadow-2xs">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              <span>שלוש - ארבע ולעבודה • לוח עזרה הדדית בקיבוץ ✨</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight heading-font mb-2 leading-tight drop-shadow-xs">
              {isEmployer
                ? 'ניהול העבודות שפרסמת בקיבוץ'
                : isJobSeeker
                ? `שלום ${currentUser?.fullName || ''}, מצא עבודה בקיבוץ!`
                : 'צריכים עזרה בקיבוץ?'}
            </h1>
            <p className="text-xs sm:text-base text-cyan-50 font-medium leading-relaxed mb-4 sm:mb-6">
              {isEmployer
                ? 'כאן תוכל לעקוב אחרי מי שנרשם לעבודות שלך, לערוך פרטים, לבטל או למחוק מודעות.'
                : isJobSeeker
                ? 'בייביסיטר, טיול עם הכלב, גינון, שטיפת כלים, ניקיון או כביסה — הירשם בקליק וקבל תשלום מהיר!'
                : 'בייביסיטר, טיול עם הכלב, טיפול בחתול, גינון, הובלה, ניקיון או כביסה — פרסמו תוך שניות וקבלו מענה מהיר מהנעורים!'}
            </p>

            <div className="flex flex-wrap items-center gap-3">
              {canPublish ? (
                <button
                  id="btn-feed-post-job-hero"
                  onClick={onOpenPostJob}
                  className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300 text-slate-950 hover:from-amber-400 hover:to-amber-500 text-sm sm:text-base font-black rounded-2xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.03] active:scale-[0.98]"
                >
                  <PlusCircle className="w-5 h-5 text-slate-900" />
                  <span>פרסם בקשת עבודה בקיבוץ +</span>
                </button>
              ) : (
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/20 backdrop-blur border border-white/20 text-white text-xs sm:text-sm font-bold">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>מצב מחפש עבודה: בחר עבודה מהלוח ולחץ להרשמה מיידית!</span>
                </div>
              )}
              
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200/95 pr-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>כל הקודם זוכה • חיבור מהיר לנוער הקיבוץ</span>
              </div>
            </div>
          </div>

          {/* Big Stylized 3-4 Badge on Desktop */}
          <div className="hidden lg:flex flex-col items-center justify-center p-5 rounded-3xl bg-white/15 backdrop-blur-md border border-white/30 shadow-inner select-none shrink-0">
            <ThreeFourLogo size="lg" showText={false} />
            <span className="text-xs font-black text-amber-200 mt-2 font-['Rubik',sans-serif]">
              3 - 4 ולעבודה! 🚀
            </span>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-1/4 -top-12 w-64 h-64 bg-emerald-300/25 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Main Container / Jobs Feed */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-sm">
        
        {/* Category Horizontal Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-teal-50/50 via-cyan-50/40 to-emerald-50/30">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>🎯</span>
              <span>מה מחפשים היום בקיבוץ?</span>
            </span>
            {selectedCategory !== 'all' && (
              <button
                onClick={() => setSelectedCategory('all')}
                className="text-[11px] text-teal-700 font-black hover:underline"
              >
                הצג את כל הסוגים
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all shrink-0 ${
                selectedCategory === 'all'
                  ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 text-white shadow-md shadow-cyan-600/20 scale-[1.02]'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-50/60 hover:border-teal-200'
              }`}
            >
              🌟 כל העבודות
            </button>

            {KIBBUTZ_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 text-white shadow-md shadow-cyan-600/20 scale-[1.02]'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-teal-50/60 hover:border-teal-200'
                  }`}
                >
                  <span>{cat.emoji}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Kibbutz Neighborhood / Location Filter Bar */}
        <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-bold shrink-0 flex items-center gap-1">
            <Home className="w-3.5 h-3.5 text-teal-600" />
            <span>שכונה בקיבוץ:</span>
          </span>

          <button
            onClick={() => setSelectedLocation('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
              selectedLocation === 'all'
                ? 'bg-teal-100 text-teal-900 font-bold'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            כל הקיבוץ
          </button>

          {KIBBUTZ_LOCATIONS.map((loc) => {
            const isSelected = selectedLocation === loc;
            return (
              <button
                key={loc}
                onClick={() => setSelectedLocation(loc)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-teal-100 text-teal-900 font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>

        {/* Search, Sort & Price Range Row */}
        <div className="p-4 sm:p-5 bg-sky-50/30 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="input-feed-search"
              type="text"
              placeholder="חפש לפי כותרת, שכונה (הרחבה חדשה, קיבוץ ישן...), או תיאור..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pr-10 pl-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all font-medium shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                נקה
              </button>
            )}
          </div>

          {/* Price Range Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => setPriceFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                priceFilter === 'all'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              כל מחיר
            </button>
            <button
              onClick={() => setPriceFilter('under100')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                priceFilter === 'under100'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              עד 100 ₪
            </button>
            <button
              onClick={() => setPriceFilter('100to200')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                priceFilter === '100to200'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              100-200 ₪
            </button>
            <button
              onClick={() => setPriceFilter('above200')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                priceFilter === 'above200'
                  ? 'bg-teal-800 text-white shadow-2xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-900'
              }`}
            >
              200+ ₪
            </button>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-slate-500 font-bold hidden sm:inline">מיון:</span>
            <select
              id="select-feed-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-2xs cursor-pointer"
            >
              <option value="newest">🕒 החדשות ביותר</option>
              <option value="highest_pay">💰 התשלום הגבוה ביותר</option>
            </select>
          </div>
        </div>

        {/* Active Filters Tag Bar */}
        {hasActiveFilters && (
          <div className="px-6 py-2.5 bg-teal-50/70 border-b border-teal-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-teal-950">סינונים פעילים:</span>
              {selectedCategory !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-900 font-bold">
                  סוג: {selectedCategory}
                </span>
              )}
              {selectedLocation !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-900 font-bold">
                  שכונה: {selectedLocation}
                </span>
              )}
              {priceFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-900 font-bold">
                  מחיר: {priceFilter === 'under100' ? 'עד 100 ₪' : priceFilter === '100to200' ? '100-200 ₪' : '200+ ₪'}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-0.5 rounded-lg bg-teal-100 text-teal-900 font-bold">
                  חיפוש: &quot;{searchTerm}&quot;
                </span>
              )}
            </div>

            <button
              onClick={clearAllFilters}
              className="text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 shrink-0"
            >
              <X className="w-3.5 h-3.5" />
              <span>נקה הכל</span>
            </button>
          </div>
        )}

        {/* Feed Cards Section */}
        <div className="p-4 sm:p-6 space-y-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                currentUser={currentUser}
                onOpenAuth={onOpenAuth}
                onOpenShare={onOpenShare}
                onOpenDetails={onOpenDetails}
                onEditJob={onEditJob}
                onClaimSuccess={onClaimSuccess}
              />
            ))
          ) : (
            <div className="py-12 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-4 border border-teal-100 text-2xl font-bold">
                🏡
              </div>
              <h3 className="text-lg font-bold text-slate-800 heading-font mb-1">
                {isEmployer
                  ? 'טרם פרסמת מודעות עבודה בקיבוץ'
                  : hasActiveFilters
                  ? 'לא נמצאו עבודות בקיבוץ התואמות לסינון'
                  : 'אין כרגע עבודות פנויות בקיבוץ'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto mb-5">
                {isEmployer
                  ? 'פרסם מודעת עבודה ראשונה וקבל מענה מהיר מנוער וחברי הקיבוץ!'
                  : hasActiveFilters
                  ? 'נסה לבחור שכונה אחרת, סוג עבודה אחר או לאפס את הסינונים'
                  : isJobSeeker
                  ? 'ברגע שחברי הקיבוץ יפרסמו עבודות חדשות, הן יופיעו כאן מיידית'
                  : 'היה הראשון שמפרסם בקשת עבודה בקיבוץ וקבל מענה מהיר!'}
              </p>

              {hasActiveFilters ? (
                <button
                  onClick={clearAllFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
                >
                  אפס את כל הסינונים
                </button>
              ) : canPublish ? (
                <button
                  onClick={onOpenPostJob}
                  className="px-6 py-3 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md shadow-teal-700/20 transition-all inline-flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>פרסם בקשת עבודה בקיבוץ</span>
                </button>
              ) : null}
            </div>
          )}
        </div>

        {/* Footer Status bar */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2 text-slate-500 text-xs sm:text-sm">
          <span>
            {isEmployer
              ? `מוצגות ${filteredJobs.length} עבודות שפרסמת`
              : `נמצאו ${filteredJobs.length} עבודות פנויות בקיבוץ`}
          </span>
          <span>•</span>
          <button 
            onClick={clearAllFilters}
            className="text-teal-700 hover:text-teal-900 font-bold transition-colors"
          >
            רענן לוח עבודות
          </button>
        </div>

      </div>

      {/* Mobile PWA Install Box */}
      <div 
        id="main-pwa-install-banner"
        className="bg-gradient-to-r from-teal-700 via-cyan-700 to-emerald-600 text-white rounded-3xl p-5 sm:p-6 shadow-md shadow-cyan-800/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right border border-white/20"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-amber-200 shrink-0 shadow-2xs">
            <img src="/apple-touch-icon.png" alt="שלוש-ארבע" className="w-9 h-9 rounded-xl object-cover" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-white font-['Rubik',sans-serif] flex items-center justify-center sm:justify-start gap-1.5">
              <span>השתמש ב״שלוש - ארבע״ כאפליקציה בנייד</span>
              <span className="text-amber-300">📱</span>
            </h4>
            <p className="text-xs text-cyan-100 mt-0.5 font-medium">
              התקנה מהירה לאייפון (iOS Safari) ולאנדרואיד — פתיחה ישירה ממסך הבית ללא צורך בדפדפן
            </p>
          </div>
        </div>

        <PWAInstallButton />
      </div>

      {/* Technical Support Box - Bottom of Main Screen */}
      <div 
        id="main-technical-support-banner"
        className="bg-white rounded-3xl border border-teal-100 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right hover:border-teal-200 transition-colors"
      >
        <div className="flex flex-col sm:flex-row items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 border border-amber-200 flex items-center justify-center text-amber-800 shrink-0 shadow-2xs">
            <PhoneCall className="w-6 h-6 text-amber-700" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-800 font-['Rubik',sans-serif] flex items-center justify-center sm:justify-start gap-1.5">
              <span>לתמיכה טכנית נא לפנות לאילנית</span>
              <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">תמיד בשמחה! 😊</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              עזרה בהרשמה, פרסום מודעות, תקלות או שאלות לגבי המערכת
            </p>
          </div>
        </div>

        <a
          id="btn-call-support-ilanit"
          href="tel:0549311010"
          className="inline-flex items-center gap-2.5 px-5 py-3 rounded-2xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 active:from-teal-800 text-white font-black text-sm shadow-md shadow-teal-600/20 transition-all hover:scale-[1.03] cursor-pointer"
          title="התקשר לאילנית - 054-9311010"
        >
          <Phone className="w-4 h-4 text-amber-200" />
          <span dir="ltr" className="tracking-wider font-mono font-bold">054-9311010</span>
          <span className="text-xs text-teal-100 font-sans mr-0.5">• התקשר עכשיו</span>
        </a>
      </div>

    </div>
  );
};
