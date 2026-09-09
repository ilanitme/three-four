import React from 'react';
import { Layers, User as UserIcon } from 'lucide-react';
import { AppTab, UserProfile } from '../types';

interface BottomNavProps {
  currentTab: AppTab;
  onSelectTab: (tab: AppTab) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
  availableCount: number;
  myJobsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  user,
  onOpenAuth,
  availableCount,
  myJobsCount,
}) => {
  return (
    <nav 
      aria-label="ניווט ראשי תחתון"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-4 py-2 flex items-center justify-around max-w-lg mx-auto md:max-w-xl md:rounded-t-3xl md:border-x md:border-slate-200"
      dir="rtl"
    >
      {/* 1. Feed Tab (לוח עבודות) */}
      <button
        id="bottom-nav-tab-feed"
        type="button"
        onClick={() => onSelectTab('feed')}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
          currentTab === 'feed'
            ? 'text-emerald-900 bg-emerald-50/90 font-black scale-102 shadow-2xs'
            : 'text-slate-500 hover:text-emerald-800 hover:bg-slate-50 font-bold'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <Layers className={`w-6 h-6 ${currentTab === 'feed' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
          {availableCount > 0 && (
            <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-700 text-white min-w-[18px] text-center shadow-xs">
              {availableCount}
            </span>
          )}
        </div>
        <span className="text-xs mt-1 leading-none font-['Assistant',sans-serif]">
          לוח עבודות
        </span>
      </button>

      {/* Vertical Divider */}
      <div className="h-7 w-[1px] bg-slate-200 mx-2" />

      {/* 2. Dashboard Tab (האזור שלי) */}
      <button
        id="bottom-nav-tab-dashboard"
        type="button"
        onClick={() => {
          if (!user) {
            onOpenAuth();
          } else {
            onSelectTab('dashboard');
          }
        }}
        className={`flex-1 flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer ${
          currentTab === 'dashboard'
            ? 'text-emerald-900 bg-emerald-50/90 font-black scale-102 shadow-2xs'
            : 'text-slate-500 hover:text-emerald-800 hover:bg-slate-50 font-bold'
        }`}
      >
        <div className="relative flex items-center justify-center">
          <UserIcon className={`w-6 h-6 ${currentTab === 'dashboard' ? 'text-emerald-700 stroke-[2.5]' : 'text-slate-500'}`} />
          {myJobsCount > 0 && (
            <span className="absolute -top-1 -right-2.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-slate-800 text-white min-w-[18px] text-center shadow-xs">
              {myJobsCount}
            </span>
          )}
        </div>
        <span className="text-xs mt-1 leading-none font-['Assistant',sans-serif]">
          האזור שלי
        </span>
      </button>
    </nav>
  );
};
