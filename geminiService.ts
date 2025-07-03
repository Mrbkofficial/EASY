
import { GoogleGenAI } from "@google/genai";
import { ChatMessage, Project } from '../types';

if (!process.env.API_KEY) {
  console.warn("API_KEY environment variable not set. Using a mock service.");
}

const ai = process.env.API_KEY ? new GoogleGenAI({ apiKey: process.env.API_KEY }) : null;

const MOCK_DELAY = 1500;

const getTermsAndConditions = (companyName: string) => `
## Standard Terms and Conditions

1.  **Confidentiality:** All information contained within this RFP is confidential and proprietary to ${companyName} and is not to be disclosed to any third party without prior written consent. The Recipient agrees to protect the confidentiality of this information with the same degree of care it uses to protect its own confidential information.

2.  **Cost of Proposal:** ${companyName} is not liable for any costs incurred by the bidders in the preparation and presentation of their proposals. All costs shall be borne by the bidders.

3.  **Right to Reject:** ${companyName} reserves the right to accept or reject any or all proposals, to waive any informalities or irregularities in any proposal, and to award the contract in the best interest of the organization.

4.  **Proposal Validity:** All proposals must remain valid for a period of ninety (90) days from the submission deadline.

5.  **Inquiries:** Any questions concerning this RFP should be directed in writing to [Contact Person, Email - To be specified]. No verbal explanation or instructions will be considered binding.

6.  **Contract Award:** The contract will be awarded to the bidder whose proposal is deemed to be the most advantageous to ${companyName}, taking into account price, quality, experience, and other factors as specified in this RFP.

7.  **Governing Law:** This RFP and any resulting contract shall be governed by and construed in accordance with the laws of [Jurisdiction - e.g., State of New York, UAE].
`;

const cleanJsonString = (text: string): string => {
  let jsonStr = text.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = jsonStr.match(fenceRegex);
  if (match && match[2]) {
    jsonStr = match[2].trim();
  }
  return jsonStr;
};

// Mock Functions
const mockGenerateRFP = (conversation: string): Promise<string> => {
    return new Promise(resolve => {
        setTimeout(() => {
            const mockRFP = {
                title: "Mock Generated Event RFP",
                summary: "This is a sample RFP based on your conversation about an event on 26th October with AV, Lighting, and Staging needs.",
                sections: [
                    { title: "Introduction", content: "Seeking proposals for a corporate event." },
                    { title: "Event Details", content: "Date: 26th October. Requirements: Audio, Video, Lighting, Staging." },
                    {
                        "title": "3. Scope of Work - Technical Production",
                        "content": "**Full AV:** Professional setup of Video, Audio, and Lighting. Includes screens, projections, sound system for 500 guests, microphones (handheld, lapel), and lighting for stage and room ambiance.\n\n**Staging:** Design and setup of a main stage, including backdrop and podium."
                    },
                    {
                        "title": "4. Scope of Work - Guest Experience and Logistics",
                        "content": "**Decor:** Comprehensive decoration of the main event space and pre-function area.\n\n**Flowers:** High-quality floral arrangements for tables and key focal points."
                    },
                    { title: "Timeline", content: "Event Date: August 16th. Submission Deadline: July 20th." }
                ]
            };
            const responseText = `Here is the RFP document I've generated for you.\n\`\`\`json\n${JSON.stringify(mockRFP, null, 2)}\n\`\`\``;
            resolve(responseText);
        }, MOCK_DELAY);
    });
};

