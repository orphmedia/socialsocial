import { query, queryOne, execute } from "./db";
import { v4 as uuid } from "uuid";
import { cookies } from "next/headers";

// Simple session-based auth (no external dependencies)
// In production, use proper password hashing (bcrypt) and JWT tokens

export interface User {
  id: string;
  email: string;
  name: string;
}

export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + "orphmedia-salt-2024");
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(hash).toString("hex");
}

export async function createUser(
  email: string,
  name: string,
  password: string
): Promise<User> {
  const id = uuid();
  const passwordHash = await hashPassword(password);

  await execute(
    "INSERT INTO users (id, email, name, password_hash) VALUES (?, ?, ?, ?)",
    [id, email, name, passwordHash]
  );

  return { id, email, name };
}

export async function verifyUser(
  email: string,
  password: string
): Promise<User | null> {
  const passwordHash = await hashPassword(password);

  const row = await queryOne(
    "SELECT id, email, name FROM users WHERE email = ? AND password_hash = ?",
    [email, passwordHash]
  );

  return row ? (row as unknown as User) : null;
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");
  if (!sessionCookie) return null;

  try {
    const session = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString()
    );
    const user = await queryOne(
      "SELECT id, email, name FROM users WHERE id = ?",
      [session.userId]
    );
    return user ? (user as unknown as User) : null;
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString(
    "base64"
  );
}
