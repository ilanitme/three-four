import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div 
      id="pwa-offline-indicator"
      className="fixed bottom-20 left-4 z-50 flex items-center gap-2 rounded-2xl bg-amber-600/95 text-white px-4 py-2.5 text-xs font-bold shadow-xl backdrop-blur-xs border border-amber-400/40 animate-pulse"
      dir="rtl"
    >
      <WifiOff className="w-4 h-4" />
      <span>מצב לא מקוון — מציג נתונים שמורים מהמכשיר</span>
    </div>
  );
};
