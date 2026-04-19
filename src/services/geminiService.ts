import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';

const ai = import.meta.env.VITE_GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY })
  : null;

const MOCK_DELAY = 1500;

const getTermsAndConditions = (companyName: string) => `
## Standard Terms and Conditions

1.  **Confidentiality:** All information contained within this RFP is confidential and proprietary to ${companyName}.
2.  **Cost of Proposal:** ${companyName} is not liable for any costs incurred by bidders in preparation of proposals.
3.  **Right to Reject:** ${companyName} reserves the right to accept or reject any or all proposals.
4.  **Proposal Validity:** All proposals must remain valid for ninety (90) days from the submission deadline.
5.  **Contract Award:** The contract will be awarded to the most advantageous bidder, considering price, quality, and experience.
6.  **Governing Law:** This RFP and any resulting contract shall be governed by applicable law.
`;

const cleanJsonString = (text: string): string => {
  let jsonStr = text.trim();
  const match = jsonStr.match(/^```(\w*)?\s*\n?(.*?)\n?\s*```$/s);
  if (match && match[2]) jsonStr = match[2].trim();
  return jsonStr;
};

const mockGenerateRFP = (): Promise<string> =>
  new Promise(resolve =>
    setTimeout(() => {
      const mockRFP = {
        title: 'Mock Generated Event RFP',
        summary: 'A sample RFP based on your conversation.',
        sections: [
          { title: 'Introduction', content: 'Seeking proposals for a corporate event.' },
          { title: 'Event Details', content: 'Date: TBD. Requirements: Audio, Video, Lighting, Staging.' },
          { title: 'Scope of Work', content: 'Full AV production, staging design and setup.' },
          { title: 'Timeline', content: 'Event Date: TBD. Submission Deadline: TBD.' },
        ],
      };
      resolve(`Here is the RFP document.\n\`\`\`json\n${JSON.stringify(mockRFP, null, 2)}\n\`\`\``);
    }, MOCK_DELAY)
  );

const mockProcessCommand = (conversation: ChatMessage[]): Promise<string> =>
  new Promise(resolve => {
    const full = conversation.map(m => m.text).join(' ').toLowerCase();
    const last = conversation[conversation.length - 1]?.text.toLowerCase() || '';
    setTimeout(() => {
      if (last.includes('project')) return resolve(JSON.stringify({ action: 'navigate', payload: 'projects' }));
      if (last.includes('pricing')) return resolve(JSON.stringify({ action: 'navigate', payload: 'pricing' }));
      if (last.includes('profile')) return resolve(JSON.stringify({ action: 'navigate', payload: 'profile' }));
      if (last.includes('mission') || last.includes('agent')) return resolve(JSON.stringify({ action: 'navigate', payload: 'mission' }));
      if (full.includes('create') || full.includes('event') || full.includes('rfp')) {
        if (!full.includes('attendees')) return resolve(JSON.stringify({ action: 'ask_clarification', payload: 'How many attendees are you expecting?' }));
        if (!full.includes('date')) return resolve(JSON.stringify({ action: 'ask_clarification', payload: 'What is the date of the event?' }));
        if (!full.includes('staging') || !full.includes('audio')) return resolve(JSON.stringify({ action: 'ask_clarification', payload: 'What services do you need? (AV, staging, lighting, catering?)' }));
        return resolve(JSON.stringify({ action: 'generate_rfp', payload: conversation.map(m => m.text).join('\n') }));
      }
      resolve(JSON.stringify({ action: 'chat', payload: 'I can help you generate RFPs, navigate the app, or answer questions. What would you like to do?' }));
    }, MOCK_DELAY / 2);
  });

const geminiGenerateRFP = async (conversation: string, companyName: string): Promise<string> => {
  if (!ai) return mockGenerateRFP();
  const prompt = `You are a world-class procurement expert for "${companyName}". Generate a detailed RFP in JSON format based on this conversation:\n\n"${conversation}"\n\nReturn ONLY a JSON object with: title, summary, sections (array of {title, content}).`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: 'application/json' } });
    return `Here is the RFP I've generated.\n\`\`\`json\n${response.text}\n\`\`\``;
  } catch (error) {
    console.error('Error generating RFP:', error);
    return 'I encountered an error generating the RFP. Please try again.';
  }
};

const geminiProcessCommand = async (conversation: ChatMessage[]): Promise<string> => {
  if (!ai) return mockProcessCommand(conversation);
  const fullConversation = conversation.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `You are "EasyRFP" AI. Analyze this conversation and return ONE JSON action: ask_clarification, generate_rfp, navigate (payload: home/projects/pricing/profile/mission), or chat.\n\nConversation:\n${fullConversation}\n\nRespond with only JSON: {"action": "...", "payload": "..."}`;
  try {
    const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-preview-04-17', contents: prompt, config: { responseMimeType: 'application/json' } });
    return response.text;
  } catch (error) {
    console.error('Error processing command:', error);
    return JSON.stringify({ action: 'chat', payload: "I'm having trouble understanding. Could you rephrase that?" });
  }
};

export const processCommand = async (conversation: ChatMessage[]): Promise<{ action: string; payload: string }> => {
  const responseText = await (ai ? geminiProcessCommand(conversation) : mockProcessCommand(conversation));
  try {
    return JSON.parse(cleanJsonString(responseText));
  } catch {
    return { action: 'chat', payload: "I'm sorry, I had an issue processing that. Please try again." };
  }
};

export const generateRFP = async (conversation: string, companyName: string): Promise<{ title: string; content: string } | null> => {
  const responseText = await (ai ? geminiGenerateRFP(conversation, companyName) : mockGenerateRFP());
  const match = responseText.match(/```json\s*([\s\S]+?)\s*```/);
  let jsonStr = '';
  if (match && match[1]) {
    jsonStr = match[1].trim();
  } else {
    const f = responseText.indexOf('{');
    const l = responseText.lastIndexOf('}');
    if (f !== -1 && l > f) jsonStr = responseText.substring(f, l + 1);
  }
  try {
    if (!jsonStr) throw new Error('No JSON found in response');
    const parsedRFP = JSON.parse(jsonStr);
    const termsAndConditions = getTermsAndConditions(companyName || 'Your Organization');
    const content = `# ${parsedRFP.title}\n\n## Summary\n${parsedRFP.summary}\n\n${parsedRFP.sections.map((s: { title: string; content: string }) => `## ${s.title}\n${s.content}`).join('\n\n')}\n\n${termsAndConditions}`;
    return { title: parsedRFP.title, content };
  } catch (e) {
    console.error('Failed to parse RFP JSON:', e);
    return null;
  }
};