const mockProcessCommand = (conversation: ChatMessage[]): Promise<string> => {
    return new Promise(resolve => {
        const fullConversation = conversation.map(m => m.text).join(' ').toLowerCase();
        const lastMessage = conversation[conversation.length - 1]?.text.toLowerCase() || '';

        setTimeout(() => {
            if (lastMessage.includes('project')) {
                resolve(JSON.stringify({ action: 'navigate', payload: 'projects' }));
            } else if (lastMessage.includes('pricing')) {
                resolve(JSON.stringify({ action: 'navigate', payload: 'pricing' }));
             } else if (lastMessage.includes('profile')) {
                resolve(JSON.stringify({ action: 'navigate', payload: 'profile' }));
            } else if (lastMessage.includes('home')) {
                resolve(JSON.stringify({ action: 'navigate', payload: 'home' }));
            } else if (fullConversation.includes('create') || fullConversation.includes('event') || fullConversation.includes('rfp')) {
                 if (!fullConversation.includes('attendees') && !fullConversation.includes('people')) {
                    resolve(JSON.stringify({ action: 'ask_clarification', payload: 'Sounds great! To help me build the RFP, how many attendees are you expecting?' }));
                } else if (!fullConversation.includes('date') && !fullConversation.includes('october')) { // simple check
                    resolve(JSON.stringify({ action: 'ask_clarification', payload: 'Got it. And what is the date of the event?' }));
                } else if (!fullConversation.includes('staging') || !fullConversation.includes('audio') || !fullConversation.includes('lighting')) {
                    resolve(JSON.stringify({ action: 'ask_clarification', payload: 'Perfect. What specific services do you need? For example, AV, staging, lighting, catering?' }));
                } else if (!fullConversation.includes('timeline') && !fullConversation.includes('deadline')) {
                    resolve(JSON.stringify({ action: 'ask_clarification', payload: 'That covers the services. What is the project timeline or submission deadline for this RFP?' }));
                }
                else {
                    resolve(JSON.stringify({ action: 'generate_rfp', payload: conversation.map(m => m.text).join('\n') }));
                }
            }
             else {
                resolve(JSON.stringify({ action: 'chat', payload: "I can help you generate RFPs, navigate the app, or answer questions. What would you like to do?" }));
            }
        }, MOCK_DELAY / 2);
    });
};


// Actual Gemini Service
const geminiGenerateRFP = async (conversation: string, companyName: string): Promise<string> => {
    if (!ai) return mockGenerateRFP(conversation);
    const prompt = `You are a world-class procurement expert working for the company "${companyName}". Your task is to generate an exceptionally detailed RFP document in JSON format based on the following conversation.

Conversation:
"${conversation}"

Key Instructions:
1.  **Company Name:** The RFP is being issued by "${companyName}". Use this name throughout the document in all appropriate places, such as the introduction and terms. Do not use placeholders like "[Your Company Name]".
2.  **Detailed Expansion:** Expand on each user request with professional detail. Instead of just "Flowers", create a section detailing requirements for "Floral Design and Arrangements" including mood boards, types of arrangements, and installation. Do this for all services mentioned (AV, Staging, Security, etc.).
3.  **JSON Output:** The output must be ONLY a JSON object with the following structure, and nothing else.

{
  "title": "A concise and professional title for the RFP",
  "summary": "A brief 2-3 sentence summary of the event and the request.",
  "sections": [
    { "title": "1. Introduction and Event Overview", "content": "Detailed content..." },
    { "title": "2. Scope of Work - Technical Production", "content": "Detailed content for AV, lighting, staging..." },
    { "title": "3. Scope of Work - Design & Aesthetics", "content": "Detailed content for decor, flowers..." },
    { "title": "4. Scope of Work - Logistics & Management", "content": "Detailed content for security, staffing..." },
    { "title": "5. Proposal Requirements and Submission", "content": "What bidders should include in their proposal." },
    { "title": "6. Timeline and Key Dates", "content": "Include the event date and proposal deadlines." }
  ]
}

Your response must be the JSON object inside a JSON markdown block.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        return `Here is the RFP I've generated.\n\`\`\`json\n${response.text}\n\`\`\``;
    } catch (error) {
        console.error("Error generating RFP:", error);
        return "I'm sorry, I encountered an error while generating the RFP. Please try again.";
    }
};

