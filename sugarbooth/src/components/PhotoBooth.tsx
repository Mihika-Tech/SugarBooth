import React, { useEffect, useRef, useState } from "react";
import { composeStrip } from "../utils/composeStrip";
import css from "./PhotoBooth.module.css";

type Filter = 'none' | 'soft' | 'warm' | 'bw'

export default function PhotoBooth() {
    const videoRef = useRef<HTMLVideoElement>(null)
    const stripCanvasRef = useRef<HTMLCanvasElement>(null)
    const [ready, setReady] = useState(false)
    const [shots, setShots] = useState<string[]>([])
    const [countdown, setCountdown] = useState<number | null>(null)
    const [filter, setFilter] = useState<Filter>('soft')

    useEffect(() => {
        (async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } })
                if (videoRef.current) {
                    videoRef.current.srcObject = stream
                    await videoRef.current.play()
                    setReady(true)
                }
            } catch {
                alert('Camera access denied or unavailable.')
            }
        }) ()
        return () => {
            const s = videoRef.current?.srcObject as MediaStream | undefined
            s?.getTracks().forEach(t => t.stop())
        }
    }, [])

    const cssFilter = 
        filter === 'bw' ? 'grayscale(1) contrast(1.2)' :
        filter === 'warm' ? 'brightness(1.06) contrast(1.02) sepia(0.15) saturate(1.15)' :
        filter === 'soft' ? 'brightness(1.08) contrast(0.95) saturate(1.1)' : 'none'

        const takeShot = async () => {
            if(!videoRef.current) return
            for (let i=3;i>=1;i--) {
                setCountdown(i)
                await new Promise(r => setTimeout(r, 700))
            }
            setCountdown(null)

            const v = videoRef.current
            const w = 720
            const h = 720
            const temp = document.createElement('canvas')
            temp.width = w
            temp.height = h
            const ctx = temp.getContext('2d')!

            const vw = v.videoWidth
            const vh = v.videoHeight
            const side = Math.min(vw, vh)
            const sx = (vw - side) / 2
            const sy = (vh - side) / 2

            if (filter === 'bw') ctx.filter = 'grayscale(1) contrast(1.2)'
            if (filter === 'warm') ctx.filter = 'brightness(1.06) contrast(1.02) sepia(0.15) saturate(1.15)'
            if (filter === 'soft') ctx.filter = 'brightness(1.08) contrast(0.95) saturate(1.1)'

            ctx.drawImage(v, sx, sy, side, side, 0, 0, w, h)
            const dataUrl = temp.toDataURL('image/jpeg', 0.92)
            setShots(prev => prev.length < 4 ? [...prev, dataUrl] : prev)
        }

        const downloadStrip = async () => {
            if (!stripCanvasRef.current || shots.length === 0) return;
            await composeStrip(stripCanvasRef.current, shots.slice(0, 4)); // <-- await
            const url = stripCanvasRef.current.toDataURL("image/png");
            const a = document.createElement("a");
            a.href = url;
            a.download = "photostrip.png";
            a.click();
        };


        return (
            <div className={css.wrap}>
                <section className={'card ' + css.panel}>
                    <div className={css.controls}>
                        <select className={css.select} value={filter} onChange={e => setFilter(e.target.value as Filter)}>
                            <option value="soft">Soft Glow</option>
                            <option value="warm">Warm</option>
                            <option value="bw">B&W</option>
                            <option value="none">None</option>
                        </select>
                        <button className={css.btn} onClick={takeShot} disabled={!ready || shots.length >= 4}>
                            {shots.length >= 4 ? '4/4 Taken' : 'Take Photo'}
                        </button>
                        <button className={'card ' + css.btnGhost} onClick={() => setShots([])}>Reset</button>
                        <button className={css.btn} onClick={downloadStrip} disabled={shots.length === 0}>Download Strip</button>
                    </div>
                </section>

                <section className={css.stage}>
                    <div className={'card ' + css.preview}>
                        <video ref={videoRef} className={css.video} playsInline muted style={{ filter: cssFilter }} />
                        {countdown && <div className={css.countdown}>{countdown}</div>}
                    </div>

                    <div className={'card ' + css.stripCard}>
                        <canvas ref={stripCanvasRef} className={css.stripCanvas} />
                        <p className={css.hint}>Tip: Take up to 4 shots. Download the composed strip on the right.</p>
                        <div className={css.shots}>
                            {shots.map((s, i) => <img className={css.shot} key={i} src={s} alt={`Shot ${i}`} />)}
                        </div>
                    </div>
                </section>
            </div>
        )
}