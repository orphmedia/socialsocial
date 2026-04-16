import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { v4 as uuid } from "uuid";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { accountId, contentType, contentId, scheduledAt } = await req.json();
    if (!accountId || !contentType || !contentId || !scheduledAt) {
      return NextResponse.json(
        { error: "accountId, contentType, contentId, and scheduledAt are required" },
        { status: 400 }
      );
    }

    const db = getDb();
    const id = uuid();

    db.prepare(
      `INSERT INTO scheduled_posts (id, user_id, account_id, content_type, content_id, scheduled_at, status)
       VALUES (?, ?, ?, ?, ?, ?, 'pending')`
    ).run(id, user.id, accountId, contentType, contentId, scheduledAt);

    // Update the content status
    if (contentType === "carousel") {
      db.prepare("UPDATE carousels SET status = 'scheduled', scheduled_at = ?, account_id = ? WHERE id = ?")
        .run(scheduledAt, accountId, contentId);
    } else if (contentType === "reel") {
      db.prepare("UPDATE reels SET status = 'scheduled', scheduled_at = ?, account_id = ? WHERE id = ?")
        .run(scheduledAt, accountId, contentId);
    }

    return NextResponse.json({ id, status: "scheduled", scheduledAt });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Scheduling failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const posts = db
    .prepare(
      `SELECT sp.*, ia.username as account_username
       FROM scheduled_posts sp
       LEFT JOIN instagram_accounts ia ON sp.account_id = ia.id
       WHERE sp.user_id = ?
       ORDER BY sp.scheduled_at ASC`
    )
    .all(user.id);

  return NextResponse.json({ posts });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const db = getDb();
  db.prepare("DELETE FROM scheduled_posts WHERE id = ? AND user_id = ?").run(id, user.id);

  return NextResponse.json({ ok: true });
}
