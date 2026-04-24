import { FirebaseError } from "firebase/app";
import {
  Timestamp,
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

import { firestore } from "./firebase";
import type { TranscriptItem } from "./transcript-types";

function getUserTranscriptsCollection(userId: string) {
  return collection(firestore, "users", userId, "transcripts");
}

function toDate(value: string | Date) {
  return value instanceof Date ? value : new Date(value);
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error(message));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function getReadableFirestoreError(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "permission-denied") {
      return "Firestore denied access. Check your Firestore rules for signed-in users.";
    }

    if (error.code === "failed-precondition") {
      return "Firestore is not fully set up yet. Make sure the Firestore database is created.";
    }

    if (error.code === "unavailable") {
      return "Firestore is temporarily unavailable. Check your network and Firebase project status.";
    }

    if (error.code === "unauthenticated") {
      return "Firebase does not think you are signed in. Please sign out and sign back in.";
    }

    return `${error.code}: ${error.message}`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected Firestore error";
}

export async function listUserTranscripts(userId: string): Promise<TranscriptItem[]> {
  try {
    const transcriptQuery = query(
      getUserTranscriptsCollection(userId),
      orderBy("createdAt", "desc")
    );
    const snapshot = await withTimeout(
      getDocs(transcriptQuery),
      10000,
      "Firestore took too long to return transcripts."
    );

    return snapshot.docs.map((entry) => {
      const data = entry.data() as {
        fileName?: string;
        content?: string;
        createdAt?: Timestamp;
      };

      return {
        id: entry.id,
        fileName: data.fileName ?? "Untitled audio",
        content: data.content ?? "",
        createdAt: data.createdAt?.toDate() ?? new Date(),
      };
    });
  } catch (error) {
    throw new Error(getReadableFirestoreError(error));
  }
}

export async function saveUserTranscript(
  userId: string,
  transcript: TranscriptItem
) {
  try {
    await withTimeout(
      setDoc(doc(firestore, "users", userId, "transcripts", transcript.id), {
        fileName: transcript.fileName,
        content: transcript.content,
        createdAt: Timestamp.fromDate(toDate(transcript.createdAt)),
      }),
      10000,
      "Firestore took too long to save the transcript."
    );
  } catch (error) {
    throw new Error(getReadableFirestoreError(error));
  }
}
