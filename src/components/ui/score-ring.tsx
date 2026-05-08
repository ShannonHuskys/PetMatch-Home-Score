'use client';

interface ScoreRingProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showLabel?: boolean;
}

const sizeConfig = {
  sm: { width: 64, stroke: 4, fontSize: 'text-sm', radius: 26 },
  md: { width: 96, stroke: 6, fontSize: 'text-xl', radius: 38 },
  lg: { width: 140, stroke: 8, fontSize: 'text-3xl', radius: 56 },
};

function getScoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#0c93e7';
  if (score >= 40) return '#f59e0b';
  return '#dc2626';
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Fair';
  return 'Poor';
}

export function ScoreRing({ score, size = 'md', label, showLabel = true }: ScoreRingProps) {
  const config = sizeConfig[size];
  const circumference = 2 * Math.PI * config.radius;
  const progress = (score / 100) * circumference;
  const color = getScoreColor(score);
  const center = config.width / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={config.width} height={config.width} className="-rotate-90">
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={config.stroke}
        />
        <circle
          cx={center}
          cy={center}
          r={config.radius}
          fill="none"
          stroke={color}
          strokeWidth={config.stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <text
          x={center}
          y={center}
          textAnchor="middle"
          dominantBaseline="central"
          className={`${config.fontSize} font-bold`}
          fill={color}
          transform={`rotate(90 ${center} ${center})`}
        >
          {score}
        </text>
      </svg>
      {showLabel && (
        <div className="text-center">
          {label && <p className="text-xs font-medium text-gray-500">{label}</p>}
          <p className="text-xs font-semibold" style={{ color }}>
            {getScoreLabel(score)}
          </p>
        </div>
      )}
    </div>
  );
}

export function ScoreBadge({ score, label }: { score: number; label: string }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {score}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs" style={{ color }}>
          {getScoreLabel(score)}
        </p>
      </div>
    </div>
  );
}
