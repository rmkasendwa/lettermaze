"use client";
import Link from "next/link";
import { useAccount } from "./AccountProvider";

export function AccountControls() {
  const { user, loading, logout } = useAccount();
  if (loading) return null;
  return user ? (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden sm:inline">{user.name || user.email}</span>
      <button
        className="rounded-lg border px-3 py-2 font-semibold"
        onClick={() => void logout()}
      >
        Log out
      </button>
    </div>
  ) : (
    <Link
      className="rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white"
      href="/account"
    >
      Log in
    </Link>
  );
}
