import { randomBytes } from "crypto";
import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { warmMediaCache } from "@/lib/media/get-stored-media";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "media");

function createMediaId(): string {
  return `c${Date.now().toString(36)}${randomBytes(8).toString("hex")}`;
}

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/avif":
      return "avif";
    case "image/svg+xml":
      return "svg";
    case "image/jpeg":
    default:
      return "jpg";
  }
}

/**
 * Fast path: write to public/uploads (static file).
 * Neon Bytes backup runs in the background — awaiting it was making uploads hang for seconds.
 */
export async function storeMediaFile(file: File): Promise<{
  id: string;
  url: string;
  mimeType: string;
  byteSize: number;
}> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const id = createMediaId();
  const ext = extensionForMime(mimeType);
  const fileName = `${id}.${ext}`;
  const absolutePath = path.join(UPLOAD_DIR, fileName);

  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  await fs.writeFile(absolutePath, buffer);

  const media = {
    data: buffer,
    mimeType,
    byteSize: buffer.byteLength,
  };
  await warmMediaCache(id, media);

  // Backup to Neon without blocking the upload response.
  void prisma.storedMedia
    .create({
      data: {
        id,
        mimeType,
        byteSize: buffer.byteLength,
        data: buffer,
      },
    })
    .catch((error: unknown) => {
      console.error("[storeMediaFile] Neon backup failed", id, error);
    });

  return {
    id,
    url: `/uploads/media/${fileName}`,
    mimeType,
    byteSize: buffer.byteLength,
  };
}
