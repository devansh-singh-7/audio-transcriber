import { GoogleGenerativeAI } from "@google/generative-ai";

const geminiApiKey = process.env.GEMINI_API_KEY;

if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const genAI = new GoogleGenerativeAI(geminiApiKey);
const GEMINI_TIMEOUT_MS = 30_000;

const GEMINI_MODELS = ["gemini-2.5-flash-lite", "gemini-2.5-flash"];

async function transcribeWithModel(
  modelName: string,
  audioBuffer: Buffer,
  mimeType: string
) {
  const model = genAI.getGenerativeModel({ model: modelName });
  const base64Audio = audioBuffer.toString("base64");

  const result = await Promise.race([
    model.generateContent([
      {
        inlineData: {
          data: base64Audio,
          mimeType,
        },
      },
      {
        text: "Transcribe this audio accurately. Return only the transcription text, no commentary, no timestamps, no labels.",
      },
    ]),
    new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error("GEMINI_TIMEOUT"));
      }, GEMINI_TIMEOUT_MS);
    }),
  ]);

  const text = result.response.text().trim();

  if (!text) {
    throw new Error("Gemini returned an empty transcription");
  }

  return text;
}

export async function transcribeAudio(
  audioBuffer: Buffer,
  mimeType: string
): Promise<string> {
  try {
    let lastError: unknown;

    for (const modelName of GEMINI_MODELS) {
      try {
        return await transcribeWithModel(modelName, audioBuffer, mimeType);
      } catch (error) {
        lastError = error;

        if (error instanceof Error && error.message === "GEMINI_TIMEOUT") {
          throw new Error("Transcription service timed out, please try again");
        }

        continue;
      }
    }

    const message =
      lastError instanceof Error ? lastError.message : "Unknown Gemini API error";
    throw new Error(`Failed to transcribe audio with Gemini: ${message}`);
  } catch (error) {
    if (error instanceof Error && error.message === "GEMINI_TIMEOUT") {
      throw new Error("Transcription service timed out, please try again");
    }
    const message =
      error instanceof Error ? error.message : "Unknown Gemini API error";
    throw new Error(`Failed to transcribe audio with Gemini: ${message}`);
  }
}
