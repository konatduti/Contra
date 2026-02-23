import { neon } from "@neondatabase/serverless";
import { SupportedLanguage } from "@/i18n/settings";

let cachedClient: ReturnType<typeof neon> | null = null;

function getClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  if (!cachedClient) {
    cachedClient = neon(process.env.DATABASE_URL);
  }
  return cachedClient;
}

export async function getUserLanguage(userId: string): Promise<SupportedLanguage | null> {
  const client = getClient();
  if (!client) {
    return null;
  }
  const rows = await client`SELECT language FROM users WHERE id = ${userId}`;
  const language = rows[0]?.language as string | undefined;
  return language ? (language as SupportedLanguage) : null;
}

export async function updateUserLanguage(userId: string, language: SupportedLanguage): Promise<void> {
  const client = getClient();
  if (!client) {
    return;
  }
  await client`UPDATE users SET language = ${language} WHERE id = ${userId}`;
}
