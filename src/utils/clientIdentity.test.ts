import { getOrCreateClientId, getOrCreateSessionId } from './clientIdentity'

describe('clientIdentity', () => {
  beforeEach(() => {
    window.localStorage.clear()
    window.sessionStorage.clear()
  })

  it('reuses the same client id from localStorage', () => {
    const first = getOrCreateClientId()
    const second = getOrCreateClientId()

    expect(second).toBe(first)
    expect(window.localStorage.getItem('echo_client_id')).toBe(first)
  })

  it('reuses the same session id from sessionStorage', () => {
    const first = getOrCreateSessionId()
    const second = getOrCreateSessionId()

    expect(second).toBe(first)
    expect(window.sessionStorage.getItem('echo_session')).toBe(first)
  })

  it('falls back gracefully when localStorage throws an error', () => {
    const originalGetItem = window.localStorage.getItem;
    window.localStorage.getItem = () => { throw new Error('Access denied'); };
    
    const first = getOrCreateClientId();
    const second = getOrCreateClientId();
    
    expect(first).toBeTruthy();
    expect(first.startsWith('client_')).toBe(true);
    expect(second).toBe(first);
    
    window.localStorage.getItem = originalGetItem;
  })

  it('falls back gracefully when localStorage.setItem throws an error (e.g., quota exceeded / strict incognito)', () => {
    const originalSetItem = window.localStorage.setItem;
    window.localStorage.setItem = () => { throw new Error('Quota exceeded'); };
    
    const first = getOrCreateClientId();
    const second = getOrCreateClientId();
    
    expect(first).toBeTruthy();
    expect(first.startsWith('client_')).toBe(true);
    expect(second).toBe(first);
    
    window.localStorage.setItem = originalSetItem;
  })

  it('falls back gracefully when sessionStorage throws an error', () => {
    const originalGetItem = window.sessionStorage.getItem;
    window.sessionStorage.getItem = () => { throw new Error('Access denied'); };
    
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    
    expect(first).toBeTruthy();
    expect(first.startsWith('session_')).toBe(true);
    expect(second).toBe(first);
    
    window.sessionStorage.getItem = originalGetItem;
  })

  it('falls back gracefully when sessionStorage.setItem throws an error', () => {
    const originalSetItem = window.sessionStorage.setItem;
    window.sessionStorage.setItem = () => { throw new Error('Quota exceeded'); };
    
    const first = getOrCreateSessionId();
    const second = getOrCreateSessionId();
    
    expect(first).toBeTruthy();
    expect(first.startsWith('session_')).toBe(true);
    expect(second).toBe(first);
    
    window.sessionStorage.setItem = originalSetItem;
  })
})
