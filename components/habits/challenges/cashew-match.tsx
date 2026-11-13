import { Crown, Handshake, Sparkles } from "lucide-react"
import type { Challenge, Player } from "@/lib/challenges/types"
import styles from "./cashew-match.module.css"

function Fighter({ side, winner, shaking }: { side: Player; winner: boolean; shaking: boolean }) {
  return (
    <g transform={side === "creator" ? "translate(119 18)" : "translate(241 18) scale(-1 1)"}>
      <g className={styles.fighter} data-winner={winner} data-side={side}>
        <g stroke="#37271e" strokeWidth="4" strokeLinecap="round" fill="none">
          <path d="M-12 55 Q-18 65 -15 72 l-8 2 M9 54 Q15 63 14 71 l7 2" />
          <path d="M-16 34 Q-31 34 -28 20" />
          <circle cx="-28" cy="18" r="6" fill="var(--team)" />
        </g>
        <image href="/challenges/cashew.webp" x="-29" y="-9" width="58" height="72" />
        <g className={styles.arm} stroke="#37271e" strokeWidth="3.5" strokeLinecap="round" fill="none">
          {shaking ? <path d="M15 36 Q30 43 51 34" /> : <>
            <path d="M15 36 Q29 46 33 24" />
            <path d="M27 27 Q23 18 29 14 Q40 9 42 18 Q45 22 39 27 L36 31 Z" fill="var(--team)" />
          </>}
        </g>
        {winner && <Crown x="-14" y="-23" width="28" height="22" fill="#ffcd52" stroke="#65390d" />}
      </g>
    </g>
  )
}

export function CashewMatch({ challenge }: { challenge: Challenge }) {
  const { members, stage, result } = challenge
  if (!members.player) return null
  const resolved = stage === "settling" || stage === "settled"
  const mode = resolved && result ? result === "draw" ? "draw" : "victory" : stage === "active" ? "spar" : "rest"
  return (
    <figure className={styles.scene} data-mode={mode}>
      <svg aria-hidden="true" viewBox="0 -10 360 114" className={styles.ring}>
        <ellipse cx="180" cy="95" rx="114" ry="4" fill="currentColor" opacity=".12" />
        <Fighter side="creator" winner={mode === "victory" && result === "creator"} shaking={mode === "draw"} />
        <Fighter side="player" winner={mode === "victory" && result === "player"} shaking={mode === "draw"} />
        {mode === "draw" && <g className={styles.clasp}><Handshake x="165" y="42" width="30" height="25" fill="#ffcf89" stroke="#432f26" strokeWidth="1.8" /></g>}
        {mode === "victory" && <Sparkles className={styles.spark} x={result === "creator" ? 69 : 261} y="12" width="20" height="20" stroke="#ffc952" />}
      </svg>
      <figcaption className={styles.names}>
        <span>{members.creator?.name}</span><span>{members.player.name}</span>
      </figcaption>
    </figure>
  )
}
