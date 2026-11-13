import { useId } from "react"
import { Crown, Handshake, Sparkles } from "lucide-react"
import type { Challenge, Player } from "@/lib/challenges/types"
import { PILLAR_IDS } from "@/lib/constants/pillars"
import { PILLAR_ICON_MAP } from "@/lib/pillars"
import styles from "./cashew-match.module.css"

function PillarUdder({ flipped }: { flipped: boolean }) {
  return (
    <g transform={flipped ? "translate(0 54) scale(-1 1)" : "translate(0 54)"} data-part="udder">
      <path
        d="M-38 0 Q-34 -12 -14 -9 Q0 -13 15 -8 Q33 -11 39 1 Q42 12 29 16 Q2 22 -29 16 Q-41 12 -38 0Z"
        fill="#bf84ba"
        stroke="#5e396c"
        strokeWidth="2"
      />
      <path d="M-30 0 Q-18 -7 -8 -5" fill="none" stroke="#f3b8dc" strokeWidth="2.5" strokeLinecap="round" />
      {PILLAR_IDS.map((pillar, index) => {
        const Icon = PILLAR_ICON_MAP[pillar]
        const x = (index - 2.5) * 15
        const y = [3, 9, 13, 13, 9, 3][index]
        return (
          <g
            key={pillar}
            transform={`translate(${x} ${y})`}
            data-part="teat"
            data-pillar={pillar}
            color={`var(--${pillar})`}
          >
            <path
              d="M-5 -2 Q-6 4 -4 13 Q-3 18 0 18 Q4 18 5 13 L6 -1"
              fill="#dfa5ca"
              stroke="#704e78"
              strokeWidth="1.5"
            />
            <circle cy="15" r="6.8" fill="#21182f" stroke="currentColor" strokeWidth="1.5" />
            <Icon x="-5" y="10" width="10" height="10" strokeWidth="2.5" />
          </g>
        )
      })}
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
          <stop stopColor="#b9a9ff" />
          <stop offset=".38" stopColor="#7e66cf" />
          <stop offset=".86" stopColor="#382f65" />
          <stop offset="1" stopColor="#4f607e" />
        </linearGradient>
      </defs>
      <path d={shell} fill={`url(#${id})`} stroke="#ccbfff" strokeWidth="2" />
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

function Fighter({ side, winner, shaking }: { side: Player; winner: boolean; shaking: boolean }) {
  return (
    <g transform={side === "creator" ? "translate(119 18)" : "translate(241 18) scale(-1 1)"}>
      <g className={styles.fighter} data-winner={winner} data-side={side}>
        <g stroke="#b2a5d7" strokeWidth="4" strokeLinecap="round" fill="none">
          <path data-part="legs" d="M-18 65 Q-23 76 -24 91 l-8 2 M18 65 Q22 77 23 91 l7 2" />
          <path data-part="back-arm" d="M-16 34 Q-31 34 -28 20" />
          <circle cx="-28" cy="18" r="6" fill="var(--team)" />
        </g>
        <CashewBody />
        <PillarUdder flipped={side === "player"} />
        <g
          data-part="front-arm"
          className={styles.arm}
          stroke="#b2a5d7"
          strokeWidth="3.5"
          strokeLinecap="round"
          fill="none"
        >
          {shaking ? (
            <path d="M15 36 Q30 43 51 34" />
          ) : (
            <>
              <path d="M15 36 Q29 46 33 24" />
              <path d="M27 27 Q23 18 29 14 Q40 9 42 18 Q45 22 39 27 L36 31 Z" fill="var(--team)" />
            </>
          )}
        </g>
        {winner && <Crown x="-14" y="-33" width="28" height="22" fill="#ffcd52" stroke="#65390d" />}
      </g>
    </g>
  )
}

export function CashewMatch({ challenge }: { challenge: Challenge }) {
  const { members, stage, result } = challenge
  if (!members.player) return null
  const resolved = stage === "settling" || stage === "settled"
  const mode =
    resolved && result ? (result === "draw" ? "draw" : "victory") : stage === "active" ? "spar" : "rest"
  return (
    <figure className={styles.scene} data-mode={mode}>
      <svg aria-hidden="true" viewBox="63 -19 234 139" className={styles.ring}>
        <ellipse cx="180" cy="113" rx="114" ry="4" fill="currentColor" opacity=".12" />
        <Fighter
          side="creator"
          winner={mode === "victory" && result === "creator"}
          shaking={mode === "draw"}
        />
        <Fighter side="player" winner={mode === "victory" && result === "player"} shaking={mode === "draw"} />
        {mode === "draw" && (
          <g className={styles.clasp}>
            <Handshake
              x="165"
              y="42"
              width="30"
              height="25"
              fill="#ffcf89"
              stroke="#432f26"
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
      <figcaption className={styles.names}>
        <span>{members.creator?.name}</span>
        <span>{members.player.name}</span>
      </figcaption>
    </figure>
  )
}
