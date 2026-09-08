import React, { useState } from 'react';
import { X, Star, Sparkles, MessageSquare, CheckCircle2, AlertCircle, Users, User } from 'lucide-react';
import { Job, UserProfile } from '../types';
import { submitFeedbackReview } from '../lib/firebase';
import { triggerCelebrationConfetti } from '../lib/utils';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
  currentUser: UserProfile;
  onSuccess?: () => void;
}

const STAR_LABELS: { [key: number]: string } = {
  1: 'טעון שיפור (1)',
  2: 'סביר (2)',
  3: 'טוב (3)',
  4: 'טוב מאוד (4)',
  5: 'מצוין! מומלץ בחום (5)',
};

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  job,
  currentUser,
  onSuccess,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isCreator = currentUser.uid === job.creatorId;
  const registeredWorkers = Array.isArray(job.registeredWorkers) ? job.registeredWorkers : [];
  
  // If creator, allow picking which worker to review if multiple
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>(() => {
    if (isCreator) {
      if (registeredWorkers.length > 0) return registeredWorkers[0].uid;
      return job.workerId || '';
    }
    return job.creatorId;
  });

  if (!isOpen) return null;

  const targetWorker = registeredWorkers.find(w => w.uid === selectedWorkerId);
  const toUserId = isCreator ? selectedWorkerId : job.creatorId;
  const toUserName = isCreator 
    ? (targetWorker?.fullName || job.workerName || 'העובד') 
    : job.creatorName;
  const role = isCreator ? 'creator' : 'worker';

  if (!toUserId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('אנא בחר דירוג בין 1 ל-5 כוכבים');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitFeedbackReview({
        jobId: job.id,
        jobTitle: job.title,
        fromUserId: currentUser.uid,
        fromUserName: currentUser.fullName,
        toUserId,
        toUserName,
        role,
        rating,
        comment: comment.trim(),
      });

      triggerCelebrationConfetti();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Submit review error:', err);
      setError(err.message || 'אירעה שגיאה בשמירת הדירוג');
    } finally {
      setLoading(false);
    }
  };

  const activeRating = hoverRating || rating;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        dir="rtl"
      >
        {/* Close Button */}
        <button
          id="btn-close-rating-modal"
          onClick={onClose}
          className="absolute top-4 left-4 p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="bg-blue-600 p-6 text-white text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mx-auto mb-2.5 text-amber-300">
            <Star className="w-6 h-6 fill-amber-300" />
          </div>
          <h2 className="text-xl font-black heading-font">
            דירוג וחוות דעת
          </h2>
          <p className="text-blue-100 text-xs mt-1">
            עבור {toUserName} על העבודה &quot;{job.title}&quot;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-right">
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* If Creator and multiple workers, pick which worker to review */}
          {isCreator && registeredWorkers.length > 1 && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span>בחר איזה עובד ברצונך לדרג:</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {registeredWorkers.map((worker) => (
                  <button
                    key={worker.uid}
                    type="button"
                    onClick={() => setSelectedWorkerId(worker.uid)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-right flex items-center gap-2 ${
                      selectedWorkerId === worker.uid
                        ? 'bg-blue-50 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{worker.fullName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Star Selection */}
          <div className="text-center py-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              בחר דירוג כוכבים:
            </label>
            <div className="flex items-center justify-center gap-2" dir="ltr">
              {[1, 2, 3, 4, 5].map((starNum) => (
                <button
                  key={starNum}
                  type="button"
                  id={`btn-star-${starNum}`}
                  onClick={() => setRating(starNum)}
                  onMouseEnter={() => setHoverRating(starNum)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 hover:scale-125 transition-transform cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 ${
                      starNum <= activeRating
                        ? 'text-amber-400 fill-amber-400 drop-shadow-xs'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-xs font-bold text-blue-700 mt-2 min-h-4">
              {STAR_LABELS[activeRating] || ''}
            </p>
          </div>

          {/* Comment Textarea */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span>חוות דעת מילולית (מומלץ)</span>
              <span className="text-[10px] text-slate-400 font-normal">אופציונלי</span>
            </label>
            <textarea
              id="input-review-comment"
              rows={3}
              placeholder="איך הייתה חווית השירות, העמידה בזמנים והתקשורת?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-medium resize-none"
            />
          </div>

          {/* Submit button */}
          <button
            id="btn-submit-rating"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-sm shadow-md shadow-blue-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>פרסם דירוג וחוות דעת</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
