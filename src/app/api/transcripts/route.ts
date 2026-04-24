import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import auth from "@/lib/auth";
import { DATABASE_URL_MISSING_MESSAGE, getDb } from "@/lib/db";
import { getSafeDatabaseMessage, isMissingRelationError, isPermissionError } from "@/lib/db-errors";
import { transcript } from "@/lib/schema";
import type { TranscriptItem } from "@/lib/transcript-types";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getDb();

    if (!db) {
      return NextResponse.json(
        { error: DATABASE_URL_MISSING_MESSAGE },
        { status: 503 }
      );
    }

    const transcripts: TranscriptItem[] = await db
      .select({
        id: transcript.id,
        fileName: transcript.fileName,
        content: transcript.content,
        createdAt: transcript.createdAt,
      })
      .from(transcript)
      .where(eq(transcript.userId, session.user.id))
      .orderBy(desc(transcript.createdAt));

    return NextResponse.json(transcripts);
  } catch (error) {
    if (isMissingRelationError(error) || isPermissionError(error)) {
      return NextResponse.json(
        { error: getSafeDatabaseMessage(error) },
        { status: 503 }
      );
    }

    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json(
      { error: `Failed to fetch transcripts: ${message}` },
      { status: 500 }
    );
  }
}
