import { NextResponse } from "next/server";

import auth from "@/lib/auth";
import db from "@/lib/db";
import { transcribeAudio } from "@/lib/gemini";
import { transcript, user } from "@/lib/schema";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = new Set([
  "audio/mpeg",
  "audio/mp3",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/ogg",
  "audio/m4a",
]);

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Session expired, please sign in again" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const audioEntry = formData.get("audio");
    const fileNameEntry = formData.get("fileName");

    if (!(audioEntry instanceof File)) {
      return NextResponse.json(
        { error: "Audio file is required" },
        { status: 400 }
      );
    }

    if (audioEntry.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Audio file must be smaller than 10MB" },
        { status: 400 }
      );
    }

    if (audioEntry.size === 0) {
      return NextResponse.json({ error: "Audio file is empty" }, { status: 400 });
    }

    if (!ACCEPTED_MIME_TYPES.has(audioEntry.type)) {
      return NextResponse.json(
        { error: "Unsupported audio MIME type" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await audioEntry.arrayBuffer());
    const transcription = await transcribeAudio(fileBuffer, audioEntry.type);

    const id = crypto.randomUUID();
    const createdAt = new Date();
    const resolvedFileName =
      typeof fileNameEntry === "string" && fileNameEntry.trim()
        ? fileNameEntry.trim()
        : audioEntry.name;

    await db
      .insert(user)
      .values({
        id: session.user.id,
        name: "Firebase User",
        email: `${session.user.id}@firebase.local`,
        emailVerified: false,
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoNothing({ target: user.id });

    await db.insert(transcript).values({
      id,
      userId: session.user.id,
      fileName: resolvedFileName,
      content: transcription,
      createdAt,
    });

    return NextResponse.json({
      success: true,
      transcript: {
        id,
        fileName: resolvedFileName,
        content: transcription,
        createdAt,
      },
    });
  } catch (error) {
    console.error("Failed to transcribe audio", error);

    if (error instanceof Error) {
      if (error.message === "Transcription service timed out, please try again") {
        return NextResponse.json(
          { error: "Transcription service timed out, please try again" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { error: `Failed to transcribe audio: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to transcribe audio" },
      { status: 500 }
    );
  }
}
