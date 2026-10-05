import React, { useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline, wasOffline, setWasOffline } = useOnlineStatus();

  // If back online after being offline, show temporary reconnection banner for 4 seconds
  useEffect(() => {
    if (isOnline && wasOffline) {
      const timer = setTimeout(() => {
        setWasOffline(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline, setWasOffline]);

  if (!isOnline) {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-amber-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all">
        <WifiOff className="w-4 h-4 animate-pulse shrink-0" />
        <span>Internet aloqasi uzildi. Javoblaringiz qurilmada saqlanmoqda. Testni davom ettirishingiz mumkin.</span>
      </div>
    );
  }

  if (wasOffline) {
    return (
      <div className="sticky top-0 z-50 flex items-center justify-center gap-2 bg-emerald-600 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md transition-all">
        <Wifi className="w-4 h-4 shrink-0" />
        <span>Internet aloqasi tiklandi. Saqlangan javoblar server bilan sinxronlashtirilmoqda.</span>
      </div>
    );
  }

  return null;
};
