import { NextRequest, NextResponse } from "next/server";

// OAuth callback - redirects back to app with the code
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?error=${encodeURIComponent(error)}`
    );
  }

  if (code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/accounts?code=${encodeURIComponent(code)}`
    );
  }

  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/accounts?error=no_code`);
}
