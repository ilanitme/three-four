import React, { useState, useEffect } from 'react';
import { 
  X, 
  MapPin, 
  Coins, 
  Clock, 
  User, 
  Phone, 
  MessageCircle, 
  Share2, 
  CheckCircle2, 
  RotateCcw, 
  Navigation,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Star,
  Users,
  Edit3,
  Trash2
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
  const isJobSeeker = currentUser?.isLookingForJob === true;
  const isEmployer = currentUser && !currentUser.isLookingForJob && !isAdmin;
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
  const isFull = registeredWorkers.length >= workersNeeded && workersNeeded > 0;
  const canRate = (isCreator || isRegistered) && job.status === 'completed';

  // Check if current user already submitted a review
  const hasUserReviewed = reviews.some(r => r.fromUserId === currentUser?.uid);

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
      setClaimError(err.message || 'שגיאה בביטול ההרשמה');
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

  // Maps / Waze URLs
  const wazeUrl = job.coordinates 
    ? `https://waze.com/ul?ll=${job.coordinates.lat},${job.coordinates.lng}&navigate=yes`
    : `https://waze.com/ul?q=${encodeURIComponent(job.location)}&navigate=yes`;

  const googleMapsUrl = job.coordinates
    ? `https://www.google.com/maps/search/?api=1&query=${job.coordinates.lat},${job.coordinates.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location)}`;

  return (
    <>
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
            id="btn-close-details-modal"
            onClick={onClose}
            aria-label="סגור חלון"
            className="absolute top-3 sm:top-4 left-3 sm:left-4 p-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/30 rounded-full transition-colors z-20 backdrop-blur-xs"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Banner - Fixed at top of modal */}
          <div className="bg-gradient-to-r from-teal-700 via-cyan-700 to-emerald-600 p-4 sm:p-6 text-white relative shrink-0">
            <div className="relative z-10 pl-8">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {(() => {
                  const catMeta = getCategoryMeta(job.category, job.title, job.details);
                  return (
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-white text-teal-900 flex items-center gap-1 shadow-xs">
                      <span>{catMeta.emoji}</span>
                      <span>{catMeta.label}</span>
                    </span>
                  );
                })()}
                <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-xs font-black bg-white/20 text-white backdrop-blur border border-white/20 flex items-center gap-1">
                  {job.status === 'completed' && '✓ הושלם בהצלחה'}
                  {job.status === 'cancelled' && 'בוטל'}
                  {job.status !== 'completed' && job.status !== 'cancelled' && (
                    isFull ? `בעבודה (${registeredWorkers.length}/${workersNeeded} נרשמו)` : `פנוי (${spotsLeft} מקומות פנויים) ✨`
                  )}
                </span>
                <span className="text-cyan-100 text-[11px] sm:text-xs font-bold mr-auto">
                  פורסם {formatHebrewDate(job.createdAt)}
                </span>
              </div>
              <h2 className="text-base sm:text-2xl font-black heading-font leading-snug drop-shadow-xs">
                {job.title}
              </h2>
            </div>
            <div className="absolute -left-8 -bottom-8 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none"></div>
          </div>

          {/* Body Content - Scrollable */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto overscroll-contain flex-1">
            
            {claimError && (
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {/* Payment & Location & Workers Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
              <div className="p-3.5 sm:p-4 rounded-2xl bg-teal-50/70 border border-teal-100">
                <span className="text-xs font-bold text-teal-900 block mb-1">
                  תשלום לעובד
                </span>
                <div className="text-lg sm:text-xl font-black text-teal-700 flex items-center gap-1.5">
                  <Coins className="w-5 h-5 text-teal-600 shrink-0" />
                  <span>{formatPayment(job.payment)}</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-500 block mb-1">
                  מיקום העבודה
                </span>
                <div className="text-xs sm:text-sm font-bold text-slate-800 flex items-center gap-1.5 truncate">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>

              <div className="p-3.5 sm:p-4 rounded-2xl bg-cyan-50/80 border border-cyan-100">
                <span className="text-xs font-bold text-cyan-900 block mb-1">
                  מכסת עובדים
                </span>
                <div className="text-xs sm:text-sm font-extrabold text-cyan-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-cyan-600 shrink-0" />
                  <span>{registeredWorkers.length} מתוך {workersNeeded} נרשמו</span>
                </div>
              </div>
            </div>

            {/* Navigation links if coordinates or location available */}
            <div className="flex items-center gap-2">
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <Navigation className="w-4 h-4 text-blue-600" />
                <span>נווט עם Waze</span>
              </a>
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl border border-slate-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <MapPin className="w-4 h-4 text-red-500" />
                <span>פתח ב-Google Maps</span>
              </a>
            </div>

            {/* Detailed description */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 mb-2">
                פירוט והסבר על העבודה:
              </h4>
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                {job.details || 'אין פרטים נוספים. העבודה כפי שתוארה בכותרת.'}
              </div>
            </div>

            {/* Contact Details Section */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">
                  פרטי יוצר המודעה
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-700 font-bold">
                    {job.creatorName}
                  </span>
                  {job.creatorRating && (
                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      <span>{job.creatorRating.toFixed(1)}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Revealed phone if job claimed or user is creator/worker */}
              {(isRegistered || isCreator) ? (
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-mono font-bold text-slate-900">
                    {job.creatorPhone}
                  </span>
                  <div className="flex items-center gap-2">
                    <a
                      href={`tel:${job.creatorPhone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>חייג</span>
                    </a>
                    <a
                      href={`https://wa.me/${cleanPhoneForWa(job.creatorPhone)}?text=${encodeURIComponent(`שלום ${job.creatorName}, אני פונה לגבי העבודה "${job.title}"`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl transition-colors shadow-2xs"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500 font-medium">
                  מספר הטלפון המלא של המזמין ייחשף מיד לאחר הרשמתך לעבודה.
                </p>
              )}

              {/* Multi-Worker Details List */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>רשימת העובדים שנרשמו ({registeredWorkers.length} מתוך {workersNeeded}):</span>
                  </span>
                </div>

                {registeredWorkers.length > 0 ? (
                  <div className="space-y-1.5">
                    {registeredWorkers.map((worker, idx) => (
                      <div key={worker.uid || idx} className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-900">{worker.fullName}</span>
                              {worker.youthGroup && (
                                <span className="text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-bold border border-teal-200">
                                  {worker.youthGroup}
                                </span>
                              )}
                              {worker.uid === currentUser?.uid && (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                                  אתה
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">{worker.phoneNumber}</span>
                          </div>
                          {worker.ratingAverage && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              <span>{worker.ratingAverage.toFixed(1)}</span>
                            </span>
                          )}
                        </div>
                        {(isCreator || isRegistered) && (
                          <div className="flex items-center gap-1.5">
                            <a
                              href={`tel:${worker.phoneNumber}`}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>חייג</span>
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhoneForWa(worker.phoneNumber)}?text=${encodeURIComponent(`שלום ${worker.fullName}, אני פונה בקשר לעבודה "${job.title}"`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition-colors"
                              title="וואטסאפ"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    טרם נרשמו עובדים. הירשם ראשון!
                  </p>
                )}
              </div>
            </div>

            {/* Completed Job Reviews Section */}
            {job.status === 'completed' && (
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span>דירוגים וחוות דעת על העבודה</span>
                  </span>
                  
                  {canRate && !hasUserReviewed && (
                    <button
                      type="button"
                      onClick={() => setShowRatingModal(true)}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-colors"
                    >
                      דרג כעת +
                    </button>
                  )}
                </div>

                {reviews.length > 0 ? (
                  <div className="space-y-2 pt-1">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="p-3 bg-white rounded-xl border border-amber-100 shadow-2xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-800">
                            {rev.fromUserName} ({rev.role === 'creator' ? 'מזמין העבודה' : 'העובד'})
                          </span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {rev.comment && (
                          <p className="text-xs text-slate-600 mt-1 italic">
                            &quot;{rev.comment}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-amber-800/80">
                    טרם נמסרה חוות דעת עבור עבודה זו.
                  </p>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              {canClaim && !isRegistered && spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id="btn-modal-claim-job"
                  onClick={handleClaim}
                  disabled={loading}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white font-black text-sm sm:text-base shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                      <span>{workersNeeded > 1 ? `הירשם לעבודה זו עכשיו (${spotsLeft} מקומות פנויים) ✋` : 'קח עבודה זו עכשיו 🚀'}</span>
                    </>
                  )}
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
                      className="py-3 px-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Edit3 className="w-4 h-4 text-teal-600" />
                      <span>ערוך מודעה</span>
                    </button>
                  )}
                  <button
                    id="btn-modal-delete-job"
                    onClick={handleDeleteJob}
                    disabled={loading}
                    className="py-3 px-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs border border-red-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <span>הסר מודעה</span>
                  </button>
                </div>
              )}

              {spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id="btn-modal-share-job"
                  onClick={() => {
                    onClose();
                    onOpenShare(job);
                  }}
                  className="w-full py-3 px-4 rounded-2xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] font-bold text-xs border border-[#25D366]/30 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>שתף מודעה זו לקבוצות וואטסאפ</span>
                </button>
              )}

              {isRegistered && job.status !== 'completed' && job.status !== 'cancelled' && (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="btn-modal-return-queue"
                    onClick={handleReturnToQueue}
                    disabled={loading}
                    className="py-3 px-3 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs border border-amber-200 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>בטל רישום</span>
                  </button>
                  <button
                    id="btn-modal-complete-worker"
                    onClick={handleComplete}
                    disabled={loading}
                    className="py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>סמן כהושלם</span>
                  </button>
                </div>
              )}

              {isCreator && (registeredWorkers.length > 0 || job.workerId) && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id="btn-modal-complete-creator"
                  onClick={handleComplete}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>סמן שהעבודה הושלמה בהצלחה ({registeredWorkers.length} עובדים)</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Standalone Rating Modal if opened */}
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
