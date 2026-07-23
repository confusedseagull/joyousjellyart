// One-time bootstrap: create the first admin account.
// Signup via the app is admin-gated (you need to already be logged in to
// create another admin), so the very first account has to be seeded directly.
//
// Usage:
//   DATABASE_URL=... node scripts/seed-admin.mjs <email> <password> ["Name"]

import "dotenv/config";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/mysql2";
import { eq } from "drizzle-orm";
import { adminUsers } from "../drizzle/schema.ts";

const [email, password, name] = process.argv.slice(2);

if (!email || !password) {
  console.error("Usage: node scripts/seed-admin.mjs <email> <password> [\"Name\"]");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Password must be at least 8 characters long");
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = drizzle(process.env.DATABASE_URL);

const existing = await db
  .select()
  .from(adminUsers)
  .where(eq(adminUsers.email, email))
  .limit(1);

if (existing.length > 0) {
  console.error(`Admin with email ${email} already exists`);
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);

await db.insert(adminUsers).values({
  email,
  passwordHash,
  name: name || undefined,
});

console.log(`Created admin account for ${email}`);
process.exit(0);
