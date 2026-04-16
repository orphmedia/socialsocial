"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ReelScene {
  timestamp: string;
  dialogue: string;
  visual_direction: string;
  text_overlay?: string;
}

interface ReelScript {
  title: string;
  hook: string;
  scenes: ReelScene[];
  cta: string;
  caption: string;
  hashtags: string[];
  music_suggestion: string;
  transition_notes: string;
}

interface SavedReel {
  id: string;
  title: string;
  hook?: string;
  duration?: number;
  status: string;
  created_at: string;
}

type Duration = 15 | 30 | 60;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function SpinnerIcon() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Inner page (uses useSearchParams) ────────────────────────────────────────

function ReelsPageInner() {
  const searchParams = useSearchParams();

  const [topic, setTopic] = useState(searchParams.get("topic") ?? "");
  const [angle, setAngle] = useState(searchParams.get("angle") ?? "");
  const [duration, setDuration] = useState<Duration>(30);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState<ReelScript | null>(null);
  const [copiedCaption, setCopiedCaption] = useState(false);

  const [reels, setReels] = useState<SavedReel[]>([]);
  const [reelsLoading, setReelsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // Fetch saved reels on mount
  const loadReels = useCallback(async () => {
    setReelsLoading(true);
    try {
      const res = await fetch("/api/reels");
      const data = res.ok ? await res.json() : { reels: [] };
      setReels(data.reels ?? []);
    } finally {
      setReelsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReels();
  }, [loadReels]);

  // Generate script
  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setError(null);
    setScript(null);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/reels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), angle: angle.trim(), duration }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setScript(data.script ?? data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  // Copy caption
  async function copyCaption() {
    if (!script) return;
    await navigator.clipboard.writeText(script.caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  }

  // Save as draft
  async function handleSaveDraft() {
    if (!script) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: script.title,
          hook: script.hook,
          script,
          duration,
          status: "draft",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaveMsg("Saved as draft!");
      loadReels();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  // Schedule
  async function handleSchedule() {
    if (!script) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const saveRes = await fetch("/api/reels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: script.title,
          hook: script.hook,
          script,
          duration,
          status: "scheduled",
        }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error ?? "Save failed");
      setSaveMsg("Reel saved and marked for scheduling!");
      loadReels();
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "Schedule failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "#09090b" }}
    >
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main */}
      <main
        className="flex-1 overflow-y-auto px-8 py-8 space-y-10"
        style={{ marginLeft: 0 }}
      >
        {/* ── Header ── */}
        <header className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-white glow-text">
            Reels Creator
          </h1>
          <p style={{ color: "#71717a" }} className="text-base">
            AI-scripted Instagram Reels with hooks that stop the scroll
          </p>
        </header>

        {/* ── Creation Form ── */}
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#52525b" }}
          >
            Create New Reel
          </h2>

          <div
            className="rounded-2xl p-6 space-y-5 gradient-border"
            style={{ backgroundColor: "#18181b" }}
          >
            {/* Topic */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white" htmlFor="reel-topic">
                Topic
              </label>
              <input
                id="reel-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Hotel check-in experience, rooftop pool sunrise, local food tour"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/60"
                style={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                }}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>

            {/* Angle / Hook */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-white" htmlFor="reel-angle">
                Angle / Hook Direction{" "}
                <span style={{ color: "#52525b" }} className="font-normal text-xs">
                  (optional)
                </span>
              </label>
              <input
                id="reel-angle"
                type="text"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="e.g. POV: you just arrived at the most Instagrammable hotel in the city"
                className="w-full rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-all focus:ring-2 focus:ring-violet-500/60"
                style={{
                  backgroundColor: "#09090b",
                  border: "1px solid #27272a",
                }}
              />
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-white">
                Duration
              </label>
              <div className="flex gap-2">
                {([15, 30, 60] as Duration[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className="px-5 py-2 rounded-xl text-sm font-semibold transition-all"
                    style={
                      duration === d
                        ? {
                            background:
                              "linear-gradient(135deg, #6d28d9, #06b6d4)",
                            color: "#fff",
                            border: "1px solid transparent",
                          }
                        : {
                            backgroundColor: "#09090b",
                            color: "#71717a",
                            border: "1px solid #27272a",
                          }
                    }
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
              style={{
                background: "linear-gradient(135deg, #6d28d9, #06b6d4)",
              }}
            >
              {generating ? (
                <>
                  <SpinnerIcon />
                  Generating Script...
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
                      d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    />
                  </svg>
                  Generate Reel Script
                </>
              )}
            </button>

            {/* Loading message */}
            {generating && (
              <div
                className="rounded-xl p-4 flex items-start gap-3"
                style={{
                  backgroundColor: "rgba(109, 40, 217, 0.1)",
                  border: "1px solid rgba(109, 40, 217, 0.25)",
                }}
              >
                <SpinnerIcon />
                <div>
                  <p className="text-violet-300 text-sm font-medium">
                    Claude is scripting your reel...
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#6d28d9" }}>
                    Crafting a scroll-stopping hook, scene-by-scene timeline, caption, and hashtags.
                  </p>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div
                className="rounded-xl p-4 text-sm text-red-300"
                style={{
                  backgroundColor: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.2)",
                }}
              >
                {error}
              </div>
            )}
          </div>
        </section>

        {/* ── Reel Preview ── */}
        {script && (
          <section className="space-y-6">
            <h2
              className="text-xs font-semibold uppercase tracking-widest"
              style={{ color: "#52525b" }}
            >
              Generated Script
            </h2>

            {/* Title */}
            <div
              className="rounded-2xl px-6 py-5 gradient-border"
              style={{ backgroundColor: "#18181b" }}
            >
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "#52525b" }}>
                Title
              </p>
              <h3 className="text-2xl font-bold text-white leading-snug">
                {script.title}
              </h3>
            </div>

            {/* Hook */}
            <div
              className="rounded-2xl px-6 py-6 space-y-2"
              style={{
                backgroundColor: "#18181b",
                border: "1px solid rgba(6, 182, 212, 0.35)",
              }}
            >
              <div className="flex items-center gap-2 mb-3">
                <svg
                  className="w-5 h-5"
                  style={{ color: "#06b6d4" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z"
                  />
                </svg>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#06b6d4" }}
                >
                  Scroll-Stopper Hook
                </span>
              </div>
              <p className="text-2xl font-extrabold text-white leading-tight">
                {script.hook}
              </p>
            </div>

            {/* Script Timeline */}
            <div
              className="rounded-2xl px-6 py-6 gradient-border"
              style={{ backgroundColor: "#18181b" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-6"
                style={{ color: "#52525b" }}
              >
                Scene-by-Scene Timeline
              </p>

              <div className="space-y-0">
                {script.scenes.map((scene, i) => (
                  <div key={i} className="relative flex gap-5">
                    {/* Vertical line */}
                    {i < script.scenes.length - 1 && (
                      <div
                        className="absolute left-[19px] top-8 bottom-0 w-px"
                        style={{ backgroundColor: "#27272a" }}
                      />
                    )}

                    {/* Timeline dot */}
                    <div className="relative flex-shrink-0 mt-1">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          background: "linear-gradient(135deg, #6d28d9, #7c3aed)",
                          color: "#fff",
                          fontSize: "10px",
                        }}
                      >
                        {scene.timestamp}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 pb-6 space-y-2">
                      <p className="text-white text-sm font-medium leading-relaxed">
                        {scene.dialogue}
                      </p>
                      <p
                        className="text-xs italic leading-relaxed"
                        style={{ color: "#71717a" }}
                      >
                        {scene.visual_direction}
                      </p>

                      {/* Text overlay phone-style card */}
                      {scene.text_overlay && (
                        <div
                          className="inline-flex items-center gap-2 mt-1 px-3 py-1.5 rounded-lg text-xs font-semibold"
                          style={{
                            backgroundColor: "rgba(0,0,0,0.7)",
                            border: "1px solid rgba(255,255,255,0.12)",
                            color: "#fff",
                            backdropFilter: "blur(6px)",
                          }}
                        >
                          <svg
                            className="w-3 h-3 flex-shrink-0"
                            style={{ color: "#a855f7" }}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                            />
                          </svg>
                          <span style={{ color: "#d4d4d8" }}>
                            {scene.text_overlay}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div
              className="rounded-2xl px-6 py-5 space-y-2"
              style={{
                background:
                  "linear-gradient(135deg, rgba(109,40,217,0.15), rgba(6,182,212,0.1))",
                border: "1px solid rgba(109,40,217,0.3)",
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: "#a855f7" }}
              >
                Call to Action
              </p>
              <p className="text-white font-semibold text-base">{script.cta}</p>
            </div>

            {/* Caption */}
            <div
              className="rounded-2xl px-6 py-5 space-y-3 gradient-border"
              style={{ backgroundColor: "#18181b" }}
            >
              <div className="flex items-center justify-between">
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#52525b" }}
                >
                  Caption
                </p>
                <button
                  onClick={copyCaption}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    backgroundColor: copiedCaption
                      ? "rgba(34,197,94,0.12)"
                      : "rgba(109,40,217,0.15)",
                    color: copiedCaption ? "#4ade80" : "#a855f7",
                    border: `1px solid ${copiedCaption ? "rgba(34,197,94,0.3)" : "rgba(109,40,217,0.3)"}`,
                  }}
                >
                  {copiedCaption ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "#d4d4d8" }}>
                {script.caption}
              </p>
            </div>

            {/* Hashtags */}
            <div
              className="rounded-2xl px-6 py-5 gradient-border"
              style={{ backgroundColor: "#18181b" }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: "#52525b" }}
              >
                Hashtags
              </p>
              <div className="flex flex-wrap gap-2">
                {script.hashtags.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(109,40,217,0.12)",
                      color: "#c084fc",
                      border: "1px solid rgba(109,40,217,0.25)",
                    }}
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Music suggestion */}
            <div
              className="rounded-2xl px-6 py-5 flex items-start gap-4"
              style={{
                backgroundColor: "#18181b",
                border: "1px solid rgba(6,182,212,0.3)",
              }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: "rgba(6,182,212,0.12)",
                  border: "1px solid rgba(6,182,212,0.25)",
                }}
              >
                <svg
                  className="w-5 h-5"
                  style={{ color: "#06b6d4" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z"
                  />
                </svg>
              </div>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest mb-1"
                  style={{ color: "#06b6d4" }}
                >
                  Music Suggestion
                </p>
                <p className="text-white text-sm font-medium">{script.music_suggestion}</p>
              </div>
            </div>

            {/* Transition notes */}
            <div
              className="rounded-2xl px-6 py-5 gradient-border"
              style={{ backgroundColor: "#18181b" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <svg
                  className="w-4 h-4"
                  style={{ color: "#a855f7" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
                  />
                </svg>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "#52525b" }}
                >
                  Transition Notes
                </p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "#a1a1aa" }}>
                {script.transition_notes}
              </p>
            </div>

            {/* Save message */}
            {saveMsg && (
              <div
                className="rounded-xl px-4 py-3 text-sm font-medium"
                style={{
                  backgroundColor: saveMsg.includes("fail") || saveMsg.includes("failed")
                    ? "rgba(239,68,68,0.08)"
                    : "rgba(34,197,94,0.08)",
                  border: `1px solid ${
                    saveMsg.includes("fail") || saveMsg.includes("failed")
                      ? "rgba(239,68,68,0.2)"
                      : "rgba(34,197,94,0.2)"
                  }`,
                  color: saveMsg.includes("fail") || saveMsg.includes("failed")
                    ? "#f87171"
                    : "#4ade80",
                }}
              >
                {saveMsg}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={handleSchedule}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
                style={{
                  background: "linear-gradient(135deg, #6d28d9, #06b6d4)",
                }}
              >
                {saving ? (
                  <SpinnerIcon />
                ) : (
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
                      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z"
                    />
                  </svg>
                )}
                Schedule This
              </button>

              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: "rgba(109,40,217,0.12)",
                  color: "#c084fc",
                  border: "1px solid rgba(109,40,217,0.3)",
                }}
              >
                {saving ? (
                  <SpinnerIcon />
                ) : (
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
                      d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                    />
                  </svg>
                )}
                Save as Draft
              </button>
            </div>
          </section>
        )}

        {/* ── Previous Reels ── */}
        <section className="pb-10">
          <h2
            className="text-xs font-semibold uppercase tracking-widest mb-4"
            style={{ color: "#52525b" }}
          >
            Previous Reels
          </h2>

          {reelsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-32 rounded-xl animate-pulse"
                  style={{ backgroundColor: "#18181b" }}
                />
              ))}
            </div>
          ) : reels.length === 0 ? (
            <div
              className="rounded-2xl px-6 py-10 text-center gradient-border"
              style={{ backgroundColor: "#18181b" }}
            >
              <svg
                className="w-10 h-10 mx-auto mb-3 opacity-30"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
                style={{ color: "#a855f7" }}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14M3 8.87A1 1 0 013.553 8l4.447 2.069v6l-4.447 2.07A1 1 0 013 17.13V8.87z"
                />
              </svg>
              <p className="text-sm" style={{ color: "#71717a" }}>
                No reels yet. Generate your first script above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {reels.map((reel) => (
                <div
                  key={reel.id}
                  className="rounded-xl px-5 py-4 space-y-3 gradient-border transition-colors cursor-default"
                  style={{ backgroundColor: "#18181b" }}
                >
                  {/* Status + duration */}
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge status={reel.status} />
                    {reel.duration != null && (
                      <span
                        className="text-xs font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor: "rgba(6,182,212,0.1)",
                          color: "#22d3ee",
                          border: "1px solid rgba(6,182,212,0.2)",
                        }}
                      >
                        {reel.duration}s
                      </span>
                    )}
                  </div>

                  {/* Title */}
                  <p className="text-white text-sm font-semibold leading-snug line-clamp-2">
                    {reel.title}
                  </p>

                  {/* Hook preview */}
                  {reel.hook && (
                    <p className="text-xs italic line-clamp-2" style={{ color: "#71717a" }}>
                      &ldquo;{reel.hook}&rdquo;
                    </p>
                  )}

                  {/* Date */}
                  <p className="text-xs" style={{ color: "#52525b" }}>
                    {reel.created_at ? formatDate(reel.created_at) : "—"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

// ─── Page with Suspense boundary for useSearchParams ─────────────────────────

export default function ReelsPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex h-screen items-center justify-center"
          style={{ backgroundColor: "#09090b" }}
        >
          <div className="flex items-center gap-3 text-zinc-500 text-sm">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Loading...
          </div>
        </div>
      }
    >
      <ReelsPageInner />
    </Suspense>
  );
}
