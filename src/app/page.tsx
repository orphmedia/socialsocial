"use client";

import { useState } from "react";

type Mode = "login" | "register";

export default function Home() {
  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setName("");
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
    const body =
      mode === "login"
        ? { email, password }
        : { name, email, password };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || data?.message || "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Network error. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-16"
      style={{ background: "#09090b" }}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div
          className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full opacity-[0.07]"
          style={{
            background:
              "radial-gradient(ellipse at center, #6d28d9 0%, #06b6d4 60%, transparent 80%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-[15%] w-[400px] h-[300px] rounded-full opacity-[0.05]"
          style={{
            background: "radial-gradient(ellipse at center, #8b5cf6, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full opacity-[0.04]"
          style={{
            background: "radial-gradient(ellipse at center, #06b6d4, transparent 70%)",
            filter: "blur(60px)",
          }}
        />
      </div>

      {/* Brand header */}
      <div className="mb-10 text-center z-10">
        <h1
          className="text-5xl font-black tracking-tight mb-3 animate-gradient"
          style={{
            background: "linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%)",
            backgroundSize: "200% 200%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          SocialSocial
        </h1>
        <p className="text-sm font-medium tracking-widest uppercase" style={{ color: "#71717a" }}>
          OrphMedia&apos;s AI-Powered Instagram Engine
        </p>
      </div>

      {/* Card */}
      <div className="gradient-border w-full max-w-md z-10">
        <div
          className="rounded-xl px-8 py-10"
          style={{ background: "#18181b" }}
        >
          {/* Mode toggle */}
          <div
            className="flex rounded-lg p-1 mb-8"
            style={{ background: "#09090b" }}
          >
            {(["login", "register"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="flex-1 py-2 text-sm font-semibold rounded-md transition-all duration-200 tracking-wide"
                style={
                  mode === m
                    ? {
                        background: "linear-gradient(135deg, #6d28d9, #8b5cf6)",
                        color: "#fafafa",
                        boxShadow: "0 0 16px rgba(139, 92, 246, 0.35)",
                      }
                    : { color: "#71717a" }
                }
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            {mode === "register" && (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="name"
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "#71717a" }}
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Jane Doe"
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:opacity-30"
                  style={{
                    background: "#09090b",
                    border: "1px solid #27272a",
                    color: "#fafafa",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#6d28d9";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.15)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "#27272a";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email"
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#71717a" }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:opacity-30"
                style={{
                  background: "#09090b",
                  border: "1px solid #27272a",
                  color: "#fafafa",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6d28d9";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#27272a";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-xs font-semibold tracking-widest uppercase"
                style={{ color: "#71717a" }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder={mode === "register" ? "Min. 8 characters" : "••••••••"}
                className="w-full rounded-lg px-4 py-3 text-sm outline-none transition-all duration-200 placeholder:opacity-30"
                style={{
                  background: "#09090b",
                  border: "1px solid #27272a",
                  color: "#fafafa",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#6d28d9";
                  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(109,40,217,0.15)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#27272a";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
            </div>

            {/* Inline error */}
            {error && (
              <p
                className="text-xs rounded-lg px-4 py-3 leading-relaxed"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  color: "#f87171",
                }}
              >
                {error}
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg text-sm font-bold tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-1 animate-gradient"
              style={{
                background: "linear-gradient(135deg, #6d28d9 0%, #8b5cf6 50%, #06b6d4 100%)",
                backgroundSize: "200% 200%",
                color: "#fafafa",
                boxShadow: loading
                  ? "none"
                  : "0 0 24px rgba(139, 92, 246, 0.4), 0 4px 16px rgba(109, 40, 217, 0.3)",
              }}
            >
              {loading
                ? mode === "login"
                  ? "Signing in..."
                  : "Creating account..."
                : mode === "login"
                ? "Sign In"
                : "Create Account"}
            </button>
          </form>

          {/* Switch mode hint */}
          <p className="text-center text-xs mt-6" style={{ color: "#52525b" }}>
            {mode === "login" ? (
              <>
                No account yet?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("register")}
                  className="font-semibold transition-colors duration-150 hover:underline"
                  style={{ color: "#8b5cf6" }}
                >
                  Create one
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="font-semibold transition-colors duration-150 hover:underline"
                  style={{ color: "#8b5cf6" }}
                >
                  Sign in
                </button>
              </>
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs tracking-widest uppercase z-10" style={{ color: "#3f3f46" }}>
        Powered by Claude AI
      </p>
    </div>
  );
}
