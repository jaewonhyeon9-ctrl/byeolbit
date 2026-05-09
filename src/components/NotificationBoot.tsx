'use client';

import { useEffect } from 'react';
import { fireAllDueChecks, registerServiceWorker } from '@/lib/notifications';

export function NotificationBoot() {
  useEffect(() => {
    void registerServiceWorker().then(() => {
      void fireAllDueChecks();
    });
  }, []);
  return null;
}
