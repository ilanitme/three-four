import React, { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  auth, 
  fetchUserProfile, 
  logoutUser, 
  subscribeAvailableJobs, 
  subscribeUserPostedJobs, 
  subscribeUserClaimedJobs, 
  subscribeAllJobs,
  fetchJobById,
  createJob
} from './lib/firebase';
import { Job, UserProfile, AppTab } from './types';
import { Header } from './components/Header';
import { AvailableJobsFeed } from './components/AvailableJobsFeed';
import { DashboardView } from './components/DashboardView';
import { AuthModal } from './components/AuthModal';
import { PostJobModal } from './components/PostJobModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { JobDetailsModal } from './components/JobDetailsModal';
import { CsvExportModal } from './components/CsvExportModal';
import { WhatsAppBotSettingsModal } from './components/WhatsAppBotSettingsModal';
import { downloadJobsCsvFile } from './lib/googleSheetsService';
import { sendGreenApiJobNotification } from './lib/greenApiService';
import { Sparkles, MessageCircle, Heart, Phone, PhoneCall } from 'lucide-react';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { OfflineIndicator } from './components/OfflineIndicator';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const localStored = localStorage.getItem('quickjobs_active_user');
      return localStored ? JSON.parse(localStored) : null;
    } catch {
      return null;
    }
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [currentTab, setCurrentTab] = useState<AppTab>('feed');

  // Jobs Lists (initialized with local cache to avoid flicker on refresh)
  const [availableJobs, setAvailableJobs] = useState<Job[]>(() => {
    try {
      const cached = localStorage.getItem('quickjobs_cached_available');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [postedJobs, setPostedJobs] = useState<Job[]>([]);
  const [claimedJobs, setClaimedJobs] = useState<Job[]>([]);
  const [allFirestoreJobs, setAllFirestoreJobs] = useState<Job[]>([]);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('register');
  const [postJobModalOpen, setPostJobModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareJob, setShareJob] = useState<Job | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [csvExportModalOpen, setCsvExportModalOpen] = useState(false);
  const [whatsAppBotModalOpen, setWhatsAppBotModalOpen] = useState(false);

  // 1. Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        let profile = await fetchUserProfile(user.uid);
        if (!profile) {
          const localStored = localStorage.getItem('quickjobs_active_user');
          if (localStored) {
            try {
              const parsed = JSON.parse(localStored);
              if (parsed.uid) {
                profile = await fetchUserProfile(parsed.uid);
              }
              if (!profile) profile = parsed;
            } catch {}
          }
        }
        if (profile) {
          setCurrentUser(profile);
          try {
            localStorage.setItem('quickjobs_active_user', JSON.stringify(profile));
          } catch {}
        } else {
          setCurrentUser({
            uid: user.uid,
            fullName: user.displayName || 'משתמש',
            phoneNumber: user.phoneNumber || '050-0000000',
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        const localStored = localStorage.getItem('quickjobs_active_user');
        if (localStored) {
          try {
            const parsed = JSON.parse(localStored);
            setCurrentUser(parsed);
            // Re-fetch from firestore to verify current IsAdmin status
            if (parsed.uid) {
              fetchUserProfile(parsed.uid).then(fresh => {
                if (fresh) {
                  setCurrentUser(fresh);
                  localStorage.setItem('quickjobs_active_user', JSON.stringify(fresh));
                }
              }).catch(() => {});
            }
          } catch (e) {
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Available Jobs in real-time
  useEffect(() => {
    const unsubscribe = subscribeAvailableJobs((jobs) => {
      setAvailableJobs(jobs);

      // Seed initial welcoming jobs if database is fresh
      if (jobs.length === 0) {
        seedInitialJobsIfEmpty();
      }
    });

    const unsubAll = subscribeAllJobs((jobs) => {
      setAllFirestoreJobs(jobs);
    });

    return () => {
      unsubscribe();
      unsubAll();
    };
  }, []);

  // Function to seed demo jobs if collection is completely fresh
  const seedInitialJobsIfEmpty = async () => {
    const hasSeeded = localStorage.getItem('kibbutz_jobs_demo_seeded_v2');
    if (hasSeeded) return;
    localStorage.setItem('kibbutz_jobs_demo_seeded_v2', 'true');

    try {
      await createJob({
        title: 'בייביסיטר לשני ילדים מקסימים',
        category: 'בייביסיטר',
        details: 'השגחה בין 18:00 ל-21:00, כולל ארוחת ערב והשכבה.',
        location: 'שכונת הרחבה חדשה, בית 114',
        coordinates: { lat: 32.7015, lng: 35.3021 },
        payment: 60,
        creatorId: 'kibbutz_member_1',
        creatorName: 'יעל כהן',
        creatorPhone: '052-4455667',
        creatorRating: 4.9,
      });

      await createJob({
        title: 'טיול יומי עם הכלב רקסי',
        category: 'טיול עם הכלב',
        details: 'כלב גולדן ידידותי מאוד. טיול של חצי שעה בשבילי הקיבוץ.',
        location: 'קיבוץ ישן, ליד המועדון',
        coordinates: { lat: 32.7020, lng: 35.3035 },
        payment: 40,
        creatorId: 'kibbutz_member_2',
        creatorName: 'אורי לוי',
        creatorPhone: '054-9988776',
        creatorRating: 5.0,
      });

      await createJob({
        title: 'עזרה בגינון ופינוי גזם למכולה',
        category: 'עזרה בגינון או פינוי פסולת',
        details: 'גיזום שיחים, איסוף עלים ופינוי עם מריצה למכולת הגזם של הקיבוץ.',
        location: 'הרחבה ישנה, בית 45',
        coordinates: { lat: 32.7008, lng: 35.3012 },
        payment: 150,
        creatorId: 'kibbutz_member_3',
        creatorName: 'נועם שמיר',
        creatorPhone: '050-1122334',
        creatorRating: 4.8,
      });

      await createJob({
        title: 'שטיפת כלים וסירים לאחר אירוח',
        category: 'שטיפת כלים',
        details: 'עזרה של שעה בשטיפת כלים וסדר במטבח לאחר מפגש משפחתי.',
        location: 'אזור חדר האוכל, שביל האקליפטוס',
        coordinates: { lat: 32.7025, lng: 35.3040 },
        payment: 80,
        creatorId: 'kibbutz_member_4',
        creatorName: 'רונית ברק',
        creatorPhone: '053-7788990',
        creatorRating: 4.9,
      });
    } catch (e) {
      console.warn('Initial kibbutz seed skipped:', e);
    }
  };

  // 3. Subscribe to user posted & claimed jobs
  useEffect(() => {
    if (!currentUser) {
      setPostedJobs([]);
      setClaimedJobs([]);
      return;
    }

    const unsubPosted = subscribeUserPostedJobs(currentUser.uid, (jobs) => {
      setPostedJobs(jobs);
    });

    const unsubClaimed = subscribeUserClaimedJobs(currentUser.uid, (jobs) => {
      setClaimedJobs(jobs);
    });

    return () => {
      unsubPosted();
      unsubClaimed();
    };
  }, [currentUser]);

  // 4. Handle Deep Link (?jobId=XYZ)
  useEffect(() => {
    const handleUrlParams = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const jobIdParam = urlParams.get('jobId');

      if (jobIdParam) {
        const job = await fetchJobById(jobIdParam);
        if (job) {
          setSelectedJob(job);
          setDetailsModalOpen(true);
        }
      }
    };

    handleUrlParams();
  }, []);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'register' = 'register') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setCurrentTab('feed');
  };

  const handleOpenPostJob = () => {
    if (!currentUser) {
      handleOpenAuth('register');
      return;
    }
    setEditingJob(null);
    setPostJobModalOpen(true);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setPostJobModalOpen(true);
  };

  const handleJobSaved = (jobId: string, isNew: boolean, createdJobObj?: Job) => {
    if (isNew) {
      if (createdJobObj) {
        // Automatic background dispatch to WhatsApp group via Green API
        sendGreenApiJobNotification(createdJobObj).catch(console.warn);
      } else {
        fetchJobById(jobId).then((createdJob) => {
          if (createdJob) {
            sendGreenApiJobNotification(createdJob).catch(console.warn);
          }
        });
      }
    }
  };

  const handleOpenShare = (job: Job) => {
    setShareJob(job);
    setShareModalOpen(true);
  };

  const handleOpenDetails = (job: Job) => {
    setSelectedJob(job);
    setDetailsModalOpen(true);
  };

  // Combine all jobs for sync (using all Firestore jobs collection if available, fallback to combined views)
  const allKnownJobs = allFirestoreJobs.length > 0 
    ? allFirestoreJobs 
    : [
        ...availableJobs,
        ...postedJobs.filter(pj => !availableJobs.some(aj => aj.id === pj.id)),
        ...claimedJobs.filter(cj => !availableJobs.some(aj => aj.id === cj.id) && !postedJobs.some(pj => pj.id === cj.id))
      ];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-teal-50/20 to-sky-50/30 text-slate-800 font-sans" dir="rtl">
      
      {/* PWA Mobile Install Banner (iPhone & Android) */}
      <PWAInstallBanner />

      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'post') {
            handleOpenPostJob();
          } else {
            setCurrentTab(tab);
          }
        }}
        user={currentUser}
        onOpenAuth={() => handleOpenAuth('register')}
        onLogout={handleLogout}
        availableCount={availableJobs.length}
        myJobsCount={postedJobs.length + claimedJobs.length}
        onOpenGoogleSheets={() => setCsvExportModalOpen(true)}
        onOpenGoogleSheetsFile={() => downloadJobsCsvFile(allKnownJobs)}
        onOpenWhatsAppBot={() => setWhatsAppBotModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12">
        {currentTab === 'feed' && (
          <AvailableJobsFeed
            jobs={availableJobs}
            currentUser={currentUser}
            onOpenAuth={() => handleOpenAuth('register')}
            onOpenPostJob={handleOpenPostJob}
            onOpenShare={handleOpenShare}
            onOpenDetails={handleOpenDetails}
            onEditJob={handleEditJob}
          />
        )}

        {currentTab === 'dashboard' && currentUser && (
          <DashboardView
            user={currentUser}
            postedJobs={postedJobs}
            claimedJobs={claimedJobs}
            allJobs={allKnownJobs}
            onOpenPostJob={handleOpenPostJob}
            onOpenShare={handleOpenShare}
            onOpenDetails={handleOpenDetails}
            onEditJob={handleEditJob}
            onOpenGoogleSheets={() => setCsvExportModalOpen(true)}
            onOpenGoogleSheetsFile={() => setCsvExportModalOpen(true)}
            onOpenWhatsAppBot={() => setWhatsAppBotModalOpen(true)}
            onRefreshUser={() => {
              if (currentUser?.uid) {
                fetchUserProfile(currentUser.uid).then((updated) => {
                  if (updated) setCurrentUser(updated);
                });
              }
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-500 mb-16 md:mb-0">
        <div className="max-w-5xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">שלוש - ארבע • לוח עבודות בקיבוץ</span>
            <span>•</span>
            <span>לוח עבודות מהיר בזמן אמת</span>
          </div>

          {/* Technical Support Phone Link */}
          <div className="flex items-center gap-2.5 bg-teal-50/80 border border-teal-200/80 px-4 py-1.5 rounded-full text-slate-700 shadow-2xs">
            <span className="text-xs font-medium text-slate-800">לתמיכה טכנית נא לפנות לאילנית:</span>
            <a
              id="footer-call-ilanit-support"
              href="tel:0549311010"
              className="inline-flex items-center gap-1.5 font-extrabold text-teal-800 hover:text-teal-950 transition-colors"
              title="התקשר לאילנית - 054-9311010"
            >
              <PhoneCall className="w-3.5 h-3.5 text-teal-600" />
              <span dir="ltr" className="font-mono">054-9311010</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWhatsAppBotModalOpen(true)}
              className="text-emerald-700 hover:text-emerald-800 font-bold hover:underline cursor-pointer"
            >
              בוט וואטסאפ (Green API) 🤖
            </button>
            <span>•</span>
            <button
              onClick={() => setCsvExportModalOpen(true)}
              className="text-teal-700 hover:text-teal-800 font-bold hover:underline cursor-pointer"
            >
              הורדת יומן עבודות (CSV / Excel) 📊
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={(profile) => {
          setCurrentUser(profile);
          setAuthModalOpen(false);
        }}
      />

      {currentUser && (
        <PostJobModal
          isOpen={postJobModalOpen}
          onClose={() => setPostJobModalOpen(false)}
          user={currentUser}
          editingJob={editingJob}
          onJobSaved={handleJobSaved}
        />
      )}

      <WhatsAppShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        job={shareJob}
      />

      <JobDetailsModal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        job={selectedJob}
        currentUser={currentUser}
        onOpenAuth={() => handleOpenAuth('register')}
        onOpenShare={handleOpenShare}
        onEditJob={handleEditJob}
        onJobUpdated={() => {
          if (selectedJob) {
            fetchJobById(selectedJob.id).then((j) => setSelectedJob(j));
          }
        }}
      />

      {/* CSV / Excel Export Modal (Offline, Secure, Instant) */}
      <CsvExportModal
        isOpen={csvExportModalOpen}
        onClose={() => setCsvExportModalOpen(false)}
        allJobs={allKnownJobs}
      />

      {/* WhatsApp Bot (Green API) Automation Modal */}
      <WhatsAppBotSettingsModal
        isOpen={whatsAppBotModalOpen}
        onClose={() => setWhatsAppBotModalOpen(false)}
      />

      {/* Offline Status Indicator */}
      <OfflineIndicator />
    </div>
  );
}
