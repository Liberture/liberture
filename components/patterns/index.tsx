"use client"

import { CSSProperties, ReactNode, useId } from "react"

export type GradientName = "neon" | "plasma" | "magma" | "acidLime"
export type PatternPlacement = "full" | "cropped" | "corner"

interface PatternProps {
  gradient?: GradientName
  placement?: PatternPlacement
  size?: number | string
  opacity?: number
  className?: string
  style?: CSSProperties
}

const gradientStops: Record<GradientName, { offset: string; color: string }[]> = {
  neon: [
    { offset: "0%", color: "#22d3ee" },
    { offset: "40%", color: "#a855f7" },
    { offset: "80%", color: "#ec4899" },
    { offset: "100%", color: "#f97316" },
  ],
  plasma: [
    { offset: "0%", color: "#7c3aed" },
    { offset: "35%", color: "#c084fc" },
    { offset: "70%", color: "#22d3ee" },
    { offset: "100%", color: "#14f195" },
  ],
  magma: [
    { offset: "0%", color: "#fb923c" },
    { offset: "45%", color: "#ef4444" },
    { offset: "80%", color: "#991b1b" },
    { offset: "100%", color: "#7c2d12" },
  ],
  acidLime: [
    { offset: "0%", color: "#bef264" },
    { offset: "30%", color: "#4ade80" },
    { offset: "65%", color: "#a3e635" },
    { offset: "100%", color: "#22c55e" },
  ],
}

const placementDimensions: Record<PatternPlacement, CSSProperties> = {
  full: { width: "120%", height: "120%", inset: "-10%" },
  cropped: { width: "80%", height: "80%" },
  corner: { width: "320px", height: "320px" },
}

function GradientDefs({ id, gradient }: { id: string; gradient: GradientName }) {
  return (
    <defs>
      <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
        {gradientStops[gradient].map((stop) => (
          <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={1} />
        ))}
      </linearGradient>
    </defs>
  )
}

function patternBase(
  name: string,
  viewBox: string,
  children: (gradientId: string) => ReactNode,
): React.FC<PatternProps> {
  return function Pattern({
    gradient = "neon",
    placement = "full",
    size,
    opacity = placement === "full" ? 0.18 : 0.28,
    className = "",
    style = {},
  }: PatternProps) {
    const internalId = useId()
    const gradientId = `${name}-${gradient}-${internalId}`

    const dimensions = placementDimensions[placement]
    const resolvedSize = size ? { width: size, height: size } : dimensions

    return (
      <svg
        aria-hidden
        viewBox={viewBox}
        className={`pointer-events-none absolute ${className}`}
        style={{
          ...dimensions,
          ...resolvedSize,
          opacity,
          mixBlendMode: "screen",
          ...style,
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        <GradientDefs id={gradientId} gradient={gradient} />
        {children(gradientId)}
      </svg>
    )
  }
}

export const FoldedDrift = patternBase("folded-drift", "0 0 900 700", (gradientId) => (
  <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="2" strokeLinecap="round">
    <path d="M60 340c140-120 280-120 420 10s280 140 420 10" opacity="0.8" />
    <path d="M40 420c150-150 320-140 480 20s310 160 460 0" opacity="0.6" />
    <path d="M80 260c130-90 270-60 390 60s240 140 360 40" opacity="0.45" />
    <path d="M120 520c160-130 330-90 480 70s280 120 420-20" opacity="0.35" />
    <path d="M20 180c120-80 260-50 360 80s210 150 320 80" opacity="0.3" />
  </g>
))

export const IslandRidge = patternBase("island-ridge", "0 0 720 620", (gradientId) => (
  <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.8">
    <path d="M120 420c60-110 170-170 270-170s210 60 270 170" opacity="0.75" />
    <path d="M160 450c70-95 150-140 230-140s160 45 230 140" opacity="0.55" />
    <path d="M200 480c60-70 130-100 200-100s140 30 200 100" opacity="0.45" />
    <path d="M260 500c50-50 110-70 160-70s110 20 160 70" opacity="0.35" />
  </g>
))

export const MicroterrainRidge = patternBase("microterrain-ridge", "0 0 1000 520", (gradientId) => (
  <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.6" strokeLinecap="round">
    <path d="M0 300c90-60 210-60 330 10s240 90 360 30 210-60 310 20" opacity="0.5" />
    <path d="M0 350c110-70 230-60 330 0s210 80 330 40 210-60 310 10" opacity="0.4" />
    <path d="M0 400c100-50 220-40 320 10s200 90 320 50 210-70 310-10" opacity="0.3" />
    <path d="M0 450c90-40 210-30 310 20s200 80 310 40 210-60 310-30" opacity="0.25" />
  </g>
))

export const RippleBloom = patternBase("ripple-bloom", "0 0 520 520", (gradientId) => (
  <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.8">
    <circle cx="260" cy="260" r="220" opacity="0.8" />
    <circle cx="240" cy="240" r="170" opacity="0.6" />
    <circle cx="280" cy="280" r="140" opacity="0.5" />
    <circle cx="250" cy="250" r="110" opacity="0.4" />
    <circle cx="270" cy="270" r="80" opacity="0.35" />
  </g>
))

export const TriadBasins = patternBase("triad-basins", "0 0 640 520", (gradientId) => (
  <g fill={`url(#${gradientId})`} fillOpacity="0.12" stroke={`url(#${gradientId})`} strokeWidth="1.4">
    <path d="M120 360c80-120 200-120 280 0s-20 160-140 160-220-40-140-160Z" />
    <path d="M340 220c70-90 170-90 240 0s-10 140-120 140-190-50-120-140Z" opacity="0.7" />
    <path d="M200 180c60-70 140-70 200 0s-20 120-100 120-160-50-100-120Z" opacity="0.55" />
  </g>
))

export const VortexShell = patternBase("vortex-shell", "0 0 620 620", (gradientId) => (
  <g fill="none" stroke={`url(#${gradientId})`} strokeWidth="1.6" strokeLinecap="round">
    <path d="M120 500c160-40 200-200 60-280-100-60-20-200 160-200" opacity="0.75" />
    <path d="M140 460c150-40 180-170 50-240-90-50-10-170 150-170" opacity="0.6" />
    <path d="M180 430c130-40 140-150 40-210-80-50-20-140 120-140" opacity="0.5" />
    <path d="M220 400c110-30 120-120 30-170-70-40-30-110 90-110" opacity="0.4" />
  </g>
))

export const gradientPalette = gradientStops
