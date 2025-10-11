import { Card } from "../../ui";

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  countdown: number | null;
  isCapturing: boolean;
}

export const CameraView = ({ videoRef, countdown, isCapturing }: Props) => (
  <Card className="preview">
    <video ref={videoRef} autoPlay playsInline muted />
    {countdown !== null && countdown > 0 && (
      <div className="countdown">{countdown}</div>
    )}
    {isCapturing && countdown === 0 && <div className="flash" />}
  </Card>
);
