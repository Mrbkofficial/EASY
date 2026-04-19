let selectedVoice: SpeechSynthesisVoice | null = null;

const loadVoices = () => {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return;

  const voicePreferences = [
    (v: SpeechSynthesisVoice) => v.name === 'Google US English' && v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.name.includes('Google') && v.lang.startsWith('en-'),
    (v: SpeechSynthesisVoice) => v.name.includes('Samantha') && v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.name.includes('Zira') && v.lang === 'en-US',
    (v: SpeechSynthesisVoice) => v.lang === 'en-US' && v.localService,
    (v: SpeechSynthesisVoice) => v.lang.startsWith('en-'),
  ];

  for (const condition of voicePreferences) {
    const foundVoice = voices.find(condition);
    if (foundVoice) { selectedVoice = foundVoice; break; }
  }

  if (!selectedVoice) {
    selectedVoice = voices.find(v => v.lang.startsWith('en-')) || voices[0] || null;
  }
};

if (typeof window !== 'undefined' && window.speechSynthesis) {
  if (window.speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.onvoiceschanged = loadVoices;
  } else {
    loadVoices();
  }
}

export const speak = (text: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      return reject('Speech synthesis not supported.');
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.lang = 'en-US';
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.onend = () => resolve();
    utterance.onerror = (event) => { console.error('SpeechSynthesis Error', event); reject(event); };
    setTimeout(() => window.speechSynthesis.speak(utterance), 100);
  });
};
