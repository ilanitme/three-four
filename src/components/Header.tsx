import React from 'react';
import { UserProfile, AppTab } from '../types';
import { ThreeFourLogo } from './ThreeFourLogo';
import { isUserAdmin } from '../lib/firebase';
import { 
  User as UserIcon, 
  LogOut, 
  FileSpreadsheet,
  MessageSquare
} from 'lucide-react';
import { PWAInstallButton } from './PWAInstallButton';

interface HeaderProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenGoogleSheets?: () => void;
  onOpenGoogleSheetsFile?: () => void;
  onOpenWhatsAppBot?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSelectTab,
  user,
  onOpenAuth,
  onLogout,
  onOpenGoogleSheets,
  onOpenGoogleSheetsFile,
  onOpenWhatsAppBot,
}) => {
  const isAdmin = isUserAdmin(user);

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 shadow-xs">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div 
            id="brand-logo-button"
            onClick={() => onSelectTab('feed')}
            className="cursor-pointer select-none shrink-0"
          >
            <ThreeFourLogo size="md" />
          </div>

          {/* Action Area: Admin shortcuts & User Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {/* CSV Export Button (ADMIN ONLY) */}
            {isAdmin && (
              <button
                id="nav-btn-sheets"
                onClick={onOpenGoogleSheets || onOpenGoogleSheetsFile}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-bold text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
                title="הורדת יומן עבודות לקובץ CSV / Excel"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-600" />
                <span className="hidden sm:inline">הורד CSV</span>
              </button>
            )}

            {/* WhatsApp Bot (ADMIN ONLY) */}
            {isAdmin && onOpenWhatsAppBot && (
              <button
                id="nav-btn-whatsapp-bot"
                onClick={onOpenWhatsAppBot}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors shadow-2xs cursor-pointer"
                title="הגדרות בוט וואטסאפ אוטומטי (מנהל מערכת)"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">בוט וואטסאפ</span>
              </button>
            )}

            {/* PWA Install Button */}
            <PWAInstallButton variant="header" className="hidden sm:inline-flex" />

            {/* User Profile & Auth */}
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div 
                  onClick={() => onSelectTab('dashboard')}
                  className="flex items-center gap-2 pr-2 pl-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-emerald-50 cursor-pointer transition-colors border border-slate-200"
                  title="עבור לאזור האישי"
                >
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                    {user.fullName.slice(0, 2) || 'יש'}
                  </div>
                  <div className="text-right hidden sm:block">
                    <div className="text-xs font-extrabold text-slate-900 leading-tight">
                      {user.fullName}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {user.phoneNumber}
                    </div>
                  </div>
                </div>

                <button
                  id="btn-logout"
                  onClick={onLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 cursor-pointer"
                  title="התנתק"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                id="btn-open-login"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs sm:text-sm font-bold transition-colors shrink-0 cursor-pointer shadow-2xs"
              >
                <UserIcon className="w-4 h-4 text-emerald-700" />
                <span>התחברות</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};
