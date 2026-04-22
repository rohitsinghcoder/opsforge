import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layout
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages (eager)
import Home from './pages/Home';
import NotFound from './pages/NotFound';

// Pages (lazy - heavy deps)
const ProjectVault = lazy(() => import('./pages/ProjectVault'));
const Works = lazy(() => import('./pages/Works'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const Archive = lazy(() => import('./pages/Archive'));
const Contact = lazy(() => import('./pages/Contact'));
const MyProjects = lazy(() => import('./pages/MyProjects'));
const ProjectBuilder = lazy(() => import('./pages/ProjectBuilder'));
const SharedProject = lazy(() => import('./pages/SharedProject'));
const IdeaGenerator = lazy(() => import('./pages/IdeaGenerator'));
const Playground = lazy(() => import('./pages/Playground'));
const SolarNavigator = lazy(() => import('./pages/SolarNavigator'));
const IdeaForge = lazy(() => import('./pages/IdeaForge'));

import { SessionHeatmapProvider } from './contexts/SessionHeatmapContext';
import { ToastProvider } from './contexts/ToastContext';
import { CursorProvider } from './contexts/CursorContext';
import { BlueprintProvider } from './contexts/BlueprintContext';

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center font-mono text-accent text-xs uppercase tracking-widest">
    Loading_Module...
  </div>
);

function App() {
  return (
    <CursorProvider>
      <ToastProvider>
      <SessionHeatmapProvider>
        <BlueprintProvider>
        <Router>
          <Layout>
          <Suspense fallback={<LazyFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/vault" element={<ProtectedRoute><ProjectVault /></ProtectedRoute>} />
              <Route path="/works" element={<Works />} />
              <Route path="/works/:slug" element={<ProjectDetail />} />
              <Route path="/archive" element={<Archive />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/ideas" element={<IdeaGenerator />} />
              <Route path="/navigate" element={<SolarNavigator />} />
              <Route path="/forge" element={<IdeaForge />} />
              <Route path="/playground" element={<Playground />} />
              <Route path="/my-projects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
              <Route path="/builder" element={<ProtectedRoute><ProjectBuilder /></ProtectedRoute>} />
              <Route path="/builder/:id" element={<ProtectedRoute><ProjectBuilder /></ProtectedRoute>} />
              <Route path="/p/:slug" element={<SharedProject />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Layout>
      </Router>
      </BlueprintProvider>
    </SessionHeatmapProvider>
    </ToastProvider>
    </CursorProvider>
  );
}

export default App;


