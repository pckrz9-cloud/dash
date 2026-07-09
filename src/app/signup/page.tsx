"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    inviteCode: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setBusy(false);
      return;
    }
    // Account created — sign straight in.
    await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });
    router.push("/settings?welcome=1");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <div>
          <h1 className="text-lg font-bold">Create your account</h1>
          <p className="text-sm text-ink-2">
            Use the invite code your agency sent you. Your stats are private to
            your account.
          </p>
        </div>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Invite code</span>
          <input
            required
            className="input uppercase"
            value={form.inviteCode}
            onChange={(e) => set("inviteCode", e.target.value)}
            placeholder="e.g. K7P2M9XQ4R"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Your name</span>
          <input
            required
            className="input"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            autoComplete="name"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Email</span>
          <input
            type="email"
            required
            className="input"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            autoComplete="email"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Password</span>
          <input
            type="password"
            required
            minLength={8}
            className="input"
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            autoComplete="new-password"
          />
          <span className="text-xs text-muted">At least 8 characters.</span>
        </label>
        {error && <p className="text-sm text-bad">{error}</p>}
        <button type="submit" disabled={busy} className="btn-primary w-full">
          {busy ? "Creating account…" : "Create account"}
        </button>
        <p className="text-center text-sm text-ink-2">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-series1">
            Sign in
          </Link>
        </p>
      </form>
    </main>
  );
}
