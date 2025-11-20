import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = () => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatTimezone = () => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const shortTz = time.toLocaleTimeString('en-US', {
      timeZoneName: 'short'
    }).split(' ').pop();
    return shortTz || timezone;
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card/50 border border-border/60 rounded-md">
      <Clock className="h-4 w-4 text-muted-foreground" />
      <div className="flex flex-col">
        <span className="text-sm font-mono font-semibold leading-none">
          {formatTime()}
        </span>
        <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
          {formatTimezone()}
        </span>
      </div>
    </div>
  );
}
