import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ClerkProvider, useAuth } from '@clerk/clerk-react'
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import ErrorBoundary from './components/layout/ErrorBoundary';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY
const CONVEX_URL = import.meta.env.VITE_CONVEX_URL

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key")
}

if (!CONVEX_URL) {
  throw new Error("Missing Convex URL. Set VITE_CONVEX_URL in your environment.")
}

const convex = new ConvexReactClient(CONVEX_URL as string);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  </StrictMode>,
)
