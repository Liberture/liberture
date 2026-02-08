"use client";

import { motion } from "framer-motion";

interface LibertureLogoProps {
  size?: number;
  animate?: boolean;
  className?: string;
}

const PILLAR_COLORS = [
  "oklch(0.7 0.15 260)",    // Cognition - blue/purple
  "oklch(0.75 0.15 195)",   // Recovery - cyan
  "oklch(0.75 0.2 145)",    // Fueling - green
  "oklch(0.75 0.18 350)",   // Mental - pink/magenta
  "oklch(0.75 0.18 45)",    // Physicality - orange
  "oklch(0.75 0.18 85)",    // Finance - yellow
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
          const startY = spacing + index * spacing;
          
          return (
            <motion.circle
              key={index}
              r={dotSize}
              fill={color}
              initial={{
                cx: size / 2,
                cy: startY,
              }}
              animate={animate ? {
                cx: [
                  size / 2,
                  ...Array.from({ length: 100 }, (_, i) => 
                    getEllipsePath(index, i / 100).x
                  ),
                  size / 2,
                ],
                cy: [
                  startY,
                  ...Array.from({ length: 100 }, (_, i) => 
                    getEllipsePath(index, i / 100).y
                  ),
                  startY,
                ],
              } : undefined}
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
