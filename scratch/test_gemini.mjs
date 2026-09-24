import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
console.log("Testing Gemini API Key (starts with):", apiKey ? apiKey.substring(0, 8) + "..." : "MISSING");

const ai = new GoogleGenAI({ apiKey });

async function testGemini() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Hello! Reply with 'AI Scanner is operational'."
    });
    console.log("Gemini API Response:", response.text);
  } catch (err) {
    console.error("Gemini API Error with gemini-2.5-flash:", err.message);
    try {
      console.log("Retrying with gemini-2.0-flash...");
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: "Hello! Reply with 'AI Scanner is operational'."
      });
      console.log("Gemini API Response:", response.text);
    } catch (err2) {
      console.error("Gemini API Error with gemini-2.0-flash:", err2.message);
    }
  }
}

testGemini();
