
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { User, ChatMessage, Project, ProjectStatus, UserTier } from '../types';
import { TIER_LIMITS } from '../constants';
import CircularProgress from '../components/CircularProgress';
import MicrophoneButton from '../components/MicrophoneButton';
import { processCommand, generateRFP } from '../services/geminiService';
import { speak } from '../services/speechService';

interface HomeViewProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  setView: (view: 'home' | 'projects' | 'pricing' | 'profile') => void;
}

const useSpeechRecognition = (onResult: (result: string) => void) => {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    const recognition = recognitionRef.current;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let final_transcript_part = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final_transcript_part += event.results[i][0].transcript;
        }
      }
      if (final_transcript_part) {
        transcriptRef.current += final_transcript_part + ' ';
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };
    
    recognition.onend = () => {
      if (transcriptRef.current.trim()) {
        onResult(transcriptRef.current.trim());
      }
      transcriptRef.current = ''; // Reset transcript for the next session
      setIsListening(false);
    };

    return () => {
      recognitionRef.current?.abort();
    };
  }, [onResult]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      transcriptRef.current = ''; // Clear any stale transcript before starting
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };

  return { isListening, toggleListening };
};


const HomeView: React.FC<HomeViewProps> = ({ user, onUpdateUser, setView }) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    { id: '1', sender: 'ai', text: `Hello ${user.name}! I'm EasyRFP. How can I help you generate an RFP today?`, timestamp: new Date() }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const handleAIResponse = useCallback(async (currentChat: ChatMessage[]) => {
    setIsProcessing(true);
    
    const currentRequestCount = user.projects.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).length;
    const limit = TIER_LIMITS[user.tier];
    const canStillMakeRequest = limit === Infinity || currentRequestCount < limit;

    if (currentChat[currentChat.length - 1].text.toLowerCase().includes('generate') && !canStillMakeRequest) {
      const message = "You've reached your monthly request limit. Please upgrade your plan to continue.";
      const newAiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: message, timestamp: new Date() };
      setChatHistory(prev => [...prev, newAiMessage]);
      speak(message);
      setIsProcessing(false);
      return;
    }

    const command = await processCommand(currentChat);
    
    const newAiMessageText = (() => {
        switch (command.action) {
            case 'navigate':
                setView(command.payload);
                return `Navigating to ${command.payload}.`;
            case 'ask_clarification':
            case 'chat':
                return command.payload;
            case 'generate_rfp':
                return "Great, I have enough information. Generating the RFP now...";
            default:
                return "I'm not sure how to handle that. Can you please rephrase?";
        }
    })();

    const newAiMessage: ChatMessage = { id: `ai-${Date.now()}`, sender: 'ai', text: newAiMessageText, timestamp: new Date() };
    setChatHistory(prev => [...prev, newAiMessage]);
    speak(newAiMessageText);
    
    if (command.action === 'generate_rfp') {
      const rfpResult = await generateRFP(command.payload, user.companyName);
      if (rfpResult) {
        const newProject: Project = {
          id: `proj-${Date.now()}`,
          title: rfpResult.title,
          content: rfpResult.content,
          createdAt: new Date(),
          status: ProjectStatus.Open,
        };
        
        const updatedUser = {...user, projects: [...user.projects, newProject]};
        onUpdateUser(updatedUser);
        
        let successMessage = `I've created the RFP titled "${rfpResult.title}". You can find it in the 'Open' section of your projects.`;
        const successAiMessage: ChatMessage = { id: `ai-success-${Date.now()}`, sender: 'ai', text: successMessage, timestamp: new Date() };
        setChatHistory(prev => [...prev, successAiMessage]);
        speak(successMessage);

      } else {
        const failureMessage = "I'm sorry, I couldn't generate the RFP. There might have been an issue with the details provided.";
        const failureAiMessage: ChatMessage = { id: `ai-fail-${Date.now()}`, sender: 'ai', text: failureMessage, timestamp: new Date() };
        setChatHistory(prev => [...prev, failureAiMessage]);
        speak(failureMessage);
      }
    }

    setIsProcessing(false);
  }, [user, onUpdateUser, setView]);
  
  const handleUserMessage = useCallback((text: string) => {
    if (!text || isProcessing) return;
      const newUserMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: text,
        timestamp: new Date()
      };
      
      setChatHistory(prev => {
          const newHistory = [...prev, newUserMessage];
          handleAIResponse(newHistory);
          return newHistory;
      });
  }, [isProcessing, handleAIResponse]);

  const { isListening, toggleListening } = useSpeechRecognition(handleUserMessage);
  
  const requestsUsed = user.projects.filter(p => new Date(p.createdAt).getMonth() === new Date().getMonth()).length;
  const requestLimit = TIER_LIMITS[user.tier];
  const usagePercentage = requestLimit === Infinity ? 0 : (requestsUsed / requestLimit) * 100;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleTextInputSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem('text-input') as HTMLInputElement;
    const text = input.value.trim();
    if(text) {
        handleUserMessage(text);
        input.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full text-white pt-20 pb-24 px-4 md:px-6">
      <div className="flex flex-col items-center text-center mb-4 shrink-0">
         <div className="relative mb-4">
          <CircularProgress percentage={usagePercentage} size={160} strokeWidth={14} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <span className="text-4xl font-bold">{requestLimit === Infinity ? '∞' : requestsUsed}</span>
             <span className="text-gray-400 text-sm">Requests</span>
          </div>
        </div>
      </div>
      
      <div className="flex-grow overflow-y-auto mb-4 p-4 bg-slate-900/50 border border-slate-700/50 rounded-lg space-y-4">
        {chatHistory.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
             <div className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-green-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                <p className="text-sm">{msg.text}</p>
             </div>
          </div>
        ))}
        { isProcessing && !isListening && (
            <div className="flex items-end gap-2 justify-start">
              <div className="max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl bg-gray-700 rounded-bl-none">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <span>Thinking...</span>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-gray-300 rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex flex-col items-center gap-4 shrink-0">
        <MicrophoneButton isListening={isListening} isProcessing={isProcessing} onClick={toggleListening} />
         <form onSubmit={handleTextInputSubmit} className="w-full max-w-lg">
            <input 
              name="text-input"
              type="text" 
              placeholder="Or type your message here..."
              disabled={isProcessing || isListening}
              className="w-full p-4 text-base bg-slate-800/60 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
            />
         </form>
      </div>
    </div>
  );
};

export default HomeView;