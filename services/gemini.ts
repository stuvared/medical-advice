
import { GoogleGenAI, GenerateContentResponse, Chat } from "@google/genai";
import { Role, Message, GroundingSource } from "../types";

const SYSTEM_INSTRUCTION = `
You are HealthBuddy, an empathetic, professional, and knowledgeable healthcare assistant.
Your goal is to provide supportive guidance on symptoms, general health queries, wellness tips, and healthy lifestyle habits.

CRITICAL SAFETY RULES:
1. You are NOT a doctor. Always include a subtle but clear disclaimer if a query seems medical.
2. In case of emergency (chest pain, severe bleeding, difficulty breathing), immediately advise the user to call emergency services (911).
3. Use Google Search grounding for up-to-date health information, new medical studies, or local health resources.
4. Keep responses structured using Markdown. Use bolding for emphasis and bullet points for lists.
5. If a user asks for specific dosages or prescription advice, decline and refer them to a pharmacist or physician.
`;

export class HealthBuddyService {
  private ai: GoogleGenAI;
  private chat: Chat;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
    this.chat = this.ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
        temperature: 0.7,
      },
    });
  }

  async *sendMessageStream(message: string) {
    try {
      const result = await this.chat.sendMessageStream({ message });
      
      let fullText = "";
      let sources: GroundingSource[] = [];

      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const textPart = c.text || "";
        fullText += textPart;

        // Check for grounding metadata
        const groundingMetadata = c.candidates?.[0]?.groundingMetadata;
        if (groundingMetadata?.groundingChunks) {
          groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
              sources.push({
                title: chunk.web.title || "Reference",
                uri: chunk.web.uri
              });
            }
          });
        }

        // Dedup sources by URI
        const uniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());

        yield {
          text: fullText,
          sources: uniqueSources,
          done: false
        };
      }

      const finalUniqueSources = Array.from(new Map(sources.map(s => [s.uri, s])).values());
      yield { text: fullText, sources: finalUniqueSources, done: true };
    } catch (error) {
      console.error("Gemini Error:", error);
      throw error;
    }
  }
}
