"use client";

import { motion } from "framer-motion";

interface LibertureLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

const PILLAR_COLORS = [
  "#8B5CF6",    // Cognition - purple
  "#06B6D4",    // Recovery - cyan
  "#10B981",    // Fueling - green
  "#EC4899",    // Mental - pink
  "#F59E0B",    // Physicality - orange
  "#EAB308",    // Finance - yellow
];

// Hexagon positions matching the SVG generators in the media kit page
function hexPositions(cx: number, cy: number, r: number) {
  return [
    { x: cx - 0.5 * r, y: cy - 0.866 * r },
    { x: cx + 0.5 * r, y: cy - 0.866 * r },
    { x: cx + r,        y: cy },
    { x: cx + 0.5 * r, y: cy + 0.866 * r },
    { x: cx - 0.5 * r, y: cy + 0.866 * r },
    { x: cx - r,        y: cy },
  ];
}

// Base hexagonal offsets (unit vectors) for rotation
const BASE_OFFSETS = [
  { dx: -0.5, dy: -0.866 },
  { dx:  0.5, dy: -0.866 },
  { dx:  1.0, dy:  0.0   },
  { dx:  0.5, dy:  0.866 },
  { dx: -0.5, dy:  0.866 },
  { dx: -1.0, dy:  0.0   },
];

export function LibertureLogo({ size = 60, animate = true, className = "" }: LibertureLogoProps) {
  const dotSize = size * 0.08;
  const hexR = size * 0.3;
  const center = size / 2;
  const positions = hexPositions(center, center, hexR);

  // For animation: compute keyframes for rotating the entire hexagon
  const FRAMES = 100;
  const getRotatedKeyframes = (index: number) => {
    const { dx, dy } = BASE_OFFSETS[index];
    return Array.from({ length: FRAMES }, (_, i) => {
      const angle = (i / FRAMES) * Math.PI * 2;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      return {
        x: center + hexR * (dx * cosA - dy * sinA),
        y: center + hexR * (dx * sinA + dy * cosA),
      };
    });
  };

  return (
    <div className={`inline-block ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {PILLAR_COLORS.map((color, index) => {
          const keyframes = animate ? getRotatedKeyframes(index) : null;
          return (
            <motion.circle
              key={index}
              r={dotSize}
              fill={color}
              // Without a resting cx/cy the first paint renders cx="undefined",
              // which the browser rejects. The attributes cover the server
              // render; `initial` gives Framer a starting value so a remount
              // mid-animation doesn't briefly emit undefined either.
              cx={positions[index].x}
              cy={positions[index].y}
              initial={{ cx: positions[index].x, cy: positions[index].y }}
              animate={animate ? {
                cx: keyframes!.map(k => k.x),
                cy: keyframes!.map(k => k.y),
              } : {
                cx: positions[index].x,
                cy: positions[index].y,
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                filter: `drop-shadow(0 0 ${dotSize * 0.5}px ${color})`,
              }}
            />
          );
        })}
      </svg>
    </div>
  );
}

export function LibertureLogoStatic({ size = 60, className = "" }: Omit<LibertureLogoProps, 'animate'>) {
  return <LibertureLogo size={size} animate={false} className={className} />;
}
