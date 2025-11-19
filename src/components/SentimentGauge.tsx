import { useMemo } from "react";

const sentiments = [
  { label: "MAX FEAR", color: "hsl(152, 100%, 50%)", angle: -90, value: 0 },
  { label: "FEAR", color: "hsl(187, 64%, 53%)", angle: -70, value: 10 },
  { label: "CONCERN", color: "hsl(173, 48%, 43%)", angle: -50, value: 20 },
  { label: "CAUTION", color: "hsl(230, 100%, 43%)", angle: -30, value: 30 },
  { label: "MILD CAUTION", color: "hsl(262, 62%, 55%)", angle: -10, value: 40 },
  { label: "NEUTRAL", color: "hsl(64, 65%, 54%)", angle: 10, value: 50 },
  { label: "MILD GREED", color: "hsl(60, 65%, 54%)", angle: 30, value: 60 },
  { label: "GREED", color: "hsl(42, 65%, 54%)", angle: 50, value: 70 },
  { label: "HIGH GREED", color: "hsl(22, 65%, 54%)", angle: 70, value: 80 },
  { label: "EXTREME GREED", color: "hsl(0, 64%, 51%)", angle: 90, value: 90 },
  { label: "MAX EUPHORIA", color: "hsl(351, 66%, 73%)", angle: 110, value: 100 },
];

export const SentimentGauge = () => {
  const currentSentiment = useMemo(() => {
    const variance = Math.sin(Date.now() / 10000) * 2;
    return Math.max(0, Math.min(10, Math.round(5 + variance)));
  }, []);

  return (
    <div className="space-y-3">
      <div className="relative w-full mx-auto">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          <defs>
            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {sentiments.map((s, i) => (
                <stop
                  key={i}
                  offset={`${(i / (sentiments.length - 1)) * 100}%`}
                  stopColor={s.color}
                />
              ))}
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          <path
            d="M 20,95 A 80,80 0 0,1 180,95"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.95"
          />

          <g 
            transform={`rotate(${sentiments[currentSentiment].angle}, 100, 95)`}
            className="transition-transform duration-700 ease-out"
          >
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="25"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
              filter="url(#glow)"
            />
            <circle
              cx="100"
              cy="95"
              r="5"
              fill="hsl(var(--primary))"
              filter="url(#glow)"
            />
          </g>

          <text
            x="100"
            y="112"
            textAnchor="middle"
            className="text-[11px] font-bold fill-foreground"
          >
            {sentiments[currentSentiment].label}
          </text>
        </svg>
      </div>

      <div className="flex items-center justify-between text-[9px] px-1">
        <div className="flex items-center gap-1.5">
          <div 
            className="w-2.5 h-2.5 rounded-full shadow-sm" 
            style={{ backgroundColor: sentiments[0].color }} 
          />
          <span className="text-muted-foreground font-medium">Fear</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-muted-foreground font-medium">Greed</span>
          <div 
            className="w-2.5 h-2.5 rounded-full shadow-sm" 
            style={{ backgroundColor: sentiments[10].color }} 
          />
        </div>
      </div>
    </div>
  );
};
