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
  Users
} from 'lucide-react';
import { Job, UserProfile } from '../types';
import { formatPayment, formatHebrewDate, triggerCelebrationConfetti } from '../lib/utils';
import { claimJobTransaction, returnJobToQueue, markJobCompleted, cancelJob, deleteJob, isUserAdmin } from '../lib/firebase';
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
  const isJobSeeker = currentUser?.isLookingForJob === true;
  const isEmployer = currentUser && !currentUser.isLookingForJob && !isAdmin;
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

  // Format clean phone for WhatsApp link
  const cleanPhoneForWa = (phone: string) => {
    let clean = phone.replace(/\D/g, '');
    if (clean.startsWith('0')) {
      clean = '972' + clean.slice(1);
    }
    return clean;
  };

  // Status & Workers capacity badge
  const getStatusBadge = () => {
    if (job.status === 'completed') {
      return (
        <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-purple-200">
          <CheckCircle2 className="w-3 h-3 text-purple-600" />
          <span>הושלם ({registeredWorkers.length || 1} עובדים)</span>
        </span>
      );
    }

    if (job.status === 'cancelled') {
      return (
        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
          בוטל
        </span>
      );
    }

    if (isFull) {
      return (
        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-emerald-200">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          <span>{registeredWorkers.length}/{workersNeeded} עובדים • מלא</span>
        </span>
      );
    }

    if (registeredWorkers.length > 0) {
      return (
        <span className="text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-teal-200">
          <Users className="w-3.5 h-3.5 text-teal-600" />
          <span>נרשמו {registeredWorkers.length} מתוך {workersNeeded} ({spotsLeft} מקומות פנויים)</span>
        </span>
      );
    }

    return (
      <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 flex items-center gap-1">
        {workersNeeded > 1 && <Users className="w-3.5 h-3.5 text-teal-600" />}
        <span>{workersNeeded > 1 ? `דרושים ${workersNeeded} עובדים • פנוי` : 'פנוי ללקיחה'}</span>
      </span>
    );
  };

  return (
    <div 
      id={`job-card-${job.id}`}
      onClick={() => onOpenDetails(job)}
      className="group relative bg-white rounded-3xl border border-slate-200/90 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/10 transition-all duration-200 p-4 sm:p-6 cursor-pointer text-right"
      dir="rtl"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        
        {/* Category Avatar Box */}
        <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl shrink-0 shadow-xs border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText} group-hover:scale-105 transition-transform`}>
          {categoryMeta.emoji}
        </div>

        {/* Card Content Details */}
        <div className="flex-1 min-w-0">
          
          {/* Top Row: Title and Price */}
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-1.5">
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <h4 className="font-extrabold text-sm sm:text-lg text-slate-900 group-hover:text-teal-700 transition-colors leading-snug">
                  {job.title}
                </h4>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border ${categoryMeta.badgeBg} ${categoryMeta.badgeBorder} ${categoryMeta.badgeText}`}>
                  <span>{categoryMeta.emoji}</span>
                  <span>{categoryMeta.label}</span>
                </span>
              </div>
              {isRegistered && (
                <span className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black bg-gradient-to-r from-emerald-100 to-teal-100 text-teal-900 border border-teal-300">
                  <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-teal-700" />
                  <span>נרשמת לעבודה זו 🌟</span>
                </span>
              )}
            </div>
            <span className="text-base sm:text-2xl font-black text-teal-700 font-['Rubik',sans-serif] shrink-0 bg-teal-50 px-2.5 py-1 rounded-xl border border-teal-100">
              {formatPayment(job.payment)}
            </span>
          </div>

          {/* Sub-meta: Location, Creator & Time */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-slate-500 mb-2.5">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{job.location}</span>
            </span>
            
            <div className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{job.creatorName}</span>
              {job.creatorRating && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                  <span>{job.creatorRating.toFixed(1)}</span>
                </span>
              )}
            </div>

            {workersNeeded > 1 && (
              <span className="flex items-center gap-1 text-[11px] sm:text-xs font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                <Users className="w-3 h-3 text-teal-600" />
                <span>דרושים {workersNeeded}</span>
              </span>
            )}

            <span className="text-[11px] sm:text-xs text-slate-400 mr-auto">
              {formatHebrewDate(job.createdAt)}
            </span>
          </div>

          {/* Details snippet */}
          {job.details && (
            <p className="text-xs text-slate-600 line-clamp-2 mb-3 bg-sky-50/40 p-2 sm:p-2.5 rounded-xl border border-slate-100">
              {job.details}
            </p>
          )}

          {/* Error alert */}
          {claimError && (
            <div className="mb-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{claimError}</span>
            </div>
          )}

          {/* Contact Bar for Active Registered Users or Creator */}
          {(isRegistered || isCreator) && (registeredWorkers.length > 0 || job.workerName) && (
            <div className="mb-3 p-3.5 bg-teal-50/70 rounded-2xl border border-teal-100 space-y-2.5">
              
              {/* If current user is registered worker: show Creator Contact */}
              {isRegistered && (
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] text-teal-800 font-bold block">
                      פרטי מזמין העבודה:
                    </span>
                    <span className="text-xs font-extrabold text-slate-900">
                      {job.creatorName}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    <a
                      href={`tel:${job.creatorPhone}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>חייג: {job.creatorPhone}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        if (onClaimSuccess) {
                          onClaimSuccess(job);
                        } else {
                          window.open(
                            `https://wa.me/${cleanPhoneForWa(job.creatorPhone)}?text=${encodeURIComponent(`שלום ${job.creatorName}, נרשמתי לעבודה "${job.title}" דרך שלוש - ארבע בקיבוץ`)}`,
                            '_blank'
                          );
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
                      title="שלח וואטסאפ עם הפרטים למזמין"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>וואטסאפ למפרסם</span>
                    </button>
                  </div>
                </div>
              )}

              {/* If creator or registered worker: show registered workers list */}
              {isCreator && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] text-teal-900 font-bold flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-teal-700" />
                      <span>עובדים שנרשמו ({registeredWorkers.length} מתוך {workersNeeded}):</span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {registeredWorkers.length > 0 ? (
                      registeredWorkers.map((worker, idx) => (
                        <div key={worker.uid || idx} className="flex flex-wrap items-center justify-between gap-2 p-2 bg-white rounded-xl border border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-900 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-xs font-bold text-slate-900">{worker.fullName}</span>
                                {worker.youthGroup && (
                                  <span className="text-[9px] text-teal-800 bg-teal-50 px-1.5 py-0.2 rounded font-bold border border-teal-200">
                                    {worker.youthGroup}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">{worker.phoneNumber}</span>
                            </div>
                            {worker.ratingAverage && (
                              <span className="inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[10px] font-bold bg-amber-50 text-amber-800">
                                <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                                <span>{worker.ratingAverage.toFixed(1)}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <a
                              href={`tel:${worker.phoneNumber}`}
                              className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Phone className="w-3 h-3" />
                              <span>חייג</span>
                            </a>
                            <a
                              href={`https://wa.me/${cleanPhoneForWa(worker.phoneNumber)}?text=${encodeURIComponent(`שלום ${worker.fullName}, ראיתי שנרשמת לעבודה "${job.title}" שפרסמתי בשלוש - ארבע בקיבוץ`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1 bg-[#25D366] hover:bg-[#20ba59] text-white rounded-lg transition-colors"
                              title="וואטסאפ לעובד"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500">טרם נרשמו עובדים למודעה זו</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom Toolbar & Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              {getStatusBadge()}
              
              {spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id={`btn-share-job-${job.id}`}
                  onClick={() => onOpenShare(job)}
                  className="px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3 text-teal-600" />
                  <span>שתף</span>
                </button>
              )}

              {/* Completed job review action */}
              {job.status === 'completed' && (
                <button
                  id={`btn-view-feedback-${job.id}`}
                  onClick={() => onOpenDetails(job)}
                  className="px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center gap-1"
                >
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>דירוג וחוות דעת</span>
                </button>
              )}

              {/* Creator / Admin Edit and Remove Buttons */}
              {canEditOrRemove && job.status !== 'completed' && job.status !== 'cancelled' && (
                <div className="flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-xl border border-slate-200">
                  <button
                    id={`btn-edit-job-${job.id}`}
                    onClick={() => onEditJob(job)}
                    className="flex items-center gap-1 px-2.5 py-1 text-slate-700 hover:text-teal-800 hover:bg-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                    title="ערוך פרטי מודעה"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                    <span className="hidden sm:inline">ערוך</span>
                  </button>
                  <button
                    id={`btn-delete-job-${job.id}`}
                    onClick={handleDeleteJob}
                    disabled={actionLoading}
                    className="flex items-center gap-1 px-2.5 py-1 text-red-600 hover:text-red-700 hover:bg-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                    title="הסר / מחק מודעה לצמיתות"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    <span className="hidden sm:inline">הסר מודעה</span>
                  </button>
                </div>
              )}

              {/* Registered worker: cancel registration button */}
              {isRegistered && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id={`btn-return-queue-${job.id}`}
                  onClick={handleReturnToQueue}
                  disabled={actionLoading}
                  className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>בטל רישום</span>
                </button>
              )}

              {/* Complete job button for Creator or Registered Worker */}
              {(isRegistered || isCreator) && (registeredWorkers.length > 0 || job.workerId) && job.status !== 'completed' && job.status !== 'cancelled' && (
                <button
                  id={`btn-complete-job-${job.id}`}
                  onClick={handleComplete}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>סמן כהושלם</span>
                </button>
              )}
            </div>

            {/* Primary Claim / Register CTA (Only available for Job Seekers / Guests / Admins) */}
            {canClaim && spotsLeft > 0 && job.status !== 'completed' && job.status !== 'cancelled' && (
              <button
                id={`btn-claim-job-${job.id}`}
                onClick={handleClaim}
                disabled={actionLoading}
                className="w-full sm:w-auto justify-center bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 active:from-teal-800 text-white px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 hover:shadow-lg hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {actionLoading ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
                    <span>{workersNeeded > 1 ? `הירשם לעבודה (${spotsLeft} פנויים) ✋` : 'קח עבודה 🚀'}</span>
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
