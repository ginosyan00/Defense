/**
 * Client-side: shrink large photos before Server Action upload.
 * Cuts FormData size and Neon backup time dramatically.
 */
const MAX_EDGE = 2560;
const JPEG_QUALITY = 0.82;

export type PreparedImageUpload = {
  file: File;
  width: number;
  height: number;
};

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Նկարը չհաջողվեց կարդալ"));
    };
    image.src = url;
  });
}

function canvasToJpegFile(
  canvas: HTMLCanvasElement,
  name: string,
): Promise<File> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Նկարը չհաջողվեց սեղմել"));
          return;
        }
        const base = name.replace(/\.[^.]+$/, "") || "image";
        resolve(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
      },
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
}

export async function prepareImageForUpload(
  file: File,
): Promise<PreparedImageUpload> {
  if (file.type === "image/svg+xml") {
    return { file, width: 1920, height: 1080 };
  }

  const image = await loadImage(file);
  const sourceW = image.naturalWidth;
  const sourceH = image.naturalHeight;
  if (sourceW < 32 || sourceH < 32) {
    throw new Error("Նկարի չափերը անվավեր են");
  }

  const scale = Math.min(1, MAX_EDGE / Math.max(sourceW, sourceH));
  const width = Math.max(1, Math.round(sourceW * scale));
  const height = Math.max(1, Math.round(sourceH * scale));

  const alreadySmall =
    file.size <= 900_000 &&
    scale === 1 &&
    (file.type === "image/jpeg" || file.type === "image/webp");

  if (alreadySmall) {
    return { file, width: sourceW, height: sourceH };
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { file, width: sourceW, height: sourceH };
  }
  ctx.drawImage(image, 0, 0, width, height);
  const compressed = await canvasToJpegFile(canvas, file.name);

  if (compressed.size >= file.size && scale === 1) {
    return { file, width: sourceW, height: sourceH };
  }

  return { file: compressed, width, height };
}
