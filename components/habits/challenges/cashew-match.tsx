import { useId, type ReactNode } from "react"
import { Mail, Coins, Crown, Equal, Sparkles } from "lucide-react"
import type { ChallengeStage, Result, Player } from "@/lib/challenges/types"
import styles from "./cashew-match.module.css"

function Teat({ x, y, tilt, scale = 0.9 }: { x: number; y: number; tilt: number; scale?: number }) {
  return (
    <path data-part="teat" transform={`translate(${x} ${y}) rotate(${tilt}) scale(${scale})`}
      d="M-4 0 C-3 4 -3.5 11 -2 14 Q0 17 2.2 14 C4 10 3 4 4 0"
      strokeWidth="1.4" strokeLinecap="round" />
  )
}

function Udder() {
  return (
    <g data-part="udder" transform="translate(9 32) rotate(-14) scale(.80)" stroke="#a75272" strokeLinejoin="round">
      <path d="M-32 0 C-28 -10 -13 -10 0 -6 C13 -9 26 -8 31 0 C39 12 26 23 5 24 C-17 26 -40 16 -32 0Z" fill="#f2a9ba" strokeWidth="2" />
      <g fill="#df92a7">
        <Teat x={-13} y={4} tilt={8} scale={0.74} />
        <Teat x={12} y={5} tilt={-6} scale={0.74} />
      </g>
      <g fill="#f5b6c4">
        <Teat x={-22} y={14} tilt={12} />
        <Teat x={0} y={19} tilt={2} />
        <Teat x={21} y={15} tilt={-10} />
      </g>
      <path d="M-26 0 Q-21 -5 -13 -4" fill="none" stroke="#ffe0df" strokeWidth="2.6" strokeLinecap="round" />
    </g>
  )
}

function CashewBody() {
  const id = useId()
  const shell =
    "M-29 45 C-48 18 -37 -11 -14 -20 C3 -28 29 -24 33 -10 C38 6 21 9 12 15 C-1 23 1 35 12 38 C23 42 30 27 37 35 C48 50 29 65 9 66 C-7 68 -21 60 -29 45Z"
  return (
    <g data-part="body">
      <defs>
        <linearGradient id={id} x2=".85" y2="1" gradientUnits="objectBoundingBox">
          <stop stopColor="var(--shell-light)" />
          <stop offset=".38" stopColor="var(--team)" />
          <stop offset=".86" stopColor="var(--shell-dark)" />
          <stop offset="1" stopColor="var(--shell-dark)" />
        </linearGradient>
      </defs>
      <path d={shell} fill={`url(#${id})`} stroke="var(--shell-light)" strokeWidth="2" />
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M-31 23 C-36 3 -21 -13 -4 -16 M-27 29 C-31 10 -23 -5 -15 -8 M-25 42 Q-15 59 5 60 Q22 61 30 52"
          stroke="#d2bfff"
          opacity=".6"
          strokeWidth="1.5"
        />
        <path d="M-21 42 Q-9 55 7 55 M-31 33 l2 6" stroke="#8ee6ee" opacity=".65" strokeWidth="1.6" />
      </g>
      <g data-part="face" fill="#211938">
        <ellipse cx="-6" cy="-3" rx="2.7" ry="4.2" />
        <ellipse cx="14" cy="-5" rx="2.7" ry="4.2" />
        <path d="M0 3 Q5 10 11 1" stroke="#241a3a" strokeWidth="2.4" strokeLinecap="round" fill="none" />
        <circle cx="-5" cy="-4.5" r=".9" fill="white" />
        <circle cx="15" cy="-6.5" r=".9" fill="white" />
      </g>
    </g>
  )
}

function Fighter({ side, winner }: { side: Player; winner: boolean }) {
  return (
    <g transform={side === "creator" ? "translate(119 18)" : "translate(241 18) scale(-1 1)"}>
      <g className={styles.fighter} data-winner={winner} data-side={side}>
        <g stroke="#b2a5d7" strokeWidth="4" strokeLinecap="round" fill="none">
          <path data-part="legs" d="M-18 65 Q-23 76 -24 91 l-8 2 M18 65 Q22 77 23 91 l7 2" />
        </g>
        <CashewBody />
        <Udder />
        {winner && <Crown x="-14" y="-33" width="28" height="22" fill="#ffcd52" stroke="#65390d" />}
      </g>
    </g>
  )
}

