
// @google/genai Coding Guidelines followed:
// - Use GoogleGenAI with named parameter apiKey from process.env.API_KEY.
// - Use gemini-flash-lite-latest for basic text tasks.
// - Use gemini-2.5-flash-image for image generation (nano banana series).
// - Access response.text as a property, not a method.
// - Iterate through parts to find inlineData for images.

import { GoogleGenAI, Type, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";
import { UserProfile, Transaction, ChatMessage } from "../types";

export interface CoachResponse {
  advice: string;
  disciplineRating: string; 
  contextualTip: string;
}

const getContextPrompt = (profile: UserProfile, transactions: Transaction[]) => {
  const recentTransactions = transactions.slice(0, 15).map(t => 
    `${new Date(t.timestamp).toLocaleDateString()}: ₹${t.amount} for ${t.category} (${t.isFixed ? 'Fixed' : 'Variable'})`
  ).join('\n');

  return `
    You are FinFlex AI, a high-performance financial architect. 
    User Profile:
    Name: ${profile.name}
    Monthly Income: ₹${profile.monthlyIncome}
    Fixed Costs: ₹${profile.fixedCosts}
    Target Savings/Month: ₹${profile.targetMonthlyContribution}
    Yearly Goal: ₹${profile.yearlySavingsGoal}
    Risk Appetite: ${profile.riskAppetite}
    
    Recent Data Logs:
    ${recentTransactions}

    Rules:
    1. Be concise, firm, and helpful.
    2. Use Indian financial context (SIPs, Rupee symbol ₹).
    3. You have full access to their transactions. If asked about spending, calculate it from the logs.
    4. Stay in character as a "Financial Discipline Architect".
    5. If in voice mode, keep responses brief and punchy.
  `;
};

export const getFinancialAdvice = async (
  profile: UserProfile, 
  transactions: Transaction[]
): Promise<CoachResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = getContextPrompt(profile, transactions);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-flash-lite-latest",
      contents: [{ parts: [{ text: prompt + "\nProvide a strategic analysis in JSON format." }] }],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            advice: { type: Type.STRING },
            disciplineRating: { type: Type.STRING },
            contextualTip: { type: Type.STRING }
          },
          required: ["advice", "disciplineRating", "contextualTip"]
        }
      }
    });

    const jsonStr = response.text?.trim() || "{}";
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      advice: "Analysis failed. Re-evaluating system logs. Keep your spending tight.",
      disciplineRating: "Offline Architect",
      contextualTip: "Manual verification of fixed costs required."
    };
  }
};

export const chatWithGemini = async (
  profile: UserProfile,
  transactions: Transaction[],
  history: ChatMessage[],
  message: string,
  onChunk: (text: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = getContextPrompt(profile, transactions);

  const contents = [
    ...history.map(m => ({
      role: m.role,
      parts: [{ text: m.content }]
    })),
    { role: 'user', parts: [{ text: message }] }
  ];

  try {
    const responseStream = await ai.models.generateContentStream({
      model: "gemini-flash-lite-latest",
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    let fullText = "";
    for await (const chunk of responseStream) {
      // Correctly accessing .text property on response chunk
      const text = (chunk as GenerateContentResponse).text;
      if (text) {
        fullText += text;
        onChunk(fullText);
      }
    }
    return fullText;
  } catch (error) {
    console.error("Chat Error:", error);
    onChunk("System error: Connection to Financial Intelligence Grid lost.");
    return "Error";
  }
};

/**
 * Generates a vision image using gemini-2.5-flash-image (nano banana series).
 * Follows guidelines for iterating through parts to find inlineData.
 */
export const generateVisionImage = async (goal: string): Promise<string | null> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            text: `High-quality, cinematic, and professional architectural visualization of this financial goal: ${goal}. Modern, aspirational, high resolution aesthetic.`,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    // Guidelines: Iterate through all parts to find the image part, do not assume index.
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }
    return null;
  } catch (error) {
    console.error("Vision Generation Error:", error);
    return null;
  }
};

// --- AUDIO UTILITIES ---
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}
