import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { generateReel } from "@/lib/claude";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topic, angle, durationSeconds, accountId } = await req.json();
    if (!topic || !angle) {
      return NextResponse.json({ error: "Topic and angle are required" }, { status: 400 });
    }

    const reel = await generateReel(topic, angle, durationSeconds || 30);
    const id = uuid();

    await execute(
      `INSERT INTO reels (id, user_id, account_id, title, hook, script, cta, caption, hashtags, music_suggestion, duration_seconds, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        id,
        user.id,
        accountId || null,
        reel.title,
        reel.hook,
        JSON.stringify(reel.script),
        reel.cta,
        reel.caption,
        JSON.stringify(reel.hashtags),
        reel.musicSuggestion,
        durationSeconds || 30,
      ]
    );

    return NextResponse.json({ id, ...reel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Reel generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await query(
    "SELECT * FROM reels WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    [user.id]
  );

  const reels = rows.map((row) => ({
    ...row,
    script: row.script,
    hashtags: row.hashtags ?? [],
  }));

  return NextResponse.json({ reels });
}
