import { useState, useRef, useEffect } from "react";
import { Camera, Download, RotateCcw, Pencil } from "lucide-react";
import { Button, Card, Select, Toolbar } from "../ui";
import { toast, Toaster } from "sonner";
import { CameraView } from "./photobooth/CameraView";
import { TimerSelector } from "./photobooth/TimerSelector";
import { StickerEditor } from "./photobooth/StickerEditor";

type Filter = "soft" | "warm" | "bw" | "none";
type StripTheme = "classic" | "pink" | "kraft" | "stars";

const filterCss = (f: Filter) =>
  f === "bw" ? "grayscale(1) contrast(1.15)" :
  f === "warm" ? "brightness(1.06) contrast(1.02) sepia(.15) saturate(1.15)" :
  f === "soft" ? "brightness(1.08) contrast(.95) saturate(1.1)" : "none";

export const Photobooth = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isCapturing, setIsCapturing] = useState(false);

  const [filter, setFilter] = useState<Filter>("soft");
  const [theme, setTheme] = useState<StripTheme>("classic");

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // sticker editor
  const [editorOpen, setEditorOpen] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  useEffect(() => {
    startCamera();
    return () => stream?.getTracks().forEach((t) => t.stop());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 1280, height: 720 },
        audio: false,
      });
      setStream(mediaStream);
      const v = videoRef.current;
      if (v) v.srcObject = mediaStream;
    } catch {
      toast.error("Could not access camera. Please grant permission.");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // apply filter to the render (matches preview)
    if (filter !== "none") ctx.filter = filterCss(filter);
    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL("image/png");
  };

  const startPhotoSequence = () => {
    if (isCapturing) return;
    setIsCapturing(true);
    setPhotos([]);
    setCurrentPhoto(null);
    let count = 0;

    const tick = () => {
      setCountdown(timerDuration);
      let c = timerDuration;
      const iv = setInterval(() => {
        c -= 1;
        setCountdown(c);
        if (c === 0) {
          clearInterval(iv);
          const photo = capturePhoto();
          if (photo) {
            setCurrentPhoto(photo);
            setPhotos((p) => [...p, photo]);
            count += 1;
            if (count < 4) setTimeout(tick, 500);
            else { setIsCapturing(false); setCountdown(null); toast.success("Photo strip ready"); }
          }
        }
      }, 1000);
    };

    tick();
  };

  // Open sticker editor for a specific shot
  const openEditor = (index: number) => { setEditIndex(index); setEditorOpen(true); };
  const handleEdited = (dataUrl: string) => {
    if (editIndex === null) return;
    setPhotos(prev => prev.map((p, i) => i === editIndex ? dataUrl : p));
    if (currentPhoto && photos[editIndex] === currentPhoto) setCurrentPhoto(dataUrl);
  };

  // Compose a polaroid-style strip with gaps and theme background
  const composeStrip = async (): Promise<string | null> => {
    if (photos.length !== 4) return null;

    // base image dims
    const probe = await new Promise<HTMLImageElement>(res => { const i = new Image(); i.onload = ()=>res(i); i.src = photos[0]; });
    const w = probe.width, h = probe.height;

    // strip layout
    const stripW = 700;
    const stripH = 2200;
    const bgColor =
      theme === "pink" ? "#fde7f9" :
      theme === "kraft" ? "#f0e5d8" :
      theme === "stars" ? "#cdb7f7" : "#ffffff";

    const c = document.createElement("canvas");
    c.width = stripW; c.height = stripH;
    const ctx = c.getContext("2d")!;

    // background
    ctx.fillStyle = bgColor; ctx.fillRect(0,0,stripW,stripH);
    if (theme === "stars") {
      // sprinkle white stars
      ctx.fillStyle = "rgba(255,255,255,.9)";
      const rand = (n:number)=>Math.floor(Math.random()*n);
      for(let i=0;i<40;i++){ ctx.beginPath(); ctx.arc(rand(stripW), rand(stripH), Math.random()*3+1, 0, Math.PI*2); ctx.fill(); }
    }

    // card border
    ctx.strokeStyle = "#e6dff0"; ctx.lineWidth = 10; ctx.strokeRect(5,5,stripW-10,stripH-10);

    // polaroid frames
    const gap = 36;
    const frameW = stripW - 60;
    const frameH = (stripH - 60 - gap*3) / 4;
    const photoInset = 14;      // white border thickness
    const bottomExtra = 24;     // thicker bottom (polaroid feel)

    for(let i=0;i<4;i++){
      const y = 30 + i*(frameH + gap);
      // white card
      ctx.fillStyle = "#ffffff";
      const r = 20;
      roundRect(ctx, 30, y, frameW, frameH, r); ctx.fill();

      // inner photo area (top/left/right equal inset, bottom a bit more)
      const innerX = 30 + photoInset;
      const innerY = y + photoInset;
      const innerW = frameW - photoInset*2;
      const innerH = frameH - photoInset - bottomExtra;

      // draw photo
      const img = await loadImage(photos[i]);
      // center-crop to fill
      const scale = Math.max(innerW / w, innerH / h);
      const dw = w * scale, dh = h * scale;
      const dx = innerX + (innerW - dw)/2;
      const dy = innerY + (innerH - dh)/2;
      ctx.save(); roundRect(ctx, innerX, innerY, innerW, innerH, 12); ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();

      // subtle shadow under card
      ctx.globalAlpha = .08; ctx.fillStyle = "#000";
      ctx.fillRect(36, y + frameH + 3, frameW - 12, 8);
      ctx.globalAlpha = 1;
    }

    return c.toDataURL("image/png");
  };

  const downloadPhotoStrip = async () => {
    const url = await composeStrip();
    if (!url) return;
    const a = document.createElement("a");
    a.download = `photostrip-${Date.now()}.png`;
    a.href = url;
    a.click();
  };

  const retake = () => { setPhotos([]); setCurrentPhoto(null); setCountdown(null); };

  return (
    <div className="container">
      <Toaster richColors />
      <div className="center" style={{ marginBottom: 16 }}>
        <div className="stack" style={{ width: "100%" }}>
          <div className="center"><h1>Kawaii Booth</h1></div>

          <Toolbar>
            {/* Filter dropdown — now working */}
            <Select value={filter} onChange={(e)=>setFilter(e.target.value as Filter)}>
              <option value="soft">Soft Glow</option>
              <option value="warm">Warm</option>
              <option value="bw">B&amp;W</option>
              <option value="none">None</option>
            </Select>

            {/* Start / Reset / Download */}
            <Button onClick={startPhotoSequence} disabled={isCapturing || !stream}>
              <Camera size={18}/> {isCapturing ? "Capturing..." : "Start Photo Strip"}
            </Button>
            <Button variant="ghost" onClick={retake}><RotateCcw size={18}/> Reset</Button>
            <Button onClick={downloadPhotoStrip} disabled={photos.length !== 4}><Download size={18}/> Download</Button>
          </Toolbar>

          {/* Strip theme picker */}
          <div className="row" style={{justifyContent:"center"}}>
            <span className="muted">Strip background:</span>
            <div className="theme-row">
              {(["classic","pink","kraft","stars"] as StripTheme[]).map(t => (
                <button key={t}
                  aria-label={t}
                  onClick={()=>setTheme(t)}
                  className={`theme-swatch swatch-${t}`}
                  data-active={theme===t}
                  title={t}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="booth-grid">
        {/* Camera Section */}
        <div className="stack">
          <Card className="preview">
            <video ref={videoRef} autoPlay playsInline muted style={{ filter: filterCss(filter) }} />
            {countdown !== null && countdown > 0 && (<div className="countdown">{countdown}</div>)}
            {isCapturing && countdown === 0 && <div className="flash" />}
          </Card>
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {photos.length === 0 && (
            <div className="row"><TimerSelector timerDuration={timerDuration} setTimerDuration={setTimerDuration} disabled={isCapturing} /></div>
          )}
        </div>

        {/* Preview / strip column */}
        <div className="stack">
          <Card className="strip-card">
            <p className="muted">Latest photo</p>
            <div className="aspect-4-3">
              {currentPhoto ? <img src={currentPhoto} alt="Current capture" /> : <div className="center muted" style={{height:"100%"}}>Preview will appear here</div>}
            </div>
          </Card>

          <Card className="strip-card">
            <p><strong>Photos</strong> <small>({photos.length}/4)</small></p>
            <div className="strip-grid">
              {[0,1,2,3].map(i => (
                <div key={i} className="strip-slot">
                  {photos[i] ? (
                    <div style={{position:"relative", width:"100%", height:"100%"}}>
                      <img src={photos[i]} alt={`Photo ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/>
                      <Button variant="outline" onClick={()=>openEditor(i)} style={{position:"absolute", right:6, bottom:6, padding:"6px 8px"}}>
                        <Pencil size={14}/> Edit
                      </Button>
                    </div>
                  ) : <span>{i+1}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Sticker editor modal */}
      {editIndex !== null && (
        <StickerEditor
          open={editorOpen}
          onClose={()=>setEditorOpen(false)}
          baseImage={photos[editIndex]}
          onDone={handleEdited}
        />
      )}
    </div>
  );
};

// helpers
function loadImage(src:string){ return new Promise<HTMLImageElement>((res,rej)=>{ const i=new Image(); i.onload=()=>res(i); i.onerror=rej; i.src=src; }); }
function roundRect(ctx:CanvasRenderingContext2D, x:number,y:number,w:number,h:number,r:number){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+r,r);
  ctx.arcTo(x+w,y+h,x+w-r,y+h,r);
  ctx.arcTo(x,y+h,x,y+h-r,r);
  ctx.arcTo(x,y,x+r,y,r);
  ctx.closePath();
}
