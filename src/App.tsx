import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
        </Routes>
        </Layout>
      </Router>
    </SessionHeatmapProvider>
  );
}

export default App;


