import { useState } from "react";

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
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const currentSentiment = 5; // Neutral - would be dynamic in real app

  return (
    <div className="glass rounded-2xl p-8 space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Market Sentiment Index</h3>
        <p className="text-sm text-muted-foreground">
          Real-time emotional cycle mapping from fear to euphoria
        </p>
      </div>

      {/* Circular Gauge */}
      <div className="relative w-full max-w-md mx-auto aspect-square">
        <svg viewBox="0 0 200 120" className="w-full h-auto">
          {/* Background arc */}
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
          
          {/* Main arc */}
          <path
            d="M 20,100 A 80,80 0 0,1 180,100"
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            className="drop-shadow-[0_0_10px_hsl(var(--primary)/0.5)]"
          />

          {/* Needle */}
          <g transform={`rotate(${sentiments[currentSentiment].angle}, 100, 100)`}>
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="30"
              stroke="hsl(var(--foreground))"
              strokeWidth="3"
              strokeLinecap="round"
              className="drop-shadow-lg"
            />
            <circle
              cx="100"
              cy="100"
              r="6"
              fill="hsl(var(--primary))"
              className="drop-shadow-[0_0_10px_hsl(var(--primary)/0.8)]"
            />
          </g>

          {/* Center label */}
          <text
            x="100"
            y="110"
            textAnchor="middle"
            className="text-xs font-bold fill-current"
          >
            {sentiments[currentSentiment].label}
          </text>
        </svg>
      </div>

      {/* Sentiment Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {sentiments.map((sentiment, idx) => (
          <button
            key={sentiment.label}
            onMouseEnter={() => setHoveredIndex(idx)}
            onMouseLeave={() => setHoveredIndex(null)}
            className={`glass-strong rounded-lg p-4 transition-all ${
              idx === currentSentiment ? 'ring-2 ring-primary scale-105' : ''
            } ${hoveredIndex === idx ? 'scale-105 bg-primary/5' : ''}`}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-4 h-4 rounded-full shrink-0"
                style={{
                  backgroundColor: sentiment.color,
                  boxShadow: `0 0 10px ${sentiment.color}`,
                }}
              ></div>
              <span className="text-xs font-medium text-left">{sentiment.label}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="glass-strong rounded-lg p-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">How it works:</strong> The sentiment index combines RSI, 
          funding rates, volume patterns, and open interest to map market psychology. Extreme fear 
          often signals buying opportunities, while euphoria indicates caution zones.
        </p>
      </div>
    </div>
  );
};
