import { GoogleGenAI } from "@google/genai";
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const candidateModels = [
  "gemini-3.6-flash",
  "gemini-3-flash-preview",
  "gemini-1.5-flash",
  "gemini-1.5-flash-latest",
  "gemini-1.5-pro",
  "gemini-2.0-flash-exp"
];

async function testModels() {
  for (const model of candidateModels) {
    try {
      console.log(`Trying model: ${model}...`);
      const response = await ai.models.generateContent({
        model,
        contents: "Say Hello"
      });
      console.log(`✅ SUCCESS with ${model}:`, response.text?.trim());
      break;
    } catch (err) {
      console.log(`❌ Failed with ${model}:`, err.message);
    }
  }
}

testModels();
