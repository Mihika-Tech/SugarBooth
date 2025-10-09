// async compose — waits for images, then draws
export async function composeStrip(canvas: HTMLCanvasElement, shots: string[]) {
  const frameW = 600, frameH = 1800;
  const margin = 30, gap = 30;
  const photoH = (frameH - margin * 2 - gap * 3) / 4;
  const photoW = frameW - margin * 2;

  canvas.width = frameW;
  canvas.height = frameH;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // background paper + border
  ctx.fillStyle = "#faf7fb";
  ctx.fillRect(0, 0, frameW, frameH);
  ctx.strokeStyle = "#e7d7ef";
  ctx.lineWidth = 8;
  ctx.strokeRect(4, 4, frameW - 8, frameH - 8);

  const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src; // data URLs are fine; no crossOrigin needed
    });

  const images = await Promise.all(shots.slice(0, 4).map(loadImage));

  images.forEach((img, i) => {
    const y = margin + i * (photoH + gap);
    const r = 24;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(margin + r, y);
    ctx.arcTo(margin + photoW, y, margin + photoW, y + r, r);
    ctx.arcTo(margin + photoW, y + photoH, margin + photoW - r, y + photoH, r);
    ctx.arcTo(margin, y + photoH, margin, y + photoH - r, r);
    ctx.arcTo(margin, y, margin + r, y, r);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, 0, 0, img.width, img.height, margin, y, photoW, photoH);
    ctx.restore();

    ctx.globalAlpha = 0.08;
    ctx.fillStyle = "#000";
    ctx.fillRect(margin + 6, y + photoH + 2, photoW - 12, 6);
    ctx.globalAlpha = 1;
  });
}
