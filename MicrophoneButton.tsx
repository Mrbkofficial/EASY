
import React from 'react';

interface MicrophoneButtonProps {
  isListening: boolean;
  isProcessing: boolean;
  onClick: () => void;
}

const MicrophoneIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" x2="12" y1="19" y2="22"></line></svg>;
const StopIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="8" x="8" y="8" rx="1" ry="1"></rect></svg>

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isListening,
  isProcessing,
  onClick,
}) => {
  const getButtonClasses = () => {
    if (isListening) {
      return 'bg-red-500 animate-pulse';
    }
    if (isProcessing) {
      return 'bg-yellow-500 cursor-not-allowed';
    }
    return 'bg-green-500 hover:bg-green-600';
  };

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      className={`w-24 h-24 rounded-full flex items-center justify-center text-white transition-all duration-300 shadow-lg focus:outline-none focus:ring-4 focus:ring-green-500/50 ${getButtonClasses()}`}
      aria-label={isListening ? 'Stop listening' : 'Start listening'}
    >
      {isProcessing ? (
         <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      ) : isListening ? (
        <StopIcon />
      ) : (
        <MicrophoneIcon />
      )}
    </button>
  );
};

export default MicrophoneButton;