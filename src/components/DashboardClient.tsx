"use client";

import { useMemo, useState } from "react";

import AudioUploader from "@/components/AudioUploader";
import TranscriptList, { type TranscriptItem } from "@/components/TranscriptList";

type DashboardClientProps = {
  initialTranscripts: TranscriptItem[];
};

export default function DashboardClient({ initialTranscripts }: DashboardClientProps) {
  const [latestTranscript, setLatestTranscript] = useState<TranscriptItem | null>(null);

  const transcriptCount = useMemo(() => {
    if (!latestTranscript) {
      return initialTranscripts.length;
    }
    const exists = initialTranscripts.some((item) => item.id === latestTranscript.id);
    return exists ? initialTranscripts.length : initialTranscripts.length + 1;
  }, [initialTranscripts, latestTranscript]);

  return (
    <>
      <section className="mt-3 rounded-xl border border-[#e5eaf3] bg-[#fbfcff] p-5">
        <h2 className="text-[14px] font-semibold text-[#23304a]">Upload Audio</h2>
        <p className="mt-1 text-[13px] text-[#64748b]">
          MP3, WAV, M4A · max 10 MB · under 1 min
        </p>
        <div className="mt-3">
          <AudioUploader onTranscriptAdded={setLatestTranscript} />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-[#e5eaf3] bg-[#fbfcff] p-5">
        <div className="mb-3 flex items-center gap-2">
          <h2 className="text-[14px] font-semibold text-[#23304a]">Transcripts</h2>
          <span className="rounded-full border border-[#d9e3f2] bg-[#f0f5ff] px-2 py-0.5 text-[12px] text-[#55709f]">
            {transcriptCount}
          </span>
        </div>
        <TranscriptList
          initialTranscripts={initialTranscripts}
          newlyAddedTranscript={latestTranscript}
        />
      </section>
    </>
  );
}
