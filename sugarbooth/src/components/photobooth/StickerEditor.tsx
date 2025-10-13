import { useEffect, useRef, useState } from "react";
import { Button, Modal } from "../../ui";

type Sticker = { id: string; x: number; y: number; size: number; text: string };

export function StickerEditor({
  open, onClose, baseImage, onDone
}: {
  open: boolean;
  onClose: () => void;
  baseImage: string;            // dataURL of the photo to edit
  onDone: (editedDataUrl: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [img, setImg] = useState<HTMLImageElement | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<Sticker | null>(null);
  const [offset, setOffset] = useState<{dx:number, dy:number}>({dx:0, dy:0});

  // load image
  useEffect(() => {
    if (!open) return;
    const i = new Image();
    i.onload = () => setImg(i);
    i.src = baseImage;
    setStickers([]); setActiveId(null);
  }, [open, baseImage]);

  // render
  useEffect(() => {
    const c = canvasRef.current; if (!c || !img) return;
    const ctx = c.getContext("2d")!;
    c.width = img.width; c.height = img.height;
    ctx.clearRect(0,0,c.width,c.height);
    ctx.drawImage(img,0,0);
    stickers.forEach(s => {
      ctx.save();
      ctx.font = `${s.size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      ctx.textAlign = "center"; ctx.textBaseline = "middle";
      ctx.fillText(s.text, s.x, s.y);
      if (s.id === activeId) {
        ctx.strokeStyle = "#8b5cf6"; ctx.lineWidth = 2;
        ctx.strokeRect(s.x - s.size*0.6, s.y - s.size*0.6, s.size*1.2, s.size*1.2);
      }
      ctx.restore();
    });
  }, [img, stickers, activeId]);

  // hit-test
  const stickerAt = (x:number, y:number) => {
    for (let i = stickers.length - 1; i >= 0; i--) {
      const s = stickers[i];
      const half = s.size*0.6;
      if (x>=s.x-half && x<=s.x+half && y>=s.y-half && y<=s.y+half) return s;
    }
    return null;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (c.width/rect.width);
    const y = (e.clientY - rect.top) * (c.height/rect.height);
    const hit = stickerAt(x,y);
    if (hit) {
      setActiveId(hit.id);
      setDragging(hit);
      setOffset({ dx: x - hit.x, dy: y - hit.y });
    } else {
      setActiveId(null);
    }
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging) return;
    const c = canvasRef.current!; const rect = c.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (c.width/rect.width);
    const y = (e.clientY - rect.top) * (c.height/rect.height);
    setStickers(prev => prev.map(s => s.id === dragging.id ? { ...s, x: x - offset.dx, y: y - offset.dy } : s));
  };
  const onPointerUp = () => setDragging(null);

  const add = (text: string) => {
    const c = canvasRef.current!; 
    setStickers(prev => [...prev, { id: Math.random().toString(36).slice(2), x: c.width/2, y: c.height/2, size: Math.max(c.width, c.height)/8, text }]);
  };
  const scale = (delta:number) => activeId && setStickers(prev => prev.map(s => s.id===activeId ? { ...s, size: Math.max(20, s.size + delta) } : s));
  const remove = () => activeId && setStickers(prev => prev.filter(s => s.id !== activeId));

  const finish = () => {
    if (!canvasRef.current) return;
    onDone(canvasRef.current.toDataURL("image/png"));
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="row">
        <h3>Edit stickers</h3>
        <div className="row">
          <Button variant="outline" onClick={()=>add("✨")}>✨</Button>
          <Button variant="outline" onClick={()=>add("💖")}>💖</Button>
          <Button variant="outline" onClick={()=>add("🎀")}>🎀</Button>
          <Button variant="outline" onClick={()=>add("⭐")}>⭐</Button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        className="editor-canvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      />
      <div className="row" style={{justifyContent:"space-between"}}>
        <div className="row">
          <Button variant="ghost" onClick={()=>scale(-10)}>-</Button>
          <Button variant="ghost" onClick={()=>scale(+10)}>+</Button>
          <Button variant="ghost" onClick={remove}>Delete</Button>
        </div>
        <div className="row">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={finish}>Done</Button>
        </div>
      </div>
    </Modal>
  );
}
