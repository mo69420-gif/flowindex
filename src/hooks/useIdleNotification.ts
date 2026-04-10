import { useEffect, useRef } from 'react';
import { useFlow, getCurrentStage } from '@/lib/flowContext';

const IDLE_TIMEOUT = 20 * 60 * 1000; // 20 minutes

/**
 * Patch 13: Notification system — permission-gated, idle detection.
 * Fires after 20 minutes idle when an op is active.
 * References actual operation name and current sector.
 */
export function useIdleNotification() {
  const { state } = useFlow();
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const permissionGranted = useRef(false);

  const opActive = state.scanDone && !state.opReviewed && state.sectorOrder.length > 0;
  const currentKey = getCurrentStage(state);
  const currentSectorName = currentKey ? state.sectors[currentKey]?.name : null;
  const opName = state.operationName;

  // Request permission on first active op
  useEffect(() => {
    if (!opActive) return;
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      permissionGranted.current = true;
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then(p => {
        permissionGranted.current = p === 'granted';
      });
    }
  }, [opActive]);

  // Idle detection — fire after 20 min
  useEffect(() => {
    if (!opActive || !permissionGranted.current) return;

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!permissionGranted.current || !('Notification' in window)) return;
        try {
          new Notification('FLOWINDEX OS', {
            body: `${opName || 'Your operation'} is still active. ${currentSectorName || 'Sector'} awaits. Get back to work.`,
          });
        } catch {}
      }, IDLE_TIMEOUT);
    };

    resetTimer();
    const events = ['click', 'touchstart', 'keydown', 'scroll'];
    events.forEach(e => document.addEventListener(e, resetTimer, { passive: true }));

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [opActive, opName, currentSectorName]);
}
