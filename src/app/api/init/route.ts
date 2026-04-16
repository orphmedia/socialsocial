import { NextRequest, NextResponse } from "next/server";
import { initializeDb } from "@/lib/db";

// One-time endpoint to create database tables
// Call this once after deploying: POST /api/init?secret=YOUR_AUTH_SECRET
export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const secret = searchParams.get("secret");

  if (secret !== process.env.AUTH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await initializeDb();
    return NextResponse.json({ ok: true, message: "Database tables created successfully" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
