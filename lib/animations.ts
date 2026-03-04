import { Variants, Transition, TargetAndTransition } from "framer-motion"

// Transitions
export const transition = {
  fast: { duration: 0.2, ease: "easeOut" } as Transition,
  normal: { duration: 0.3, ease: "easeOut" } as Transition,
  smooth: { duration: 0.4, ease: "easeInOut" } as Transition,
  slow: { duration: 0.5, ease: "easeOut" } as Transition,
}

// Variants
export const variants = {
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } as Variants,
  fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } } as Variants,
  fadeInDown: { initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 20 } } as Variants,
  scaleIn: { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 } } as Variants,
  slideUp: { initial: { opacity: 0, y: 40 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 40 } } as Variants,
}

// Stagger
export const stagger = {
  container: (delay = 0.1): Variants => ({ initial: {}, animate: { transition: { staggerChildren: delay } } }),
  item: variants.fadeInUp,
}

// Hover
export const hover = {
  scale: { scale: 1.02 },
  lift: { y: -4 },
  scaleLift: { scale: 1.02, y: -4 },
}

// Viewport
export const viewport = {
  once: { once: true, margin: "-100px" as const },
  always: { once: false, margin: "-50px" as const },
}

// Loop animations
export const loop = {
  pulse: { scale: [1, 1.1, 1], opacity: [1, 0.8, 1], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } } as TargetAndTransition,
  bounce: { y: [0, -8, 0], transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } } as TargetAndTransition,
  float: { y: [0, -10, 0], transition: { duration: 6, repeat: Infinity, ease: "easeInOut" } } as TargetAndTransition,
  breathe: { scale: [1, 1.05, 1], transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } } as TargetAndTransition,
}

// Background animations (variants format)
export const floatAnimation: Variants = {
  animate: { y: [0, -20, 0], x: [0, 10, 0], transition: { duration: 8, repeat: Infinity, ease: "easeInOut" } },
}

export const rotateAnimation: Variants = {
  animate: { rotate: 360, transition: { duration: 20, repeat: Infinity, ease: "linear" } },
}

// Pillar icon animations
type PillarAnim = { animate: Record<string, number | number[]>; transition: Transition }

export const pillarAnimations: Record<string, PillarAnim> = {
  work: { animate: { scale: [1, 1.1, 1], opacity: [1, 0.8, 1] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  sleep: { animate: { scale: [1, 1.15, 1, 1.05, 1] }, transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut", times: [0, 0.2, 0.3, 0.5, 1] } },
  nutrition: { animate: { rotate: [-5, 5, -5], scale: [1, 1.05, 1] }, transition: { duration: 3, repeat: Infinity, ease: "easeInOut" } },
  mind: { animate: { opacity: [1, 0.5, 1, 0.7, 1], scale: [1, 1.1, 1] }, transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } },
  exercise: { animate: { y: [0, -8, 0], rotate: [-2, 2, -2] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } },
  finance: { animate: { rotateY: [0, 180, 360], scale: [1, 0.95, 1] }, transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } },
}

export const getPillarAnimation = (slug: string): PillarAnim =>
  pillarAnimations[slug] || { animate: { scale: [1, 1.05, 1] }, transition: { duration: 2, repeat: Infinity, ease: "easeInOut" } }
