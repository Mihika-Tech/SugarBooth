import { Timer } from "lucide-react";
import { Button } from "../../ui";

interface TimerSelectorProps {
  timerDuration: number;
  setTimerDuration: (duration: number) => void;
  disabled?: boolean;
}

export const TimerSelector = ({ timerDuration, setTimerDuration, disabled }: TimerSelectorProps) => {
  const options = [3,5,10];
  return (
    <div className="row">
      <div className="row muted" style={{ gap: 8 }}>
        <Timer size={16}/> <span>Timer:</span>
      </div>
      <div className="row" style={{ gap: 8 }}>
        {options.map(sec => (
          <Button
            key={sec}
            variant={timerDuration === sec ? "primary" : "outline"}
            onClick={() => setTimerDuration(sec)}
            disabled={disabled}
          >
            {sec}s
          </Button>
        ))}
      </div>
    </div>
  );
};
