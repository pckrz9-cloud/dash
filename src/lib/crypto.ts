import crypto from "crypto";

// AES-256-GCM encryption for integration API keys at rest.
// Key comes from ENCRYPTION_KEY (hex, 32 bytes) or is derived from
// NEXTAUTH_SECRET so the app works out of the box.
function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY;
  if (hex && /^[0-9a-fA-F]{64}$/.test(hex)) return Buffer.from(hex, "hex");
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Set ENCRYPTION_KEY or NEXTAUTH_SECRET");
  return crypto.scryptSync(secret, "dash-integration-keys", 32);
}

export function encrypt(plain: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString("base64");
}

export function decrypt(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const data = buf.subarray(28);
  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString(
    "utf8"
  );
}

/** Show only the last 4 characters of a stored secret. */
export function maskSecret(payload: string | null | undefined): string | null {
  if (!payload) return null;
  try {
    const plain = decrypt(payload);
    return `••••${plain.slice(-4)}`;
  } catch {
    return "••••";
  }
}
