"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Slide {
  slideNumber: number;
  headline: string;
  body: string;
  visualDirection: string;
  designNotes: string;
}

interface GeneratedCarousel {
  title: string;
  slides: Slide[];
  caption: string;
  hashtags: string[];
}

interface SavedCarousel {
  id: string;
  title: string;
  status: string;
  created_at: string;
  slide_count?: number;
  slides?: Slide[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

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

function SpinnerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--border)] hover:bg-zinc-600 text-zinc-300 text-xs font-medium transition-colors"
    >
      {copied ? (
        <>
          <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
          Copied!
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.337c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
          </svg>
          {label}
        </>
      )}
    </button>
  );
}

function SlideCard({ slide }: { slide: Slide }) {
  return (
    <div
      className="gradient-border flex-shrink-0 flex flex-col gap-3 p-5"
      style={{ width: 300, minHeight: 260 }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
          Slide {slide.slideNumber}
        </span>
        <span
          className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
          style={{ background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))" }}
        >
          {slide.slideNumber}
        </span>
      </div>

      <p className="text-white text-lg font-bold leading-tight">{slide.headline}</p>

      {slide.body && (
        <p className="text-zinc-300 text-sm leading-relaxed flex-1">{slide.body}</p>
      )}

      {slide.visualDirection && (
        <p className="text-cyan-400/80 text-xs italic border-t border-[var(--border)] pt-3">
          {slide.visualDirection}
        </p>
      )}

      {slide.designNotes && (
        <p className="text-[var(--muted)] text-xs">{slide.designNotes}</p>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CarouselsPage() {
  // Form state
  const [topic, setTopic] = useState("");
  const [angle, setAngle] = useState("");
  const [slideCount, setSlideCount] = useState<6 | 8 | 10>(8);

  // Generation state
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedCarousel | null>(null);

  // Save / schedule state
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Previous carousels
  const [carousels, setCarousels] = useState<SavedCarousel[]>([]);
  const [carouselsLoading, setCarouselsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Pre-fill topic from ?topic= query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("topic");
    if (t) setTopic(t);
  }, []);

  // Load previous carousels on mount
  useEffect(() => {
    loadCarousels();
  }, []);

  async function loadCarousels() {
    setCarouselsLoading(true);
    try {
      const res = await fetch("/api/carousels");
      if (res.ok) {
        const data = await res.json();
        setCarousels(data.carousels ?? []);
      }
    } finally {
      setCarouselsLoading(false);
    }
  }

  async function handleGenerate() {
    if (!topic.trim()) return;
    setGenerating(true);
    setGenerateError(null);
    setGenerated(null);
    setSavedId(null);
    setSaveError(null);

    try {
      const res = await fetch("/api/carousels/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), angle: angle.trim(), slideCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
      setGenerated(data);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave(status: "draft" | "scheduled") {
    if (!generated) return;
    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/carousels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...generated, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSavedId(data.id ?? data.carousel?.id ?? "saved");
      await loadCarousels();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
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
            Carousel Creator
          </h1>
          <p className="text-[var(--muted)] text-base">
            AI-generated Instagram carousel posts
          </p>
        </header>

        {/* Creation Form */}
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Create New Carousel
          </h2>
          <div className="gradient-border p-6 space-y-5">

            {/* Topic */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">
                Topic
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. 5-star guest experience tips"
                className="w-full rounded-xl bg-[var(--background)] border border-[var(--border)] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-light)] focus:ring-1 focus:ring-[var(--accent-light)] transition-colors"
              />
            </div>

            {/* Angle / Hook */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-zinc-300">
                Angle / Hook{" "}
                <span className="text-[var(--muted)] font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={angle}
                onChange={(e) => setAngle(e.target.value)}
                placeholder="e.g. 'What hotels won't tell you' — contrarian take"
                className="w-full rounded-xl bg-[var(--background)] border border-[var(--border)] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-[var(--accent-light)] focus:ring-1 focus:ring-[var(--accent-light)] transition-colors"
              />
            </div>

            {/* Slide Count */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-300">Slide Count</label>
              <div className="flex gap-2">
                {([6, 8, 10] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => setSlideCount(n)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                      slideCount === n
                        ? "border-[var(--accent-light)] text-white"
                        : "border-[var(--border)] text-[var(--muted)] hover:border-zinc-500 hover:text-zinc-300"
                    }`}
                    style={
                      slideCount === n
                        ? { background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))" }
                        : { background: "var(--background)" }
                    }
                  >
                    {n} slides
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !topic.trim()}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed pulse-glow"
              style={{ background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))" }}
            >
              {generating ? (
                <>
                  <SpinnerIcon className="w-4 h-4 animate-spin" />
                  Claude is crafting your carousel...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generate Carousel
                </>
              )}
            </button>

            {/* Generation error */}
            {generateError && (
              <div className="rounded-xl bg-red-950/40 border border-red-800/30 p-4 text-red-300 text-sm">
                {generateError}
              </div>
            )}
          </div>
        </section>

        {/* Carousel Preview */}
        {generated && (
          <section className="space-y-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
              Preview
            </h2>

            {/* Title */}
            <div>
              <h3
                className="text-2xl font-bold bg-clip-text text-transparent animate-gradient"
                style={{
                  backgroundImage:
                    "linear-gradient(90deg, var(--gradient-start), var(--gradient-end), var(--gradient-start))",
                  backgroundSize: "200% 100%",
                }}
              >
                {generated.title}
              </h3>
              <p className="text-[var(--muted)] text-sm mt-1">
                {generated.slides.length} slides
              </p>
            </div>

            {/* Slides horizontal scroll */}
            <div
              className="flex gap-4 overflow-x-auto pb-3"
              style={{ scrollbarWidth: "thin" }}
            >
              {generated.slides.map((slide) => (
                <SlideCard key={slide.slideNumber} slide={slide} />
              ))}
            </div>

            {/* Caption */}
            <div className="gradient-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Caption
                </span>
                <CopyButton text={generated.caption} />
              </div>
              <p className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">
                {generated.caption}
              </p>
            </div>

            {/* Hashtags */}
            <div className="gradient-border p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                  Hashtags
                </span>
                <CopyButton text={generated.hashtags.join(" ")} label="Copy all" />
              </div>
              <div className="flex flex-wrap gap-2">
                {generated.hashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-violet-900/40 text-violet-300 border border-violet-800/30"
                  >
                    {tag.startsWith("#") ? tag : `#${tag}`}
                  </span>
                ))}
              </div>
            </div>

            {/* Save / Schedule actions */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => handleSave("scheduled")}
                disabled={saving || !!savedId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "linear-gradient(135deg, var(--gradient-start), var(--gradient-end))" }}
              >
                {saving ? (
                  <>
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                    </svg>
                    Schedule This
                  </>
                )}
              </button>

              <button
                onClick={() => handleSave("draft")}
                disabled={saving || !!savedId}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 border border-[var(--border)] hover:border-zinc-500 hover:text-white bg-[var(--background)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
                </svg>
                Save as Draft
              </button>

              {savedId && (
                <div className="inline-flex items-center gap-1.5 text-emerald-400 text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Saved!
                </div>
              )}
            </div>

            {saveError && (
              <div className="rounded-xl bg-red-950/40 border border-red-800/30 p-4 text-red-300 text-sm">
                {saveError}
              </div>
            )}
          </section>
        )}

        {/* Previous Carousels */}
        <section className="pb-10">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">
            Previous Carousels
          </h2>

          {carouselsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 rounded-xl bg-[var(--card)] animate-pulse" />
              ))}
            </div>
          ) : carousels.length === 0 ? (
            <div className="gradient-border p-10 text-center">
              <p className="text-[var(--muted)] text-sm">
                No carousels yet. Generate your first one above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {carousels.map((carousel) => (
                  <div key={carousel.id} className="space-y-0">
                    {/* Card */}
                    <button
                      onClick={() => toggleExpand(carousel.id)}
                      className="w-full text-left gradient-border p-4 space-y-3 hover:bg-[var(--card-hover)] transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <StatusBadge status={carousel.status} />
                        <svg
                          className={`w-4 h-4 text-[var(--muted)] flex-shrink-0 mt-0.5 transition-transform ${
                            expandedId === carousel.id ? "rotate-180" : ""
                          }`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                        </svg>
                      </div>
                      <p className="text-white text-sm font-semibold leading-snug line-clamp-2 group-hover:text-violet-200 transition-colors">
                        {carousel.title}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--muted)] text-xs">
                          {carousel.created_at ? formatDate(carousel.created_at) : "—"}
                        </span>
                        {carousel.slide_count != null && (
                          <span className="text-[var(--muted)] text-xs">
                            {carousel.slide_count} slides
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Expanded slides */}
                    {expandedId === carousel.id && carousel.slides && carousel.slides.length > 0 && (
                      <div className="mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)] p-4">
                        <div
                          className="flex gap-3 overflow-x-auto pb-2"
                          style={{ scrollbarWidth: "thin" }}
                        >
                          {carousel.slides.map((slide) => (
                            <SlideCard key={slide.slideNumber} slide={slide} />
                          ))}
                        </div>
                      </div>
                    )}

                    {expandedId === carousel.id && (!carousel.slides || carousel.slides.length === 0) && (
                      <div className="mt-2 rounded-xl bg-[var(--card)] border border-[var(--border)] px-5 py-4">
                        <p className="text-[var(--muted)] text-sm text-center">No slide data available for this carousel.</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}
