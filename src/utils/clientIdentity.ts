const CLIENT_ID_KEY = 'echo_client_id';
const SESSION_KEY = 'echo_session';

function createId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export function getOrCreateClientId() {
  if (typeof window === 'undefined') {
    return 'server_client';
  }

  const existing = window.localStorage.getItem(CLIENT_ID_KEY);
  if (existing) {
    return existing;
  }

  const next = createId('client');
  window.localStorage.setItem(CLIENT_ID_KEY, next);
  return next;
}

export function getOrCreateSessionId() {
  if (typeof window === 'undefined') {
    return 'server_session';
  }

  const existing = window.sessionStorage.getItem(SESSION_KEY);
  if (existing) {
    return existing;
  }

  const next = createId('session');
  window.sessionStorage.setItem(SESSION_KEY, next);
  return next;
}
