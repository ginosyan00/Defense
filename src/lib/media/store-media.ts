import { prisma } from "@/lib/db";

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

  return {
    id: row.id,
    url: `/api/media/${row.id}`,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
  };
}
