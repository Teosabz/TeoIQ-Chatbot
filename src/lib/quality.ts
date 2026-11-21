/** Client-side chart quality gate — rejects blurry, tiny or low-detail screenshots. */

export interface QualityReport {
  ok: boolean;
  sharpness: number;
  width: number;
  height: number;
  reason: string;
}

const MIN_WIDTH = 480;
const MIN_HEIGHT = 300;
const MIN_SHARPNESS = 3.5;

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("unreadable image"));
    };
    img.src = url;
  });
}

/** Variance-of-Laplacian style sharpness estimate on a downscaled grayscale copy. */
export async function inspectChart(file: File): Promise<QualityReport> {
  try {
    const img = await loadImage(file);
    const width = img.naturalWidth;
    const height = img.naturalHeight;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) {
      return {
        ok: false,
        sharpness: 0,
        width,
        height,
        reason: `Screenshot is only ${width}×${height}px. Upload a full-screen MT4/MT5 capture (at least ${MIN_WIDTH}×${MIN_HEIGHT}px) so candles and the price scale are readable.`,
      };
    }

    const w = 320;
    const h = Math.max(1, Math.round((height / width) * w));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return { ok: true, sharpness: 100, width, height, reason: "" };
    ctx.drawImage(img, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const gray = new Float32Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      const o = i * 4;
      gray[i] = 0.299 * data[o] + 0.587 * data[o + 1] + 0.114 * data[o + 2];
    }

    let sum = 0;
    let sumSq = 0;
    let count = 0;
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        const lap = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
        sum += lap;
        sumSq += lap * lap;
        count++;
      }
    }
    const mean = sum / count;
    const variance = sumSq / count - mean * mean;
    const sharpness = Number(Math.sqrt(Math.max(0, variance)).toFixed(2));

    if (sharpness < MIN_SHARPNESS) {
      return {
        ok: false,
        sharpness,
        width,
        height,
        reason:
          "This screenshot looks blurry or low-detail. Take a fresh, unscaled MetaTrader screenshot so the candles, indicators and price scale stay crisp.",
      };
    }

    return { ok: true, sharpness, width, height, reason: "" };
  } catch {
    return { ok: false, sharpness: 0, width: 0, height: 0, reason: "That image could not be read. Try a PNG or JPG screenshot." };
  }
}
