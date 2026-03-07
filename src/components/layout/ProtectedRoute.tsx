import type { ReactNode } from 'react';
import { SignIn } from '@clerk/clerk-react';
import { Authenticated, AuthLoading, Unauthenticated } from 'convex/react';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  return (
    <>
      <AuthLoading>
        <div className="min-h-screen pt-32 flex items-center justify-center font-mono text-xs uppercase tracking-widest text-accent">
          Securing_Session...
        </div>
      </AuthLoading>
      <Authenticated>
        {children}
      </Authenticated>
      <Unauthenticated>
        <div className="min-h-screen pt-32 flex items-center justify-center">
          <SignIn routing="hash" />
        </div>
      </Unauthenticated>
    </>
  );
};

export default ProtectedRoute;
