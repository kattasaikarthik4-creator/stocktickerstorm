import React, { useId } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  isPositive?: boolean;
}

export const Sparkline: React.FC<SparklineProps> = React.memo(
  ({ data, width = 110, height = 30, isPositive }) => {
    if (!data || data.length < 2) {
      return <div style={{ width, height }} className="bg-slate-800/30 rounded" />;
    }

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * (width - 4) + 2;
        const y = height - 4 - ((val - min) / range) * (height - 8);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');

    const positive = isPositive !== undefined ? isPositive : data[data.length - 1] >= data[0];
    const strokeColor = positive ? '#10B981' : '#EF4444';
    const fillColor = positive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)';

    const firstX = 2;
    const lastX = width - 2;
    const polygonPoints = `${points} ${lastX},${height} ${firstX},${height}`;

    return (
      <svg
        width={width}
        height={height}
        className="overflow-visible"
        viewBox={`0 0 ${width} ${height}`}
      >
        <polygon points={polygonPoints} fill={fillColor} />
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    );
  }
);

Sparkline.displayName = 'Sparkline';
