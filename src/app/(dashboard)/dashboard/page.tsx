import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import DashboardClient from "@/components/DashboardClient";
import type { TranscriptItem } from "@/components/TranscriptList";
import LogoutButton from "@/components/LogoutButton";
import auth from "@/lib/auth";
import db from "@/lib/db";
import { transcript } from "@/lib/schema";

export default async function DashboardPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/login");
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

  return (
    <main className="mx-auto min-h-screen w-full max-w-245 px-4 py-8">
      <div className="rounded-3xl border border-[#d7ddf2] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(245,248,255,0.92))] p-6 shadow-[0_20px_50px_rgba(56,71,117,0.16)] backdrop-blur-sm md:p-7">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M12 3C10.3431 3 9 4.34315 9 6V12C9 13.6569 10.3431 15 12 15C13.6569 15 15 13.6569 15 12V6C15 4.34315 13.6569 3 12 3Z"
                stroke="#111111"
                strokeWidth="1.8"
              />
              <path
                d="M6.5 11.5V12C6.5 15.0376 8.96243 17.5 12 17.5C15.0376 17.5 17.5 15.0376 17.5 12V11.5M12 17.5V21M9.5 21H14.5"
                stroke="#111111"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
            <h1 className="text-[18px] font-semibold tracking-tight text-[#1f2a44]">
              Transcriber
            </h1>
          </div>
          <LogoutButton />
        </div>

        <hr className="my-5 border-[#dfe6f4]" />

        <DashboardClient initialTranscripts={transcripts} />
      </div>
    </main>
  );
}
