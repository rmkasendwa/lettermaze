"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useAccount } from "@/features/account";
import { apiRequest } from "@/lib/api/client";

const responseSchema = z.object({
  user: z.object({
    id: z.string(),
    email: z.string().nullable(),
    name: z.string().nullable(),
  }),
});

export default function AccountPage() {
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { refresh } = useAccount();
  const router = useRouter();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await apiRequest(
        `/account/${registering ? "register" : "login"}`,
        responseSchema,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: data.get("email"),
            password: data.get("password"),
            name: data.get("name") || undefined,
          }),
        },
      );
      await refresh();
      router.push("/play");
    } catch {
      setError("Unable to sign in. Check your details and try again.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="mx-auto max-w-md px-4 py-12">
      <div className="rounded-2xl border bg-white p-6 shadow-xl dark:bg-slate-900">
        <h1 className="text-2xl font-bold">
          {registering ? "Create account" : "Log in"}
        </h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Guest play is always available. Your progress on this device will be
          merged after you sign in.
        </p>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          {registering && (
            <label className="block text-sm font-semibold">
              Name
              <input
                className="mt-1 w-full rounded-lg border bg-transparent p-3"
                name="name"
                required
              />
            </label>
          )}
          <label className="block text-sm font-semibold">
            Email
            <input
              className="mt-1 w-full rounded-lg border bg-transparent p-3"
              name="email"
              type="email"
              required
            />
          </label>
          <label className="block text-sm font-semibold">
            Password
            <input
              className="mt-1 w-full rounded-lg border bg-transparent p-3"
              minLength={8}
              name="password"
              type="password"
              required
            />
          </label>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            className="w-full rounded-lg bg-violet-600 p-3 font-bold text-white disabled:opacity-60"
            disabled={busy}
          >
            {busy ? "Please wait…" : registering ? "Create account" : "Log in"}
          </button>
        </form>
        <button
          className="mt-4 w-full text-sm font-semibold text-violet-700 dark:text-violet-300"
          onClick={() => setRegistering((value) => !value)}
        >
          {registering
            ? "Already have an account? Log in"
            : "New player? Create an account"}
        </button>
      </div>
    </main>
  );
}
