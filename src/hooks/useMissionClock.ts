import { useEffect, useState } from 'react';

export function useMissionClock(active = true) {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    if (!active) return;

    setNowMs(Date.now());
    const timerId = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);

    return () => window.clearInterval(timerId);
  }, [active]);

  return nowMs;
}

export function getElapsedSeconds(startedAt?: string | null, nowMs = Date.now()) {
  if (!startedAt) return 0;

  const startedMs = new Date(startedAt).getTime();
  if (Number.isNaN(startedMs)) return 0;

  return Math.max(0, Math.floor((nowMs - startedMs) / 1000));
}

export function getElapsedMinutes(startedAt?: string | null, nowMs = Date.now()) {
  return Math.floor(getElapsedSeconds(startedAt, nowMs) / 60);
}

export function formatClock(totalSeconds: number) {
  const absoluteSeconds = Math.abs(totalSeconds);
  const minutes = Math.floor(absoluteSeconds / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (absoluteSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${seconds}`;
}