export function ChallengeStepArt({step}: {step: "invite" | "play" | "finish"}) {
  return <svg aria-hidden="true" viewBox="56 -24 246 145" className={styles.stepArt} data-step={step}>
    <ellipse cx="180" cy="113" rx="105" ry="4" fill="currentColor" opacity=".1" />
    <Fighter side="creator" winner={step === "finish"} />
    <Fighter side="player" winner={false} />
    {step === "invite" && <g className={styles.envelope}><Mail x="165" y="35" width="30" height="24" fill="#243a68" stroke="#9dc5ff" /></g>}
    {step === "play" && <g className={styles.coins}><Coins x="163" y="52" width="34" height="34" fill="#83531d" stroke="#ffd27b" /></g>}
    {step === "finish" && <Sparkles className={styles.spark} x="163" y="19" width="24" height="24" stroke="#ffd27b" />}
  </svg>
}

function ModeratorCashew() {
  return (
    <g transform="translate(178 40) scale(.63)" data-part="moderator">
      <path d="M-18 63 l-5 28 -8 2 M18 63 l5 28 8 2" fill="none" stroke="#b2a5d7" strokeWidth="4" strokeLinecap="round" />
      <CashewBody />
      <Udder />
      <g stroke="#ffda74" strokeWidth="2.5" fill="#82501c">
        <path d="M-15 -8 l18 -1 -2 7 q-7 8 -13 0Z M6 -9 l17 -1 -1 7 q-7 8 -14 0Z" />
        <path d="M1 -7 q2 -3 6 -1 M-16 -7 l-6 -2" fill="none" />
        <path d="M-11 -6 l5 -1 M11 -7 l4 -1" stroke="#fff2ba" />
      </g>
      <g transform="translate(39 18) rotate(27)">
        <rect x="-3" y="1" width="6" height="19" rx="3" fill="#838cb2" stroke="#332b49" />
        <rect x="-6" y="-9" width="12" height="14" rx="6" fill="#c7cce2" stroke="#453952" strokeWidth="2" />
        <path d="M-3 -5 h6 M-3 -2 h6" stroke="#697084" />
      </g>
    </g>
  )
}

export function CashewMatch({ stage = "inviting", result = null, joined = false, compact = false, children, versus, waiting = false, moderator = false, moderatorDetails, corner }: {
  stage?: ChallengeStage
  result?: Result | null
  joined?: boolean
  waiting?: boolean
  moderatorDetails?: ReactNode
  moderator?: boolean
  corner?: ReactNode
  children?: ReactNode
  versus?: string
  compact?: boolean
}) {
  const resolved = stage === "settling" || stage === "settled"
  const mode =
    resolved && result ? (result === "draw" ? "draw" : "victory") : stage === "active" ? "spar" : "rest"
  return (
    <figure aria-hidden={children ? undefined : true} className={styles.scene} data-mode={mode} data-joined={joined} data-compact={compact} data-moderator={moderator} data-waiting={waiting}>
      {corner && <div className="absolute right-2 top-2 z-10">{corner}</div>}
      <div className="relative mx-auto w-full max-w-[410px]">
        {moderatorDetails && <div className="absolute top-[15%] left-1/2 z-[1] flex max-w-[42%] -translate-x-1/2 justify-center text-xs opacity-[.65]">{moderatorDetails}</div>}
      <svg aria-hidden="true" viewBox="63 -19 234 139" className={styles.ring}>
        <ellipse cx="180" cy="113" rx="114" ry="4" fill="currentColor" opacity=".12" />
        <g className={styles.leftPlayer}>
        <Fighter
          side="creator"
          winner={mode === "victory" && result === "creator"}
        />
        </g>
        <g className={styles.rightPlayer}><Fighter side="player" winner={mode === "victory" && result === "player"} /></g>
        {compact && <g className={styles.announcer}><ModeratorCashew /></g>}
        {versus && !moderator && <text x="180" y="44" textAnchor="middle" fill="currentColor" fontSize="15" fontWeight="700">{versus}</text>}
        {mode === "draw" && (
          <g className={styles.clasp}>
            <Equal
              x="165"
              y="42"
              width="30"
              height="25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            />
          </g>
        )}
        {mode === "victory" && (
          <Sparkles
            className={styles.spark}
            x={result === "creator" ? 69 : 261}
            y="12"
            width="20"
            height="20"
            stroke="#ffc952"
          />
        )}
      </svg>
      </div>
      {children && <figcaption className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-3 px-2 pb-2">{children}</figcaption>}

    </figure>
  )
}
