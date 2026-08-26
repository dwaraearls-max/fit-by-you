import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

/**
 * Storage lives behind this interface so that moving from the local disk to S3
 * or Cloudflare R2 later is a new implementation and a changed environment
 * variable, not a rewrite of every upload path.
 *
 * Keys are always `businesses/<businessId>/...`, which is what makes the
 * authorizing serve route able to decide, from the key alone, whether the
 * signed-in business is allowed to see an object.
 */
export type StoredObject = {
  bytes: Buffer;
  contentType: string;
  size: number;
};

export interface StorageAdapter {
  put(input: {
    key: string;
    bytes: Buffer;
    contentType: string;
  }): Promise<{ key: string; size: number }>;
  get(key: string): Promise<StoredObject | null>;
  remove(key: string): Promise<void>;
}

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/avif": "avif",
};

/** 8 MB. Phone cameras produce 2–4 MB, so this leaves room without inviting abuse. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function isAllowedImageType(mimeType: string): boolean {
  return mimeType.toLowerCase() in ALLOWED_TYPES;
}

export function extensionFor(mimeType: string): string {
  return ALLOWED_TYPES[mimeType.toLowerCase()] ?? "bin";
}

export function contentTypeFor(key: string): string {
  const extension = path.extname(key).slice(1).toLowerCase();
  const found = Object.entries(ALLOWED_TYPES).find(
    ([, value]) => value === extension,
  );
  return found?.[0] ?? "application/octet-stream";
}

/**
 * Builds the object key. The random suffix means two photos taken in the same
 * second never collide, and the business prefix is what the serve route checks.
 */
export function buildKey(input: {
  businessId: string;
  scope: "customers" | "styles" | "logos";
  ownerId?: string;
  mimeType: string;
}): string {
  const extension = extensionFor(input.mimeType);
  const parts = ["businesses", input.businessId, input.scope];
  if (input.ownerId) parts.push(input.ownerId);
  parts.push(`${randomUUID()}.${extension}`);
  return parts.join("/");
}

export function businessIdFromKey(key: string): string | null {
  const parts = key.split("/");
  return parts[0] === "businesses" && parts[1] ? parts[1] : null;
}

/** Rejects `..` and absolute paths before they reach the file system. */
export function isSafeKey(key: string): boolean {
  if (!key || key.length > 400) return false;
  if (key.startsWith("/") || key.includes("\\")) return false;
  if (key.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    return false;
  }
  return true;
}

class LocalDiskStorage implements StorageAdapter {
  constructor(private readonly root: string) {}

  private pathFor(key: string): string {
    return path.join(this.root, ...key.split("/"));
  }

  async put({
    key,
    bytes,
    contentType,
  }: {
    key: string;
    bytes: Buffer;
    contentType: string;
  }) {
    void contentType;
    const target = this.pathFor(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
    return { key, size: bytes.byteLength };
  }

  async get(key: string): Promise<StoredObject | null> {
    const target = this.pathFor(key);
    try {
      const info = await stat(target);
      if (!info.isFile()) return null;
      const bytes = await readFile(target);
      return { bytes, contentType: contentTypeFor(key), size: info.size };
    } catch {
      return null;
    }
  }

  async remove(key: string): Promise<void> {
    await rm(this.pathFor(key), { force: true });
  }
}

let adapter: StorageAdapter | null = null;

export function storage(): StorageAdapter {
  if (adapter) return adapter;

  // Only the local driver ships today. An S3/R2 driver implements the same
  // three methods and is selected here by STORAGE_DRIVER.
  const root = process.env.STORAGE_ROOT ?? path.join(process.cwd(), ".storage");
  adapter = new LocalDiskStorage(root);
  return adapter;
}

/** Weak validator for the browser cache, derived from the bytes. */
export function etagFor(bytes: Buffer): string {
  return `"${createHash("sha1").update(bytes).digest("hex")}"`;
}
