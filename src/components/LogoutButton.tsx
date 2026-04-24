"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function LogoutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <button
      type="button"
      onClick={() => void handleSignOut()}
      className="rounded-md border border-[#d6dfed] bg-[#f8faff] px-3 py-1.5 text-[13px] text-[#5a6d8f] transition-all hover:border-[#9db0d2] hover:text-[#2f4366]"
    >
      Sign out
    </button>
  );
}
