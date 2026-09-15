import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractEmployeeData(base64Image: string, mimeType: string = "image/jpeg") {
  const model = "gemini-3-flash-preview";
  
  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        parts: [
          {
            text: `Extract all employee bio-data information from this document. 
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
            Look specifically for "SPACE FASHIONS LIMITED" headers to distinguish between records. Extract the entire table for Office Use Only.`
          },
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
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          employees: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                postAppliedFor: { type: Type.STRING },
                jobProcessAssigned: { type: Type.STRING },
                department: { type: Type.STRING },
                fatherHusbandName: { type: Type.STRING },
                dob: { type: Type.STRING },
                age: { type: Type.NUMBER },
                qualification: { type: Type.STRING },
                technicalQualification: { type: Type.STRING },
                permanentAddress: { type: Type.STRING },
                localAddress: { type: Type.STRING },
                reference: { type: Type.STRING },
                languages: {
                  type: Type.OBJECT,
                  properties: {
                    hindi: {
                      type: Type.OBJECT,
                      properties: {
                        read: { type: Type.BOOLEAN },
                        write: { type: Type.BOOLEAN },
                        speak: { type: Type.BOOLEAN }
                      }
                    },
                    english: {
                      type: Type.OBJECT,
                      properties: {
                        read: { type: Type.BOOLEAN },
                        write: { type: Type.BOOLEAN },
                        speak: { type: Type.BOOLEAN }
                      }
                    },
                    punjabi: {
                      type: Type.OBJECT,
                      properties: {
                        read: { type: Type.BOOLEAN },
                        write: { type: Type.BOOLEAN },
                        speak: { type: Type.BOOLEAN }
                      }
                    },
                    other: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        skill: {
                          type: Type.OBJECT,
                          properties: {
                            read: { type: Type.BOOLEAN },
                            write: { type: Type.BOOLEAN },
                            speak: { type: Type.BOOLEAN }
                          }
                        }
                      }
                    }
                  }
                },
                contactNo: { type: Type.STRING },
                alternateContactNo: { type: Type.STRING },
                employeeCode: { type: Type.STRING },
                category: { type: Type.STRING },
                experience: { type: Type.STRING },
                dutyTime: { type: Type.STRING },
                dutyHours: { type: Type.STRING },
                shiftTime: { type: Type.STRING },
                teaTimeAllowed: { type: Type.STRING },
                teaBreak1: { type: Type.STRING },
                teaBreak2: { type: Type.STRING },
                lunchBreak: { type: Type.STRING },
                shiftHours: { type: Type.STRING },
                overtimeAllowed: { type: Type.BOOLEAN },
                overtimeHours: { type: Type.STRING },
                esi: { type: Type.STRING },
                pf: { type: Type.STRING },
                uan: { type: Type.STRING },
                dateOfJoining: { type: Type.STRING },
                dateOfLeaving: { type: Type.STRING },
                nominee: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    age: { type: Type.NUMBER },
                    dob: { type: Type.STRING },
                    relation: { type: Type.STRING }
                  }
                },
                family: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      age: { type: Type.NUMBER },
                      dob: { type: Type.STRING },
                      relation: { type: Type.STRING },
                      mobileNumber: { type: Type.STRING }
                    }
                  }
                },
                officeUse: {
                  type: Type.OBJECT,
                  properties: {
                    basicPay: { type: Type.NUMBER },
                    esiEmployee: { type: Type.NUMBER },
                    pfEmployee: { type: Type.NUMBER },
                    esiEmployer: { type: Type.NUMBER },
                    pfEmployer: { type: Type.NUMBER },
                    bonus: { type: Type.NUMBER },
                    lwwAllowed: { type: Type.NUMBER },
                    lwwAmount: { type: Type.NUMBER },
                    lwfEmployer: { type: Type.NUMBER },
                    lwfEmployee: { type: Type.NUMBER },
                    ctc: { type: Type.NUMBER },
                    netCash: { type: Type.NUMBER },
                    remarks: { type: Type.STRING }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}
