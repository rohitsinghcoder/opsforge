import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import {
  SignedIn,
  SignedOut,
  RedirectToSignIn,
} from "@clerk/clerk-react";

// Layout
import Layout from './components/layout/Layout';

// Pages
import Home from './pages/Home';
import ProjectVault from './pages/ProjectVault';
import Works from './pages/Works';
import ProjectDetail from './pages/ProjectDetail';
import Archive from './pages/Archive';
import Contact from './pages/Contact';
import MyProjects from './pages/MyProjects';
import ProjectBuilder from './pages/ProjectBuilder';
import SharedProject from './pages/SharedProject';
import IdeaGenerator from './pages/IdeaGenerator';
import Playground from './pages/Playground';

// Context
import { SessionHeatmapProvider } from './contexts/SessionHeatmapContext';

function App() {
  return (
    <SessionHeatmapProvider>
      <Router>
        <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route 
            path="/vault" 
            element={
              <>
                <SignedIn>
                  <ProjectVault />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route path="/works" element={<Works />} />
          <Route path="/works/:slug" element={<ProjectDetail />} />
          <Route path="/archive" element={<Archive />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ideas" element={<IdeaGenerator />} />
          <Route path="/playground" element={<Playground />} />
          <Route 
            path="/my-projects" 
            element={
              <>
                <SignedIn>
                  <MyProjects />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/builder" 
            element={
              <>
                <SignedIn>
                  <ProjectBuilder />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route 
            path="/builder/:id" 
            element={
              <>
                <SignedIn>
                  <ProjectBuilder />
                </SignedIn>
                <SignedOut>
                  <RedirectToSignIn />
                </SignedOut>
              </>
            } 
          />
          <Route path="/p/:slug" element={<SharedProject />} />
          <Route path="*" element={
            <div className="min-h-screen flex flex-col items-center justify-center px-6">
              <h1 className="text-[20vw] font-black uppercase tracking-tighter leading-none text-accent">404</h1>
              <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest mb-8">Page_Not_Found</p>
              <Link to="/" className="px-8 py-4 bg-accent text-black font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform">Return_Home</Link>
            </div>
          } />
        </Routes>
        </Layout>
      </Router>
    </SessionHeatmapProvider>
  );
}

export default App;


