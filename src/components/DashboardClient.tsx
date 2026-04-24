"use client";

import { useEffect, useMemo, useState } from "react";

import AudioUploader from "@/components/AudioUploader";
import TranscriptList from "@/components/TranscriptList";
import { authUseSession } from "@/lib/auth-client";
import { listUserTranscripts } from "@/lib/firestore-transcripts";
import type { TranscriptItem } from "@/lib/transcript-types";

export default function DashboardClient() {
  const { data: session, error: sessionError, isPending } = authUseSession();
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [isLoadingTranscripts, setIsLoadingTranscripts] = useState(true);
  const sessionUserId = session?.user?.uid ?? null;
  const sessionErrorMessage = sessionError ?? null;

  useEffect(() => {
    if (isPending) {
      return;
    }

    if (sessionErrorMessage) {
      setTranscripts([]);
      setIsLoadingTranscripts(false);
      setTranscriptError(sessionErrorMessage);
      return;
    }

    if (!sessionUserId) {
      setTranscripts([]);
      setIsLoadingTranscripts(false);
      setTranscriptError(
        "The dashboard cookie exists, but the Firebase client session was not restored. Sign out and sign back in."
      );
      return;
    }

    const activeUserId = sessionUserId;
    let cancelled = false;

    async function loadTranscripts() {
      setIsLoadingTranscripts(true);
      setTranscriptError(null);

      try {
        const nextTranscripts = await listUserTranscripts(activeUserId);

        if (!cancelled) {
          setTranscripts(nextTranscripts);
        }
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Unable to load transcripts from Firebase right now.";
          setTranscriptError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTranscripts(false);
        }
      }
    }

    void loadTranscripts();

    return () => {
      cancelled = true;
    };
  }, [isPending, sessionUserId, sessionErrorMessage]);

  const transcriptCount = useMemo(() => transcripts.length, [transcripts]);

  const handleTranscriptAdded = (transcript: TranscriptItem) => {
    setTranscripts((current) => {
      const deduped = current.filter((item) => item.id !== transcript.id);
      return [transcript, ...deduped];
    });
  };

  return (
    <>
      <section className="mt-3 rounded-2xl border border-[#dde5f6] bg-[linear-gradient(180deg,#fcfdff,#f4f7ff)] p-5 shadow-[0_10px_26px_rgba(88,110,168,0.08)]">
        <h2 className="text-[14px] font-semibold text-[#253553]">Upload Audio</h2>
        <p className="mt-1 text-[13px] text-[#64748b]">
          MP3, WAV, M4A | max 10 MB | under 1 min
        </p>
        <div className="mt-3">
          <AudioUploader
            userId={sessionUserId}
            sessionReady={!isPending}
            onTranscriptAdded={handleTranscriptAdded}
          />
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-[#dde5f6] bg-[linear-gradient(180deg,#fcfdff,#f4f7ff)] p-5 shadow-[0_10px_26px_rgba(88,110,168,0.08)]">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-[#253553]">Transcripts</h2>
          <span className="rounded-full border border-[#c9d6f0] bg-[#e9f0ff] px-2 py-0.5 text-[12px] text-[#4f6896]">
            {transcriptCount}
          </span>
        </div>
        {transcriptError ? (
          <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {transcriptError}
          </div>
        ) : null}
        <TranscriptList transcripts={transcripts} isLoading={isLoadingTranscripts} />
      </section>
    </>
  );
}
