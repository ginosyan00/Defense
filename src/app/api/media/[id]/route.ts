import { prisma } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  if (!id || id.length > 64) {
    return new Response("Not found", { status: 404 });
  }

  const media = await prisma.storedMedia.findUnique({
    where: { id },
    select: { data: true, mimeType: true, byteSize: true },
  });

  if (!media) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(media.data), {
    status: 200,
    headers: {
      "Content-Type": media.mimeType,
      "Content-Length": String(media.byteSize),
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
