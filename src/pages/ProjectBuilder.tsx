import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { usePageTitle } from '../hooks/usePageTitle';

import BuilderStepIdentity from '../components/builder/BuilderStepIdentity';
import BuilderStepStack from '../components/builder/BuilderStepStack';
import BuilderStepVisuals from '../components/builder/BuilderStepVisuals';
import BuilderStepDeploy from '../components/builder/BuilderStepDeploy';
import PreviewCard from '../components/builder/PreviewCard';

type ProjectVisibility = 'public' | 'unlisted' | 'private';

interface ProjectFormData {
  title: string;
  clientName: string;
  year: string;
  category: string;
  stack: string[];
  imageUrl: string;
  description: string;
  role: string;
  liveUrl: string;
  githubUrl: string;
  visibility: ProjectVisibility;
}

const STEPS = [
  { id: 1, label: 'IDENTITY_MATRIX' },
  { id: 2, label: 'STACK_CONFIG' },
  { id: 3, label: 'VISUAL_ASSETS' },
  { id: 4, label: 'COMPILE_&_DEPLOY' },
];

const ProjectBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useUser();
  const isEditMode = Boolean(id);
  usePageTitle(isEditMode ? 'Edit Project' : 'Create Project');

  const [currentStep, setCurrentStep] = useState(1);
  const [isCompiling, setIsCompiling] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [shareSlug, setShareSlug] = useState<string | null>(null);
  const [compileError, setCompileError] = useState<string | null>(null);
  const compileDelayRef = useRef<number | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  const [formData, setFormData] = useState<ProjectFormData>({
    title: '',
    clientName: '',
    year: new Date().getFullYear().toString(),
    category: '',
    stack: [],
    imageUrl: '',
    description: '',
    role: '',
    liveUrl: '',
    githubUrl: '',
    visibility: 'public',
  });

  // Convex mutations
  const createProject = useMutation(api.user_projects.create);
  const updateProject = useMutation(api.user_projects.update);
  const existingProject = useQuery(
    api.user_projects.getById,
    isEditMode ? { projectId: id as Id<"user_projects"> } : "skip"
  );

  // Load existing project data in edit mode
  useEffect(() => {
    if (existingProject) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData({
        title: existingProject.title,
        clientName: existingProject.clientName || '',
        year: existingProject.year,
        category: existingProject.category,
        stack: existingProject.stack,
        imageUrl: existingProject.imageUrl,
        description: existingProject.description,
        role: existingProject.role || '',
        liveUrl: existingProject.liveUrl || '',
        githubUrl: existingProject.githubUrl || '',
        visibility: existingProject.visibility,
      });
    }
  }, [existingProject]);

  // Load prefill data from Idea Generator (via React Router state)
  const location = useLocation();
  useEffect(() => {
    const prefill = location.state as Record<string, unknown> | null;
    if (prefill && !isEditMode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setFormData(prev => ({
        ...prev,
        title: (prefill.title as string) || prev.title,
        category: (prefill.category as string) || prev.category,
        description: (prefill.description as string) || prev.description,
        stack: (prefill.stack as string[]) || prev.stack,
      }));
      // Clear router state so a refresh doesn't re-apply it
      window.history.replaceState({}, '');
    }
  }, [isEditMode, location.state]);

  const clearCompileTimers = useCallback(() => {
    if (compileDelayRef.current !== null) {
      window.clearTimeout(compileDelayRef.current);
      compileDelayRef.current = null;
    }
    if (redirectTimerRef.current !== null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => clearCompileTimers(), [clearCompileTimers]);

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.title.length > 0 && formData.category.length > 0;
      case 2:
        return true; // Stack is optional
      case 3:
        return formData.imageUrl.length > 0 && formData.description.length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const isFormValid =
    formData.title.length > 0 &&
    formData.category.length > 0 &&
    formData.imageUrl.length > 0 &&
    formData.description.length > 0;

  const handleCompile = useCallback(async () => {
    if (!user || !isFormValid || isCompiling) return;

    clearCompileTimers();
    setIsCompiling(true);
    setCompileError(null);

    try {
      if (isEditMode && id) {
        await updateProject({
          projectId: id as Id<"user_projects">,
          title: formData.title,
          subtitle: undefined,
          category: formData.category,
          description: formData.description,
          imageUrl: formData.imageUrl,
          stack: formData.stack,
          year: formData.year,
          clientName: formData.clientName || undefined,
          role: formData.role || undefined,
          liveUrl: formData.liveUrl || undefined,
          githubUrl: formData.githubUrl || undefined,
          visibility: formData.visibility,
        });
        setShareSlug(existingProject?.shareSlug || null);
      } else {
        const result = await createProject({
          title: formData.title,
          subtitle: undefined,
          category: formData.category,
          description: formData.description,
          imageUrl: formData.imageUrl,
          stack: formData.stack,
          year: formData.year,
          clientName: formData.clientName || undefined,
          role: formData.role || undefined,
          liveUrl: formData.liveUrl || undefined,
          githubUrl: formData.githubUrl || undefined,
          visibility: formData.visibility,
        });
        setShareSlug(result.shareSlug);
      }

      compileDelayRef.current = window.setTimeout(() => {
        setShowSuccess(true);
        compileDelayRef.current = null;
        redirectTimerRef.current = window.setTimeout(() => {
          navigate('/my-projects');
          redirectTimerRef.current = null;
        }, 2500);
      }, 2000);
    } catch (error) {
      console.error('Failed to save project:', error);
      setCompileError(error instanceof Error ? error.message : 'Failed to compile project. Please try again.');
      setIsCompiling(false);
    }
  }, [clearCompileTimers, createProject, existingProject, formData, id, isCompiling, isEditMode, isFormValid, navigate, updateProject, user]);

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 md:px-6">
      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[500] bg-black flex flex-col items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', damping: 10 }}
              className="w-24 h-24 rounded-full bg-accent flex items-center justify-center mb-8"
            >
              <Check size={48} className="text-black" />
            </motion.div>
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
              Compilation_Successful
            </h2>
            <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
              Redirecting_To_Dashboard...
            </p>
            {shareSlug && (
              <p className="font-mono text-xs text-accent mt-4">
                Share URL: /p/{shareSlug}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="font-mono text-xs text-zinc-500 hover:text-accent transition-colors flex items-center gap-2 mb-6"
          >
            <ArrowLeft size={14} />
            BACK_TO_DASHBOARD
          </button>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter">
            {isEditMode ? 'Edit' : 'Create'}{' '}
            <span className="text-outline italic">Project</span>
          </h1>
          <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest mt-2">
            Echo_Terminal: Project_Compiler v2.0
          </p>
          {compileError && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <p className="font-mono text-sm text-red-400">{compileError}</p>
            </div>
          )}
        </div>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 mb-12 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => setCurrentStep(step.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all whitespace-nowrap ${
                  currentStep === step.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : currentStep > step.id
                    ? 'border-accent/50 text-accent/50'
                    : 'border-white/10 text-zinc-600'
                }`}
              >
                <span className="font-mono text-[10px] font-bold">
                  0{step.id}
                </span>
                <span className="font-mono text-[10px] uppercase hidden md:inline">
                  {step.label}
                </span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className="w-8 h-px bg-white/10 mx-1" />
              )}
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Form Section */}
          <div className="bg-zinc-900/30 border border-white/10 rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
                Step {currentStep}/4: {STEPS[currentStep - 1].label}
              </span>
            </div>

            <AnimatePresence mode="wait">
              {currentStep === 1 && (
                <BuilderStepIdentity
                  key="step1"
                  data={{
                    title: formData.title,
                    clientName: formData.clientName,
                    year: formData.year,
                    category: formData.category,
                  }}
                  onChange={(field, value) => updateField(field, value)}
                />
              )}
              {currentStep === 2 && (
                <BuilderStepStack
                  key="step2"
                  stack={formData.stack}
                  onChange={(stack) => updateField('stack', stack)}
                />
              )}
              {currentStep === 3 && (
                <BuilderStepVisuals
                  key="step3"
                  data={{
                    imageUrl: formData.imageUrl,
                    description: formData.description,
                    role: formData.role,
                    liveUrl: formData.liveUrl,
                    githubUrl: formData.githubUrl,
                  }}
                  onChange={(field, value) => updateField(field, value)}
                />
              )}
              {currentStep === 4 && (
                <BuilderStepDeploy
                  key="step4"
                  visibility={formData.visibility}
                  onVisibilityChange={(v) => updateField('visibility', v)}
                  onCompile={handleCompile}
                  isCompiling={isCompiling}
                  isValid={isFormValid}
                />
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            {currentStep < 4 && (
              <div className="flex justify-between mt-12 pt-6 border-t border-white/5">
                <button
                  onClick={() => setCurrentStep((p) => Math.max(1, p - 1))}
                  disabled={currentStep === 1}
                  className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    currentStep === 1
                      ? 'text-zinc-700 cursor-not-allowed'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ArrowLeft size={14} />
                  Prev
                </button>
                <button
                  onClick={() => setCurrentStep((p) => Math.min(4, p + 1))}
                  disabled={!isStepValid(currentStep)}
                  className={`flex items-center gap-2 font-mono text-xs uppercase tracking-widest transition-colors ${
                    isStepValid(currentStep)
                      ? 'text-accent hover:text-white'
                      : 'text-zinc-700 cursor-not-allowed'
                  }`}
                >
                  Next
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Preview Section */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 bg-white/30 rounded-full" />
              <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">
                Live_Preview
              </span>
            </div>
            <div className="max-w-sm mx-auto lg:mx-0">
              <PreviewCard data={formData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectBuilder;
