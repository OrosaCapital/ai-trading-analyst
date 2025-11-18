const sentiments = [
  { label: "MAX FEAR", color: "hsl(152, 100%, 50%)", angle: -90 },
  { label: "FEAR", color: "hsl(187, 64%, 53%)", angle: -70 },
  { label: "CONCERN", color: "hsl(173, 48%, 43%)", angle: -50 },
  { label: "CAUTION", color: "hsl(230, 100%, 43%)", angle: -30 },
  { label: "MILD CAUTION", color: "hsl(262, 62%, 55%)", angle: -10 },
  { label: "NEUTRAL", color: "hsl(64, 65%, 54%)", angle: 10 },
  { label: "MILD GREED", color: "hsl(60, 65%, 54%)", angle: 30 },
  { label: "GREED", color: "hsl(42, 65%, 54%)", angle: 50 },
  { label: "HIGH GREED", color: "hsl(22, 65%, 54%)", angle: 70 },
  { label: "EXTREME GREED", color: "hsl(0, 64%, 51%)", angle: 90 },
  { label: "MAX EUPHORIA", color: "hsl(351, 66%, 73%)", angle: 110 },
];

export const SentimentGauge = () => {
  const currentSentiment = 5; // Neutral - would be dynamic in real app

  return (
    <div className="space-y-2">
      {/* Compact Gauge */}
      <div className="relative w-full mx-auto">
        <svg viewBox="0 0 200 110" className="w-full h-auto">
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
          </defs>
          
          <path
            d="M 20,95 A 80,80 0 0,1 180,95"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            opacity="0.9"
          />

          <g transform={`rotate(${sentiments[currentSentiment].angle}, 100, 95)`}>
            <line
              x1="100"
              y1="95"
              x2="100"
              y2="30"
              stroke="hsl(var(--foreground))"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle
              cx="100"
              cy="95"
              r="4"
              fill="hsl(var(--primary))"
            />
          </g>

          <text
            x="100"
            y="105"
            textAnchor="middle"
            className="text-[9px] font-semibold fill-foreground"
          >
            {sentiments[currentSentiment].label}
          </text>
        </svg>
      </div>

      {/* Minimal Key */}
      <div className="grid grid-cols-2 gap-1 text-[8px]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sentiments[0].color }} />
          <span className="text-muted-foreground">Fear</span>
        </div>
        <div className="flex items-center gap-1 justify-end">
          <span className="text-muted-foreground">Greed</span>
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: sentiments[10].color }} />
        </div>
      </div>
    </div>
  );
};
