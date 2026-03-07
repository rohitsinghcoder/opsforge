import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useQuery, useMutation, useAction } from 'convex/react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Github, ExternalLink, Star, GitFork, Lock, Unlock, Sparkles, 
  X, Loader2, Plus, Pencil, Trash2, Eye, Share2, Layers
} from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { getOrCreateClientId } from '../utils/clientIdentity';

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  private: boolean;
  updated_at: string;
}

const MyProjects = () => {
  const { user, isSignedIn } = useUser();
  const [activeTab, setActiveTab] = useState<'github' | 'creations'>('creations');
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  
  // AI Analysis state
  const [analyzingRepo, setAnalyzingRepo] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [analysisRepoName, setAnalysisRepoName] = useState<string | null>(null);
  const [clientId] = useState(() => getOrCreateClientId());

  // Convex queries for user projects
  const myCreations = useQuery(
    api.user_projects.getMyProjects,
    user?.id ? {} : "skip"
  );
  const deleteProject = useMutation(api.user_projects.remove);
  const analyzeGitHubRepo = useAction(api.ai.analyzeGitHubRepo);
  
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<Id<"user_projects"> | null>(null);

  useEffect(() => {
    const fetchGitHubData = async () => {
      if (!isSignedIn || !user) {
        setLoading(false);
        return;
      }

      const githubAccount = user.externalAccounts?.find(
        (account) => account.provider === 'github'
      );

      if (!githubAccount) {
        setError('GitHub account not connected. Please sign in with GitHub to view your projects.');
        setLoading(false);
        return;
      }

      const username = githubAccount.username;
      setGithubUsername(username || null);

      if (!username) {
        setError('Could not find GitHub username.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://api.github.com/users/${username}/repos?sort=updated&per_page=30`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch repositories');
        }

        const data = await response.json();
        setRepos(data);
      } catch (err) {
        setError('Failed to load repositories. Please try again later.');
        console.error('GitHub API error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchGitHubData();
  }, [isSignedIn, user]);

  const handleAnalyze = async (repo: GitHubRepo, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (repo.private) {
      setAnalysisResult('Cannot analyze private repositories. Only public repos are supported.');
      setAnalysisRepoName(repo.name);
      return;
    }

    setAnalyzingRepo(repo.full_name);
    setAnalysisRepoName(repo.name);
    setAnalysisResult(null);

    const result = await analyzeGitHubRepo({
      repoFullName: repo.full_name,
      clientId,
    });
    
    if (typeof result === 'string') {
      setAnalysisResult(result);
    } else {
      setAnalysisResult(result.summary);
    }
    
    setAnalyzingRepo(null);
  };

  const handleDelete = async (projectId: Id<"user_projects">) => {
    if (!user) return;
    try {
      await deleteProject({ projectId });
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
  };

  const copyShareLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/p/${slug}`);
  };

  const closeAnalysis = () => {
    setAnalysisResult(null);
    setAnalysisRepoName(null);
  };

  const languageColors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    HTML: '#e34c26',
    CSS: '#563d7c',
    React: '#61dafb',
  };

  if (!isSignedIn) {
    return (
      <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen">
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-8">
            My Projects
          </h1>
          <p className="text-zinc-400 mb-8">Sign in with GitHub to view your repositories.</p>
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-zinc-900 border border-zinc-700 rounded-full text-zinc-400">
            <Github size={20} />
            <span className="font-mono text-sm uppercase tracking-widest">Sign in required</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-32 md:pt-48 pb-24 px-4 md:px-6 min-h-screen overflow-x-hidden">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black uppercase tracking-tighter mb-4">
              My Projects
            </h1>
            {githubUsername && (
              <a
                href={`https://github.com/${githubUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-400 hover:text-accent transition-colors"
              >
                <Github size={18} />
                <span className="font-mono text-sm">@{githubUsername}</span>
                <ExternalLink size={14} />
              </a>
            )}
          </div>
          <Link
            to="/builder"
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold uppercase tracking-widest rounded-full hover:scale-105 transition-transform"
          >
            <Plus size={18} />
            Create_New
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-white/10 pb-4">
          <button
            onClick={() => setActiveTab('creations')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${
              activeTab === 'creations'
                ? 'bg-accent text-black'
                : 'border border-white/10 text-zinc-400 hover:border-accent hover:text-accent'
            }`}
          >
            <Layers size={14} />
            My_Creations
            {myCreations && <span className="ml-1">({myCreations.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab('github')}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs uppercase tracking-widest transition-all ${
              activeTab === 'github'
                ? 'bg-accent text-black'
                : 'border border-white/10 text-zinc-400 hover:border-accent hover:text-accent'
            }`}
          >
            <Github size={14} />
            GitHub_Repos
            <span className="ml-1">({repos.length})</span>
          </button>
        </div>

        {/* My Creations Tab */}
        {activeTab === 'creations' && (
          <div>
            {myCreations === undefined ? (
              <div className="text-center py-20">
                <Loader2 size={32} className="animate-spin mx-auto text-accent mb-4" />
                <p className="font-mono text-sm text-zinc-500 uppercase">Loading_Creations...</p>
              </div>
            ) : myCreations.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-white/10 rounded-2xl">
                <Layers size={48} className="mx-auto text-zinc-700 mb-4" />
                <h3 className="text-xl font-bold mb-2">No_Creations_Yet</h3>
                <p className="text-zinc-500 mb-6">Build your first project card to showcase your work</p>
                <Link
                  to="/builder"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-black font-bold uppercase tracking-widest rounded-full"
                >
                  <Plus size={16} />
                  Start_Building
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {myCreations.map((project, idx) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative bg-zinc-900/50 border border-white/5 rounded-2xl overflow-hidden hover:border-accent/30 transition-all"
                  >
                    {/* Image */}
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>

                    {/* Content */}
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-bold text-lg truncate">{project.title}</h3>
                        <span className={`px-2 py-0.5 rounded-full font-mono text-[8px] uppercase ${
                          project.visibility === 'public' 
                            ? 'bg-accent/10 text-accent' 
                            : project.visibility === 'unlisted'
                            ? 'bg-yellow-500/10 text-yellow-500'
                            : 'bg-zinc-700 text-zinc-400'
                        }`}>
                          {project.visibility}
                        </span>
                      </div>
                      <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mb-3">
                        {project.category}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-zinc-600 text-xs mb-4">
                        <span className="flex items-center gap-1">
                          <Eye size={12} />
                          {project.viewCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers size={12} />
                          {project.stack.length}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Link
                          to={`/builder/${project._id}`}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-white/10 rounded-lg font-mono text-[10px] uppercase hover:border-accent hover:text-accent transition-all"
                        >
                          <Pencil size={12} />
                          Edit
                        </Link>
                        <button
                          onClick={() => copyShareLink(project.shareSlug)}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-white/10 rounded-lg font-mono text-[10px] uppercase hover:border-accent hover:text-accent transition-all"
                        >
                          <Share2 size={12} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(project._id)}
                          className="flex items-center justify-center gap-2 px-3 py-2 border border-white/10 rounded-lg font-mono text-[10px] uppercase hover:border-red-500 hover:text-red-500 transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    {/* View Link */}
                    <Link
                      to={`/p/${project.shareSlug}`}
                      className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* GitHub Repos Tab */}
        {activeTab === 'github' && (
          <div>
            {loading ? (
              <div className="text-center py-20">
                <div className="flex gap-2 justify-center mb-4">
                  <div className="w-2 h-8 bg-accent animate-bounce" />
                  <div className="w-2 h-8 bg-accent animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-8 bg-accent animate-bounce [animation-delay:0.4s]" />
                </div>
                <p className="font-mono text-sm text-zinc-500 uppercase tracking-widest">
                  Fetching_GitHub_Repos...
                </p>
              </div>
            ) : error ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
                <p className="text-red-400 mb-4">{error}</p>
                <p className="text-zinc-500 text-sm">
                  Make sure you've signed in using GitHub OAuth in your Clerk account.
                </p>
              </div>
            ) : repos.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-zinc-500">No repositories found.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {repos.map((repo, idx) => (
                  <motion.div
                    key={repo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="group relative p-6 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-accent/30 hover:bg-zinc-900 transition-all"
                  >
                    <a
                      href={repo.html_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <h3 className="font-bold text-lg group-hover:text-accent transition-colors truncate flex-1">
                          {repo.name}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          {repo.private ? (
                            <Lock size={14} className="text-zinc-600" />
                          ) : (
                            <Unlock size={14} className="text-zinc-600" />
                          )}
                        </div>
                      </div>

                      {repo.description && (
                        <p className="text-zinc-500 text-sm mb-4 line-clamp-2">
                          {repo.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {repo.language && (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full"
                                style={{
                                  backgroundColor: languageColors[repo.language] || '#8b8b8b',
                                }}
                              />
                              <span className="font-mono text-[10px] text-zinc-400 uppercase">
                                {repo.language}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-zinc-600">
                            <Star size={12} />
                            <span className="font-mono text-[10px]">{repo.stargazers_count}</span>
                          </div>
                          <div className="flex items-center gap-1 text-zinc-600">
                            <GitFork size={12} />
                            <span className="font-mono text-[10px]">{repo.forks_count}</span>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-zinc-600 group-hover:text-accent transition-colors" />
                      </div>
                    </a>

                    {/* Analyze Button */}
                    <button
                      onClick={(e) => handleAnalyze(repo, e)}
                      disabled={analyzingRepo === repo.full_name}
                      className="absolute top-4 right-4 p-2 rounded-full bg-accent/10 border border-accent/30 text-accent hover:bg-accent hover:text-black transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Analyze with AI"
                    >
                      {analyzingRepo === repo.full_name ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Sparkles size={16} />
                      )}
                    </button>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAnalysis}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 md:p-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-[#0a0a0a] border border-accent/30 rounded-2xl shadow-[0_0_50px_rgba(196,255,14,0.1)] overflow-hidden max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Sparkles size={20} className="text-accent" />
                  <div>
                    <h2 className="font-bold text-lg">AI Analysis</h2>
                    <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{analysisRepoName}</p>
                  </div>
                </div>
                <button
                  onClick={closeAnalysis}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center hover:border-accent hover:text-accent transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="prose prose-invert prose-sm max-w-none">
                  <div className="font-mono text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {analysisResult}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-[#0a0a0a] border border-red-500/30 rounded-2xl p-8 max-w-md w-full text-center"
            >
              <Trash2 size={48} className="mx-auto text-red-500 mb-4" />
              <h3 className="text-xl font-bold mb-2">Delete_Project?</h3>
              <p className="text-zinc-500 text-sm mb-6">
                This action cannot be undone. The project card and its share link will be permanently removed.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="flex-1 py-3 border border-white/10 rounded-xl font-mono text-sm uppercase hover:border-white/30 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="flex-1 py-3 bg-red-500 text-white rounded-xl font-mono text-sm uppercase hover:bg-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MyProjects;
