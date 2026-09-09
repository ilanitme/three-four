import React, { useState } from 'react';
import { 
  MapPin, 
  Coins, 
  Clock, 
  User, 
  Phone, 
  MessageCircle, 
  Share2, 
  CheckCircle2, 
  RotateCcw, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Sparkles,
  Navigation,
  Star,
  Users,
  Calendar,
  ArrowLeft
} from 'lucide-react';
import { Job, UserProfile } from '../types';
import { formatPayment, formatHebrewDate, triggerCelebrationConfetti } from '../lib/utils';
import { claimJobTransaction, returnJobToQueue, markJobCompleted, deleteJob, isUserAdmin } from '../lib/firebase';
import { getCategoryMeta } from '../constants/kibbutz';

interface JobCardProps {
  job: Job;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenShare: (job: Job) => void;
  onOpenDetails: (job: Job) => void;
  onEditJob: (job: Job) => void;
  onActionComplete?: () => void;
  onClaimSuccess?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  currentUser,
  onOpenAuth,
  onOpenShare,
  onOpenDetails,
  onEditJob,
  onActionComplete,
  onClaimSuccess,
}) => {
  const [actionLoading, setActionLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  const isAdmin = isUserAdmin(currentUser);
  const isCreator = currentUser?.uid === job.creatorId;
  const canEditOrRemove = isCreator || isAdmin;
  const workersNeeded = Math.max(1, job.workersNeeded || 1);
  const registeredWorkers = Array.isArray(job.registeredWorkers) ? job.registeredWorkers : [];
  
  // Check if current user is registered
  const isRegistered = currentUser ? (
    registeredWorkers.some(w => w.uid === currentUser.uid) || 
    (Array.isArray(job.registeredWorkerIds) && job.registeredWorkerIds.includes(currentUser.uid)) ||
    job.workerId === currentUser.uid
  ) : false;

  const canClaim = !isCreator && !isRegistered;
  const spotsLeft = Math.max(0, workersNeeded - registeredWorkers.length);
  const isFull = registeredWorkers.length >= workersNeeded && workersNeeded > 0;
  const categoryMeta = getCategoryMeta(job.category, job.title, job.details);

  const cleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '972' + clean.slice(1);
    return clean;
  };

  // Handle claiming / registering for the job
  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) {
      onOpenAuth();
      return;
    }

    if (isCreator) {
      setClaimError('לא ניתן להירשם לעבודה שאתה בעצמך פרסמת');
      return;
    }

    if (isRegistered) {
      setClaimError('כבר נרשמת לעבודה זו!');
      return;
    }

    setActionLoading(true);
    setClaimError(null);

    try {
      await claimJobTransaction(job.id, {
        uid: currentUser.uid,
        fullName: currentUser.fullName,
        phoneNumber: currentUser.phoneNumber,
        ratingAverage: currentUser.ratingAverage,
        youthGroup: currentUser.youthGroup,
      });
      triggerCelebrationConfetti();
      if (onActionComplete) onActionComplete();
      if (onClaimSuccess) onClaimSuccess(job);
    } catch (err: any) {
      console.error('Claim error:', err);
      setClaimError(err.message || 'שגיאה ברישום לעבודה');
    } finally {
      setActionLoading(false);
    }
  };

  // Return job / cancel registration
  const handleReturnToQueue = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    setActionLoading(true);
    setClaimError(null);
    try {
      await returnJobToQueue(job.id, currentUser.uid);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      setClaimError(err.message || 'שגיאה בביטול הרישום');
    } finally {
      setActionLoading(false);
    }
  };

  // Complete job
  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    setActionLoading(true);
    setClaimError(null);
    try {
      await markJobCompleted(job.id, currentUser.uid);
      triggerCelebrationConfetti();
      if (onActionComplete) onActionComplete();
      onOpenDetails(job);
    } catch (err: any) {
      setClaimError(err.message || 'שגיאה בסיום העבודה');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete/Remove job (creator or admin)
  const handleDeleteJob = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;

    setActionLoading(true);
    setClaimError(null);
    try {
      await deleteJob(job.id, currentUser.uid, isAdmin);
      if (onActionComplete) onActionComplete();
    } catch (err: any) {
      setClaimError(err.message || 'שגיאה במחיקת העבודה');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div 
      id={`job-card-${job.id}`}
      onClick={() => onOpenDetails(job)}
      className={`group relative bg-white rounded-3xl border transition-all duration-200 p-5 sm:p-6 cursor-pointer text-right shadow-sm hover:shadow-md ${
        isRegistered 
          ? 'border-emerald-300 ring-2 ring-emerald-500/10 bg-emerald-50/20' 
          : job.status === 'completed'
          ? 'border-slate-200 bg-slate-50/60 opacity-90'
          : 'border-slate-200/90 hover:border-teal-500'
      }`}
      dir="rtl"
    >
      {/* Status Badge Indicator Bar */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {job.status === 'new' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
            <span>🟢 פתוח להרשמה</span>
            <span className="font-normal text-emerald-800">
              ({registeredWorkers.length}/{workersNeeded} נרשמו)
            </span>
          </div>
        ) : job.status === 'in_progress' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-950 border border-amber-300 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-600"></span>
            <span>🟡 בביצוע / עובדים נרשמו</span>
            <span className="font-extrabold text-amber-900">
              ({registeredWorkers.length > 0 ? `${registeredWorkers.length} עובדים` : 'נלקח'})
            </span>
          </div>
        ) : job.status === 'completed' ? (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-800 border border-slate-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
            <span>✅ הושלם בהצלחה</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-100 text-red-900 border border-red-300">
            <span>❌ מודעה בוטלה</span>
          </div>
        )}

        {isCreator && (
          <span className="text-[11px] font-black text-teal-900 bg-teal-50 px-2 py-0.5 rounded-lg border border-teal-200">
            מודעה שפרסמת
          </span>
        )}
      </div>

      {/* Top Banner: Category Icon, Title, and Payment (Clean & High Contrast) */}
      <div className="flex items-start justify-between gap-3 sm:gap-4 mb-3">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Big, Friendly Visual Icon */}
          <div className={`w-13 h-13 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-2xs border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} group-hover:scale-105 transition-transform`}>
            {categoryMeta.emoji}
          </div>

          <div className="flex-1 min-w-0">
            {/* Title */}
            <h3 className="text-base sm:text-xl font-black text-slate-900 group-hover:text-teal-800 transition-colors leading-snug truncate">
              {job.title}
            </h3>

            {/* Location and Category Label */}
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-slate-600 font-medium">
              <span className="flex items-center gap-1 font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                <span className="truncate">{job.location}</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">
                {categoryMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Large Prominent Payment Pill */}
        <div className="shrink-0 text-left">
          <div className="inline-flex flex-col items-end px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-['Rubik',sans-serif]">
            <span className="text-lg sm:text-2xl font-black leading-tight">
              {formatPayment(job.payment)}
            </span>
          </div>
        </div>
      </div>

      {/* Middle Row: Date, Publisher & Workers Needed */}
      <div className="flex flex-wrap items-center justify-between gap-2 py-2.5 px-3 bg-slate-50/80 rounded-2xl border border-slate-100 text-xs sm:text-sm text-slate-600 mb-3.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="flex items-center gap-1 text-slate-700 font-medium">
            <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>פורסם ע״י {job.creatorName}</span>
          </span>

          {workersNeeded > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-100/70 text-cyan-900 font-bold text-[11px] sm:text-xs">
              <Users className="w-3 h-3 text-cyan-700" />
              <span>דרושים {workersNeeded} עובדים ({spotsLeft} פנויים)</span>
            </span>
          )}

          {isRegistered && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-extrabold text-[11px] sm:text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>נרשמת לעבודה זו 🌟</span>
            </span>
          )}
        </div>

        <span className="text-[11px] sm:text-xs text-slate-400 flex items-center gap-1 mr-auto">
          <Calendar className="w-3 h-3" />
          <span>{formatHebrewDate(job.createdAt)}</span>
        </span>
      </div>

      {/* Optional Details preview if exists */}
      {job.details && (
        <p className="text-xs sm:text-sm text-slate-600 line-clamp-1 mb-3.5 font-normal">
          {job.details}
        </p>
      )}

      {/* Error alert if any */}
      {claimError && (
        <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{claimError}</span>
        </div>
      )}

      {/* If Creator: Show registered workers banner with contact buttons */}
      {isCreator && registeredWorkers.length > 0 && (
        <div className="mb-3.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-700" />
              <span>עובדים שנרשמו לעבודה שלך ({registeredWorkers.length}):</span>
            </span>
            <span className="text-[11px] text-amber-800 font-bold">
              {job.status === 'completed' ? 'העבודה הסתיימה' : 'צור קשר לתיאום'}
            </span>
          </div>

          <div className="space-y-1.5">
            {registeredWorkers.map((w) => (
              <div 
                key={w.uid} 
                className="flex items-center justify-between gap-2 p-2 bg-white rounded-xl border border-amber-200/80 text-xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold">
                    {w.fullName.slice(0, 2)}
                  </div>
                  <div>
                    <span className="font-extrabold text-slate-900 block leading-tight">
                      {w.fullName}
                    </span>
                    {w.youthGroup && (
                      <span className="text-[10px] text-teal-800 font-medium">
                        {w.youthGroup}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={`tel:${w.phoneNumber}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg transition-colors border border-emerald-200"
                    title={`חייג אל ${w.fullName}`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={`https://wa.me/${cleanPhoneForWa(w.phoneNumber)}?text=${encodeURIComponent(`שלום ${w.fullName}, ראיתי שנרשמת לעבודה "${job.title}" שפרסמתי בשלוש - ארבע בקיבוץ`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#128C7E] rounded-lg transition-colors border border-[#25D366]/30"
                    title={`וואטסאפ ל-${w.fullName}`}
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Bar (Single Primary CTA + Secondary Actions) */}
      <div 
        className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Side (Secondary buttons: Share, Edit, Cancel, Details) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id={`btn-details-job-${job.id}`}
            onClick={() => onOpenDetails(job)}
            className="px-3 py-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5"
            title="צפה בפרטים מלאים"
          >
            <span>פרטים נוספים</span>
            <ArrowLeft className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
            <button
              id={`btn-share-job-${job.id}`}
              onClick={() => onOpenShare(job)}
              className="px-3 py-2 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs sm:text-sm font-bold rounded-xl transition-colors flex items-center gap-1.5"
              title="שתף מודעה בוואטסאפ"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>שתף</span>
            </button>
          )}

          {canEditOrRemove && job.status !== 'completed' && job.status !== 'cancelled' && (
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                id={`btn-edit-job-${job.id}`}
                onClick={() => onEditJob(job)}
                className="p-1.5 text-slate-700 hover:text-teal-800 hover:bg-white rounded-lg transition-all"
                title="ערוך מודעה"
              >
                <Edit3 className="w-3.5 h-3.5 text-teal-700" />
              </button>
              <button
                id={`btn-delete-job-${job.id}`}
                onClick={handleDeleteJob}
                disabled={actionLoading}
                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-white rounded-lg transition-all"
                title="הסר מודעה"
              >
                <Trash2 className="w-3.5 h-3.5 text-red-600" />
              </button>
            </div>
          )}

          {isRegistered && job.status !== 'completed' && job.status !== 'cancelled' && (
            <button
              id={`btn-return-queue-${job.id}`}
              onClick={handleReturnToQueue}
              disabled={actionLoading}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs sm:text-sm font-bold rounded-xl border border-amber-200 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>בטל רישום</span>
            </button>
          )}
        </div>

        {/* Right Side: Primary Big CTA */}
        {canClaim && spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' ? (
          <button
            id={`btn-claim-job-${job.id}`}
            onClick={handleClaim}
            disabled={actionLoading}
            className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-black text-sm sm:text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            {actionLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{workersNeeded > 1 ? `אני רוצה את העבודה (${spotsLeft} פנויים) ✋` : 'אני רוצה את העבודה ✋'}</span>
              </>
            )}
          </button>
        ) : isRegistered && job.status !== 'completed' && job.status !== 'cancelled' ? (
          <button
            id={`btn-complete-job-${job.id}`}
            onClick={handleComplete}
            disabled={actionLoading}
            className="w-full sm:w-auto px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-black rounded-2xl shadow-sm transition-all flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>סמן כהושלם</span>
          </button>
        ) : isCreator ? (
          <button
            onClick={() => onOpenDetails(job)}
            className="w-full sm:w-auto px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 text-xs sm:text-sm font-bold rounded-2xl transition-colors flex items-center justify-center gap-1.5"
          >
            <span>ניהול מודעה ועובדים</span>
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
        ) : job.status === 'completed' ? (
          <span className="inline-flex items-center justify-center gap-1 px-4 py-2 bg-slate-100 text-slate-700 text-xs sm:text-sm font-bold rounded-2xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>העבודה הושלמה</span>
          </span>
        ) : null}
      </div>
    </div>
  );
};
