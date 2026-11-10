
import { GoogleGenAI } from "@google/genai";

export const getAuraInsight = async (shapeLabel: string) => {
  try {
    // process.env.API_KEY is replaced by Vite at build time
    const apiKey = process.env.API_KEY;

    if (!apiKey) {
      console.warn("Gemini API Key is missing");
      return "The universe waits for your key.";
    }

    // Create a new GoogleGenAI instance right before making an API call to ensure it always 
    // uses the most up-to-date API key from the execution environment.
    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Context: A user is interacting with a 3D sacred geometry particle system called 'Gemini Aura'. 
      They just manifested the shape: ${shapeLabel}.
      Task: Provide a deep, esoteric, and poetic one-sentence 'cosmic insight' that feels like a prophecy or a psychological reflection. Keep it under 20 words.`,
      config: {
        temperature: 0.9,
      }
    });
    // Use response.text property directly to extract the generated string output.
    return response.text.replace(/"/g, '');
  } catch (error) {
    console.error("API Error:", error);
    return "The silence between stars speaks of your presence.";
  }
};
