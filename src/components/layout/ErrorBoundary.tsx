import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Terminal, RotateCcw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-red-500 font-mono flex items-center justify-center p-6 selection:bg-red-500 selection:text-black">
          <div className="noise opacity-10" />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl border-2 border-red-600 p-8 shadow-[0_0_50px_rgba(255,0,0,0.3)] relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
            
            <div className="flex items-center gap-4 mb-8 border-b border-red-900 pb-4">
              <Terminal size={32} className="text-red-500" />
              <div>
                <h1 className="text-2xl font-black uppercase tracking-widest text-red-500">
                  CRITICAL_SYSTEM_FAILURE
                </h1>
                <p className="text-[10px] text-red-400 mt-1 uppercase tracking-widest">
                  Error_Code: 0xFACEB00C
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-red-950/30 p-4 border border-red-900 overflow-x-auto">
                <p className="text-red-400 text-sm whitespace-pre-wrap font-bold">
                  {this.state.error?.message || "Unknown rendering exception"}
                </p>
              </div>

              <div className="text-xs text-red-600 uppercase tracking-widest space-y-1">
                <p>{" > "} Attempting memory dump...</p>
                <p>{" > "} Isolating corrupted threads...</p>
                <p className="animate-pulse">{" > "} Awaiting operator intervention</p>
              </div>

              <div className="pt-8 flex items-center gap-4">
                <button
                  onClick={() => window.location.reload()}
                  className="flex items-center gap-2 px-6 py-3 bg-red-600 text-black font-black uppercase tracking-widest hover:bg-red-500 active:scale-95 transition-all text-sm"
                >
                  <RotateCcw size={16} />
                  Initiate_Hard_Reboot
                </button>
                <button
                  onClick={() => {
                    this.setState({ hasError: false, error: null });
                  }}
                  className="px-6 py-3 border border-red-600 text-red-500 font-bold uppercase tracking-widest hover:bg-red-900/50 transition-all text-sm"
                >
                  Clear_Buffer_Try_Again
                </button>
              </div>
            </div>
            
            <div className="absolute -bottom-10 -right-10 text-[120px] font-black text-red-900/20 italic select-none pointer-events-none">
              ERR
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
