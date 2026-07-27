import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/db";

export type CachedMedia = {
  data: Buffer;
  mimeType: string;
  byteSize: number;
};

const memoryCache = new Map<string, CachedMedia>();
const CACHE_DIR = path.join(process.cwd(), ".data", "media-cache");

function diskPath(id: string): string {
  return path.join(CACHE_DIR, `${id}.bin`);
}

function metaPath(id: string): string {
  return path.join(CACHE_DIR, `${id}.json`);
}

async function readDisk(id: string): Promise<CachedMedia | null> {
  try {
    const [data, metaRaw] = await Promise.all([
      fs.readFile(diskPath(id)),
      fs.readFile(metaPath(id), "utf8"),
    ]);
    const meta = JSON.parse(metaRaw) as {
      mimeType: string;
      byteSize: number;
    };
    return {
      data,
      mimeType: meta.mimeType,
      byteSize: meta.byteSize,
    };
  } catch {
    return null;
  }
}

async function writeDisk(id: string, media: CachedMedia): Promise<void> {
  try {
    await fs.mkdir(CACHE_DIR, { recursive: true });
    await Promise.all([
      fs.writeFile(diskPath(id), media.data),
      fs.writeFile(
        metaPath(id),
        JSON.stringify({
          mimeType: media.mimeType,
          byteSize: media.byteSize,
        }),
      ),
    ]);
  } catch {
    // Cache write failures must not break media serving.
  }
}

/** Warm local caches after upload so the next GET skips Neon blob fetch. */
export async function warmMediaCache(
  id: string,
  media: CachedMedia,
): Promise<void> {
  memoryCache.set(id, media);
  await writeDisk(id, media);
}

/**
 * Serves uploaded bytes with memory → disk → Neon fallback.
 * Neon Bytes round-trips are slow (~seconds); local cache makes home load fast.
 */
export async function getStoredMedia(id: string): Promise<CachedMedia | null> {
  const fromMemory = memoryCache.get(id);
  if (fromMemory) return fromMemory;

  const fromDisk = await readDisk(id);
  if (fromDisk) {
    memoryCache.set(id, fromDisk);
    return fromDisk;
  }

  const row = await prisma.storedMedia.findUnique({
    where: { id },
    select: { data: true, mimeType: true, byteSize: true },
  });
  if (!row) return null;

  const media: CachedMedia = {
    data: Buffer.from(row.data),
    mimeType: row.mimeType,
    byteSize: row.byteSize,
  };
  memoryCache.set(id, media);
  void writeDisk(id, media);
  return media;
}
