"use client"

import { CSSProperties } from "react"

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

function gradientString(gradient: GradientName) {
  return `linear-gradient(135deg, ${gradientStops[gradient]
    .map((stop) => `${stop.color} ${stop.offset}`)
    .join(", ")})`
}

function patternBase(assetFile: string): (props: PatternProps) => JSX.Element {
  return function Pattern({
    gradient = "neon",
    placement = "full",
    size,
    opacity = placement === "full" ? 0.18 : 0.28,
    className = "",
    style = {},
  }: PatternProps) {
    const baseDimensions = placementDimensions[placement]
    const dimensionStyle = size ? { width: size, height: size } : { width: baseDimensions.width, height: baseDimensions.height }
    const insetStyle = placement === "full" && !size ? { inset: baseDimensions.inset } : {}

    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute ${className}`}
        style={{
          ...dimensionStyle,
          ...insetStyle,
          opacity,
          mixBlendMode: "screen",
          backgroundImage: gradientString(gradient),
          backgroundRepeat: "no-repeat",
          backgroundSize: "cover",
          maskImage: `url(/assets/patterns/topographic/${assetFile})`,
          maskSize: "cover",
          maskRepeat: "no-repeat",
          WebkitMaskImage: `url(/assets/patterns/topographic/${assetFile})`,
          WebkitMaskSize: "cover",
          WebkitMaskRepeat: "no-repeat",
          ...style,
        }}
      />
    )
  }
}

export const FoldedDrift = patternBase("folded-drift.svg")
export const IslandRidge = patternBase("island-ridge.svg")
export const MicroterrainRidge = patternBase("microterrain-ridge.svg")
export const RippleBloom = patternBase("ripple-bloom.svg")
export const TriadBasins = patternBase("triad-basins.svg")
export const VortexShell = patternBase("vortex-shell.svg")

export const gradientPalette = gradientStops
