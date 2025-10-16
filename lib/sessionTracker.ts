// lib/sessionTracker.ts
let sessionStartMs: number | null = null;

export function ensureSessionStart() {
  // Start only if not already running
  if (sessionStartMs == null) sessionStartMs = Date.now();
}

export function stopAndSnapshotMs(): number {
  // Stop the timer and return the total ms this session
  const now = Date.now();
  const elapsed = sessionStartMs ? Math.max(0, now - sessionStartMs) : 0;
  sessionStartMs = null;
  return elapsed;
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
