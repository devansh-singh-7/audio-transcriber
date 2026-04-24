import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

import auth from "@/lib/auth";
import db from "@/lib/db";
import { transcript } from "@/lib/schema";
import type { TranscriptItem } from "@/components/TranscriptList";

export async function GET(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let transcripts: TranscriptItem[] = [];

    try {
      transcripts = await db
        .select({
          id: transcript.id,
          fileName: transcript.fileName,
          content: transcript.content,
          createdAt: transcript.createdAt,
        })
        .from(transcript)
        .where(eq(transcript.userId, session.user.id))
        .orderBy(desc(transcript.createdAt));
    } catch {
      transcripts = [];
    }

    return NextResponse.json(transcripts);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unexpected server error";
    return NextResponse.json(
      { error: `Failed to fetch transcripts: ${message}` },
      { status: 500 }
    );
  }
}
