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

export function LibertureLogo({ size = 60, animate = true, className = "" }: LibertureLogoProps) {
  const dotSize = size * 0.12;
  const spacing = size * 0.15;
  
  // Calculate the ellipse path for each dot
  const getEllipsePath = (index: number, progress: number) => {
    const centerY = size / 2;
    const startY = spacing + index * spacing;
    
    // Ellipse parameters
    const radiusX = size * 0.35; // Horizontal radius
    const radiusY = size * 0.15; // Vertical radius (smaller for ellipse)
    
    // Angle based on progress (0 to 2π for full rotation)
    const angle = progress * Math.PI * 2;
    
    // Stagger each dot's starting position
    const stagger = (index / 6) * Math.PI * 2;
    const totalAngle = angle + stagger;
    
    // Calculate elliptical position
    const x = size / 2 + radiusX * Math.cos(totalAngle);
    const y = centerY + radiusY * Math.sin(totalAngle);
    
    return { x, y };
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
          return (
            <motion.circle
              key={index}
              r={dotSize}
              fill={color}
              animate={animate ? {
                cx: Array.from({ length: 100 }, (_, i) => getEllipsePath(index, i / 100).x),
                cy: Array.from({ length: 100 }, (_, i) => getEllipsePath(index, i / 100).y),
              } : {
                cx: size / 2,
                cy: spacing + index * spacing,
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
