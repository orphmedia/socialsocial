import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, execute } from "@/lib/db";
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
    const id = uuid();

    await execute(
      `INSERT INTO content_research (id, user_id, topic, research_data, trends, content_angles, hashtags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        user.id,
        topic,
        JSON.stringify(research),
        JSON.stringify(research.trends),
        JSON.stringify(research.contentAngles),
        JSON.stringify(research.hashtags),
      ]
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

  const rows = await query(
    "SELECT * FROM content_research WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    [user.id]
  );

  const research = rows.map((row) => ({
    ...row,
    research_data: row.research_data,
    trends: row.trends,
    content_angles: row.content_angles,
    hashtags: row.hashtags,
  }));

  return NextResponse.json({ research });
}
