"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ScheduledPost {
  id: string;
  content_type: "carousel" | "reel";
  content_id: string;
  content_title?: string;
  scheduled_at: string;
  status: "pending" | "published" | "failed";
  account_id?: string;
  account_username?: string;
}

interface CalendarEntry {
  date: string;
  theme: string;
  contentType: string;
}

interface Account {
  id: string;
  username: string;
  platform: string;
}

interface ContentDraft {
  id: string;
  title: string;
  type: "carousel" | "reel";
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getWeekDates(startDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => addDays(startDate, i));
}

function getPostsForDay(posts: ScheduledPost[], day: Date): ScheduledPost[] {
  return posts.filter((p) => {
    try {
      return isSameDay(parseISO(p.scheduled_at), day);
    } catch {
      return false;
    }
  });
}

function getCalendarEntriesForDay(
  entries: CalendarEntry[],
  day: Date
): CalendarEntry[] {
  return entries.filter((e) => {
    try {
      return isSameDay(parseISO(e.date), day);
    } catch {
      return false;
    }
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-900/60 text-yellow-300 border border-yellow-700/40",
    published: "bg-emerald-900/60 text-emerald-300 border border-emerald-700/40",
    failed: "bg-red-900/60 text-red-300 border border-red-700/40",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
        styles[status] ?? "bg-zinc-700 text-zinc-300"
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
          ? "bg-purple-900/60 text-purple-300 border border-purple-700/40"
          : "bg-cyan-900/60 text-cyan-300 border border-cyan-700/40"
      }`}
    >
      {type === "carousel" ? "Carousel" : "Reel"}
    </span>
  );
}

interface DayCellProps {
  day: Date;
  posts: ScheduledPost[];
  calendarEntries: CalendarEntry[];
}

function DayCell({ day, posts, calendarEntries }: DayCellProps) {
  const todayHighlight = isToday(day);

  return (
    <div
      className="rounded-xl border flex flex-col min-h-[120px] p-2.5 gap-1.5 transition-colors"
      style={{
        backgroundColor: todayHighlight
          ? "rgba(109, 40, 217, 0.12)"
          : "var(--card)",
        borderColor: todayHighlight ? "rgba(139, 92, 246, 0.5)" : "var(--border)",
        boxShadow: todayHighlight
          ? "0 0 0 1px rgba(139,92,246,0.3), 0 0 16px rgba(139,92,246,0.15)"
          : undefined,
      }}
    >
      {/* Date header */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: todayHighlight ? "#a78bfa" : "var(--muted)" }}
        >
          {format(day, "EEE")}
        </span>
        <span
          className="text-sm font-bold"
          style={{ color: todayHighlight ? "#e4d4fd" : "#e4e4e7" }}
        >
          {format(day, "d")}
        </span>
        {todayHighlight && (
          <span className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-purple-600/50 text-purple-200 leading-none">
            Today
          </span>
        )}
      </div>

      {/* Scheduled posts */}
      {posts.map((post) => (
        <div
          key={post.id}
          className="rounded-lg px-2 py-1.5 text-xs leading-snug"
          style={{
            backgroundColor:
              post.content_type === "carousel"
                ? "rgba(126, 34, 206, 0.25)"
                : "rgba(8, 145, 178, 0.25)",
            borderLeft: `2px solid ${
              post.content_type === "carousel" ? "#a855f7" : "#22d3ee"
            }`,
          }}
        >
          <div
            className="font-semibold truncate"
            style={{
              color: post.content_type === "carousel" ? "#c084fc" : "#67e8f9",
            }}
          >
            {post.content_title ?? post.content_type}
          </div>
          <div style={{ color: "var(--muted)" }}>
            {format(parseISO(post.scheduled_at), "h:mm a")}
          </div>
        </div>
      ))}

      {/* Autopilot calendar entries (no real scheduled post yet) */}
      {calendarEntries.map((entry, i) => (
        <div
          key={`cal-${i}`}
          className="rounded-lg px-2 py-1.5 text-xs leading-snug border border-dashed"
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            borderColor: "var(--border)",
          }}
        >
          <div className="font-medium text-zinc-400 truncate capitalize">
            {entry.contentType}
          </div>
          <div className="text-zinc-600 truncate text-[10px]">{entry.theme}</div>
        </div>
      ))}

      {posts.length === 0 && calendarEntries.length === 0 && (
        <div
          className="flex-1 flex items-center justify-center text-[10px]"
          style={{ color: "#3f3f46" }}
        >
          Empty
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SchedulePage() {
  // Data state
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [draftCarousels, setDraftCarousels] = useState<ContentDraft[]>([]);
  const [draftReels, setDraftReels] = useState<ContentDraft[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick schedule form state
  const [formType, setFormType] = useState<"carousel" | "reel">("carousel");
  const [formContentId, setFormContentId] = useState("");
  const [formDatetime, setFormDatetime] = useState("");
  const [formAccountId, setFormAccountId] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState(false);

  // Cancel action
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  // Calendar week navigation
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
  const week1 = getWeekDates(weekStart);
  const week2 = getWeekDates(addDays(weekStart, 7));

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [schedRes, autopilotRes, accountsRes, carRes, reelRes] =
          await Promise.all([
            fetch("/api/schedule"),
            fetch("/api/autopilot"),
            fetch("/api/accounts"),
            fetch("/api/carousels?status=draft"),
            fetch("/api/reels?status=draft"),
          ]);

        const [schedData, autopilotData, accountsData, carData, reelData] =
          await Promise.all([
            schedRes.ok ? schedRes.json() : { posts: [] },
            autopilotRes.ok ? autopilotRes.json() : { calendar: [] },
            accountsRes.ok ? accountsRes.json() : { accounts: [] },
            carRes.ok ? carRes.json() : { carousels: [] },
            reelRes.ok ? reelRes.json() : { reels: [] },
          ]);

        const rawPosts: ScheduledPost[] = schedData.posts ?? [];
        // Sort ascending
        rawPosts.sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime()
        );
        setPosts(rawPosts);
        setCalendarEntries(autopilotData.calendar ?? []);
        setAccounts(accountsData.accounts ?? []);

        const carDrafts: ContentDraft[] = (carData.carousels ?? []).map(
          (c: { id: string; title: string }) => ({
            id: c.id,
            title: c.title,
            type: "carousel" as const,
          })
        );
        const reelDrafts: ContentDraft[] = (reelData.reels ?? []).map(
          (r: { id: string; title: string }) => ({
            id: r.id,
            title: r.title,
            type: "reel" as const,
          })
        );
        setDraftCarousels(carDrafts);
        setDraftReels(reelDrafts);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Available drafts based on selected type
  const availableDrafts =
    formType === "carousel" ? draftCarousels : draftReels;

  // Reset content selection when type changes
  function handleTypeChange(t: "carousel" | "reel") {
    setFormType(t);
    setFormContentId("");
  }

  // Cancel a scheduled post
  async function handleCancel(id: string) {
    setCancellingId(id);
    try {
      const res = await fetch(`/api/schedule?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
      }
    } finally {
      setCancellingId(null);
    }
  }

  // Submit quick schedule form
  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(false);

    if (!formContentId) {
      setFormError("Please select a piece of content.");
      return;
    }
    if (!formDatetime) {
      setFormError("Please select a date and time.");
      return;
    }

    setFormSubmitting(true);
    try {
      const body: Record<string, string> = {
        content_type: formType,
        content_id: formContentId,
        scheduled_at: new Date(formDatetime).toISOString(),
      };
      if (formAccountId) body.account_id = formAccountId;

      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to schedule");

      // Optimistically add and re-fetch
      const refreshRes = await fetch("/api/schedule");
      if (refreshRes.ok) {
        const refreshData = await refreshRes.json();
        const updated: ScheduledPost[] = refreshData.posts ?? [];
        updated.sort(
          (a, b) =>
            new Date(a.scheduled_at).getTime() -
            new Date(b.scheduled_at).getTime()
        );
        setPosts(updated);
      }

      setFormSuccess(true);
      setFormContentId("");
      setFormDatetime("");
      setFormAccountId("");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setFormSubmitting(false);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--background)" }}
    >
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main */}
      <main className="flex-1 overflow-y-auto px-8 py-8 space-y-10">
        {/* Header */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
            Content Schedule
          </h1>
          <p className="text-base" style={{ color: "var(--muted)" }}>
            Your autoprogrammed content calendar
          </p>
        </header>

        {/* ── Calendar ──────────────────────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--muted)" }}
            >
              Calendar — Current &amp; Next Week
            </h2>
            <div className="flex items-center gap-3 text-xs" style={{ color: "var(--muted)" }}>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: "#a855f7" }}
                />
                Carousel
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm"
                  style={{ backgroundColor: "#22d3ee" }}
                />
                Reel
              </span>
              <span className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm border border-dashed"
                  style={{ borderColor: "var(--border)" }}
                />
                Planned (Autopilot)
              </span>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 14 }).map((_, i) => (
                <div
                  key={i}
                  className="h-28 rounded-xl animate-pulse"
                  style={{ backgroundColor: "var(--card)" }}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Week 1 label */}
              <p
                className="text-xs font-medium mb-1"
                style={{ color: "#52525b" }}
              >
                {format(week1[0], "MMM d")} – {format(week1[6], "MMM d, yyyy")}
              </p>
              <div className="grid grid-cols-7 gap-2">
                {week1.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    day={day}
                    posts={getPostsForDay(posts, day)}
                    calendarEntries={getCalendarEntriesForDay(
                      calendarEntries,
                      day
                    )}
                  />
                ))}
              </div>

              {/* Week 2 label */}
              <p
                className="text-xs font-medium mt-3 mb-1"
                style={{ color: "#52525b" }}
              >
                {format(week2[0], "MMM d")} – {format(week2[6], "MMM d, yyyy")}
              </p>
              <div className="grid grid-cols-7 gap-2">
                {week2.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    day={day}
                    posts={getPostsForDay(posts, day)}
                    calendarEntries={getCalendarEntriesForDay(
                      calendarEntries,
                      day
                    )}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        {/* ── Quick Schedule Form ────────────────────────────────────────────── */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--muted)" }}
          >
            Quick Schedule
          </h2>

          <div className="gradient-border p-6">
            <form onSubmit={handleSchedule} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Content type */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Content Type
                  </label>
                  <select
                    value={formType}
                    onChange={(e) =>
                      handleTypeChange(e.target.value as "carousel" | "reel")
                    }
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                    style={{
                      backgroundColor: "var(--card-hover)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="carousel">Carousel</option>
                    <option value="reel">Reel</option>
                  </select>
                </div>

                {/* Content selector */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Select Content (Draft)
                  </label>
                  <select
                    value={formContentId}
                    onChange={(e) => setFormContentId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                    style={{
                      backgroundColor: "var(--card-hover)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="">
                      {availableDrafts.length === 0
                        ? `No draft ${formType}s`
                        : `Choose a ${formType}…`}
                    </option>
                    {availableDrafts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date/time picker */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Date &amp; Time
                  </label>
                  <input
                    type="datetime-local"
                    value={formDatetime}
                    onChange={(e) => setFormDatetime(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                    style={{
                      backgroundColor: "var(--card-hover)",
                      border: "1px solid var(--border)",
                      colorScheme: "dark",
                    }}
                  />
                </div>

                {/* Account selector */}
                <div className="space-y-1.5">
                  <label
                    className="block text-xs font-semibold uppercase tracking-wide"
                    style={{ color: "var(--muted)" }}
                  >
                    Account
                  </label>
                  <select
                    value={formAccountId}
                    onChange={(e) => setFormAccountId(e.target.value)}
                    className="w-full rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-purple-500 transition-shadow"
                    style={{
                      backgroundColor: "var(--card-hover)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <option value="">Any account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        @{a.username}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Error / success */}
              {formError && (
                <div className="rounded-xl p-3 text-sm text-red-300 bg-red-950/40 border border-red-800/30">
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div className="rounded-xl p-3 text-sm text-emerald-300 bg-emerald-950/40 border border-emerald-800/30">
                  Post scheduled successfully.
                </div>
              )}

              <button
                type="submit"
                disabled={formSubmitting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed pulse-glow"
                style={{
                  background:
                    "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))",
                }}
              >
                {formSubmitting ? (
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
                    Scheduling…
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                      />
                    </svg>
                    Schedule Post
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* ── Scheduled Posts List ───────────────────────────────────────────── */}
        <section className="pb-8">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "var(--muted)" }}
          >
            All Scheduled Posts
          </h2>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="h-14 rounded-xl animate-pulse"
                  style={{ backgroundColor: "var(--card)" }}
                />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="gradient-border p-10 text-center">
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                No scheduled posts yet. Use the form above to schedule your
                first post.
              </p>
            </div>
          ) : (
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: "1px solid var(--border)" }}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      backgroundColor: "var(--card)",
                      borderBottom: "1px solid var(--border)",
                    }}
                  >
                    {[
                      "Date / Time",
                      "Type",
                      "Title",
                      "Account",
                      "Status",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide"
                        style={{ color: "var(--muted)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, idx) => (
                    <tr
                      key={post.id}
                      style={{
                        backgroundColor: "var(--card)",
                        borderTop:
                          idx === 0 ? undefined : "1px solid var(--border)",
                      }}
                      className="hover:bg-[var(--card-hover)] transition-colors"
                    >
                      <td className="px-5 py-4 text-white font-medium whitespace-nowrap">
                        {(() => {
                          try {
                            return format(
                              parseISO(post.scheduled_at),
                              "MMM d, yyyy · h:mm a"
                            );
                          } catch {
                            return post.scheduled_at;
                          }
                        })()}
                      </td>
                      <td className="px-5 py-4">
                        <TypeBadge type={post.content_type} />
                      </td>
                      <td
                        className="px-5 py-4 max-w-[200px] truncate"
                        style={{ color: "#e4e4e7" }}
                        title={post.content_title ?? post.content_id}
                      >
                        {post.content_title ?? (
                          <span style={{ color: "var(--muted)" }}>
                            {post.content_id}
                          </span>
                        )}
                      </td>
                      <td
                        className="px-5 py-4"
                        style={{ color: "var(--muted)" }}
                      >
                        {post.account_username
                          ? `@${post.account_username}`
                          : "—"}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={post.status} />
                      </td>
                      <td className="px-5 py-4">
                        {post.status === "pending" ? (
                          <button
                            onClick={() => handleCancel(post.id)}
                            disabled={cancellingId === post.id}
                            className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors disabled:opacity-50"
                            style={{
                              color: "#f87171",
                              borderColor: "rgba(239,68,68,0.3)",
                              backgroundColor: "rgba(239,68,68,0.06)",
                            }}
                            onMouseEnter={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                "rgba(239,68,68,0.14)";
                            }}
                            onMouseLeave={(e) => {
                              (e.currentTarget as HTMLButtonElement).style.backgroundColor =
                                "rgba(239,68,68,0.06)";
                            }}
                          >
                            {cancellingId === post.id ? (
                              <svg
                                className="w-3 h-3 animate-spin"
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
                            ) : (
                              <svg
                                className="w-3 h-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            )}
                            Cancel
                          </button>
                        ) : (
                          <span style={{ color: "#3f3f46", fontSize: "12px" }}>
                            —
                          </span>
                        )}
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
