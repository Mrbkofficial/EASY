
let selectedVoice: SpeechSynthesisVoice | null = null;

const loadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) {
    return;
  }

  // Define a priority list for finding the best available voice.
  // High-quality voices like Google's are preferred.
  const voicePreferences = [
    (v: SpeechSynthesisVoice) => v.name === 'Google US English' && v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.lang.startsWith('en-'),
    (v: SpeechSynthesisVoice) => v.name.includes('Samantha') && v.lang === 'en-US', // Common on macOS
    (v: SpeechSynthesisVoice) => v.name.includes('Zira') && v.lang === 'en-US', // Common on Windows
    (v: SpeechSynthesisVoice) => v.lang === 'en-US' && v.localService, // Prefer local high-quality voices
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en-'),
  ];

  for (const condition of voicePreferences) {
    const foundVoice = voices.find(condition);
    if (foundVoice) {
      selectedVoice = foundVoice;
      console.log(`Selected voice: ${selectedVoice.name}`);
      break;
    }
  }
  
  // Fallback to the first available English voice or the very first voice
  if (!selectedVoice) {
      selectedVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0] || null;
  }
};

// Voices may load asynchronously. We need to listen for when they are ready.
if (typeof window !== 'undefined' && window.speechSynthesis) {
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    loadVoices(); // Run immediately if voices are already available
  }
}

export const speak = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis not supported.');
      return reject('Speech synthesis not supported.');
    }

    // Cancel any ongoing speech to prevent overlap and ensure the new message is spoken
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    if (selectedVoice) {
        utterance.voice = selectedVoice;
    }
    
    utterance.lang = 'en-US';
    // Adjust rate and pitch for a more natural, less robotic sound
    utterance.rate = 0.95; 
    utterance.pitch = 1.1;

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      console.error('SpeechSynthesis Error', event);
      reject(event);
    };

    // A small delay can help ensure the previous utterance is fully cancelled.
    setTimeout(() => {
        window.speechSynthesis.speak(utterance);
    }, 100);
  });
};