const geminiProcessCommand = async (conversation: ChatMessage[]): Promise<string> => {
    if (!ai) return mockProcessCommand(conversation);
    const fullConversation = conversation.map(m => `${m.sender}: ${m.text}`).join('\n');
    const prompt = `You are "EasyRFP", a helpful AI assistant for the EasyRFP app.
Your task is to analyze the entire conversation history and determine the next action.

The user's goal is to generate an RFP. To do this, you need key details like:
- The purpose/type of event (e.g., corporate conference, wedding).
- The event date.
- The number of attendees.
- Specific services required (e.g., AV, staging, lighting, catering, decor).
- Project timeline and key deadlines (e.g., proposal submission deadline).

Conversation History:
${fullConversation}

Based on the ENTIRE conversation, decide ONE of the following actions. Prioritize getting information for the RFP.

1.  'ask_clarification': If any of the key details above are missing, your action MUST be this. Ask for ONE piece of missing information. Your payload should be a friendly, specific question.
2.  'generate_rfp': If you have collected ALL key details (event type, date, attendees, services, and timeline), your action MUST be this. The payload must be the complete conversation transcript.
3.  'navigate': If the user explicitly asks to go to a section ('home', 'projects', 'pricing', 'profile').
4.  'chat': For any other general conversation that isn't related to creating an RFP or navigating.

Respond with a single JSON object containing "action" and "payload". Do NOT add any other text.

Example Clarification: If conversation is "I need an RFP for an event on Oct 26 for 500 people with AV", respond: {"action": "ask_clarification", "payload": "Got it. What is the submission deadline for the proposals?"}
Example Generation: If the conversation has a date, attendees, services, and a deadline, respond: {"action": "generate_rfp", "payload": "..."}
`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-04-17",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });
        return response.text;
    } catch (error) {
        console.error("Error processing command:", error);
        return JSON.stringify({ action: 'chat', payload: "I'm having trouble understanding. Could you rephrase that?" });
    }
};

export const processCommand = async (conversation: ChatMessage[]): Promise<{ action: string; payload: any }> => {
    const responseText = await (ai ? geminiProcessCommand(conversation) : mockProcessCommand(conversation));
    try {
        const cleanedText = cleanJsonString(responseText);
        return JSON.parse(cleanedText);
    } catch (e) {
        console.error("Failed to parse AI command response:", e, "Raw response:", responseText);
        return { action: 'chat', payload: "I'm sorry, I had an issue processing that. Please try again." };
    }
};

export const generateRFP = async (conversation: string, companyName: string): Promise<{ title: string; content: string } | null> => {
    const responseText = await (ai ? geminiGenerateRFP(conversation, companyName) : mockGenerateRFP(conversation));
    
    const jsonRegex = /```json\s*([\s\S]+?)\s*```/;
    const match = responseText.match(jsonRegex);
    
    let jsonStringToParse = '';
    if (match && match[1]) {
        jsonStringToParse = match[1].trim();
    } else {
        const firstBrace = responseText.indexOf('{');
        const lastBrace = responseText.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace > firstBrace) {
            jsonStringToParse = responseText.substring(firstBrace, lastBrace + 1);
        }
    }

    try {
        if (!jsonStringToParse) {
            throw new Error("Could not find a JSON object in the AI response.");
        }
        
        const parsedRFP = JSON.parse(jsonStringToParse);
        const termsAndConditions = getTermsAndConditions(companyName || 'Your Organization');

        const content = `
# ${parsedRFP.title}

## Summary
${parsedRFP.summary}

${parsedRFP.sections.map((s: any) => `## ${s.title}\n${s.content}`).join('\n\n')}

${termsAndConditions}
`;
        return { title: parsedRFP.title, content };
    } catch (e) {
        console.error("Failed to parse RFP JSON:", e, "Raw JSON part:", jsonStringToParse || responseText);
        return null;
    }
};