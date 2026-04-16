"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface InstagramAccount {
  id: string;
  username: string;
  followers_count?: number;
  status: "active" | "inactive";
  connected_at: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatFollowers(n?: number) {
  if (n === undefined || n === null) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString();
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className ?? "w-4 h-4 animate-spin"} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function AccountCard({ account }: { account: InstagramAccount }) {
  const isActive = account.status === "active";

  return (
    <div className="gradient-border p-6 flex flex-col gap-4 transition-transform hover:-translate-y-0.5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        {/* Avatar placeholder */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
            }}
          >
            {account.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm truncate">@{account.username}</p>
            <p className="text-[var(--muted)] text-xs mt-0.5">Instagram Business</p>
          </div>
        </div>

        {/* Status badge */}
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
            isActive
              ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40"
              : "bg-zinc-800 text-zinc-400 border border-zinc-700/40"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isActive ? "bg-emerald-400" : "bg-zinc-500"
            }`}
          />
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-[var(--card-hover)] px-3 py-2">
          <p className="text-[var(--muted)] text-xs uppercase tracking-wide font-medium mb-0.5">
            Followers
          </p>
          <p className="text-white font-bold text-lg tabular-nums">
            {formatFollowers(account.followers_count)}
          </p>
        </div>
        <div className="rounded-lg bg-[var(--card-hover)] px-3 py-2">
          <p className="text-[var(--muted)] text-xs uppercase tracking-wide font-medium mb-0.5">
            Connected
          </p>
          <p className="text-white font-semibold text-sm">
            {formatDate(account.connected_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  // Fetch accounts and handle OAuth callback code on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      // Strip code from URL without reloading
      const clean = window.location.pathname;
      window.history.replaceState({}, "", clean);
      handleOAuthCallback(code);
    } else {
      fetchAccounts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function fetchAccounts() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/accounts");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load accounts");
      setAccounts(data.accounts ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleOAuthCallback(code: string) {
    setLoading(true);
    setConnectLoading(true);
    setConnectError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "connect", code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to connect account");
      setConnectSuccess("Instagram account connected successfully!");
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setConnectLoading(false);
      // Always fetch accounts after callback attempt
      await fetchAccounts();
    }
  }

  async function handleConnectClick() {
    setConnectLoading(true);
    setConnectError(null);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_oauth_url" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to get OAuth URL");
      if (!data.url) throw new Error("No OAuth URL returned");
      window.location.href = data.url;
    } catch (err) {
      setConnectError(err instanceof Error ? err.message : "Something went wrong");
      setConnectLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const hasAccounts = accounts.length > 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
            Instagram Accounts
          </h1>
          <p className="text-[var(--muted)] text-base">
            Connect and manage your Instagram business accounts
          </p>
        </header>

        {/* OAuth success banner */}
        {connectSuccess && (
          <div className="rounded-xl bg-emerald-950/40 border border-emerald-700/40 p-4 flex items-center gap-3">
            <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-emerald-300 text-sm font-medium">{connectSuccess}</p>
            <button
              onClick={() => setConnectSuccess(null)}
              className="ml-auto text-emerald-500 hover:text-emerald-300 transition-colors"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* ── Connected Accounts ─────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Connected Accounts
          </h2>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-40 rounded-xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="gradient-border p-6 flex items-start gap-3">
              <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-red-300 text-sm font-medium">Failed to load accounts</p>
                <p className="text-red-400/70 text-xs mt-0.5">{error}</p>
              </div>
              <button
                onClick={fetchAccounts}
                className="flex-shrink-0 text-xs text-[var(--accent-light)] hover:text-white transition-colors"
              >
                Retry
              </button>
            </div>
          ) : hasAccounts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((account) => (
                <AccountCard key={account.id} account={account} />
              ))}
            </div>
          ) : (
            <div className="gradient-border p-10 text-center space-y-2">
              <svg className="w-8 h-8 text-[var(--muted)] mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
              </svg>
              <p className="text-[var(--muted)] text-sm">No accounts connected yet.</p>
              <p className="text-[var(--muted)] text-xs">
                Use the section below to connect your first Instagram business account.
              </p>
            </div>
          )}
        </section>

        {/* ── Connect New Account ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Connect New Account
          </h2>

          <div
            className="relative rounded-2xl p-px overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
            }}
          >
            <div className="rounded-2xl bg-[#0e0e12] p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                {/* Description */}
                <div className="space-y-4 max-w-lg">
                  <div className="space-y-1.5">
                    <h3 className="text-white font-semibold text-lg">Connect via Facebook</h3>
                    <p className="text-[var(--muted)] text-sm leading-relaxed">
                      Instagram Business accounts are connected through Meta&apos;s secure OAuth
                      flow. You&apos;ll be redirected to Facebook to authorize access.
                    </p>
                  </div>

                  {/* Steps */}
                  <ol className="space-y-2.5">
                    {[
                      "Sign in to Facebook with your business account",
                      "Select the Facebook Page linked to your Instagram",
                      "Grant Instagram Graph API access",
                    ].map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span
                          className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white mt-0.5"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                          }}
                        >
                          {i + 1}
                        </span>
                        <span className="text-[var(--muted)] text-sm leading-snug">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* CTA */}
                <div className="flex flex-col items-start sm:items-end gap-3 flex-shrink-0">
                  <button
                    onClick={handleConnectClick}
                    disabled={connectLoading}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed pulse-glow"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                    }}
                  >
                    {connectLoading ? (
                      <>
                        <SpinnerIcon />
                        Connecting...
                      </>
                    ) : (
                      <>
                        {/* Facebook-style icon */}
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                        </svg>
                        Connect via Facebook
                      </>
                    )}
                  </button>
                  <p className="text-[var(--muted)] text-xs text-right max-w-[200px]">
                    Secure OAuth 2.0 — we never store your Facebook password
                  </p>
                </div>
              </div>

              {/* Connect error */}
              {connectError && (
                <div className="rounded-xl bg-red-950/40 border border-red-800/30 p-4 flex items-start gap-3">
                  <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                  </svg>
                  <p className="text-red-300 text-sm">{connectError}</p>
                </div>
              )}

              {/* Connecting loading message */}
              {connectLoading && (
                <div className="rounded-xl bg-violet-950/40 border border-violet-800/30 p-4 flex items-start gap-3">
                  <SpinnerIcon className="w-4 h-4 animate-spin text-violet-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-violet-300 text-sm font-medium">Redirecting to Facebook...</p>
                    <p className="text-violet-400/70 text-xs mt-0.5">
                      You&apos;ll be sent to Meta&apos;s secure login page.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ── Setup Guide (no accounts) ──────────────────────────────────────── */}
        {!loading && !hasAccounts && (
          <section className="pb-8">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
              Prerequisites
            </h2>

            <div className="gradient-border p-8 space-y-6">
              <div className="space-y-1.5">
                <h3 className="text-white font-semibold text-base">Before you connect</h3>
                <p className="text-[var(--muted)] text-sm leading-relaxed">
                  Make sure the following are in place before attempting to connect your account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Req 1 */}
                <div className="rounded-xl bg-[var(--card-hover)] p-5 space-y-2 border border-[var(--border)]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(6,182,212,0.3))",
                    }}
                  >
                    <svg className="w-4 h-4 text-[var(--accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-semibold">Instagram Business or Creator Account</p>
                  <p className="text-[var(--muted)] text-xs leading-relaxed">
                    Personal accounts are not supported. Switch to a Professional account in Instagram Settings &rarr; Account.
                  </p>
                </div>

                {/* Req 2 */}
                <div className="rounded-xl bg-[var(--card-hover)] p-5 space-y-2 border border-[var(--border)]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(6,182,212,0.3))",
                    }}
                  >
                    <svg className="w-4 h-4 text-[var(--accent-light)]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-semibold">Facebook Page Linked to Instagram</p>
                  <p className="text-[var(--muted)] text-xs leading-relaxed">
                    Your Instagram must be connected to a Facebook Page. Link it in Facebook &rarr; Settings &rarr; Linked Accounts.
                  </p>
                </div>

                {/* Req 3 */}
                <div className="rounded-xl bg-[var(--card-hover)] p-5 space-y-2 border border-[var(--border)]">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, rgba(109,40,217,0.3), rgba(6,182,212,0.3))",
                    }}
                  >
                    <svg className="w-4 h-4 text-[var(--accent-light)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                    </svg>
                  </div>
                  <p className="text-white text-sm font-semibold">Meta Developer App</p>
                  <p className="text-[var(--muted)] text-xs leading-relaxed">
                    A Meta app with the Instagram Graph API enabled is required.{" "}
                    <a
                      href="https://developers.facebook.com/apps"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent-light)] hover:text-white transition-colors underline underline-offset-2"
                    >
                      Open Meta Developer Portal &rarr;
                    </a>
                  </p>
                </div>
              </div>

              {/* Additional help link */}
              <div className="rounded-xl bg-violet-950/20 border border-violet-800/20 p-4 flex items-start gap-3">
                <svg className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                </svg>
                <p className="text-violet-300/80 text-xs leading-relaxed">
                  Need help setting up?{" "}
                  <a
                    href="https://developers.facebook.com/docs/instagram-api/getting-started"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-violet-300 hover:text-white transition-colors underline underline-offset-2"
                  >
                    Read the Instagram Graph API Getting Started guide
                  </a>
                  {" "}on the Meta developer documentation site.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
