
import { GoogleGenAI, Type } from "@google/genai";
import { COMPANY_MANUAL, COMPANY_NAME } from "../constants";

export const getKnowledgeResponse = async (query: string, history: any[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Filter out system messages and ensure roles are 'user' or 'model'
  const processedHistory = history
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  // Find the first 'user' message index to start valid history
  const firstUserIndex = processedHistory.findIndex(m => m.role === 'user');
  const validHistory = firstUserIndex !== -1 ? processedHistory.slice(firstUserIndex) : [];

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [...validHistory, { role: 'user', parts: [{ text: query }] }],
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: `You are an expert internal training coach for ${COMPANY_NAME}. 
      
      TONE & STYLE GUIDELINES:
      - Be warm, professional, and highly conversational, like a senior mentor.
      - DO NOT use Markdown headers (no # symbols).
      - Use bullet points or simple spacing for organization.
      - Use Bold text sparingly for emphasis (e.g., **Term**).
      - If explaining a script part, present it naturally as if you're speaking to the rep.
      
      KNOWLEDGE CONTEXT:
      - Use the 2024 Training Manual and Script: ${COMPANY_MANUAL}.
      - Use Google Search to provide up-to-date competitive intel (e.g., comparing 411 to Yelp, Google My Business, or Yellow Pages) or current SEO trends in Canada.
      - Focus on practical, actionable advice for sales calls.`,
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
  };
};

export const getSalesFeedback = async (transcript: string, persona: any) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash',
    contents: [
      {
        role: 'user',
        parts: [{
          text: `Evaluate the following sales call transcript based on the 411 SMART SEARCH.CA 2024 SCRIPT.
          
          Persona Pitched: ${persona.name} (${persona.role} at ${persona.company}). 
          
          MANDATORY SCRIPT STEPS TO CHECK:
          1. DID THEY ASK FOR AUTHORIZATION? (Crucial: "Are you authorized to confirm info as well as purchase?")
          2. DID THEY CONFIRM ADDRESS/INFO?
          3. DID THEY MENTION THE VALUE: "Choice of 2 categories and 7 keywords"?
          4. DID THEY QUOTE THE $775.00 PRICE CORRECTLY?
          5. DID THEY ASK FOR NAME SPELLING FOR THE INVOICE?
          6. DID THEY MENTION PROMOTIONS? (15% 2nd year or 10% Credit Card)
          
          Evaluation Metrics:
          - Rebuttal Rating: How effectively did they use the ARC (Acknowledge, Reaffirm, Close) method for objections?
          - Script Adherence: How verbatim and accurate were they to the 2024 Master Script?
          
          Training Manual Background:
          ${COMPANY_MANUAL}
          
          Transcript:
          ${transcript}
          
          Provide a detailed professional evaluation in JSON format.`
        }]
      }
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER, description: "Overall score out of 100" },
          rebuttalScore: { type: Type.NUMBER, description: "Rating out of 100 for objection handling" },
          scriptAdherenceScore: { type: Type.NUMBER, description: "Rating out of 100 for script accuracy/verbatim" },
          strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Key positive points from the script" },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Specific script steps missed" },
          summary: { type: Type.STRING, description: "One paragraph summary" },
          detailedAnalysis: { type: Type.STRING, description: "Markdown analysis of how they used the script and ARC method." }
        },
        required: ["score", "rebuttalScore", "scriptAdherenceScore", "strengths", "improvements", "summary", "detailedAnalysis"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Empty response from model");
  return JSON.parse(text);
};
