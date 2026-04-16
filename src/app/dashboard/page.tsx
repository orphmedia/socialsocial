"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledPost {
  id: string;
  content_type: string;
  content_id: string;
  scheduled_at: string;
  status: string;
  account_username?: string;
}

interface Carousel {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Reel {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface ResearchItem {
  id: string;
  topic: string;
  created_at: string;
}

interface ContentItem {
  id: string;
  title: string;
  type: "carousel" | "reel";
  status: string;
  created_at: string;
}

interface AutopilotResult {
  message: string;
  calendar: { date: string; theme: string; contentType: string }[];
  generatedContent: { date: string; contentType: string }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  loading,
  icon,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: React.ReactNode;
}) {
  return (
    <div className="gradient-border glow-accent p-6 flex flex-col gap-3 transition-transform hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[var(--muted)] text-sm font-medium tracking-wide uppercase">
          {label}
        </span>
        <span className="text-[var(--accent-light)] opacity-70">{icon}</span>
      </div>
      {loading ? (
        <div className="h-9 w-16 rounded-md bg-[var(--border)] animate-pulse" />
      ) : (
        <span className="text-4xl font-bold text-white tabular-nums">{value}</span>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-zinc-700 text-zinc-300",
    scheduled: "bg-violet-900/60 text-violet-300",
    published: "bg-emerald-900/60 text-emerald-300",
    planned: "bg-cyan-900/60 text-cyan-300",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
        map[status] ?? "bg-zinc-700 text-zinc-300"
      }`}
    >
      {status}
    </span>
  );
}

function TypeBadge({ type }: { type: "carousel" | "reel" }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
        type === "carousel"
          ? "bg-purple-900/60 text-purple-300"
          : "bg-cyan-900/60 text-cyan-300"
      }`}
    >
      {type === "carousel" ? "Carousel" : "Reel"}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // Stats
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [carousels, setCarousels] = useState<Carousel[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  // Autopilot
  const [autopilotLoading, setAutopilotLoading] = useState(false);
  const [autopilotResult, setAutopilotResult] = useState<AutopilotResult | null>(null);
  const [autopilotError, setAutopilotError] = useState<string | null>(null);

  // Fetch all data on mount
  useEffect(() => {
    async function load() {
      setStatsLoading(true);
      try {
        const [schedRes, carRes, reelRes, resRes] = await Promise.all([
          fetch("/api/schedule"),
          fetch("/api/carousels"),
          fetch("/api/reels"),
          fetch("/api/research"),
        ]);

        const [schedData, carData, reelData, resData] = await Promise.all([
          schedRes.ok ? schedRes.json() : { posts: [] },
          carRes.ok ? carRes.json() : { carousels: [] },
          reelRes.ok ? reelRes.json() : { reels: [] },
          resRes.ok ? resRes.json() : { research: [] },
        ]);

        setScheduledPosts(schedData.posts ?? []);
        setCarousels(carData.carousels ?? []);
        setReels(reelData.reels ?? []);
        setResearch(resData.research ?? []);
      } finally {
        setStatsLoading(false);
      }
    }
    load();
  }, []);

  // Derived data
  const pendingPostsCount = scheduledPosts.filter((p) => p.status === "pending").length;

  const recentContent: ContentItem[] = [
    ...carousels.map((c) => ({ id: c.id, title: c.title, type: "carousel" as const, status: c.status, created_at: c.created_at })),
    ...reels.map((r) => ({ id: r.id, title: r.title, type: "reel" as const, status: r.status, created_at: r.created_at })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const upcomingPosts = scheduledPosts
    .filter((p) => p.status === "pending" && new Date(p.scheduled_at) >= new Date())
    .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
    .slice(0, 5);

  // Autopilot handler
  async function handleAutopilot() {
    setAutopilotLoading(true);
    setAutopilotError(null);
    setAutopilotResult(null);
    try {
      const res = await fetch("/api/autopilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weeks: 2, autoGenerate: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Autopilot failed");
      setAutopilotResult(data);

      // Refresh stats after generation
      const [schedRes, carRes, reelRes] = await Promise.all([
        fetch("/api/schedule"),
        fetch("/api/carousels"),
        fetch("/api/reels"),
      ]);
      const [schedData, carData, reelData] = await Promise.all([
        schedRes.ok ? schedRes.json() : { posts: [] },
        carRes.ok ? carRes.json() : { carousels: [] },
        reelRes.ok ? reelRes.json() : { reels: [] },
      ]);
      setScheduledPosts(schedData.posts ?? []);
      setCarousels(carData.carousels ?? []);
      setReels(reelData.reels ?? []);
    } catch (err) {
      setAutopilotError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setAutopilotLoading(false);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

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
            Command Center
          </h1>
          <p className="text-[var(--muted)] text-base">
            Welcome back — here&apos;s what&apos;s happening with your content.
          </p>
        </header>

        {/* Stats Row */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Overview
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              label="Scheduled Posts"
              value={pendingPostsCount}
              loading={statsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
            />
            <StatCard
              label="Carousels Created"
              value={carousels.length}
              loading={statsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                </svg>
              }
            />
            <StatCard
              label="Reels Scripted"
              value={reels.length}
              loading={statsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125c0-.621.504-1.125 1.125-1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125M6 18.375V6.375m0 12V6.375M6 6.375A1.125 1.125 0 017.125 5.25m-.75 1.125C6 5.754 6.504 5.25 7.125 5.25m0 0h9.75M7.125 5.25c.621 0 1.125.504 1.125 1.125M18 18.375V6.375m0 12c0 .621.504 1.125 1.125 1.125m-1.125-1.125c0 .621.504 1.125 1.125 1.125m0 0h1.5m-1.5 0c-.621 0-1.125.504-1.125 1.125M18 6.375c0-.621-.504-1.125-1.125-1.125m1.125 1.125c0-.621-.504-1.125-1.125-1.125" />
                </svg>
              }
            />
            <StatCard
              label="Research Topics"
              value={research.length}
              loading={statsLoading}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
                </svg>
              }
            />
          </div>
        </section>

        {/* Autopilot CTA */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Autopilot
          </h2>
          <div
            className="relative rounded-2xl p-px overflow-hidden"
            style={{
              background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
            }}
          >
            <div className="rounded-2xl bg-[#0e0e12] p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-2xl font-bold bg-clip-text text-transparent animate-gradient"
                      style={{
                        backgroundImage:
                          "linear-gradient(90deg, var(--gradient-start), var(--gradient-end), var(--gradient-start))",
                        backgroundSize: "200% 100%",
                      }}
                    >
                      Launch Autopilot
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-violet-900/60 text-violet-300 border border-violet-700/50">
                      AI
                    </span>
                  </div>
                  <p className="text-[var(--muted)] text-sm leading-relaxed">
                    Let Claude AI generate a full 2-week content calendar with carousels and reels,
                    ready to schedule — all tailored to your hospitality brand.
                  </p>
                </div>

                <button
                  onClick={handleAutopilot}
                  disabled={autopilotLoading}
                  className="relative flex-shrink-0 group inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed pulse-glow"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                  }}
                >
                  {autopilotLoading ? (
                    <>
                      <svg
                        className="w-4 h-4 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                      </svg>
                      Generate Content Calendar
                    </>
                  )}
                </button>
              </div>

              {/* Loading state message */}
              {autopilotLoading && (
                <div className="rounded-xl bg-violet-950/40 border border-violet-800/30 p-4 flex items-start gap-3">
                  <svg className="w-5 h-5 text-violet-400 mt-0.5 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  <div>
                    <p className="text-violet-300 text-sm font-medium">Claude is working...</p>
                    <p className="text-violet-400/70 text-xs mt-0.5">
                      Generating a 2-week calendar and creating your first 5 pieces of content. This may take 30–60 seconds.
                    </p>
                  </div>
                </div>
              )}

              {/* Error */}
              {autopilotError && (
                <div className="rounded-xl bg-red-950/40 border border-red-800/30 p-4 text-red-300 text-sm">
                  {autopilotError}
                </div>
              )}

              {/* Results */}
              {autopilotResult && (
                <div className="rounded-xl bg-emerald-950/30 border border-emerald-800/30 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-emerald-300 font-semibold text-sm">Autopilot complete!</p>
                  </div>
                  <p className="text-emerald-400/80 text-sm">{autopilotResult.message}</p>
                  {autopilotResult.calendar?.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {autopilotResult.calendar.slice(0, 8).map((entry, i) => (
                        <div
                          key={i}
                          className="rounded-lg bg-emerald-950/40 border border-emerald-800/20 px-3 py-2"
                        >
                          <p className="text-emerald-300 text-xs font-semibold">
                            {new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                          <p className="text-emerald-400/70 text-xs truncate capitalize">{entry.contentType}</p>
                          <p className="text-emerald-500/60 text-xs truncate">{entry.theme}</p>
                        </div>
                      ))}
                      {autopilotResult.calendar.length > 8 && (
                        <div className="rounded-lg bg-emerald-950/40 border border-emerald-800/20 px-3 py-2 flex items-center justify-center">
                          <span className="text-emerald-400/60 text-xs">
                            +{autopilotResult.calendar.length - 8} more
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Recent Content */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Recent Content
          </h2>
          {statsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-24 rounded-xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : recentContent.length === 0 ? (
            <div className="gradient-border p-10 text-center">
              <p className="text-[var(--muted)] text-sm">
                No content yet. Use the tools above to generate carousels or reels.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {recentContent.map((item) => (
                <div
                  key={`${item.type}-${item.id}`}
                  className="gradient-border p-4 space-y-3 hover:bg-[var(--card-hover)] transition-colors cursor-default"
                >
                  <div className="flex items-start justify-between gap-2">
                    <TypeBadge type={item.type} />
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-white text-sm font-medium leading-snug line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[var(--muted)] text-xs">
                    {item.created_at ? formatDate(item.created_at) : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Upcoming Schedule */}
        <section className="pb-8">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Upcoming Schedule
          </h2>
          {statsLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 rounded-xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : upcomingPosts.length === 0 ? (
            <div className="gradient-border p-10 text-center">
              <p className="text-[var(--muted)] text-sm">
                No upcoming posts. Schedule content from the Carousels or Reels sections.
              </p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[var(--card)] border-b border-[var(--border)]">
                    <th className="text-left px-5 py-3 text-[var(--muted)] text-xs font-semibold uppercase tracking-wide">
                      Scheduled For
                    </th>
                    <th className="text-left px-5 py-3 text-[var(--muted)] text-xs font-semibold uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-5 py-3 text-[var(--muted)] text-xs font-semibold uppercase tracking-wide">
                      Account
                    </th>
                    <th className="text-left px-5 py-3 text-[var(--muted)] text-xs font-semibold uppercase tracking-wide">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {upcomingPosts.map((post) => (
                    <tr
                      key={post.id}
                      className="bg-[var(--card)] hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="px-5 py-4 text-white font-medium whitespace-nowrap">
                        {formatDateTime(post.scheduled_at)}
                      </td>
                      <td className="px-5 py-4">
                        <TypeBadge type={post.content_type as "carousel" | "reel"} />
                      </td>
                      <td className="px-5 py-4 text-[var(--muted)]">
                        {post.account_username ? `@${post.account_username}` : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={post.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
