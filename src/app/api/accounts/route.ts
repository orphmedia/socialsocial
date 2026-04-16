import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { getOAuthUrl, exchangeCodeForToken, getLongLivedToken, getInstagramAccounts } from "@/lib/instagram";
import { v4 as uuid } from "uuid";

// Get connected accounts
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getDb();
  const accounts = db
    .prepare("SELECT id, instagram_id, username, profile_picture_url, followers_count, is_active, created_at FROM instagram_accounts WHERE user_id = ?")
    .all(user.id);

  return NextResponse.json({ accounts });
}

// Start OAuth flow - returns the URL to redirect to
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { action, code } = await req.json();

  if (action === "get_oauth_url") {
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/accounts/callback`;
    const url = getOAuthUrl(redirectUri);
    return NextResponse.json({ url });
  }

  if (action === "connect" && code) {
    try {
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/accounts/callback`;

      // Exchange code for token
      const { access_token } = await exchangeCodeForToken(code, redirectUri);

      // Get long-lived token
      const longToken = await getLongLivedToken(access_token);

      // Get Instagram accounts
      const igAccounts = await getInstagramAccounts(longToken);

      const db = getDb();
      const connected = [];

      for (const account of igAccounts) {
        const id = uuid();
        db.prepare(
          `INSERT OR REPLACE INTO instagram_accounts (id, user_id, instagram_id, username, access_token, profile_picture_url, followers_count)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(
          id, user.id, account.id, account.username, longToken,
          account.profile_picture_url, account.followers_count
        );
        connected.push({ id, username: account.username, followers_count: account.followers_count });
      }

      return NextResponse.json({ connected });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Connection failed";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
