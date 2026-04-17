import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useConvexAuth, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export function useConvexSync(pathname: string, sessionId: string) {
  const { user, isSignedIn } = useUser();
  const { isAuthenticated: isConvexAuthenticated } = useConvexAuth();
  const syncUser = useMutation(api.users.getOrCreate);
  const trackPageView = useMutation(api.users.trackPageView);
  const lastSyncedUser = useRef('');
  const lastTrackedPage = useRef('');

  useEffect(() => {
    if (!isSignedIn || !user || !isConvexAuthenticated) {
      lastSyncedUser.current = '';
      return;
    }

    if (lastSyncedUser.current === user.id) {
      return;
    }

    lastSyncedUser.current = user.id;
    void syncUser({}).catch((error) => {
      console.error('Failed to sync Convex user:', error);
      if (lastSyncedUser.current === user.id) {
        lastSyncedUser.current = '';
      }
    });
  }, [isConvexAuthenticated, isSignedIn, syncUser, user]);

  useEffect(() => {
    lastTrackedPage.current = '';
  }, [sessionId, user?.id]);

  useEffect(() => {
    const key = `${pathname}|${sessionId}|${user?.id ?? 'anon'}`;
    if (key === lastTrackedPage.current) {
      return;
    }

    let cancelled = false;
    lastTrackedPage.current = key;

    void trackPageView({
      path: pathname,
      projectSlug: pathname.startsWith('/works/') ? pathname.split('/works/')[1] : undefined,
      sessionId,
    }).catch((error) => {
      console.error('Failed to track page view:', error);
      if (!cancelled && lastTrackedPage.current === key) {
        lastTrackedPage.current = '';
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pathname, sessionId, trackPageView, user?.id]);
}
