"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResearchResult {
  trends: string[];
  contentAngles: { title: string; description: string }[];
  keyInsights: { stat: string; label: string }[];
  competitorGaps: { opportunity: string; detail: string }[];
  hashtags: string[];
}

interface PastResearch {
  id: string;
  topic: string;
  created_at: string;
  result?: ResearchResult;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg
      className="w-4 h-4 animate-spin"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ResearchPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [currentTopic, setCurrentTopic] = useState("");

  const [pastResearch, setPastResearch] = useState<PastResearch[]>([]);
  const [pastLoading, setPastLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  // Fetch past research on mount
  useEffect(() => {
    async function load() {
      setPastLoading(true);
      try {
        const res = await fetch("/api/research");
        const data = res.ok ? await res.json() : { research: [] };
        setPastResearch(data.research ?? []);
      } finally {
        setPastLoading(false);
      }
    }
    load();
  }, []);

  // Submit research
  async function handleResearch() {
    const trimmed = topic.trim();
    if (!trimmed) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCurrentTopic(trimmed);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Research failed");
      setResult(data.result ?? data);

      // Refresh past research list
      const listRes = await fetch("/api/research");
      const listData = listRes.ok ? await listRes.json() : { research: [] };
      setPastResearch(listData.research ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleResearch();
  }

  async function copyHashtag(tag: string) {
    try {
      await navigator.clipboard.writeText(tag);
      setCopiedTag(tag);
      setTimeout(() => setCopiedTag(null), 1500);
    } catch {
      // fallback: do nothing
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#09090b",
      }}
    >
      {/* Sidebar */}
      <div style={{ width: 260, flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main */}
      <main
        style={{
          flex: 1,
          marginLeft: 260,
          padding: "32px",
          overflowY: "auto",
          minHeight: "100vh",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: "32px" }}>
          <h1
            style={{
              fontSize: "28px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              background: "linear-gradient(90deg, #c084fc, #22d3ee)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              marginBottom: "6px",
            }}
          >
            Content Research
          </h1>
          <p style={{ color: "#71717a", fontSize: "15px" }}>
            Let Claude AI discover trending topics and content angles
          </p>
        </header>

        {/* Research Input */}
        <section
          style={{
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px",
            padding: "28px",
            marginBottom: "32px",
          }}
        >
          <label
            htmlFor="research-topic"
            style={{
              display: "block",
              fontSize: "13px",
              fontWeight: 500,
              color: "#a1a1aa",
              marginBottom: "10px",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
            }}
          >
            Research Topic
          </label>
          <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
            <input
              id="research-topic"
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., AI concierge technology, smart hotel rooms, robotic restaurants"
              disabled={loading}
              style={{
                flex: 1,
                backgroundColor: "#09090b",
                border: "1px solid #3f3f46",
                borderRadius: "10px",
                padding: "12px 16px",
                fontSize: "14px",
                color: "#e4e4e7",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#a855f7";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#3f3f46";
              }}
            />
            <button
              onClick={handleResearch}
              disabled={loading || !topic.trim()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "12px 24px",
                borderRadius: "10px",
                border: "none",
                background: loading || !topic.trim()
                  ? "rgba(168,85,247,0.3)"
                  : "linear-gradient(135deg, #7c3aed, #6d28d9)",
                color: "#fff",
                fontSize: "14px",
                fontWeight: 600,
                cursor: loading || !topic.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap",
                transition: "opacity 0.15s",
                boxShadow: loading || !topic.trim()
                  ? "none"
                  : "0 0 16px rgba(124,58,237,0.4)",
              }}
            >
              {loading ? (
                <>
                  <Spinner />
                  Researching...
                </>
              ) : (
                <>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="M21 21l-4.35-4.35" />
                    <path d="M11 8v6M8 11h6" />
                  </svg>
                  Research
                </>
              )}
            </button>
          </div>

          {loading && (
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "rgba(109,40,217,0.12)",
                border: "1px solid rgba(109,40,217,0.3)",
                borderRadius: "10px",
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Spinner />
              <div>
                <p style={{ color: "#c084fc", fontSize: "13px", fontWeight: 500 }}>
                  Claude is researching...
                </p>
                <p style={{ color: "#7c3aed", fontSize: "12px", marginTop: "2px" }}>
                  Analyzing trends, content angles, and opportunities for &ldquo;{currentTopic}&rdquo;
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                marginTop: "16px",
                backgroundColor: "rgba(239,68,68,0.08)",
                border: "1px solid rgba(239,68,68,0.25)",
                borderRadius: "10px",
                padding: "12px 16px",
                color: "#f87171",
                fontSize: "13px",
              }}
            >
              {error}
            </div>
          )}
        </section>

        {/* Research Results */}
        {result && (
          <section style={{ marginBottom: "40px" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#e4e4e7", marginBottom: "2px" }}>
                  Research Results
                </h2>
                <p style={{ fontSize: "13px", color: "#71717a" }}>
                  Topic: <span style={{ color: "#c084fc" }}>{currentTopic}</span>
                </p>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
                <a
                  href={`/carousels?topic=${encodeURIComponent(currentTopic)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "9px",
                    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 0 14px rgba(124,58,237,0.35)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="14" height="12" rx="2" />
                    <path d="M22 8v8M19 8v8" />
                  </svg>
                  Use for Carousel
                </a>
                <a
                  href={`/reels?topic=${encodeURIComponent(currentTopic)}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "9px 18px",
                    borderRadius: "9px",
                    background: "linear-gradient(135deg, #0891b2, #0e7490)",
                    color: "#fff",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                    boxShadow: "0 0 14px rgba(8,145,178,0.3)",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.9L15 14" />
                    <rect x="3" y="6" width="12" height="12" rx="2" />
                  </svg>
                  Use for Reel
                </a>
              </div>
            </div>

            <div style={{ display: "grid", gap: "20px" }}>

              {/* Trends */}
              {result.trends && result.trends.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "14px",
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#a855f7",
                      marginBottom: "16px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
                      <polyline points="17 6 23 6 23 12" />
                    </svg>
                    Trending Topics
                  </h3>
                  <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.trends.map((trend, i) => (
                      <li
                        key={i}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "12px",
                          color: "#d4d4d8",
                          fontSize: "14px",
                          lineHeight: 1.6,
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            width: "24px",
                            height: "24px",
                            borderRadius: "6px",
                            background: "rgba(168,85,247,0.15)",
                            border: "1px solid rgba(168,85,247,0.3)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#a855f7",
                            marginTop: "1px",
                          }}
                        >
                          {i + 1}
                        </span>
                        {trend}
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              {/* Content Angles */}
              {result.contentAngles && result.contentAngles.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#a855f7",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                    Content Angles
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    {result.contentAngles.map((angle, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "#18181b",
                          border: "1px solid #27272a",
                          borderRadius: "12px",
                          padding: "18px",
                          transition: "border-color 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(168,85,247,0.4)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#27272a";
                        }}
                      >
                        <p style={{ color: "#e4e4e7", fontSize: "14px", fontWeight: 600, marginBottom: "6px" }}>
                          {angle.title}
                        </p>
                        <p style={{ color: "#71717a", fontSize: "13px", lineHeight: 1.55 }}>
                          {angle.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Insights */}
              {result.keyInsights && result.keyInsights.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#22d3ee",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    Key Insights
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                      gap: "14px",
                    }}
                  >
                    {result.keyInsights.map((insight, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "rgba(8,145,178,0.07)",
                          border: "1px solid rgba(34,211,238,0.2)",
                          borderRadius: "12px",
                          padding: "20px",
                          textAlign: "center",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "26px",
                            fontWeight: 800,
                            color: "#22d3ee",
                            letterSpacing: "-0.02em",
                            marginBottom: "6px",
                          }}
                        >
                          {insight.stat}
                        </p>
                        <p style={{ color: "#a1a1aa", fontSize: "12px", lineHeight: 1.5 }}>
                          {insight.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Competitor Gaps */}
              {result.competitorGaps && result.competitorGaps.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#fb923c",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    Competitor Gaps &amp; Opportunities
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    {result.competitorGaps.map((gap, i) => (
                      <div
                        key={i}
                        style={{
                          backgroundColor: "rgba(251,146,60,0.06)",
                          border: "1px solid rgba(251,146,60,0.2)",
                          borderRadius: "12px",
                          padding: "16px 20px",
                          display: "flex",
                          gap: "14px",
                          alignItems: "flex-start",
                        }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: "#fb923c",
                            marginTop: "6px",
                          }}
                        />
                        <div>
                          <p style={{ color: "#fdba74", fontSize: "14px", fontWeight: 600, marginBottom: "4px" }}>
                            {gap.opportunity}
                          </p>
                          <p style={{ color: "#78716c", fontSize: "13px", lineHeight: 1.55 }}>
                            {gap.detail}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {result.hashtags && result.hashtags.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "14px",
                    padding: "24px",
                  }}
                >
                  <h3
                    style={{
                      fontSize: "13px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.07em",
                      color: "#a855f7",
                      marginBottom: "14px",
                      display: "flex",
                      alignItems: "center",
                      gap: "7px",
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="4" y1="9" x2="20" y2="9" />
                      <line x1="4" y1="15" x2="20" y2="15" />
                      <line x1="10" y1="3" x2="8" y2="21" />
                      <line x1="16" y1="3" x2="14" y2="21" />
                    </svg>
                    Hashtags
                    <span style={{ color: "#52525b", fontSize: "11px", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                      — click to copy
                    </span>
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {result.hashtags.map((tag, i) => (
                      <button
                        key={i}
                        onClick={() => copyHashtag(tag)}
                        style={{
                          padding: "6px 13px",
                          borderRadius: "999px",
                          border: copiedTag === tag
                            ? "1px solid rgba(34,211,238,0.5)"
                            : "1px solid rgba(168,85,247,0.3)",
                          backgroundColor: copiedTag === tag
                            ? "rgba(34,211,238,0.1)"
                            : "rgba(168,85,247,0.08)",
                          color: copiedTag === tag ? "#22d3ee" : "#c084fc",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (copiedTag !== tag) {
                            e.currentTarget.style.backgroundColor = "rgba(168,85,247,0.18)";
                            e.currentTarget.style.borderColor = "rgba(168,85,247,0.6)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (copiedTag !== tag) {
                            e.currentTarget.style.backgroundColor = "rgba(168,85,247,0.08)";
                            e.currentTarget.style.borderColor = "rgba(168,85,247,0.3)";
                          }
                        }}
                      >
                        {copiedTag === tag ? "Copied!" : tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Previous Research */}
        <section style={{ paddingBottom: "48px" }}>
          <h2
            style={{
              fontSize: "13px",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              color: "#52525b",
              marginBottom: "16px",
            }}
          >
            Previous Research
          </h2>

          {pastLoading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: "64px",
                    borderRadius: "12px",
                    backgroundColor: "#18181b",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          ) : pastResearch.length === 0 ? (
            <div
              style={{
                backgroundColor: "#18181b",
                border: "1px solid #27272a",
                borderRadius: "14px",
                padding: "40px",
                textAlign: "center",
                color: "#52525b",
                fontSize: "14px",
              }}
            >
              No research yet. Enter a topic above to get started.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {pastResearch.map((item) => {
                const isExpanded = expandedId === item.id;
                const trends: string[] = item.result?.trends ?? [];
                return (
                  <div
                    key={item.id}
                    style={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "12px",
                      overflow: "hidden",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#3f3f46";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "#27272a";
                    }}
                  >
                    {/* Row header */}
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "linear-gradient(135deg, #a855f7, #22d3ee)",
                            flexShrink: 0,
                          }}
                        />
                        <span style={{ color: "#e4e4e7", fontSize: "14px", fontWeight: 500 }}>
                          {item.topic}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
                        <span style={{ color: "#52525b", fontSize: "12px" }}>
                          {formatDate(item.created_at)}
                        </span>
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#52525b"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                          }}
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div
                        style={{
                          borderTop: "1px solid #27272a",
                          padding: "16px 20px 20px",
                        }}
                      >
                        {trends.length > 0 ? (
                          <div>
                            <p
                              style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                textTransform: "uppercase",
                                letterSpacing: "0.07em",
                                color: "#52525b",
                                marginBottom: "10px",
                              }}
                            >
                              Top Trends
                            </p>
                            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                              {trends.slice(0, 4).map((trend, i) => (
                                <li
                                  key={i}
                                  style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "10px",
                                    color: "#a1a1aa",
                                    fontSize: "13px",
                                    lineHeight: 1.5,
                                  }}
                                >
                                  <span
                                    style={{
                                      flexShrink: 0,
                                      color: "#7c3aed",
                                      fontWeight: 700,
                                      fontSize: "11px",
                                      marginTop: "2px",
                                    }}
                                  >
                                    {i + 1}.
                                  </span>
                                  {trend}
                                </li>
                              ))}
                              {trends.length > 4 && (
                                <li style={{ color: "#52525b", fontSize: "12px" }}>
                                  +{trends.length - 4} more trends
                                </li>
                              )}
                            </ul>
                          </div>
                        ) : (
                          <p style={{ color: "#52525b", fontSize: "13px" }}>
                            No detailed data available for this research.
                          </p>
                        )}
                        <div style={{ marginTop: "14px", display: "flex", gap: "8px" }}>
                          <a
                            href={`/carousels?topic=${encodeURIComponent(item.topic)}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 14px",
                              borderRadius: "7px",
                              background: "rgba(124,58,237,0.15)",
                              border: "1px solid rgba(124,58,237,0.3)",
                              color: "#c084fc",
                              fontSize: "12px",
                              fontWeight: 500,
                              textDecoration: "none",
                            }}
                          >
                            Use for Carousel
                          </a>
                          <a
                            href={`/reels?topic=${encodeURIComponent(item.topic)}`}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "5px",
                              padding: "6px 14px",
                              borderRadius: "7px",
                              background: "rgba(8,145,178,0.1)",
                              border: "1px solid rgba(34,211,238,0.25)",
                              color: "#22d3ee",
                              fontSize: "12px",
                              fontWeight: 500,
                              textDecoration: "none",
                            }}
                          >
                            Use for Reel
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
