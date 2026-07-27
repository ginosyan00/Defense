import { prisma } from "@/lib/db";
import { warmMediaCache } from "@/lib/media/get-stored-media";

export async function storeMediaFile(file: File): Promise<{
  id: string;
  url: string;
  mimeType: string;
  byteSize: number;
}> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = file.type || "application/octet-stream";
  const row = await prisma.storedMedia.create({
    data: {
      mimeType,
      byteSize: buffer.byteLength,
      data: buffer,
    },
  });

  await warmMediaCache(row.id, {
    data: buffer,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
  });

  return {
    id: row.id,
    url: `/api/media/${row.id}`,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
  };
}
