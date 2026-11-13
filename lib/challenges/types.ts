import type { CashuPlan } from "./cashu"

export type Role = "creator" | "player" | "moderator"
export type Player = "creator" | "player"
export type Result = Player | "draw"
export type ChallengeStage = "inviting" | "funding" | "active" | "disputed" | "settling" | "settled" | "expired"
export interface Member {
  name: string
  pubkey: string
}

export interface ChallengeTerms {
  id: string
  title: string
  rules: string
  stake: number
  durationDays: number
  mint: string
  createdAt: string
}

export interface Challenge extends ChallengeTerms {
  role: Role
  members: Partial<Record<Role, Member>>
  stage: ChallengeStage
  expiresAt: number | null // Unix seconds, fixed before funding
  deposits: Partial<Record<Player, string>> // Encoded, locked Cashu tokens
  invitedNpubs?: Partial<Record<"player" | "moderator", string>>
  disputed: boolean
  votes: Partial<Record<Role, Result>>
  result: Result | null
  settlements: Partial<Record<Player, ChallengeSettlement>>
  refunds: Partial<Record<Player, ChallengeSettlement>>
  revision: number
}

export interface InvitePreview extends ChallengeTerms {
  role: Exclude<Role, "creator">
  creator: string
  requiresNostr: boolean
}

export interface ChallengeSettlement {
  plan: CashuPlan
  signatures: Partial<Record<Role, string>>
  receipt: string | null // Encoded, beneficiary-locked Cashu token
}

export type ChallengeAction =
  | { action: "invite"; role: Exclude<Role, "creator"> }
  | { action: "fund"; token: string }
  | { action: "vote"; result: Result }
  | { action: "dispute" }
  | { action: "prepare" }
  | { action: "sign"; signatures: Partial<Record<Player, string>> }
  | { action: "settle" }
  | { action: "prepareRefund" }
  | { action: "signRefund"; signature: string }
  | { action: "refund" }
