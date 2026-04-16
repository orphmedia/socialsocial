import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { generateCarousel } from "@/lib/claude";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { topic, angle, slideCount, accountId } = await req.json();
    if (!topic || !angle) {
      return NextResponse.json({ error: "Topic and angle are required" }, { status: 400 });
    }

    const carousel = await generateCarousel(topic, angle, slideCount || 8);
    const db = getDb();
    const id = uuid();

    db.prepare(
      `INSERT INTO carousels (id, user_id, account_id, title, slides, caption, hashtags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`
    ).run(
      id,
      user.id,
      accountId || null,
      carousel.title,
      JSON.stringify(carousel.slides),
      carousel.caption,
      JSON.stringify(carousel.hashtags)
    );

    return NextResponse.json({ id, ...carousel });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Carousel generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM carousels WHERE user_id = ? ORDER BY created_at DESC LIMIT 20")
    .all(user.id);

  const carousels = (rows as Record<string, unknown>[]).map((row) => ({
    ...row,
    slides: JSON.parse(row.slides as string),
    hashtags: row.hashtags ? JSON.parse(row.hashtags as string) : [],
  }));

  return NextResponse.json({ carousels });
}
