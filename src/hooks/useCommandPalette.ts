import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { askEcho } from '../services/ai';

const commands = ['/home', '/vault', '/works', '/archive', '/contact', '/github', '/ideas', '/builder', '/playground', '/blueprint', '/ask', '/override'];

interface UseCommandPaletteProps {
  blueprint: boolean;
  setBlueprint: (b: boolean) => void;
  onBreach: () => void;
}

export const useCommandPalette = ({ blueprint, setBlueprint, onBreach }: UseCommandPaletteProps) => {
  const navigate = useNavigate();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandInput, setCommandInput] = useState("");
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<any[]>([]);

  const logEvent = useMutation(api.logs.logEvent);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(prev => !prev);
        setCommandInput("");
      }
      
      if (!isCommandOpen) return;

      if (e.key === 'Escape') setIsCommandOpen(false);
      
      if (e.key === 'Tab') {
        e.preventDefault();
        const matches = commandInput.startsWith('/') 
          ? commands.filter(c => c.startsWith(commandInput.split(' ')[0]))
          : commands.filter(c => c.includes(commandInput));
          
        if (matches.length > 0) {
          const nextIndex = (suggestionIndex + 1) % matches.length;
          setSuggestionIndex(nextIndex);
          setCommandInput(matches[nextIndex]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandOpen, commandInput, suggestionIndex]);

  const executeCommand = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const fullCmd = commandInput.trim();
    const cmd = fullCmd.toLowerCase().split(' ')[0];
    const args = fullCmd.split(' ').slice(1).join(' ');
    
    if (cmd === '/override') {
      onBreach();
      setIsCommandOpen(false);
      setCommandInput("");
      return;
    }

    if (cmd === '/ask') {
      if (!args) {
        setAiResponse(">> SYSTEM_PROMPT: Please provide a specific query. Example: /ask What technologies were used in Hyperion OS?");
        setIsAiLoading(false);
        return;
      }
      setIsAiLoading(true);
      setAiResponse(null);
      
      // Log AI Query to Convex
      logEvent({
        type: "AI_QUERY",
        user: "GUEST_TERMINAL",
        content: `Query: ${args.substring(0, 100)}${args.length > 100 ? '...' : ''}`
      });

      try {
        const response = await askEcho(args, chatHistory);
        setAiResponse(response);
        setChatHistory(prev => [...prev, 
          { role: "user", parts: [{ text: args }] },
          { role: "assistant", parts: [{ text: response }] }
        ].slice(-20));
      } catch (error) {
        console.error("AI_COMMAND_ERROR:", error);
        const errorMsg = "SYSTEM_FAILURE: Neural link disrupted. Check console logs.";
        setAiResponse(errorMsg);
        setChatHistory(prev => [...prev,
          { role: "user", parts: [{ text: args }] },
          { role: "assistant", parts: [{ text: errorMsg }] }
        ].slice(-20));
      } finally {
        setIsAiLoading(false);
      }
      setCommandInput("");
      return;
    }
    
    const isNavCommand = ['/home', '/vault', '/works', '/archive', '/contact', '/github', '/ideas', '/builder', '/playground'].includes(cmd);
    
    if (cmd === '/home') navigate('/');
    if (cmd === '/vault') navigate('/vault');
    if (cmd === '/works') navigate('/works');
    if (cmd === '/archive') navigate('/archive');
    if (cmd === '/contact') navigate('/contact');
    if (cmd === '/github') navigate('/my-projects');
    if (cmd === '/ideas') navigate('/ideas');
    if (cmd === '/builder') navigate('/builder');
    if (cmd === '/playground') navigate('/playground');
    if (cmd === '/blueprint') setBlueprint(!blueprint);
    
    setCommandInput("");
    setSuggestionIndex(-1);
    
    // Only close palette and clear AI for navigation commands, not /ask
    if (isNavCommand || cmd === '/blueprint') {
      setIsCommandOpen(false);
      setAiResponse(null);
    }
  }, [commandInput, navigate, blueprint, setBlueprint, chatHistory, logEvent, onBreach]);

  const clearChatHistory = useCallback(() => {
    setChatHistory([]);
    setAiResponse(null);
  }, []);

  const addToChatHistory = useCallback((userText: string, aiResponse: string) => {
    setChatHistory(prev => [...prev,
      { role: "user", parts: [{ text: userText }] },
      { role: "assistant", parts: [{ text: aiResponse }] }
    ].slice(-20));
  }, []);

  return {
    isCommandOpen,
    setIsCommandOpen,
    commandInput,
    setCommandInput,
    setSuggestionIndex,
    aiResponse,
    setAiResponse,
    isAiLoading,
    executeCommand,
    commands,
    chatHistory,
    clearChatHistory,
    addToChatHistory
  };
};

export default useCommandPalette;
