import React from 'react';
import { UserProfile, AppTab } from '../types';
import { ThreeFourLogo } from './ThreeFourLogo';
import { isUserAdmin } from '../lib/firebase';
import { 
  Briefcase, 
  PlusCircle, 
  User as UserIcon, 
  LogOut, 
  Sparkles,
  Layers,
  PhoneCall,
  CheckCircle2,
  FileSpreadsheet,
  MessageSquare,
  ShieldAlert
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  availableCount: number;
  myJobsCount: number;
  onOpenGoogleSheets?: () => void;
  onOpenGoogleSheetsFile?: () => void;
  onOpenWhatsAppBot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  availableCount,
  myJobsCount,
  onOpenGoogleSheets,
  onOpenGoogleSheetsFile,
  onOpenWhatsAppBot,
}) => {
  const isAdmin = isUserAdmin(user);
  const isJobSeeker = user?.isLookingForJob === true && !isAdmin;
  const canPublish = !user || (!isJobSeeker || isAdmin);
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          
          {/* Logo & Brand */}
          <div 
            id="brand-logo-button"
            onClick={() => onSelectTab('feed')}
            className="cursor-pointer select-none group shrink-0"
          >
            <ThreeFourLogo size="md" />
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-2">
            <button
              id="nav-tab-feed"
              onClick={() => onSelectTab('feed')}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                currentTab === 'feed'
                  ? 'bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-cyan-500/15 text-teal-900 border border-teal-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-teal-900 hover:bg-teal-50/50'
              }`}
            >
              <Layers className="w-4 h-4 text-teal-600" />
              <span>עבודות פנויות</span>
              {availableCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-xs">
                  {availableCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-dashboard"
              onClick={() => {
                if (!user) {
                  onOpenAuth();
                } else {
                  onSelectTab('dashboard');
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-bold transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-gradient-to-r from-teal-500/15 via-emerald-500/15 to-cyan-500/15 text-teal-900 border border-teal-300/80 shadow-xs'
                  : 'text-slate-600 hover:text-teal-900 hover:bg-teal-50/50'
              }`}
            >
              <UserIcon className="w-4 h-4 text-teal-600" />
              <span>האזור האישי</span>
              {myJobsCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black bg-slate-800 text-white shadow-xs">
                  {myJobsCount}
                </span>
              )}
            </button>

            {/* CSV / Excel Jobs Export Button (ADMIN ONLY) */}
            {isAdmin && (
              <button
                id="nav-btn-sheets"
                onClick={onOpenGoogleSheets || onOpenGoogleSheetsFile}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-teal-900 bg-teal-50/90 hover:bg-teal-100 border border-teal-200 rounded-xl shadow-2xs transition-colors"
                title="הורדת יומן עבודות לקובץ CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span>הורד CSV</span>
              </button>
            )}

            {/* WhatsApp Group Bot Automation Button (ADMIN ONLY) */}
            {isAdmin && onOpenWhatsAppBot && (
              <button
                id="nav-btn-whatsapp-bot"
                onClick={onOpenWhatsAppBot}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs"
                title="הגדרות בוט וואטסאפ אוטומטי (מנהל מערכת)"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>בוט וואטסאפ</span>
              </button>
            )}
          </nav>

          {/* Actions: Post Job & User Auth */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Install PWA Button (iPhone & Android) */}
            <PWAInstallButton variant="header" className="hidden sm:inline-flex" />
            {/* Quick WhatsApp Bot for Mobile (ADMIN ONLY) */}
            {isAdmin && onOpenWhatsAppBot && (
              <button
                id="btn-quick-whatsapp-bot"
                onClick={onOpenWhatsAppBot}
                className="md:hidden p-2 rounded-xl text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shrink-0"
                title="בוט וואטסאפ"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
              </button>
            )}

            {/* Quick CSV Direct Download Button for Tablet/Mobile (ADMIN ONLY) */}
            {isAdmin && (
              <button
                id="btn-quick-google-sheets"
                onClick={onOpenGoogleSheets || onOpenGoogleSheetsFile}
                className="md:hidden p-2 rounded-xl text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 transition-colors flex items-center gap-1 shrink-0"
                title="הורדת יומן עבודות (קובץ CSV)"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
              </button>
            )}

            {/* Publish Job Button (Hidden for Job Seekers) */}
            {canPublish && (
              <button
                id="btn-post-job-header"
                onClick={() => {
                  if (!user) {
                    onOpenAuth();
                  } else {
                    onSelectTab('post');
                  }
                }}
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white text-xs sm:text-sm font-black shadow-md shadow-teal-700/25 transition-all hover:scale-[1.03] active:scale-[0.98] shrink-0 whitespace-nowrap"
              >
                <PlusCircle className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">פרסם עבודה</span>
                <span className="sm:hidden">פרסם +</span>
              </button>
            )}

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div 
                  onClick={() => onSelectTab('dashboard')}
                  className="flex items-center gap-2 pr-1.5 pl-2.5 sm:pr-2 sm:pl-3 py-1 sm:py-1.5 rounded-2xl bg-white hover:bg-teal-50/70 hover:border-teal-300 cursor-pointer transition-colors border border-slate-200 shadow-xs"
                  title="עבור לאזור האישי"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 text-white border-2 border-white shadow-xs flex items-center justify-center text-xs font-bold font-['Rubik',sans-serif]">
                    {user.fullName.slice(0, 2) || 'יש'}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-bold text-slate-800 leading-tight flex items-center gap-1">
                      <span>{user.fullName}</span>
                      {isAdmin ? (
                        <span className="text-[10px] text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded-md font-extrabold border border-amber-300">
                          👑 מנהל
                        </span>
                      ) : user.youthGroup ? (
                        <span className="text-[10px] text-teal-800 bg-teal-100 px-1.5 py-0.2 rounded-md font-extrabold">
                          {user.youthGroup}
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight font-mono">
                      {user.phoneNumber}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                  title="התנתק"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl border border-teal-200 bg-white hover:bg-teal-50 hover:text-teal-900 text-slate-700 text-xs sm:text-sm font-bold shadow-2xs transition-colors shrink-0"
              >
                <UserIcon className="w-4 h-4 text-teal-600" />
                <span>התחברות</span>
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex items-center justify-around shadow-lg pb-safe">
        <button
          id="mobile-nav-feed"
          onClick={() => onSelectTab('feed')}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'feed' ? 'text-teal-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            {availableCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 rounded-full text-[9px] font-bold bg-teal-600 text-white">
                {availableCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">{isJobSeeker ? 'עבודות פנויות' : 'עבודות'}</span>
        </button>

        {canPublish && (
          <button
            id="mobile-nav-post"
            onClick={() => {
              if (!user) {
                onOpenAuth();
              } else {
                onSelectTab('post');
              }
            }}
            className="flex flex-col items-center -mt-6 group"
          >
            <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white flex items-center justify-center shadow-lg shadow-teal-500/30 border-4 border-white active:scale-95 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-black text-teal-900 mt-0.5">פרסם</span>
          </button>
        )}

        <button
          id="mobile-nav-dashboard"
          onClick={() => {
            if (!user) {
              onOpenAuth();
            } else {
              onSelectTab('dashboard');
            }
          }}
          className={`flex flex-col items-center gap-0.5 py-1 px-4 rounded-xl text-xs font-bold transition-colors ${
            currentTab === 'dashboard' ? 'text-teal-700 font-extrabold' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <div className="relative">
            <UserIcon className="w-5 h-5" />
            {myJobsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1.5 rounded-full text-[9px] font-bold bg-slate-800 text-white">
                {myJobsCount}
              </span>
            )}
          </div>
          <span className="text-[11px]">האזור שלי</span>
        </button>
      </div>
    </header>
  );
};
