import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Coins, 
  User, 
  Phone, 
  MessageCircle, 
  Share2, 
  CheckCircle2, 
  RotateCcw, 
  Navigation,
  Sparkles,
  AlertCircle,
  Star,
  Users,
  Edit3,
  Trash2,
  Calendar
} from 'lucide-react';
import { Job, UserProfile, FeedbackReview } from '../types';
import { formatPayment, formatHebrewDate, triggerCelebrationConfetti } from '../lib/utils';
import { 
  claimJobTransaction, 
  returnJobToQueue, 
  markJobCompleted, 
  fetchJobReviews,
  deleteJob,
  isUserAdmin
} from '../lib/firebase';
import { RatingModal } from './RatingModal';
import { getCategoryMeta } from '../constants/kibbutz';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job | null;
  currentUser: UserProfile | null;
  onOpenAuth: () => void;
  onOpenShare: (job: Job) => void;
  onEditJob?: (job: Job) => void;
  onJobUpdated?: () => void;
  onClaimSuccess?: (job: Job) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  isOpen,
  onClose,
  job,
  currentUser,
  onOpenAuth,
  onOpenShare,
  onEditJob,
  onJobUpdated,
  onClaimSuccess,
}) => {
  const [loading, setLoading] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<FeedbackReview[]>([]);
  const [showRatingModal, setShowRatingModal] = useState(false);

  useEffect(() => {
    if (job?.id && isOpen) {
      fetchJobReviews(job.id).then(setReviews).catch(console.error);
    }
  }, [job?.id, isOpen]);

  if (!isOpen || !job) return null;

  const isAdmin = isUserAdmin(currentUser);
  const isCreator = currentUser?.uid === job.creatorId;
  const canEditOrRemove = isCreator || isAdmin;
  const workersNeeded = Math.max(1, job.workersNeeded || 1);
  const registeredWorkers = Array.isArray(job.registeredWorkers) ? job.registeredWorkers : [];
  
  const isRegistered = currentUser ? (
    registeredWorkers.some(w => w.uid === currentUser.uid) || 
    (Array.isArray(job.registeredWorkerIds) && job.registeredWorkerIds.includes(currentUser.uid)) ||
    job.workerId === currentUser.uid
  ) : false;

  const canClaim = !isCreator && !isRegistered;
  const spotsLeft = Math.max(0, workersNeeded - registeredWorkers.length);
  const canRate = (isCreator || isRegistered) && job.status === 'completed';
  const hasUserReviewed = reviews.some(r => r.fromUserId === currentUser?.uid);
  const categoryMeta = getCategoryMeta(job.category, job.title, job.details);

  const cleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) clean = '972' + clean.slice(1);
    return clean;
  };

  const handleClaim = async () => {
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

    setLoading(true);
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
      if (onJobUpdated) onJobUpdated();
      onClose();
      if (onClaimSuccess) onClaimSuccess(job);
    } catch (err: any) {
      console.error('Claim error in modal:', err);
      setClaimError(err.message || 'שגיאה ברישום לעבודה');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!currentUser) return;

    setLoading(true);
    setClaimError(null);
    try {
      await deleteJob(job.id, currentUser.uid, isAdmin);
      if (onJobUpdated) onJobUpdated();
      onClose();
    } catch (err: any) {
      setClaimError(err.message || 'שגיאה במחיקת העבודה');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToQueue = async () => {
    if (!currentUser) return;

    setLoading(true);
    setClaimError(null);
    try {
      await returnJobToQueue(job.id, currentUser.uid);
      if (onJobUpdated) onJobUpdated();
      onClose();
    } catch (err: any) {
      setClaimError(err.message || 'שגיאה בביטול הרישום');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!currentUser) return;

    setLoading(true);
    setClaimError(null);
    try {
      await markJobCompleted(job.id, currentUser.uid);
      triggerCelebrationConfetti();
      if (onJobUpdated) onJobUpdated();
      setShowRatingModal(true);
    } catch (err: any) {
      setClaimError(err.message || 'שגיאה בסיום העבודה');
    } finally {
      setLoading(false);
    }
  };

  // Map URLs
  const encodedLoc = encodeURIComponent(job.location || 'קיבוץ');
  const wazeUrl = job.coordinates
    ? `https://waze.com/ul?ll=${job.coordinates.lat},${job.coordinates.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodedLoc}&navigate=yes`;
  const googleMapsUrl = job.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${job.coordinates.lat},${job.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodedLoc}`;

  return (
    <>
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
            id="btn-close-job-details"
            onClick={onClose}
            aria-label="סגור חלון"
            className="absolute top-4 left-4 p-2 text-white bg-black/25 hover:bg-black/40 rounded-full transition-colors z-20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Modal Header */}
          <div className="bg-emerald-800 p-5 sm:p-6 text-white relative shrink-0">
            <div className="flex items-center gap-3.5 pl-10">
              <div className="w-13 h-13 rounded-2xl bg-white/15 flex items-center justify-center text-3xl shrink-0">
                {categoryMeta.emoji}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs bg-emerald-700 text-emerald-100 px-2.5 py-0.5 rounded-full font-bold">
                    {categoryMeta.label}
                  </span>
                  <span className="text-xs text-emerald-200">
                    פורסם {formatHebrewDate(job.createdAt)}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black heading-font leading-snug truncate">
                  {job.title}
                </h2>
              </div>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto overscroll-contain flex-1">
            
            {claimError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {/* Prominent Status Indicator Box */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
              job.status === 'new'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : job.status === 'in_progress'
                ? 'bg-amber-50 border-amber-200 text-amber-950'
                : job.status === 'completed'
                ? 'bg-slate-50 border-slate-300 text-slate-800'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  job.status === 'new'
                    ? 'bg-emerald-600 animate-pulse'
                    : job.status === 'in_progress'
                    ? 'bg-amber-500'
                    : job.status === 'completed'
                    ? 'bg-slate-600'
                    : 'bg-red-500'
                }`} />
                <div>
                  <div className="text-sm font-black flex items-center gap-1.5">
                    <span>סטטוס:</span>
                    <span>
                      {job.status === 'new' && '🟢 פתוח להרשמה (ממתין לעובדים)'}
                      {job.status === 'in_progress' && '🟡 נלקח / בביצוע'}
                      {job.status === 'completed' && '✅ העבודה הושלמה'}
                      {job.status === 'cancelled' && '❌ המודעה בוטלה'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-0.5">
                    {job.status === 'new' && (
                      spotsLeft > 0 
                        ? `דרושים ${workersNeeded} עובדים (${spotsLeft} מקומות פנויים)` 
                        : 'ממתין לעובד'
                    )}
                    {job.status === 'in_progress' && (
                      registeredWorkers.length > 0 
                        ? `${registeredWorkers.length} עובדים נרשמו - בתיאום לביצוע` 
                        : 'עובד שובץ ומבצע את העבודה'
                    )}
                    {job.status === 'completed' && 'העבודה הסתיימה בהצלחה'}
                  </div>
                </div>
              </div>

              {/* Status pill tag */}
              <span className={`px-2.5 py-1 rounded-xl text-xs font-black shrink-0 ${
                job.status === 'new'
                  ? 'bg-emerald-200 text-emerald-900'
                  : job.status === 'in_progress'
                  ? 'bg-amber-200 text-amber-900'
                  : job.status === 'completed'
                  ? 'bg-slate-200 text-slate-900'
                  : 'bg-red-200 text-red-900'
              }`}>
                {job.status === 'new' ? 'פתוח' : job.status === 'in_progress' ? 'בביצוע' : job.status === 'completed' ? 'הושלם' : 'בוטל'}
              </span>
            </div>

            {/* Quick Stats Grid: Pay, Location, Workers */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 block mb-1">
                  תשלום לעובד
                </span>
                <div className="text-xl font-black text-emerald-800 font-['Rubik',sans-serif] flex items-center gap-1">
                  <Coins className="w-5 h-5 text-emerald-700 shrink-0" />
                  <span>{formatPayment(job.payment)}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-600 block mb-1">
                  מיקום בקיבוץ
                </span>
                <div className="text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
                  <MapPin className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-cyan-50 border border-cyan-200">
                <span className="text-xs font-bold text-cyan-900 block mb-1">
                  מכסת עובדים
                </span>
                <div className="text-sm font-extrabold text-cyan-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-700 shrink-0" />
                  <span>{registeredWorkers.length} מתוך {workersNeeded} נרשמו</span>
                </div>
              </div>
            </div>

            {/* Navigation links */}
            <div className="flex items-center gap-2.5">
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>נווט עם Waze</span>
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-red-500" />
                <span>Google Maps</span>
              </a>
            </div>

            {/* Detailed Description */}
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">
                פירוט והסבר על העבודה:
              </h3>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm sm:text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {job.details || 'אין פרטים נוספים. העבודה כפי שתוארה בכותרת.'}
              </div>
            </div>

            {/* Contact Details Card */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  פרטי יוצר המודעה
                </span>
                <span className="text-sm text-slate-900 font-extrabold">
                  {job.creatorName}
                </span>
              </div>

              {/* Revealed Phone if registered or creator */}
              {(isRegistered || isCreator) ? (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <span className="text-sm font-mono font-bold text-slate-900">
                    {job.creatorPhone}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${job.creatorPhone}`}
                      className="flex items-center gap-1 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>חייג</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (isRegistered && !isCreator && onClaimSuccess) {
                          onClose();
                          onClaimSuccess(job);
                        } else {
                          window.open(
                            `https://wa.me/${cleanPhoneForWa(job.creatorPhone)}?text=${encodeURIComponent(`שלום ${job.creatorName}, אני פונה לגבי העבודה "${job.title}" בשלוש - ארבע בקיבוץ`)}`,
                            '_blank'
                          );
                        }
                      }}
                      className="flex items-center gap-1 px-3 py-2 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      title="וואטסאפ"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>וואטסאפ</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                  <span>מספר הטלפון של המפרסם יוצג מיד לאחר ההרשמה לעבודה</span>
                </div>
              )}
            </div>

            {/* List of registered workers for the creator */}
            {isCreator && (
              <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 space-y-2.5">
                <span className="text-xs font-bold text-teal-950 block">
                  עובדים שנרשמו ({registeredWorkers.length} מתוך {workersNeeded}):
                </span>
                {registeredWorkers.length > 0 ? (
                  <div className="space-y-2">
                    {registeredWorkers.map((w, idx) => (
                      <div key={w.uid || idx} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                        <div>
                          <div className="text-xs font-bold text-slate-900">{w.fullName}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{w.phoneNumber}</div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${w.phoneNumber}`}
                            className="p-2 bg-emerald-700 text-white rounded-lg text-xs font-bold"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`https://wa.me/${cleanPhoneForWa(w.phoneNumber)}?text=${encodeURIComponent(`שלום ${w.fullName}, ראיתי שנרשמת לעבודה "${job.title}" שפרסמתי בשלוש - ארבע בקיבוץ`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-[#25D366] text-white rounded-lg text-xs font-bold"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">טרם נרשמו עובדים למודעה זו</p>
                )}
              </div>
            )}

            {/* Primary & Secondary Action CTAs */}
            <div className="pt-2 space-y-2.5">
              {canClaim && !isRegistered && spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id="btn-modal-claim-job"
                  onClick={handleClaim}
                  disabled={loading}
                  className="w-full py-4 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-base sm:text-lg shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-200" />
                      <span>{workersNeeded > 1 ? `אני רוצה את העבודה (${spotsLeft} פנויים) ✋` : 'אני רוצה את העבודה ✋'}</span>
                    </>
                  )}
                </button>
              )}

              {/* WhatsApp Share Button */}
              {spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id="btn-modal-share-job"
                  onClick={() => {
                    onClose();
                    onOpenShare(job);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-sm border border-[#25D366]/30 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>שתף מודעה זו לקבוצות וואטסאפ בקיבוץ</span>
                </button>
              )}

              {/* Creator / Admin Edit and Remove Buttons */}
              {canEditOrRemove && job.status !== 'completed' && job.status !== 'cancelled' && (
                <div className="grid grid-cols-2 gap-2">
                  {onEditJob && (
                    <button
                      id="btn-modal-edit-job"
                      onClick={() => {
                        onClose();
                        onEditJob(job);
                      }}
                      className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-teal-700" />
                      <span>ערוך מודעה</span>
                    </button>
                  )}
                  <button
                    id="btn-modal-delete-job"
                    onClick={handleDeleteJob}
                    disabled={loading}
                    className="py-3 px-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                    <span>הסר מודעה</span>
                  </button>
                </div>
              )}

              {/* Registered worker cancel or complete */}
              {isRegistered && job.status !== 'completed' && job.status !== 'cancelled' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-modal-return-queue"
                    onClick={handleReturnToQueue}
                    disabled={loading}
                    className="py-3 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>בטל רישום</span>
                  </button>
                  <button
                    id="btn-modal-complete-worker"
                    onClick={handleComplete}
                    disabled={loading}
                    className="py-3 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>סמן כהושלם</span>
                  </button>
                </div>
              )}

              {/* Creator mark complete */}
              {isCreator && (registeredWorkers.length > 0 || job.workerId) && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id="btn-modal-complete-creator"
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>סמן שהעבודה הושלמה בהצלחה ({registeredWorkers.length} עובדים)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Standalone Rating Modal */}
      {currentUser && showRatingModal && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => {
            setShowRatingModal(false);
            if (job?.id) {
              fetchJobReviews(job.id).then(setReviews).catch(console.error);
            }
          }}
          job={job}
          currentUser={currentUser}
          onSuccess={() => {
            if (job?.id) {
              fetchJobReviews(job.id).then(setReviews).catch(console.error);
            }
            if (onJobUpdated) onJobUpdated();
          }}
        />
      )}
    </>
  );
};
