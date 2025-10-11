import { useState, useRef, useEffect } from "react";
import { Camera, Download, RotateCcw } from "lucide-react";
import { Button, Card, Select, Toolbar } from "../ui";
import { toast, Toaster } from "sonner";
import { CameraView } from "./photobooth/CameraView";
import { TimerSelector } from "./photobooth/TimerSelector";

export const Photobooth = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [currentPhoto, setCurrentPhoto] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [timerDuration, setTimerDuration] = useState(3);
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
      toast.success("Camera ready");
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
            else {
              setIsCapturing(false);
              setCountdown(null);
              toast.success("Photo strip complete");
            }
          }
        }
      }, 1000);
    };

    tick();
  };

  const downloadPhotoStrip = () => {
    if (photos.length !== 4) return;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.src = photos[0];
    img.onload = () => {
      const w = img.width, h = img.height;
      canvas.width = w;
      canvas.height = h * 4;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      photos.forEach((src, i) => {
        const im = new Image();
        im.src = src;
        ctx.drawImage(im, 0, i * h, w, h);
      });

      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = `photostrip-${Date.now()}.png`;
      a.href = url;
      a.click();
      toast.success("Photo strip downloaded");
    };
  };

  const retake = () => {
    setPhotos([]);
    setCurrentPhoto(null);
    setCountdown(null);
  };

  return (
    <div className="container">
      <Toaster richColors />
      <div className="center" style={{ marginBottom: 16 }}>
        <div className="stack" style={{ width: "100%" }}>
          <div className="center">
            <h1>Photobooth</h1>
          </div>
          <Toolbar>
            {/* Example: if you later add filters */}
            <Select defaultValue="soft" disabled className="select">
              <option value="soft">Soft Glow</option>
            </Select>
            <Button onClick={startPhotoSequence} disabled={isCapturing || !stream}>
              <Camera size={18} /> {isCapturing ? "Capturing..." : "Start Photo Strip"}
            </Button>
            <Button variant="ghost" onClick={retake}><RotateCcw size={18}/> Reset</Button>
            <Button onClick={downloadPhotoStrip} disabled={photos.length !== 4}>
              <Download size={18}/> Download Strip
            </Button>
          </Toolbar>
        </div>
      </div>

      <div className="booth-grid">
        {/* Camera Section */}
        <div className="stack">
          <CameraView videoRef={videoRef} countdown={countdown} isCapturing={isCapturing} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {photos.length === 0 && (
            <div className="row">
              <TimerSelector
                timerDuration={timerDuration}
                setTimerDuration={setTimerDuration}
                disabled={isCapturing}
              />
            </div>
          )}
          {photos.length > 0 && (
            <div className="row">
              <Button variant="outline" onClick={retake} className="w-full"><RotateCcw size={18}/> Retake</Button>
              <Button onClick={downloadPhotoStrip} className="w-full" disabled={photos.length !== 4}>
                <Download size={18}/> Download
              </Button>
            </div>
          )}
        </div>

        {/* Preview / strip column */}
        <div className="stack">
          <Card className="strip-card">
            <p className="muted">Latest photo</p>
            <div className="aspect-4-3">
              {currentPhoto ? (
                <img src={currentPhoto} alt="Current capture" />
              ) : (
                <div className="center muted" style={{ height: "100%" }}>
                  <div>Preview will appear here</div>
                </div>
              )}
            </div>
          </Card>

          <Card className="strip-card">
            <p><strong>Photo Strip</strong> <small>({photos.length}/4)</small></p>
            <div className="strip-grid">
              {[0,1,2,3].map(i => (
                <div key={i} className="strip-slot">
                  {photos[i] ? <img src={photos[i]} alt={`Photo ${i+1}`} style={{width:"100%",height:"100%",objectFit:"cover"}}/> : <span>{i+1}</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
