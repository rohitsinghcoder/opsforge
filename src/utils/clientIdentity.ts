const CLIENT_ID_KEY = 'echo_client_id';
const SESSION_KEY = 'echo_session';

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

let memoryClientId: string | null = null;
export function getOrCreateClientId() {
  if (typeof window === 'undefined') {
    return 'server_client';
  }

  try {
    const existing = window.localStorage.getItem(CLIENT_ID_KEY);
    if (existing) {
      return existing;
    }

    const next = createId('client');
    window.localStorage.setItem(CLIENT_ID_KEY, next);
    return next;
  } catch {
    if (!memoryClientId) memoryClientId = createId('client');
    return memoryClientId;
  }
}

let memorySessionId: string | null = null;
export function getOrCreateSessionId() {
  if (typeof window === 'undefined') {
    return 'server_session';
  }

  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) {
      return existing;
    }

    const next = createId('session');
    window.sessionStorage.setItem(SESSION_KEY, next);
    return next;
  } catch {
    if (!memorySessionId) memorySessionId = createId('session');
    return memorySessionId;
  }
}
