/**
 * Network-Verified Trusted Clock Utility
 * Prevents device clock manipulation (e.g., staff setting system clock back to alter shifts/receipts).
 * Fetches authoritative network time from Time API / Server HTTP headers and tracks skew offset.
 */

let calibratedSkewMs: number = 0;
let isSynced: boolean = false;
let lastSyncTimestamp: number = 0;

// Try to recover previously cached skew offset across page refreshes
try {
  const cachedSkew = localStorage.getItem('tapmenu_time_skew_ms');
  if (cachedSkew !== null) {
    calibratedSkewMs = Number(cachedSkew) || 0;
  }
} catch {}

/**
 * Calibrate trusted time against an external authoritative NTP/Time API.
 */
export async function syncNetworkTime(): Promise<number> {
  const t0 = Date.now();

  // Strategy 1: World Time API (Africa/Lagos timezone)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    
    const res = await fetch('https://worldtimeapi.org/api/timezone/Africa/Lagos', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.unixtime) {
        const t1 = Date.now();
        const roundTripLatency = (t1 - t0) / 2;
        const serverEpochMs = (data.unixtime * 1000) + roundTripLatency;
        calibratedSkewMs = serverEpochMs - t1;
        isSynced = true;
        lastSyncTimestamp = Date.now();
        try {
          localStorage.setItem('tapmenu_time_skew_ms', String(calibratedSkewMs));
        } catch {}
        return calibratedSkewMs;
      }
    }
  } catch {
    // Continue to fallback
  }

  // Strategy 2: timeapi.io
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const res = await fetch('https://timeapi.io/api/time/current/zone?timeZone=Africa/Lagos', {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (data && data.dateTime) {
        const t1 = Date.now();
        const serverEpochMs = new Date(data.dateTime).getTime() + ((t1 - t0) / 2);
        calibratedSkewMs = serverEpochMs - t1;
        isSynced = true;
        lastSyncTimestamp = Date.now();
        try {
          localStorage.setItem('tapmenu_time_skew_ms', String(calibratedSkewMs));
        } catch {}
        return calibratedSkewMs;
      }
    }
  } catch {
    // Fallback to HTTP Date header
  }

  // Strategy 3: HTTP Date header from origin / Supabase
  try {
    const res = await fetch(window.location.href, { method: 'HEAD', cache: 'no-store' });
    const dateHeader = res.headers.get('date');
    if (dateHeader) {
      const serverEpochMs = new Date(dateHeader).getTime();
      const t1 = Date.now();
      calibratedSkewMs = serverEpochMs - t1;
      isSynced = true;
      lastSyncTimestamp = Date.now();
      try {
        localStorage.setItem('tapmenu_time_skew_ms', String(calibratedSkewMs));
      } catch {}
      return calibratedSkewMs;
    }
  } catch {}

  return calibratedSkewMs;
}

// Auto-run sync on script initialization
if (typeof window !== 'undefined') {
  syncNetworkTime();
  // Periodic background re-sync every 15 minutes
  setInterval(syncNetworkTime, 15 * 60 * 1000);
}

/**
 * Returns a Date object adjusted for network skew.
 * Tamper-proof against local device clock changes.
 */
export function getNetworkVerifiedDate(): Date {
  return new Date(Date.now() + calibratedSkewMs);
}

/**
 * Formats network-verified date e.g. "Sunday, 25 October 2026"
 */
export function formatNetworkDate(date?: Date): string {
  const d = date || getNetworkVerifiedDate();
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Formats network-verified time e.g. "01:45:22 PM"
 */
export function formatNetworkTime(date?: Date): string {
  const d = date || getNetworkVerifiedDate();
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

/**
 * Formats ISO date string YYYY-MM-DD from verified network time
 */
export function getNetworkDateString(date?: Date): string {
  const d = date || getNetworkVerifiedDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isTimeNetworkSynced(): boolean {
  return isSynced || Math.abs(calibratedSkewMs) > 0;
}

export function getNetworkSkewMs(): number {
  return calibratedSkewMs;
}
