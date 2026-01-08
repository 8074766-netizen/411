
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
    model: 'gemini-3-flash-preview',
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
  console.log("Calling getSalesFeedback with transcript length:", transcript.length);
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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
            
            Based on the transcript above and the training manual provided, generate a session evaluation.
            You MUST return a JSON object with the requested schema. 
            Ensure scores are numbers 0-100.
            Be specific and detailed in your analysis. Provide at least 3 distinct points for strengths and 3 for improvements if possible.
            If the rep skipped a mandatory step, highlight it in the improvements.`
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

    console.log("Gemini API Response received:", JSON.stringify(response, null, 2));
    let text = response.text;
    if (!text) {
      console.error("Empty response text from Gemini API");
      throw new Error("The AI model returned an empty response. This can happen if the transcript is too short or if there's a safety filter hit.");
    }

    // Attempt to extract JSON if there's preamble or markdown
    const extractJson = (str: string) => {
      const firstBrace = str.indexOf('{');
      const lastBrace = str.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        return str.substring(firstBrace, lastBrace + 1);
      }
      return str;
    };

    const cleanedText = extractJson(text.replace(/```json/g, '').replace(/```/g, '').trim());
    console.log("Extracted JSON text:", cleanedText);

    try {
      const parsed = JSON.parse(cleanedText);
      console.log("Parsed feedback object:", parsed);

      // Ensure all required fields exist to prevent blank display
      const requiredFields = ["score", "rebuttalScore", "scriptAdherenceScore", "strengths", "improvements", "summary", "detailedAnalysis"];
      requiredFields.forEach(field => {
        if (!(field in parsed)) {
          console.warn(`Missing field in feedback: ${field}`);
          (parsed as any)[field] = (field.includes('Score') || field === 'score') ? 0 : (field.includes('s') ? [] : "No data provided.");
        }
      });

      return parsed;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw text:", text);
      throw new Error("Failed to parse AI response. The model might have returned an invalid format.");
    }
  } catch (error) {
    console.error("Error in getSalesFeedback:", error);
    throw error;
  }
};
