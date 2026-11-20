/**
 * Normalize the database URL for mysql2.
 *
 * Enzonic documents TLS as a driver option (ssl: {}), while mysql2 does not
 * recognize the URI query option "ssl-mode". Remove only that unsupported
 * query parameter; keep TLS enabled explicitly in each connection config.
 */
export function getMysql2DatabaseUri(rawUrl = process.env.DATABASE_URL || "") {
  if (!rawUrl) throw new Error("DATABASE_URL is required");
  const parsed = new URL(rawUrl);
  parsed.searchParams.delete("ssl-mode");
  return parsed.toString();
}
