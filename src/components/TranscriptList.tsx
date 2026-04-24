"use client";

import { useMemo, useState } from "react";

import type { TranscriptItem } from "@/lib/transcript-types";

type TranscriptListProps = {
  transcripts: TranscriptItem[];
  isLoading?: boolean;
};

function formatDate(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function TranscriptList({
  transcripts,
  isLoading = false,
}: TranscriptListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasTranscripts = useMemo(() => transcripts.length > 0, [transcripts]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  if (isLoading) {
    return (
      <p className="rounded-xl border border-dashed border-[#d7deec] bg-white py-10 text-center text-[14px] text-[#8798b4]">
        Loading transcripts...
      </p>
    );
  }

  if (!hasTranscripts) {
    return (
      <p className="rounded-xl border border-dashed border-[#d7deec] bg-white py-10 text-center text-[14px] text-[#8798b4]">
        No transcripts yet
      </p>
    );
  }

  return (
    <div>
      {transcripts.map((item) => {
        const isExpanded = expandedIds.has(item.id);
        const isCopied = copiedId === item.id;
        return (
          <article
            key={item.id}
            className="mb-3 rounded-xl border border-[#dde5f1] bg-white p-4 shadow-[0_6px_16px_rgba(15,23,42,0.05)] last:mb-0"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="line-clamp-1 text-[14px] font-medium text-[#22314c]">
                {item.fileName}
              </h3>
              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[13px] text-[#8a99b2]">
                  {formatDate(item.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy(item.id, item.content)}
                  className="rounded-md border border-[#ced8e9] px-2 py-1 text-[12px] text-[#42536f] transition-colors hover:border-[#6e89bb] hover:text-[#2e3f5e]"
                >
                  {isCopied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>

            <p
              className={`whitespace-pre-wrap text-[14px] leading-[1.6] text-[#3b4a63] ${
                isExpanded ? "" : "line-clamp-4"
              }`}
            >
              {item.content}
            </p>

            {item.content.length > 180 ? (
              <button
                type="button"
                onClick={() => toggleExpanded(item.id)}
                className="mt-2 text-[13px] text-[#63748f] transition-colors hover:text-[#344868]"
              >
                {isExpanded ? "Show less" : "Show more"}
              </button>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
