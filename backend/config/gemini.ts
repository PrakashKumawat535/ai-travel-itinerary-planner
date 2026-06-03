import { GoogleGenAI, Type } from "@google/genai";

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.warn("WARNING: GEMINI_API_KEY is not defined in the environment. Under strict constraints, users must configure the secret key inside the Settings > Secrets tab.");
}

const ai = new GoogleGenAI({
  apiKey: apiKey || "MOCK_KEY",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Response Schema for Travel Itinerary
const itineraryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    destination: {
      type: Type.STRING,
      description: "Name of the target city and country"
    },
    startDate: {
      type: Type.STRING,
      description: "StartDate of travel in YYYY-MM-DD format (if indeterminable, estimate based on raw text or user cues)"
    },
    endDate: {
      type: Type.STRING,
      description: "EndDate of travel in YYYY-MM-DD format"
    },
    totalEstimatedBudget: {
      type: Type.NUMBER,
      description: "Sum of estimated activity and stay costs in USD"
    },
    itinerary: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day: { type: Type.INTEGER },
          theme: { type: Type.STRING, description: "Theme/focus of this day, e.g. Arrival & Exploration, Beach Day, Heritage Walk" },
          activities: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                time: { type: Type.STRING, description: "Time of day (e.g., Morning, Afternoon, Evening)" },
                title: { type: Type.STRING, description: "Activity name or venue title" },
                description: { type: Type.STRING, description: "Detailed description of what to do there" },
                cost: { type: Type.NUMBER, description: "Estimated cost of this activity in USD (use 0 for free)" }
              },
              required: ["time", "title", "description", "cost"]
            }
          }
        },
        required: ["day", "theme", "activities"]
      }
    },
    packingChecklist: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Curated list of essential gear, documents, and apparel to bring"
    }
  },
  required: ["destination", "startDate", "endDate", "totalEstimatedBudget", "itinerary", "packingChecklist"]
};

/**
 * Generates an itinerary by analyzing booking documents / images
 */
export async function generateItineraryFromFile(
  fileBase64: string,
  mimeType: string,
  customNotes?: string
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add your Gemini key in Secrets.");
  }

  const filePart = {
    inlineData: {
      data: fileBase64,
      mimeType: mimeType
    }
  };

  const textPart = {
    text: `System Prompt: You are a structural backend data parser and professional travel agent.
Task: Analyze the following raw booking documents/images and organize a highly detailed, day-by-day travel itinerary profile.

Constraints:
1. Output MUST be strictly valid JSON matching the exact schema provided.
2. Infer logical, highly interesting daily activities based on the parsed flight/hotel booking city destination.
3. Estimate realistic expenses in USD for each activity. Set 0 for flights/lodging if already paid.
4. If startDate/endDate are missing, estimate logical placeholders.

Additional user instructions: ${customNotes || "none"}`
  };

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: [filePart, textPart],
    config: {
      systemInstruction: "You are a professional travel curator that creates pristine structured travel itinerary JSON profiles.",
      responseMimeType: "application/json",
      responseSchema: itineraryResponseSchema
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response string fetched from Gemini model");
  }

  return JSON.parse(text);
}

/**
 * Generates an itinerary directly from text instructions / prompt inputs
 */
export async function generateItineraryFromPrompt(
  destination: string,
  durationDays: number,
  budgetLevel: string,
  startDateString?: string,
  customNotes?: string
) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable is not configured. Please add your Gemini key in Secrets.");
  }

  const prompt = `Create a custom, professional travel itinerary for:
Destination: ${destination}
Duration: ${durationDays} Days
Budget Category: ${budgetLevel}
Start Date: ${startDateString || "Estimated Future date"}
Additional User Preferences: ${customNotes || "none"}

Generate a detailed itinerary including specific daily activities, costs, themes, and packing checklist customized for this specific trip. Follow the strict JSON schema.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are an elite travel concierge. Always return valid, structured JSON travel itineraries.",
      responseMimeType: "application/json",
      responseSchema: itineraryResponseSchema
    }
  });

  const text = response.text;
  if (!text) {
    throw new Error("No response string fetched from Gemini model");
  }

  return JSON.parse(text);
}
