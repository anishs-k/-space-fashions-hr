import { GoogleGenAI, Type } from "@google/genai";

const PROMPT_INSTRUCTIONS = `Extract all employee bio-data information from this document. 
The document may contain multiple pages, each representing a different employee.
Identify EVERY unique employee form and return them as an array of objects.

Return the data in a structured JSON format following this schema:
{
  "employees": [
    {
      "name": string,
      "postAppliedFor": string,
      "jobProcessAssigned": string,
      "department": string,
      "fatherHusbandName": string,
      "dob": string (YYYY-MM-DD),
      "age": number,
      "qualification": string,
      "technicalQualification": string,
      "permanentAddress": string,
      "localAddress": string,
      "reference": string,
      "languages": {
        "hindi": { "read": boolean, "write": boolean, "speak": boolean },
        "english": { "read": boolean, "write": boolean, "speak": boolean },
        "punjabi": { "read": boolean, "write": boolean, "speak": boolean },
        "other": {
          "name": string,
          "skill": { "read": boolean, "write": boolean, "speak": boolean }
        }
      },
      "contactNo": string,
      "alternateContactNo": string,
      "employeeCode": string,
      "category": "Staff" | "Worker" | "PC Rate",
      "experience": string,
      "dutyTime": string,
      "dutyHours": string,
      "shiftTime": string,
      "teaTimeAllowed": string,
      "teaBreak1": string,
      "teaBreak2": string,
      "lunchBreak": string,
      "shiftHours": "8" | "9" | "10" | "12" | "13",
      "overtimeAllowed": boolean,
      "overtimeHours": string,
      "esi": string (under Old ESI),
      "pf": string (under Old PF),
      "uan": string (under Old UAN),
      "dateOfJoining": string (YYYY-MM-DD),
      "dateOfLeaving": string (YYYY-MM-DD),
      "nominee": {
        "name": string,
        "age": number,
        "dob": string,
        "relation": string
      },
      "family": [
        { "name": string, "age": number, "dob": string, "relation": string, "mobileNumber": string }
      ],
      "officeUse": {
        "basicPay": number,
        "esiEmployee": number,
        "pfEmployee": number,
        "esiEmployer": number,
        "pfEmployer": number,
        "bonus": number,
        "lwwAllowed": number,
        "lwwAmount": number,
        "lwfEmployer": number,
        "lwfEmployee": number,
        "ctc": number,
        "netCash": number,
        "remarks": string
      }
    }
  ]
}
Statutory Rules for Office Use Only:
- Head 1 (Employee Share): PF is 12% of basic if basic <= 15000, fixed 1800 if basic > 15000. ESI is 0.75% of basic if basic <= 21000, 0 if basic > 21000. LWF employee is 5. Net Cash in Hand = basic - (esiEmployee + pfEmployee + lwfEmployee).
- Head 2 (Employer Share): ESI is 3.25% of basic if basic <= 21000, 0 if basic > 21000. PF is 12% of basic (fixed 1800 if basic > 15000). LWF employer is 20. Total CTC = basic + esiEmployer + pfEmployer + lwfEmployer + lwwAmount + bonus.
Look specifically for "SPACE FASHIONS LIMITED" headers to distinguish between records. Extract the entire table for Office Use Only.`;

function cleanAndParseJSON(rawText: string) {
  if (!rawText) return { employees: [] };
  try {
    return JSON.parse(rawText);
  } catch {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    return JSON.parse(cleaned);
  }
}

async function extractWithGeminiKey(apiKey: string, base64Image: string, mimeType: string) {
  const ai = new GoogleGenAI({ apiKey });
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          { text: PROMPT_INSTRUCTIONS },
          {
            inlineData: {
              mimeType,
              data: base64Image
            }
          }
        ]
      }
    ],
    config: {
      responseMimeType: "application/json"
    }
  });

  return cleanAndParseJSON(response.text || '{}');
}

async function extractWithGroq(apiKey: string, base64Image: string, mimeType: string) {
  const imageUrl = mimeType.startsWith("image/")
    ? `data:${mimeType};base64,${base64Image}`
    : `data:image/jpeg;base64,${base64Image}`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "llama-3.2-11b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: `${PROMPT_INSTRUCTIONS}\n\nIMPORTANT: Output ONLY valid JSON containing the "employees" array.` },
            { type: "image_url", image_url: { url: imageUrl } }
          ]
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const rawContent = data.choices?.[0]?.message?.content || '{}';
  return cleanAndParseJSON(rawContent);
}

export async function extractEmployeeData(base64Image: string, mimeType: string = "image/jpeg") {
  const primaryGeminiKey = (process.env.GEMINI_API_KEY || '').trim();
  const backupGeminiKey = (process.env.GEMINI_API_KEY_FALLBACK || '').trim();
  const groqKey = (process.env.GROQ_API_KEY || '').trim();

  // Tier 1: Primary Gemini Key
  if (primaryGeminiKey) {
    try {
      console.log('Attempting AI extraction with Primary Gemini Key...');
      const result = await extractWithGeminiKey(primaryGeminiKey, base64Image, mimeType);
      if (result && Array.isArray(result.employees) && result.employees.length > 0) {
        return result;
      }
      if (result && result.employees) return result;
    } catch (err: any) {
      console.warn('Primary Gemini API failed or rate-limited:', err?.message || err);
    }
  }

  // Tier 2: Backup Gemini Key Fallback
  if (backupGeminiKey && backupGeminiKey !== primaryGeminiKey) {
    try {
      console.log('Falling back to Secondary Gemini Key...');
      const result = await extractWithGeminiKey(backupGeminiKey, base64Image, mimeType);
      if (result && Array.isArray(result.employees) && result.employees.length > 0) {
        return result;
      }
      if (result && result.employees) return result;
    } catch (err: any) {
      console.warn('Backup Gemini API failed:', err?.message || err);
    }
  }

  // Tier 3: Groq Vision Fallback
  if (groqKey) {
    try {
      console.log('Falling back to Groq Vision API...');
      const result = await extractWithGroq(groqKey, base64Image, mimeType);
      if (result && Array.isArray(result.employees)) {
        return result;
      }
      if (result && result.employees) return result;
    } catch (err: any) {
      console.warn('Groq Vision API failed:', err?.message || err);
    }
  }

  throw new Error('All AI services (Primary Gemini, Backup Gemini, and Groq) failed or keys were not configured.');
}
