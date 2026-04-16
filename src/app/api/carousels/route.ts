import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, execute } from "@/lib/db";
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
    const id = uuid();

    await execute(
      `INSERT INTO carousels (id, user_id, account_id, title, slides, caption, hashtags, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'draft')`,
      [
        id,
        user.id,
        accountId || null,
        carousel.title,
        JSON.stringify(carousel.slides),
        carousel.caption,
        JSON.stringify(carousel.hashtags),
      ]
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

  const rows = await query(
    "SELECT * FROM carousels WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
    [user.id]
  );

  const carousels = rows.map((row) => ({
    ...row,
    slides: row.slides,
    hashtags: row.hashtags ?? [],
  }));

  return NextResponse.json({ carousels });
}
