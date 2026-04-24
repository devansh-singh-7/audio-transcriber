"use client";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { useEffect, useState } from "react";

import { firebaseAuth } from "./firebase";

type AuthResult =
  | {
      data: { user: User };
      error: null;
    }
  | {
      data: null;
      error: { message: string };
    };

type SessionState = {
  user: User | null;
  loading: boolean;
};

function syncUserCookie(user: User | null) {
  if (typeof document === "undefined") {
    return;
  }

  if (!user) {
    document.cookie = "firebase_uid=; path=/; max-age=0";
    return;
  }

  document.cookie = `firebase_uid=${encodeURIComponent(user.uid)}; path=/; max-age=604800`;
}

async function signInEmail({ email, password }: { email: string; password: string }): Promise<AuthResult> {
  try {
    const credentials = await signInWithEmailAndPassword(firebaseAuth, email, password);
    syncUserCookie(credentials.user);
    return {
      data: { user: credentials.user },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unable to sign in right now.",
      },
    };
  }
}

async function signUpEmail({
  email,
  password,
  name,
}: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResult> {
  try {
    const credentials = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    await updateProfile(credentials.user, { displayName: name });
    syncUserCookie(credentials.user);

    return {
      data: { user: credentials.user },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : "Unable to sign up right now.",
      },
    };
  }
}

async function signOut(): Promise<{ error: null } | { error: { message: string } }> {
  try {
    await firebaseSignOut(firebaseAuth);
    syncUserCookie(null);
    return { error: null };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Unable to sign out right now.",
      },
    };
  }
}

function useSession() {
  const [session, setSession] = useState<SessionState>({
    user: firebaseAuth.currentUser,
    loading: true,
  });

  useEffect(() => {
    return onAuthStateChanged(firebaseAuth, (user) => {
      syncUserCookie(user);
      setSession({
        user,
        loading: false,
      });
    });
  }, []);

  return {
    data: session.user ? { user: session.user } : null,
    isPending: session.loading,
  };
}

export const authClient = {
  signIn: {
    email: signInEmail,
  },
  signUp: {
    email: signUpEmail,
  },
  signOut,
  useSession,
};

export const { signIn, signUp, signOut: authSignOut, useSession: authUseSession } = authClient;
