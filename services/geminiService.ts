import { GoogleGenAI, Type } from "@google/genai";
import { RunningPlan, RunType } from "../types";
import { v4 as uuidv4 } from "uuid"; // Mocking uuid since we don't have the package, we will use a helper

// Helper for simple ID generation
const generateId = () => Math.random().toString(36).substr(2, 9);

export const generateRunningPlan = async (
  goal: string,
  level: string,
  weeks: number,
  daysPerWeek: number
): Promise<RunningPlan> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prompt engineering
  const prompt = `Create a detailed ${weeks}-week running plan for a ${level} level runner. 
  The goal is: ${goal}. 
  The runner wants to run ${daysPerWeek} days per week.
  For rest days, set distance and duration to 0 and type to '休息日'.
  Ensure the plan progresses logically in intensity/volume.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "A catchy name for the plan" },
          weeks: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                weekNumber: { type: Type.INTEGER },
                workouts: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      dayOffset: { type: Type.INTEGER, description: "0 for Monday, 6 for Sunday" },
                      type: { type: Type.STRING, enum: Object.values(RunType) },
                      distanceKm: { type: Type.NUMBER },
                      durationMin: { type: Type.NUMBER },
                      description: { type: Type.STRING, description: "Short advice for the run" }
                    },
                    required: ["dayOffset", "type", "distanceKm", "durationMin", "description"]
                  }
                }
              },
              required: ["weekNumber", "workouts"]
            }
          }
        },
        required: ["name", "weeks"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");

  const data = JSON.parse(text);

  // Transform to our internal type with IDs
  const plan: RunningPlan = {
    id: generateId(),
    name: data.name,
    goal,
    level,
    totalWeeks: weeks,
    createdAt: Date.now(),
    weeks: data.weeks.map((w: any) => ({
      weekNumber: w.weekNumber,
      workouts: w.workouts.map((wk: any) => ({
        ...wk,
        id: generateId(),
        isCompleted: false
      }))
    }))
  };

  return plan;
};
