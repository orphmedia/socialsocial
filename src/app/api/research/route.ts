import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { researchContent } from "@/lib/claude";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topic } = await req.json();
    if (!topic) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    const research = await researchContent(topic);
    const db = getDb();
    const id = uuid();

    db.prepare(
      `INSERT INTO content_research (id, user_id, topic, research_data, trends, content_angles, hashtags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      user.id,
      topic,
      JSON.stringify(research),
      JSON.stringify(research.trends),
      JSON.stringify(research.contentAngles),
      JSON.stringify(research.hashtags)
    );

    return NextResponse.json({ id, topic, ...research });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Research failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM content_research WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(user.id);

  const research = (rows as Record<string, unknown>[]).map((row) => ({
    ...row,
    research_data: JSON.parse(row.research_data as string),
    trends: JSON.parse(row.trends as string),
    content_angles: JSON.parse(row.content_angles as string),
    hashtags: JSON.parse(row.hashtags as string),
  }));

  return NextResponse.json({ research });
}
