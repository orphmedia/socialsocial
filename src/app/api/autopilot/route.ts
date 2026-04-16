import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { query, execute } from "@/lib/db";
import { generateContentCalendar, generateAutopilotContent } from "@/lib/claude";
import { v4 as uuid } from "uuid";

// Generate a full content calendar + auto-create all content
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { weeks, themes, accountId, autoGenerate } = await req.json();

    // Step 1: Generate calendar
    const { calendar } = await generateContentCalendar(weeks || 2, themes || []);

    const calendarEntries = [];

    for (const entry of calendar) {
      const id = uuid();
      await execute(
        `INSERT INTO content_calendar (id, user_id, account_id, date, theme, content_type, notes, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'planned')`,
        [id, user.id, accountId || null, entry.date, entry.theme, entry.contentType, JSON.stringify(entry)]
      );

      calendarEntries.push({ id, ...entry });
    }

    // Step 2: Auto-generate content if requested
    const generatedContent = [];
    if (autoGenerate) {
      // Generate first 5 items to avoid timeout, rest can be generated on-demand
      const toGenerate = calendar.slice(0, 5);
      for (const entry of toGenerate) {
        try {
          const content = await generateAutopilotContent(entry);
          generatedContent.push({ date: entry.date, contentType: entry.contentType, ...content });

          // Save generated content
          if (content.carousel) {
            const cId = uuid();
            await execute(
              `INSERT INTO carousels (id, user_id, account_id, title, slides, caption, hashtags, status, scheduled_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
              [
                cId, user.id, accountId || null,
                content.carousel.title,
                JSON.stringify(content.carousel.slides),
                content.carousel.caption,
                JSON.stringify(content.carousel.hashtags),
                `${entry.date}T${entry.optimal_time}:00`,
              ]
            );
          }
          if (content.reel) {
            const rId = uuid();
            await execute(
              `INSERT INTO reels (id, user_id, account_id, title, hook, script, cta, caption, hashtags, music_suggestion, status, scheduled_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?)`,
              [
                rId, user.id, accountId || null,
                content.reel.title,
                content.reel.hook,
                JSON.stringify(content.reel.script),
                content.reel.cta,
                content.reel.caption,
                JSON.stringify(content.reel.hashtags),
                content.reel.musicSuggestion,
                `${entry.date}T${entry.optimal_time}:00`,
              ]
            );
          }
        } catch {
          // Continue with next item if one fails
        }
      }
    }

    return NextResponse.json({
      calendar: calendarEntries,
      generatedContent,
      message: autoGenerate
        ? `Calendar created with ${calendar.length} entries. Auto-generated ${generatedContent.length} pieces of content.`
        : `Calendar created with ${calendar.length} entries. Use individual endpoints to generate content.`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Autopilot failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const entries = await query(
    `SELECT * FROM content_calendar WHERE user_id = ? ORDER BY date ASC`,
    [user.id]
  );

  const parsed = entries.map((row) => ({
    ...row,
    notes: row.notes ?? null,
  }));

  return NextResponse.json({ calendar: parsed });
}
